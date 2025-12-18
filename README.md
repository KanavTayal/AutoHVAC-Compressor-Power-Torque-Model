<div align="center">
<img width="1200" height="475" alt="GHBanner" src="image.png" />
</div>

## AutoHVAC — Automotive AC Compressor Power & Torque Digital Twin

### Overview

AutoHVAC is a **physics-based system-level digital twin** for automotive HVAC systems.
The model estimates **compressor power consumption, engine torque penalty, fuel impact, and cabin thermal behavior** under varying ambient temperature, humidity, and operating conditions.

The tool is designed to reflect **real vehicle behavior in Indian summer conditions**, with specific focus on **variable displacement compressor technology** used in modern passenger vehicles.

---

### Key Capabilities

* 0D–1D HVAC system modeling
* Sensible + latent cabin thermal load calculation
* Variable displacement compressor physics
* Transient cabin pull-down simulation
* Engine torque coupling and idle impact
* Fuel consumption penalty estimation
* Technology trade-off: Fixed vs Variable displacement
* High-ambient derating logic (>45 °C)

---

### Physics & Modeling Assumptions

* Steady-state refrigerant cycle abstraction
* Lumped compressor isentropic + mechanical efficiency
* Constant airflow, variable recirculation factor
* ECU-like compressor displacement control
* Engine modeled as torque source with parasitic load coupling

(Full assumptions listed in `/docs/assumptions.md`)

---

### System Architecture

```
Cabin Load Model
     ↓
Cooling Demand (kW)
     ↓
Compressor Model (Fixed / Variable)
     ↓
Compressor Power (kW)
     ↓
Engine Torque Penalty (Nm)
     ↓
Fuel Consumption Impact (L/h)
```

---

### Example Results

* AC power increases non-linearly with ambient temperature
* Variable displacement reduces peak torque by ~35–45%
* Latent load contributes ~15–25% of total cooling load at 50% RH
* Fuel penalty ranges from 0.2–0.6 L/h depending on conditions

---

### Why This Project Matters

This model reflects **early-stage HVAC and powertrain system studies** performed by OEMs and Tier-1 suppliers to:

* Evaluate compressor technology
* Assess drivability impact
* Estimate fuel economy penalties
* Optimize cabin comfort strategies

---

### Future Extensions

* Blower electrical load modeling
* Fresh-air vs recirculation optimization
* EV heat-pump variant
* WLTP / RDE drive-cycle integration

---

### Author

Kanav Tayal
B.Tech Mechanical Engineering
HVAC · Powertrain · Thermal Systems
