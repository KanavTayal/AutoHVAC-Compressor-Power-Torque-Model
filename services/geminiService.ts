import { GoogleGenAI } from "@google/genai";
import { SimulationInputs, SimulationMetrics } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSimulation = async (
  inputs: SimulationInputs,
  metrics: SimulationMetrics
): Promise<string> => {
  
  const prompt = `
    You are a Senior Automotive Thermal Systems Calibration Engineer.
    Analyze the following AC Compressor simulation data.
    Focus on **compressor map efficiency**, **ECV (Electronic Control Valve) strategy**, **Head Pressure/Discharge Temp**, and **Powertrain Integration**.

    **Simulation Context:**
    - Ambient: ${inputs.ambientTemp}°C, Target Cabin: ${inputs.targetCabinTemp}°C
    - Humidity: ${inputs.humidity}% (Latent Load Factor)
    - Engine: ${inputs.engineRpm} RPM
    - Tech: ${inputs.compressorType}

    **Key Performance Indicators:**
    - Avg Power: ${metrics.compressorPower} kW
    - Peak Torque: ${metrics.torqueLoad} Nm (Idle Status: ${metrics.idleStatus}, ISC Action: ${metrics.iscAction})
    - Loads: Sensible ${metrics.sensibleLoad}kW, Latent ${metrics.latentLoad}kW
    - Displacement: ${metrics.displacement}%
    - Fuel Penalty: ${metrics.fuelPenalty} L/h
    - COP: ${metrics.cop}
    - Discharge Temp: ${metrics.dischargeTemp}°C (Est. Condenser Temp: ${metrics.tCond}°C)

    **Request:**
    Provide a technical engineering assessment (max 3 paragraphs):
    1. **Thermodynamic Efficiency**: Evaluate the COP and Discharge Temp. Comment on the impact of Humidity (${inputs.humidity}%) on the total load.
    2. **Displacement & Fuel**: Is the displacement optimized? Evaluate the fuel penalty relative to the Latent Load demand.
    3. **Driveability & Control**: Assess torque load and ISC (Idle Speed Control) intervention. Is the ${metrics.iscAction} appropriate for this operating point?

    No markdown headers. Keep it professional, highly technical, and concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI Analysis service. Please check API Key configuration.";
  }
};