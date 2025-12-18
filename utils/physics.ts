import { SimulationInputs, SimulationMetrics, CompressorType, ChartData, PullDownPoint, AmbientSweepPoint, RpmSweepPoint } from '../types';

// Physical constants for a typical C-Segment vehicle
const UA_CABIN = 0.16; 
const SOLAR_LOAD_BASE = 0.6; // kW (Base solar load)
const PASSENGER_LOAD = 0.15; // kW per person (avg 2 people)
const MECHANICAL_EFFICIENCY = 0.90;

// Compressor Constants
const COMPRESSOR_DISPLACEMENT_CC = 150; // cc per rev
const VOLUMETRIC_EFFICIENCY = 0.70; 
const REFRIGERANT_DENSITY_SUCTION = 15; // kg/m3 approx at suction
const ENTHALPY_DELTA = 180; // kJ/kg approx
const BSFC_AVG = 280; // g/kWh (Brake Specific Fuel Consumption)
const FUEL_DENSITY = 740; // g/L (Gasoline)

/**
 * Calculates the instant state of the HVAC system based on inputs.
 */
export const calculateSystemState = (inputs: SimulationInputs): SimulationMetrics => {
  const { ambientTemp, targetCabinTemp, engineRpm, compressorType, humidity } = inputs;

  // 1. Calculate Sensible Thermal Load
  const deltaT = Math.max(0, ambientTemp - targetCabinTemp);
  const solarFactor = 1 + (ambientTemp - 25) * 0.025; 
  const sensibleLoad = (UA_CABIN * deltaT) + (SOLAR_LOAD_BASE * solarFactor) + (PASSENGER_LOAD * 2);

  // 2. Calculate Latent Load (Addition A)
  // Simplified model: Latent load increases with humidity above 30%.
  // At 90% RH, Latent load is approx 60% of Sensible load in hot conditions.
  // Formula: Load_latent = Load_sensible * Factor(RH)
  const humidityFactor = Math.max(0, humidity - 30) * 0.012; 
  const latentLoad = sensibleLoad * humidityFactor;
  const totalLoad = sensibleLoad + latentLoad;

  // 3. Theoretical Max Capacity (Pre-derate)
  const ambientDerating = 1 - ((ambientTemp - 25) * 0.01);
  const maxCapacityKW = (engineRpm / 60) * (COMPRESSOR_DISPLACEMENT_CC * 1e-6) * VOLUMETRIC_EFFICIENCY * REFRIGERANT_DENSITY_SUCTION * ENTHALPY_DELTA * ambientDerating;
  
  // --- HIGH AMBIENT HEAT REJECTION LIMIT (Addition C) ---
  let condenserLimitFactor = 1.0;
  let systemCutOff = false;
  if (ambientTemp > 45) {
    // Condenser saturation effect
    // Efficiency drops rapidly above 45C
    condenserLimitFactor = 1.0 - ((ambientTemp - 45) * 0.05); 
    if (ambientTemp > 52) systemCutOff = true;
  }

  // --- DYNAMIC FAN PWM LOGIC ---
  let condenserApproach = 12 + (totalLoad * 1.8);
  // Penalize approach temperature at high ambient due to air density/fan saturation
  if (ambientTemp > 40) condenserApproach += (ambientTemp - 40) * 0.5;

  let tCond = ambientTemp + condenserApproach;
  let estimatedDischarge = tCond + 20 + (totalLoad * 4);

  if (estimatedDischarge > 90) {
      const severity = estimatedDischarge - 90;
      const fanCorrection = Math.min(8, severity * 0.8); 
      condenserApproach -= fanCorrection;
  }
  condenserApproach = Math.max(4, condenserApproach);
  tCond = ambientTemp + condenserApproach;
  // --- END FAN LOGIC ---

  // 4. Determine Operating Displacement & COP
  const tEvap = 3.0; 
  const tCondK = tCond + 273.15;
  const tEvapK = tEvap + 273.15;
  const carnotCOP = tEvapK / (tCondK - tEvapK);

  let displacementRatio = 1.0;
  let realCOP = 0;
  let dutyCycle = 1.0; // For Fixed Displacement

  // Identify Maximum Available Capacity at current conditions
  const availableCapacity = maxCapacityKW * condenserLimitFactor;

  if (compressorType === CompressorType.VARIABLE_DISPLACEMENT) {
    // Variable disp reduces stroke to match load
    displacementRatio = Math.min(1.0, Math.max(0.05, totalLoad / (availableCapacity || 1)));
    
    // Efficiency Benefit: VD maintains better COP at partial load.
    const efficiencyFactor = 0.60 + (0.20 * (1 - displacementRatio)); 
    realCOP = carnotCOP * efficiencyFactor;
    dutyCycle = 1.0;
  } else {
    // Fixed Displacement
    // Always 100% stroke when ON. 
    displacementRatio = 1.0;
    // Lower COP due to cycling losses and full stroke operation
    realCOP = carnotCOP * 0.50;
    
    // Calculate Duty Cycle for average power: Required Load / Max Capacity
    dutyCycle = Math.min(1.0, totalLoad / (availableCapacity || 1));
  }

  // 5. Compressor Power & Torque
  // Instantaneous Power = Power when Clutch is ENGAGED (for Fixed) or Power at Partial Stroke (for Variable)
  let instantaneousLoadKW = 0;
  if (compressorType === CompressorType.VARIABLE_DISPLACEMENT) {
      // Load matched to demand
      instantaneousLoadKW = availableCapacity * displacementRatio;
  } else {
      // Fixed: When ON, it pulls full capacity
      instantaneousLoadKW = availableCapacity;
  }

  // Physics check: If compressor can't meet load (maxed out), both saturate.
  // For Fixed, duty cycle stays at 1.0. For Variable, displacement stays at 1.0.
  
  const instantaneousPower = (instantaneousLoadKW / realCOP) / MECHANICAL_EFFICIENCY;
  
  // Average Power (accounting for duty cycle)
  let avgCompPower = instantaneousPower * dutyCycle;
  
  if (systemCutOff) {
    avgCompPower = 0;
  }

  // Ensure physics limits
  if (avgCompPower < 0.1 && !systemCutOff) avgCompPower = 0.1;

  // Torque Load (Peak/Instantaneous for stall logic)
  // This is the key trade-off: Fixed Displacement slams the engine with Max Load Torque when engaged.
  let effectiveRpm = Math.max(engineRpm, 600);
  let peakTorque = (instantaneousPower * 9548.8) / effectiveRpm;
  
  if (systemCutOff) peakTorque = 0;

  // --- IDLE SPEED CONTROL (ISC) INTERACTION ---
  let iscAction: SimulationMetrics['iscAction'] = 'None';
  let finalTorque = peakTorque;

  if (systemCutOff) {
    iscAction = 'System Cut-off';
  } else if (engineRpm < 950) {
    if (peakTorque > 15) {
      // Scenario: High load at idle.
      // ECU Strategy 1: Bump RPM
      iscAction = 'Idle Bump (+150rpm)';
      // Recalculate torque with higher RPM to see if it stabilizes
      finalTorque = (instantaneousPower * 9548.8) / (effectiveRpm + 150);
      
      // If still too high, Strategy 2: Derate Compressor (Variable only) or Cut (Fixed)
      if (finalTorque > 18) {
        if (compressorType === CompressorType.VARIABLE_DISPLACEMENT) {
          iscAction = 'Compressor Derate';
          displacementRatio *= 0.7; // Force destroke
          avgCompPower *= 0.7;
          finalTorque *= 0.7;
        } else {
           // Fixed displacement can't derate continuously.
           // In reality, it would rapid cycle (short cycling), which is bad.
           // We flag this as a risk.
           // No change to torque calculation as it must pull full load when ON.
        }
      }
    }
  }

  // 6. Fuel Penalty (Average)
  const fuelPenalty = (avgCompPower * BSFC_AVG) / FUEL_DENSITY;

  // 7. Discharge Temp Final
  const dischargeTemp = tCond + 18 + (avgCompPower * 8.5);

  // 8. Idle Status
  let idleStatus: 'stable' | 'warning' | 'stall_risk' = 'stable';
  if (engineRpm < 900 && iscAction !== 'System Cut-off') {
    if (finalTorque > 15) idleStatus = 'stall_risk';
    else if (finalTorque > 8) idleStatus = 'warning';
  }

  return {
    coolingLoad: parseFloat(totalLoad.toFixed(2)),
    sensibleLoad: parseFloat(sensibleLoad.toFixed(2)),
    latentLoad: parseFloat(latentLoad.toFixed(2)),
    cop: parseFloat(realCOP.toFixed(2)),
    compressorPower: parseFloat(avgCompPower.toFixed(2)),
    peakTorque: parseFloat(peakTorque.toFixed(2)),
    torqueLoad: parseFloat(finalTorque.toFixed(2)),
    dischargeTemp: parseFloat(dischargeTemp.toFixed(1)),
    efficiencyLoss: parseFloat(((1 - displacementRatio) * 100).toFixed(0)), 
    displacement: parseFloat((displacementRatio * 100).toFixed(0)),
    fuelPenalty: parseFloat(fuelPenalty.toFixed(2)),
    idleStatus,
    iscAction,
    tCond: parseFloat(tCond.toFixed(1)),
    tEvap: parseFloat(tEvap.toFixed(1))
  };
};

/**
 * Generates Transient Pull-Down Simulation Data
 */
const generatePullDownData = (inputs: SimulationInputs): PullDownPoint[] => {
  const data: PullDownPoint[] = [];
  const CABIN_THERMAL_MASS = 150; 
  
  let currentCabinTemp = inputs.ambientTemp; 
  const totalTime = 15; 

  for (let t = 0; t <= totalTime; t++) {
    data.push({
      time: t,
      cabinTemp: parseFloat(currentCabinTemp.toFixed(1)),
      targetTemp: inputs.targetCabinTemp
    });

    const deltaT = inputs.ambientTemp - currentCabinTemp;
    const solarFactor = 1 + (inputs.ambientTemp - 25) * 0.025;
    const heatInflux = (UA_CABIN * deltaT) + (SOLAR_LOAD_BASE * solarFactor) + PASSENGER_LOAD;
    
    // Apply humidity factor to pull-down load as well (Latent Load)
    const humidityFactor = Math.max(0, inputs.humidity - 30) * 0.012; 
    const totalInflux = heatInflux * (1 + humidityFactor);

    // Cooling Power
    const ambientDerating = 1 - ((inputs.ambientTemp - 25) * 0.01);
    const maxCapacityKW = (inputs.engineRpm / 60) * (COMPRESSOR_DISPLACEMENT_CC * 1e-6) * VOLUMETRIC_EFFICIENCY * REFRIGERANT_DENSITY_SUCTION * ENTHALPY_DELTA * ambientDerating;
    
    let coolingPower = maxCapacityKW; 
    if (inputs.compressorType === CompressorType.VARIABLE_DISPLACEMENT) {
       // Slow down cooling as we approach target (PID-like behavior)
       if (currentCabinTemp - inputs.targetCabinTemp < 2) {
         coolingPower = Math.min(maxCapacityKW, totalInflux * 1.2); // Maintain slightly more than load
       }
    } else {
       // Cycling thermostat
       if (currentCabinTemp <= inputs.targetCabinTemp) coolingPower = 0;
    }

    const netHeat = (totalInflux - coolingPower) * 60;
    const tempChange = netHeat / CABIN_THERMAL_MASS;
    
    currentCabinTemp += tempChange;
    // Don't go below target significantly
    if (currentCabinTemp < inputs.targetCabinTemp - 0.5) currentCabinTemp = inputs.targetCabinTemp - 0.5;
  }
  return data;
}

/**
 * Generates data arrays for charting purposes
 */
export const generateChartData = (inputs: SimulationInputs): ChartData => {
  const ambientSweep: AmbientSweepPoint[] = [];
  for (let t = 15; t <= 50; t += 2.5) {
    const sim = calculateSystemState({ ...inputs, ambientTemp: t });
    ambientSweep.push({
      ambient: t,
      power: sim.compressorPower,
      cop: sim.cop,
      tCond: sim.tCond,
      tEvap: sim.tEvap,
      torque: sim.peakTorque
    });
  }

  const rpmSweep: RpmSweepPoint[] = [];
  for (let r = 800; r <= 6000; r += 250) {
    const sim = calculateSystemState({ ...inputs, engineRpm: r });
    rpmSweep.push({
      rpm: r,
      power: sim.compressorPower,
      torque: sim.peakTorque
    });
  }

  const pullDownCurve = generatePullDownData(inputs);

  return { ambientSweep, rpmSweep, pullDownCurve };
};