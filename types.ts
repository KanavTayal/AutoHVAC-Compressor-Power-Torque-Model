export enum CompressorType {
  FIXED_DISPLACEMENT = 'Fixed Displacement',
  VARIABLE_DISPLACEMENT = 'Variable Displacement',
}

export interface SimulationInputs {
  ambientTemp: number; // Celsius
  targetCabinTemp: number; // Celsius
  engineRpm: number; // RPM
  compressorType: CompressorType;
  humidity: number; // %
}

export interface SimulationMetrics {
  coolingLoad: number; // kW Total
  sensibleLoad: number; // kW
  latentLoad: number; // kW
  cop: number; // Coefficient of Performance
  compressorPower: number; // kW (Average)
  peakTorque: number; // Nm (For drivability)
  torqueLoad: number; // Nm (Average/Effective)
  dischargeTemp: number; // Celsius (estimated)
  efficiencyLoss: number; // %
  displacement: number; // % of max stroke
  fuelPenalty: number; // L/h
  idleStatus: 'stable' | 'warning' | 'stall_risk';
  iscAction: 'None' | 'Idle Bump (+150rpm)' | 'Compressor Derate' | 'System Cut-off';
  tCond: number; // Condensing Temp (C)
  tEvap: number; // Evaporator Temp (C)
}

export interface DataPoint {
  x: number;
  y: number;
  z?: number;
}

export interface PullDownPoint {
  time: number; // minutes
  cabinTemp: number; // Celsius
  targetTemp: number; // Celsius
}

export interface AmbientSweepPoint {
  ambient: number;
  power: number;
  cop: number;
  tCond: number;
  tEvap: number;
  torque: number;
}

export interface RpmSweepPoint {
  rpm: number;
  power: number;
  torque: number;
}

export interface ChartData {
  pullDownCurve: PullDownPoint[];
  ambientSweep: AmbientSweepPoint[];
  rpmSweep: RpmSweepPoint[];
}

export interface AnalysisResponse {
  analysis: string;
  recommendations: string[];
}