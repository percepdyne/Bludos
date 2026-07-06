# PHYSICAL PRODUCT DESIGN — DEFINITIVE MASTER DOCUMENTATION CHECKLIST
### Complete Reference: Strategy Through End-of-Life
*Consumer Hardware · Edge AI Devices · Robotics · Autonomous Vehicles · EV Systems · Additive Manufacturing*

---

> **How to use this document:** Items marked `[AI/ROBOT/EV]` apply specifically to complex interconnected products with autonomous behaviors, edge compute, or high-voltage systems. All other items apply universally to physical product development. Each phase ends with a **Phase Gate Archive Checkpoint** defining what must be filed before proceeding.

---
---

## PHASE 0 — STRATEGY, MARKET & SYSTEMS ARCHITECTURE

### 0.1 Product Strategy & Business Definition

- **Product Strategy Document** — overarching vision, multi-year product roadmap, target price points, margin targets, and revenue model (hardware, SaaS, services, licensing)
- **Business Case & Investment Thesis** — ROI projections, break-even analysis, capital expenditure plan, and funding stage alignment
- **Total Addressable Market (TAM) / SAM / SOM Analysis** — quantitative market sizing with methodology and data sources cited
- **Market Study & Opportunity Mapping** — quantitative data on market trends, growth projections, competitor market share, unmet needs, and white-space opportunities
- **Product Positioning Map** — visual and written documentation of how the product sits relative to competitors on key axes (price, capability, form factor, etc.)
- **Technology Readiness Level (TRL) Assessment** — documented TRL for all key technologies and subsystems at program start
- **Go-to-Market Strategy Document** — launch plan, target channels, launch markets, and timing
- **Channel Strategy Documentation** — direct, retail, OEM, and distribution partner agreements and requirements
- **Pricing Strategy Document** — pricing model, promotional strategy, regional pricing tiers, and BOM cost targets at volume
- **Multi-Generational Product Plan (MGPP)** — future variant roadmap documenting planned feature additions, SKU expansions, and platform evolutions

### 0.2 Competitive Intelligence & Market Analysis

- **Competitive Product Teardown & Comparison Matrix** — line-by-line breakdown of competitor products including estimated BOM costs, manufacturing methods, feature comparisons, identified weaknesses, and design shortcomings
- **Competitive Benchmarking Reports** — performance benchmarks, user satisfaction scores, retail pricing, and review sentiment analysis for key competitors
- **Technology Scouting Reports** — emerging technologies, supplier innovations, and academic research relevant to the product space
- **Patent Landscape Map** — visualization of key patent clusters, white spaces, and competitor IP holdings in the relevant technology domain

### 0.3 Intellectual Property (IP) Strategy

- **Patent Search Results** — prior art searches conducted per novel aspect of the design
- **Freedom-to-Operate (FTO) Analysis** — formal legal opinion on whether the product can be commercialized without infringing active patents
- **Provisional Patent Filings** — records of all provisional applications filed during the design process
- **IP Ownership Agreements** — employee IP assignment agreements, contractor IP assignment clauses, and joint development agreements
- **Trade Secret Documentation Protocol** — procedures for identifying, classifying, and protecting confidential know-how
- **Open-Source License Compliance Audit** — inventory of all open-source software and hardware used, license types, and compliance obligations
- **Trademark Filings** — product name, logo, and brand marks registered across all target markets

### 0.4 Stakeholder, Shareholder & Ecosystem Architecture

- **Stakeholder Register & RACI Matrix** — all internal and external stakeholders mapped with Responsible, Accountable, Consulted, and Informed roles
- **Shareholder & Investor Communication Plan** — gate review schedule, milestone reporting format, and escalation protocols for investment decisions
- **Stage Gate Approval Requirements per Stakeholder** — documented sign-off criteria, required evidence packages, and approval authority at each phase gate
- **Regulatory & Liability Exposure Strategy** — liability framework for autonomous behaviors, data privacy compliance (GDPR, CCPA, PDPA), and regional machinery or automotive directives; legal review sign-offs
- **Technology Partnership & Licensing Agreements** — signed agreements with chipset vendors, software platform providers, and sensor suppliers
- **Sub-Processor & Cloud Dependency Mapping** `[AI/ROBOT/EV]` — architecture diagrams documenting what processing occurs on the edge chip vs. requiring cloud offload; latency and privacy implications documented

### 0.5 Systems Architecture
*[Primarily for AI / Robotics / EV / Connected Products]*

- **System Architecture Document (SAD)** `[AI/ROBOT/EV]` — top-level block diagram defining all hardware, software, and communication subsystems and their interfaces
- **Edge vs. Cloud Compute Allocation Document** `[AI/ROBOT/EV]` — which AI models, decisions, and data processing run locally vs. remotely; rationale for each allocation
- **Sensor Architecture Document** `[AI/ROBOT/EV]` — all sensor types, communication protocols, sampling rates, data formats, and fusion strategy
- **Power Architecture Document** `[AI/ROBOT/EV]` — power domains, voltage rails, battery chemistry, BMS architecture, and power budget per subsystem
- **Communication Architecture Document** `[AI/ROBOT/EV]` — internal bus protocols (CAN, I2C, SPI, UART, Ethernet), external wireless protocols (BLE, Wi-Fi, LTE/5G, UWB), and security model
- **Functional Safety Strategy Document** `[AI/ROBOT/EV]` — applicable standards (ISO 26262, IEC 61508, ISO 13849), safety integrity levels (SIL/ASIL) assigned to each subsystem
- **Cybersecurity Architecture Document** `[AI/ROBOT/EV]` — threat model, attack surface analysis, security controls, secure boot chain, and OTA security protocol

> **Phase 0 Gate Archive Checkpoint:** Product strategy doc, business case, market study, IP search results, FTO analysis, stakeholder register, and systems architecture block diagram.

---
---

## PHASE 1 — RESEARCH & DISCOVERY

### 1.1 Qualitative User Research

- **Research Plan & Protocol Document** — objectives, methodologies selected, participant criteria, session structure, and ethical review approval
- **User Interview Transcripts & Recordings** — raw interview notes, audio/video recordings, and timestamped quotes
- **Ethnographic Study Reports & Field Observation Notes** — contextual research from in-situ observations of users in natural environments
- **Diary Study Data** — longitudinal self-reported data capturing user behaviors and pain points over time
- **Focus Group Session Documentation** — moderator guide, participant profiles, session recordings, and debrief notes
- **Shadowing & Contextual Inquiry Reports** — field notes from accompanying users through tasks related to the problem space
- **Expert & Domain Specialist Interviews** — structured interview records with subject matter experts (clinicians, mechanics, operators, etc.)
- **Cultural & Regional Adaptation Research** — documentation of cultural norms, regional usage patterns, and local regulatory differences that affect design

### 1.2 Quantitative Research & Data

- **Survey Design Documentation** — survey instrument, question rationale, answer scales, and bias mitigation measures
- **Survey Raw Data Sets** — raw response exports and data hygiene documentation (cleaning steps, outlier handling)
- **Statistical Analysis Reports** — descriptive and inferential statistics, confidence intervals, p-values, sample sizes, and validity assessments
- **Benchmarking & Usability Study Data** — task completion rates, error rates, time-on-task metrics, and SUS (System Usability Scale) scores from comparable products
- **Usage Analytics Documentation** — telemetry, heatmaps, and session recordings from existing or predecessor products, with privacy compliance notes
- **Market Segmentation & Persona Data Models** — quantitative segmentation analysis supporting the personas defined in synthesis

### 1.3 Research Synthesis & Insights

- **Research Synthesis & Insights Report** — distillation of all qualitative and quantitative research into actionable design constraints, opportunity areas, and ranked user needs
- **User Personas Document** — primary, secondary, and edge-case personas with demographic profiles, goals, frustrations, and behavioral archetypes
- **Jobs-to-Be-Done (JTBD) Framework Document** — functional, social, and emotional jobs users are hiring the product to do
- **Empathy Maps** — visual documentation of what users think, feel, say, and do in the relevant context
- **Affinity Diagrams & Clustering Documentation** — raw sticky-note clusters or digital equivalents capturing organization of research data into themes
- **Design Principles Document** — 4–8 guiding principles derived from research that will govern decisions throughout the program

### 1.4 Human-Robot Interaction (HRI) & Customer Experience (CX)
*[For AI devices, robots, autonomous vehicles, and interactive edge products]*

- **HRI / CX Behavioral Matrix** `[AI/ROBOT/EV]` — documentation of how the product communicates state, intent, errors, and readiness via physical motion, LED lighting, sound, haptics, and display
- **Edge-Interaction Journey Maps** `[AI/ROBOT/EV]` — step-by-step mapping of user interactions during offline operation, low-battery states, sensor obstruction, and degraded-mode scenarios
- **Proxemics & Personal Space Documentation** `[AI/ROBOT/EV]` — safe operating distances, approach vectors, and behavioral responses relative to human presence zones
- **Emotional Design & Trust Framework** `[AI/ROBOT/EV]` — principles for how the product builds and maintains user trust during autonomous operation or failure states
- **Accessibility & Inclusive Design Research** — documentation of how users with different abilities (visual, motor, cognitive) interact with the product and what adaptations are required
- **Error Communication Design Document** `[AI/ROBOT/EV]` — taxonomy of error types, severity levels, and required communication behaviors per error state
- **Child Safety & Vulnerable User Documentation** `[AI/ROBOT/EV]` — specific safety behaviors required when the product detects proximity to children or medically vulnerable individuals

### 1.5 Assumptions, Hypotheses & Performance Targets

- **Assumption Log & Hypothesis Tracking Ledger** — a living document where every technical, market, and user assumption is logged, assigned a confidence level and risk rating, tracked throughout the program, and formally closed when proven or disproven with supporting evidence
- **Edge Performance & Latency Requirements Document** `[AI/ROBOT/EV]` — hard metrics for local inference speed (ms), sensor-to-actuation latency (ms), power budget per compute cycle (mW), and acceptable model accuracy thresholds
- **Power & Battery Life Requirements** — documented targets for operational runtime, standby duration, charge time, and cycle life expectancy
- **Reliability & Durability Requirements** — MTBF targets, designed lifetime (hours/cycles/years), and environmental survival envelope

### 1.6 Requirements Definition

- **Product Requirements Document (PRD)** — finalized non-negotiable features, performance metrics, regulatory constraints, and user experience requirements
- **System Requirements Specification (SRS)** — technical translation of the PRD into measurable system-level requirements
- **Requirements Traceability Matrix (RTM)** — bidirectional mapping from user needs → PRD → SRS → test cases
- **Regulatory & Standards Requirements Register** — all applicable standards and directives by market region with specific clauses identified

> **Phase 1 Gate Archive Checkpoint:** Full research dataset (raw + synthesis), all persona documents, assumption log, PRD, SRS, and RTM.

---
---

## PHASE 2 — IDEATION & CONCEPTUALIZATION

### 2.1 Concept Ideation & Selection

- **Ideation Session Records** — methods used (SCAMPER, TRIZ, morphological charts, worst possible idea, etc.), participant list, raw sketch outputs, and session notes
- **Concept Sketches & Ideation Boards** — all explored directions including rejected ones, with rationale annotations
- **Rough Block Models / Foam Models Documentation** — photographs, dimensions, and evaluation notes for physical sketch models
- **Concept Alternatives Documentation** — minimum 3 clearly differentiated directions with written summaries of their key differentiation, risks, and trade-offs
- **Concept Selection Criteria Definition** — agreed criteria and weightings used to evaluate concepts against requirements
- **Pugh Matrix / Weighted Scoring Matrix** — completed concept evaluation matrix with scores, rationale per criterion, and audit trail for the selection decision
- **Concept Validation Reports** — focus group, A/B testing, or co-creation session data proving which direction resonates with users, including participant demographics and statistical confidence

### 2.2 Branding & Industrial Design Identity

- **Brand Hardware Guidelines** — logo placement specifications, minimum sizes, exclusion zones, and approved materials for brand elements
- **Form Language & Design Language Document** — documented design DNA defining specific curves, proportions, edge treatments, and gestural elements that define the product family aesthetic
- **Bezel Sizing & Proportions Document** — dimensioned documentation of border ratios, corner radii, and surface hierarchy

### 2.3 CMF (Color, Material, Finish) Specification

- **CMF Exploration Documentation** — record of all CMF options explored and rejected with rationale for each
- **CMF Master Specification Document:**
  - Exact color callouts (Pantone, RAL, NCS, CIELab codes for each colorway)
  - Material specifications (polymer grades, alloy designations, fabric compositions)
  - Finish specifications (VDI 3400 spark finish grade, SPI polish standards, surface roughness Ra values)
  - Gloss level specifications (measured in Gloss Units at 20°/60°/85° geometry)
  - Surface treatment specifications (anodization type, PVD coating, electroplating, painting process)
  - Texture pattern artwork files and depth specifications
- **CMF Supplier Qualification Records** — approved suppliers for each material and finish process with qualification data
- **CMF Validation Samples & Approval Records** — physical golden samples, sign-offs, and deviation records
- **CMF Durability & Aging Requirements** — documented testing requirements for UV fade resistance, scratch resistance (pencil hardness, steel wool), chemical resistance, and wear resistance per material

### 2.4 Lighting, Illumination & Indication Design

- **Lighting Behavior Specification** — complete state dictionary defining what every lighting pattern communicates (AI active, charging, error, standby, pairing, etc.)
- **LED Animation & Transition Specifications** — framerate, easing curves, timing sequences, crossfade durations, and looping behavior for each animation state
- **PWM (Pulse Width Modulation) Specifications** — PWM frequency, duty cycle ranges, and dimming curve documentation
- **Color Temperature & CRI Requirements** — Kelvin value, CRI minimum, or xy chromaticity coordinates for all LEDs
- **Luminous Intensity & Uniformity Requirements** — minimum and maximum intensity (mcd), angular distribution, and uniformity ratio across a diffused aperture
- **Optical Diffuser & Light Guide Specifications** — material, haze percentage, transmission percentage, thickness, and surface treatment
- **Night / Low-Ambient Mode Specification** — automatic dimming behavior, ambient light sensor thresholds, and minimum-brightness requirements
- **Regulatory & Safety Lighting Compliance** — warning indicator requirements and photobiological safety compliance (IEC 62471)
- **Lighting PCB & LED Placement Specifications** — LED array layout, current-limiting resistor specs, and thermal management for high-power LEDs

### 2.5 Ergonomics, Human Factors & On-Product Graphics

- **Ergonomics & Human Factors Evaluation Report** — anthropometric data applied to the design: grip angles, reach envelopes, button actuation forces (cN), torque requirements, weight, weight distribution, and balance point
- **Tactile & Haptic Feedback Specification** — vibration motor specs, haptic patterns, intensity levels, and associated trigger events
- **On-Product Graphics & Iconography Specification:**
  - Vector artwork files (.ai, .svg) for all regulatory marks, warning symbols, port indicators, and brand emblems
  - Placement parameters (distance from edge, orientation, minimum size)
  - Marking method specification (laser etch, pad print, hot stamp, in-mold decoration, screen print)
  - Minimum legibility requirements (contrast ratio, character height)
- **Warning Label & Safety Mark Documentation** — ISO 11684-compliant safety label designs, placement locations, and multilingual text requirements
- **Regulatory Mark Placement Document** — FCC ID, CE, UKCA, BIS, e-mark, and other certification marks: minimum sizes, required co-located text, and placement zones on product and packaging

### 2.6 Behavioral & AI Systems Concept Architecture
*[For AI, robotic, and autonomous products]*

- **State Machine Architecture Document** `[AI/ROBOT/EV]` — system states, transitions, guards, and outputs documented as state diagrams and state tables
- **Behavioral Tree Design Document** `[AI/ROBOT/EV]` — hierarchical behavior trees governing autonomous decision-making and task execution
- **Sensor Field of View (FoV) Coverage Map** `[AI/ROBOT/EV]` — 3D visualizations documenting required clear sight-line cones for cameras, LiDAR, radar, ultrasonic sensors, and IR sensors, with housing obstruction exclusion zones
- **Physical Constraint Zones for Sensor Clearance** `[AI/ROBOT/EV]` — mechanical design rules derived from FoV maps (keep-out volumes around sensor apertures)
- **AI Model Capability Specification** `[AI/ROBOT/EV]` — performance targets per AI model (mAP, accuracy, false positive/negative rates, latency budget)
- **Edge Inference Requirement Document** `[AI/ROBOT/EV]` — target silicon platform, TOPS/FLOPS allocation per model, memory footprint, and power budget per inference
- **Sensor Fusion Architecture Document** `[AI/ROBOT/EV]` — fusion algorithms, synchronization strategy, ground truth calibration method, and confidence weighting
- **Behavioral Safety Constraint Document** `[AI/ROBOT/EV]` — hard rules the behavioral system must never violate

> **Phase 2 Gate Archive Checkpoint:** All concept sketches, Pugh matrix, concept validation report, CMF master spec, lighting behavior spec, approved concept CAD/renders, and behavioral architecture diagrams.

---
---

## PHASE 3 — DETAILED ENGINEERING & DFx

### 3.1 Mechanical Engineering

- **Master CAD Assembly & Architecture** — finalized parametric 3D models, assembly structure, and component tree with version-controlled change history
- **Released Engineering Drawings with GD&T** — fully dimensioned 2D drawings using ASME Y14.5 / ISO 1101 for all custom parts
- **Assembly Drawings & Assembly Sequence Documentation** — exploded views and numbered assembly steps
- **Finite Element Analysis (FEA) / Structural Simulation Reports** — stress, deflection, and safety factor results under defined load cases
- **Interface Control Documents (ICD)** — dimensional and functional interface requirements between subsystems and assemblies
- **Fastener Schedule** — complete list of all fasteners with thread form, length, head type, material, torque specification, and locking method
- **Tolerance Stack-Up Analysis** — worst-case and statistical (RSS) tolerance analyses proving assemblability and function at manufacturing extremes
- **Mass Properties Report** — documented weights, centers of gravity, and moments of inertia for all assemblies and the complete product

### 3.2 Thermal Management

- **Thermal Management Strategy Document** — cooling philosophy (passive, active, liquid), heat path documentation, and thermal budget per component
- **CFD (Computational Fluid Dynamics) Simulation Reports** — airflow simulations, temperature distribution maps, hot spot identification, and simulation input parameters
- **Thermal Interface Material (TIM) Specifications** — material type (pad, paste, phase-change), thermal conductivity (W/m·K), compression thickness, and application method
- **Heat Sink Design Documentation** — geometry, fin density, material, anodization specification, and attachment method
- **Computational Dissipation Profile** `[AI/ROBOT/EV]` — power dissipation map per component at typical and peak operation, used to size the thermal system

### 3.3 Electrical, Power & Wiring

- **Complete Electrical Schematics** — all PCB-level schematics with component values, reference designators, and net names
- **PCB Design Files & Layout Documentation** — Gerber files, layer stack-up definition, impedance control documentation, and DRC reports
- **Wiring Harness & Structural Routing Topology** — 2D/3D schematics mapping internal pathways for data, power, and high-voltage lines; EMI separation zones documented
- **EMC / EMI Management Plan** — shielding strategy, filtering approach, PCB layout rules, and cable ferrite specifications
- **Power Budget Document** — complete power consumption breakdown by mode (active, idle, sleep, peak) with margin calculations
- **Battery & BMS Specification Document** — cell chemistry, capacity (Ah/Wh), nominal/max voltage, charge/discharge rate, protection circuit, and thermal behavior
- **High-Voltage Safety Documentation** `[AI/ROBOT/EV]` — isolation requirements, creepage/clearance specs, arc flash protection, and high-voltage interlock loop (HVIL) design
- **Grounding & Shielding Strategy Document** — chassis grounding topology, PCB ground plane strategy, and cable shield termination methods
- **Cable & Connector Specification Document** — all connector types, mating cycles, IP rating, wire gauge, color coding, and routing constraints
- **Firmware / Software Requirements Specification** — documented hardware-software interface requirements, interrupt priorities, and memory map (where applicable)

### 3.4 DFM — Plastics / Injection Molding

- **Mold Flow Simulation Reports** — filling analysis, packing analysis, warpage prediction, weld line locations, and sink mark risk assessment
- **Draft Angle Documentation** — minimum draft angles per surface type and texture depth; zero-draft justification where required
- **Wall Thickness Analysis** — uniform wall thickness map, thick section risk areas, and rib-to-wall ratio compliance
- **Gate Location Documentation** — primary and secondary gate positions, gate type (hot runner, cold runner, valve gate), and justification
- **Parting Line Documentation** — parting line location, mold split strategy, and visible parting line acceptance criteria
- **Side Action, Lifter & Slider Documentation** — mechanism type, actuation method, travel, and undercut geometry justification
- **Surface Finish Requirements per Mold Zone** — SPI finish callouts (A1–D3) or VDI 3400 grades per zone with transition boundaries defined
- **Mold Tool Design Specification** — steel type, hardness, number of cavities, core/cavity layout, cooling channel design, and expected tool life (shots)
- **Plastic Material Specification** — resin grade, colorant type (masterbatch or compounded), UV stabilizer package, and material certification requirements

### 3.5 DFM — Metal / Machining

- **Machining Operation Sequence Documentation** — process plan with operation numbers, machine type, tooling, fixtures, and inspection points
- **Tool Clearance Documentation** — minimum approach distances for cutting tools, drill bit clearances, and tapped hole depth requirements
- **Bend Radius Specifications (Sheet Metal)** — minimum inside bend radius per material and thickness, springback allowance, and bend reliefs
- **Weld Specification Documents (WPS)** — Weld Procedure Specifications including weld type, filler material, preheat requirements, and inspection criteria per AWS / ISO standards
- **Material Yield Optimization Analysis** — nesting layouts for sheet metal blanks, extrusion cut optimization, and scrap rate targets
- **CNC Program Documentation** — CAM program files, tool path documentation, setup sheets, and first-off inspection protocol

### 3.6 DFM — Die Casting & Forging

- **Die Design Documentation & Thermal Analysis** — die geometry, cooling/heating circuits, and cycle time targets
- **Draft Angle & Parting Line Specification for Castings** — per-surface draft callouts and parting line drawing
- **Porosity Acceptance Criteria** — visual and X-ray inspection criteria with reference images; CT scan requirements for structural castings
- **Heat Treatment Specification** — process (annealing, T6, quench & temper), temperature/time profile, and hardness targets

### 3.7 DFM — Additive Manufacturing / 3D Printing

- **AM Process Selection Document** — documented rationale for choosing FDM, SLA/DLP, SLS, MJF, DMLS/SLM, EBM, Polyjet, or Binder Jetting; process capability comparison matrix
- **AM Design Guidelines Compliance Checklist** — minimum wall thickness per process, minimum feature size, maximum overhang angle (typically 45°), minimum hole diameter, and text emboss/deboss depth
- **Build Orientation Analysis** — documented rationale for chosen print orientation: anisotropy effects on mechanical properties, surface finish on critical faces, and support minimization strategy
- **Support Strategy Document** — support type (tree, lattice, breakaway, soluble/dual extrusion), support interface layer specification, breakaway force targets, and surface damage risk assessment
- **Print Parameter Specification:**
  - Layer height / resolution
  - Infill pattern and density (FDM/SLS)
  - Wall count / shell thickness
  - Print temperature profiles (nozzle, bed, chamber)
  - Print speed and cooling strategy
  - Retraction settings (FDM)
- **AM Material Specification** — filament grade (PLA, ABS, PETG, Nylon, TPU, PEEK, CF-reinforced), resin formulation (standard, tough, flexible, castable), or powder specification (PA12, PA11, TPU, metal alloy grade)
- **AM Material Property Data Sheet** — as-printed mechanical properties (tensile strength, elongation at break, Young's modulus, HDT) vs. injection-molded equivalents; anisotropy data across X/Y/Z axes
- **AM Material Storage & Handling Protocol** — moisture control requirements (desiccant, storage humidity limits), shelf life, and pre-drying protocol per material
- **Post-Processing Specification** — surface finishing (sanding, bead blasting, tumbling, chemical smoothing), curing (UV, thermal), painting, electroless plating / metallization, resin infiltration, and annealing for stress relief
- **AM Part Tolerance & Achievable Accuracy Document** — process-specific dimensional accuracy (e.g., FDM ±0.5%, SLA ±0.1mm) and measurement protocol for AM parts
- **Topology Optimization Documentation** — FEA-driven topology optimization results, mass reduction targets achieved, and print-readiness assessment
- **Lattice Structure Specification** — lattice topology (gyroid, BCC, octet truss), cell size, strut diameter, relative density, and predicted mechanical properties
- **AM-Specific Inspection Protocol** — layer adhesion visual inspection criteria, density measurement method, CT scan requirements for internal geometries, and porosity acceptance criteria for metal AM
- **AM File Preparation Documentation** — .STL or .3MF export settings, triangle count and resolution, mesh repair steps performed, and slicer software version and settings profile used
- **Slicer Software Settings Archive** — saved settings profiles per machine/material/part, stored in version-controlled file archive
- **AM Machine Qualification Records** — machine calibration records, preventive maintenance log, build plate leveling records, and process capability data (Cpk per dimension)
- **AM vs. Conventional Manufacturing Decision Matrix** — documented trade-off analysis for each component: cost at volume, lead time, mechanical performance, and surface quality comparison
- **Functional Prototyping vs. Production AM Classification** — documented decision for each AM part: prototype-only, bridge production, or final production AM
- **AM Production Part Qualification** (for production AM parts) — process parameter lock, golden sample approval, and repeatability study (equivalent of PPAP for traditional manufacturing)

### 3.8 Design for Assembly (DFA)

- **DFA Time Study Documentation** — Boothroyd-Dewhurst or equivalent analysis scoring each part for ease of handling and insertion
- **Station-by-Station Assembly Sequence** — complete assembly flow broken down by workstation with time estimates and ergonomic considerations
- **Assembly Error-Proofing (Poka-Yoke) Documentation** — all anti-mistake features (asymmetric keying, color coding, directional snaps, physical interlocks) with rationale
- **Screw Count & Fastener Reduction Analysis** — before/after comparison with cost and time savings quantified
- **Snap-Fit & Clip Design Documentation** — force-deflection analysis, fatigue life calculation, and assembly/disassembly force specifications
- **Connector & Cable Management Documentation** — routing paths, retention features, service loop lengths, and mating verification methods

### 3.9 Design for Serviceability (DFS)

- **Modular Sub-Assembly Documentation** — which assemblies are designed as field-replaceable units (FRUs), with justification
- **Toolless Entry & Access Documentation** — all tool-free access points with opening force specs and cycle life
- **Component Swap Time Targets & Actuals** — documented target times for replacing each field-serviceable component; validated against prototypes
- **Field Technician Access Guide (Draft)** — step-by-step visual guide for common service operations developed in parallel with engineering
- **Spare Parts Hierarchy Documentation** — every part classified as: not serviceable / customer-replaceable / technician-replaceable / depot-only
- **Service Tool Specification** — custom tools required for service, with design files

### 3.10 Design for Environment / Sustainability (DFE)

- **Material Lifecycle Assessment (LCA)** — carbon footprint, energy consumption, and water use through raw material extraction, manufacturing, use, and disposal
- **Recyclability & Disassembly Documentation** — design for end-of-life disassembly, material separation strategy, and recyclability percentage targets
- **Restricted Substances Management Document** — compliance with RoHS, REACH SVHC, PFAS restrictions, and customer-specific substance bans
- **Energy Efficiency Documentation** — active mode power consumption, standby power, and compliance with energy efficiency regulations (ErP, ENERGY STAR, etc.)
- **Packaging Sustainability Analysis** — packaging material composition, recycled content percentages, and recyclability documentation

### 3.11 Assumption Closure & Design Review

- **Assumption Proof & Validation Matrix** — direct linkage from every assumption logged in Phase 1 to the engineering decision or test result that closes it; all items tracked to closure
- **Design Decision Log** — rationale documented for every significant engineering decision
- **Technical Risk Register** — all identified technical risks with probability, impact, mitigation actions, and risk owners; updated at every gate
- **Preliminary Design Review (PDR) Records** — agenda, attendees, presented materials, issues raised, and disposition for all open items
- **Critical Design Review (CDR) Records** — confirms design is stable enough to commit to tooling; all open items dispositioned

> **Phase 3 Gate Archive Checkpoint:** Released CAD package, all engineering drawings with GD&T, DFMEA, all DFM/DFA/DFS analysis reports (including AM documentation), FEA reports, CDR records, and updated risk register.

---
---

## PHASE 4 — PROTOTYPING & ITERATION

### 4.1 Prototype Management

- **Prototype BOM per Build Revision** — specific parts, materials, and fabrication methods used for each prototype build (alpha, beta, EVT, DVT, PVT)
- **Prototype Version Log** — dates, build numbers, objectives, participants, and key differences from previous build
- **Prototype Deviation Log** — all ways each prototype intentionally deviates from production intent, with impact assessment per deviation
- **Prototype Disposition Records** — where each prototype is assigned (engineering, testing, marketing, destructive testing) and chain of custody
- **Prototype Cost Tracking** — actual cost per prototype build vs. budget

### 4.2 EVT / DVT / PVT Plans & Reports

- **EVT (Engineering Validation Test) Plan** — test objectives: proving the design concept works and meets functional requirements
- **EVT Test Report** — results, pass/fail status per test, failures found, and required design changes
- **DVT (Design Validation Test) Plan** — test objectives: proving the design meets all specifications, looks correct, and is manufacturable
- **DVT Test Report** — results with statistical sample sizes, pass/fail, and action items
- **PVT (Production Validation Test) Plan** — test objectives: proving the product can be manufactured at scale with acceptable yield
- **PVT Test Report** — yield rates, line audit findings, and corrective actions
- **EVT → DVT Delta Report** — documented changes made between builds and their verification status
- **DVT → PVT Delta Report** — same for DVT to PVT transition
- **Non-Conformance Reports (NCRs)** — all non-conformances found during prototyping with root cause and disposition
- **Lessons Learned per Prototype Iteration** — documented learnings captured at each build cycle

### 4.3 Edge AI, Software & Hardware Validation
*[For AI / Connected / Robotic products]*

- **Edge AI Model Benchmarking Logs** `[AI/ROBOT/EV]` — performance metrics (accuracy, precision/recall, F1, mAP) on production-representative silicon before and after quantization
- **Model Quantization & Compression Documentation** `[AI/ROBOT/EV]` — int8/int4 methodology, accuracy degradation acceptance criteria, and re-training records
- **Hardware-in-the-Loop (HIL) Test Documentation** `[AI/ROBOT/EV]` — test rig architecture, simulated environment parameters, scenarios, pass/fail criteria, and results
- **Software-in-the-Loop (SIL) Test Documentation** `[AI/ROBOT/EV]` — software-only simulation test results prior to hardware availability
- **AI Model Validation Against Edge Conditions** `[AI/ROBOT/EV]` — performance under low light, rain, occlusion, sensor degradation, and out-of-distribution inputs
- **Inference Latency Measurement Reports** `[AI/ROBOT/EV]` — end-to-end measured latency (sensor → inference → actuation) on production hardware under load
- **Edge-Cloud Sync & Reconnection Testing** `[AI/ROBOT/EV]` — documented test results for behavior when connectivity is lost and regained

> **Phase 4 Gate Archive Checkpoint:** All prototype version logs, EVT/DVT/PVT plans and reports, delta reports, NCRs, AI benchmarking logs, and lessons learned per iteration.

---
---

## PHASE 5 — VERIFICATION, VALIDATION & REGULATORY COMPLIANCE

### 5.1 V&V Master Planning

- **Verification & Validation (V&V) Master Plan** — complete test coverage map linking every requirement in the RTM to a specific test method, sample size, acceptance criterion, and responsible owner
- **Test Method Documentation** — detailed procedures for every test type, including equipment calibration requirements and environmental conditions

### 5.2 Structural & Mechanical Reliability

- **Drop Test Reports** (IEC 60068-2-31 or ISTA / MIL-STD-810) — drop height, surface type, orientations, sample size, pass/fail criteria, and results
- **Vibration Test Reports** (IEC 60068-2-6/64, MIL-STD-810) — frequency sweep range, acceleration levels, duration, and fatigue results
- **Mechanical Shock Test Reports** — peak g levels, pulse duration, and orientations tested
- **Button / Control Actuation Life Cycle Reports** — actuations tested (e.g., 100,000 cycles), force evolution data, and failure mode documentation
- **Hinge & Flex Fatigue Reports** — cycles tested, angular range, applied load, and failure mode
- **Seal Integrity / IP Rating Test Reports** — IEC 60529 dust and water ingress test methodology and results
- **Cable & Connector Mating Cycle Reports** — mating cycles tested and contact resistance evolution

### 5.3 Environmental Validation

- **Thermal Cycling Test Reports** — temperature range, ramp rate, dwell times, number of cycles, and failure analysis
- **High-Temperature Operating & Storage Test Reports** — maximum rated temperature soak with functionality verification
- **Low-Temperature Operating & Storage Test Reports** — minimum rated temperature soak and cold-start verification
- **Humidity & Condensation Test Reports** (IEC 60068-2-78) — test conditions and performance results
- **UV / Solar Radiation Degradation Reports** — accelerated UV exposure per ASTM G154 or IEC 60068-2-5; color and material degradation measurements
- **Salt Fog / Corrosion Test Reports** (ASTM B117 / ISO 9227) — exposure duration, evaluation criteria, and results
- **Altitude / Low-Pressure Test Reports** — relevant for air freight and high-altitude operation
- **Freeze-Thaw Cycle Test Reports** — packaging and product performance after repeated freeze-thaw cycles
- **Contamination & Chemical Resistance Reports** — test results for resistance to cleaning agents, solvents, sweat, UV exposure, and other relevant contaminants

### 5.4 HALT / HASS Testing

- **HALT (Highly Accelerated Life Testing) Plan** — test conditions (temperature, vibration, combined), step stress profile, and pass criteria
- **HALT Report** — failure modes found, operating limits, destruct limits, and design margins identified
- **HASS (Highly Accelerated Stress Screening) Plan** — production screening profile derived from HALT findings; applied to production units
- **HASS Qualification Records** — proof that HASS screen does not consume significant product life while effectively screening latent defects
- **HASS Ongoing Records** — per-batch HASS records maintained throughout production life

### 5.5 Electrical, EMC & Safety Testing

- **Electrical Safety Test Reports** (IEC 62368-1, UL 62368-1) — dielectric strength, earth continuity, leakage current
- **EMC Radiated Emissions Test Reports**
- **EMC Conducted Emissions Test Reports**
- **EMC Radiated Immunity Test Reports**
- **ESD (Electrostatic Discharge) Test Reports** (IEC 61000-4-2)
- **Wireless Coexistence Test Documentation** — Bluetooth, Wi-Fi, LTE simultaneous operation testing (for multi-radio products)
- **HALT / HASS Electrical Stress Records** — see Section 5.4

### 5.6 Biocompatibility & Chemical Safety Testing

- **Biocompatibility Test Reports** — ISO 10993 series testing for any product with skin contact, oral contact, or implant proximity: cytotoxicity, sensitization, and irritation testing
- **Material Toxicology Review** — documented review of all materials for toxic substance content relevant to the use case
- **Chemical Off-Gassing / VOC Testing** — emissions testing for enclosed spaces (vehicles, indoor robotics) per applicable standards
- **California Prop 65 Compliance Documentation** — substance screening and warning label assessment for US market
- **Hazardous Materials Inventory & Handling Documentation** — complete inventory with storage requirements and disposal procedures

### 5.7 Regulatory Compliance & Certification

- **Regulatory Strategy Document** — all target markets, applicable directives, standards, certification bodies, and timeline
- **FCC Test Reports & ID Assignment** (USA) — Part 15B and Part 15C/D, FCC ID documentation
- **CE Technical File** (EU) — applicable directives (RED, LVD, EMC, MD, GPSR), applied standards, test reports, and Declaration of Conformity
- **UKCA Documentation** (UK post-Brexit)
- **BIS Certification Documentation** (India)
- **KC Mark Documentation** (South Korea)
- **CCC Certification Documentation** (China)
- **ANATEL Documentation** (Brazil)
- **MIC Documentation** (Japan)
- **RoHS Test Reports** — hazardous substance analysis per IEC 62321 methods
- **REACH SVHC Declaration of Conformity** — supply chain declarations for substances of very high concern
- **UL / ETL Electrical Safety Certification** (North America)
- **Battery Certification Documentation** — UN38.3 (transport), IEC 62133 (safety), UL 2054, and country-specific battery regulations
- **Declaration of Conformity (DoC)** — signed declarations for each market and directive
- **WEEE Registration Documentation** — producer registration in each applicable EU member state and equivalent markets
- **Safety Data Sheets (SDS / MSDS)** — for all chemicals, adhesives, coatings, and electrolyte materials used
- **Conflict Minerals Report (CMRT)** — supply chain documentation for tin, tantalum, tungsten, and gold (3TG)

### 5.8 Design Verification & Validation Closure

- **First Article Inspection (FAI) Reports** — dimensional and functional inspection of first production-intent parts from each supplier and each tool
- **Corrective Action Reports (CARs)** — all corrective actions arising from V&V testing, with root cause and closure evidence
- **Design Verification Report (DVR)** — formal document confirming that the design meets all specified requirements as verified by objective evidence; signed by engineering authority
- **Design Validation Report** — formal document confirming that the product meets user needs and intended use under simulated or actual use conditions
- **Reliability & Life Testing Records** — HALT/HASS results plus any accelerated life testing data supporting MTBF claims

> **Phase 5 Gate Archive Checkpoint:** V&V master plan, all test reports (structural, environmental, HALT/HASS, EMC, electrical safety, biocompatibility), all certification documentation, DVR, and Design Validation Report.

---
---

## PHASE 6 — SUPPLY CHAIN, MANUFACTURING & LOGISTICS

### 6.1 Bill of Materials & Sourcing Strategy

- **Master Bill of Materials (BOM)** — every custom part, off-the-shelf component, adhesive, label, fastener, and consumable with part numbers, descriptions, quantities, and unit costs
- **BOM Cost Breakdown Analysis** — BOM cost at target volume (10k, 100k, 1M units) with cost-down targets and roadmap
- **Approved Vendor List (AVL)** — primary and qualified backup suppliers for every BOM line item with qualification status and lead times
- **Long-Lead-Time Component Register** — all parts with lead time >12 weeks; buffer stock strategy and demand planning
- **Single-Source & Sole-Source Risk Documentation** — risks identified for sole-sourced components; second-source qualification plans and strategic inventory mitigation
- **Component Lifecycle & Obsolescence Risk Documentation** — lifecycle status of key components (active, last time buy, obsolete), especially semiconductors; mitigation strategies
- **Make vs. Buy Analysis** — documented rationale for in-house vs. outsourced manufacturing decisions
- **Supplier Qualification Documentation** — supplier audits, quality management system certifications (ISO 9001, IATF 16949), and approved supplier agreements

### 6.2 Tooling & Manufacturing Setup

- **Injection Mold Design Files & Specifications** — steel type, hardness, number of cavities, hot runner system, cooling circuit design, and expected shot life
- **Tooling Qualification Records** — T1, T2, T3 tool trial reports; dimensional reports from each trial; and final tool sign-off
- **Tooling Maintenance Schedules** — preventive maintenance intervals, spare core/cavity sets, and tool storage requirements
- **Tooling Ownership Agreements** — documentation of tool ownership (OEM, CM, supplier), cost, and IP rights
- **Stamping Die Documentation** — die design, progressive strip layout, pilot hole locations, and press tonnage requirements
- **Custom Jig & Fixture Documentation** — design files, materials, calibration intervals, and verification methods
- **Assembly Line Layout Documentation** — station layout, cycle time per station, WIP buffer strategy, and ergonomic assessment
- **Capital Equipment Specification** — specifications for dedicated production equipment purchased for this product

### 6.3 Additive Manufacturing Production Documentation
*[For products using AM in production, not just prototyping]*

- **Production AM Machine Fleet Qualification** — qualification records for every AM machine used in production, including inter-machine consistency data
- **Production Print Parameter Lock Document** — frozen parameter sets (per machine, material, and part) approved for production use; change-controlled after lock
- **AM Production BOM & Material Lot Tracking** — traceability of material lot numbers to specific built parts; moisture exposure time tracking for hygroscopic materials
- **AM Production Inspection Protocol** — 100% dimensional check specification, sampling plan for destructive mechanical testing, CT scan frequency for safety-critical parts
- **AM Production Yield & Scrap Rate Tracking** — per-machine, per-material, per-part yield records used to support continuous improvement
- **AM Part Serialization & Traceability** — method for marking AM parts with serial numbers (laser marking, embedded QR codes, embedded RFID)
- **AM Post-Processing Quality Plan** — inspection checkpoints within the post-processing workflow (pre-cure, post-cure, pre-coat, post-coat)

### 6.4 Product Serialization, Tracking & Cryptographic Provisioning

- **Serialization & UID Architecture Document:**
  - Serial number structure and decoding key (factory code, product family, build week, sequence number)
  - MAC address and hardware revision encoding methodology
  - QR code and barcode symbology specification (data matrix version, error correction level)
  - Label specification (material, adhesive type, print resolution, durability requirements)
- **Product Traceability System Documentation** — batch-to-unit-to-component traceability methodology; data captured at each manufacturing station
- **Factory Test Data Archival Plan** — parametric data captured per serialized unit during manufacturing, format, storage duration, and retrieval process
- **Factory Cryptographic Provisioning Protocol** `[AI/ROBOT/EV]`:
  - Secure boot key generation and storage procedures
  - Device certificate hierarchy (Root CA → Intermediate CA → Device Certificate)
  - PKI infrastructure documentation
  - Key injection station design and security controls
  - Chain of custody for cryptographic materials
  - Anti-counterfeit measures (physical unclonable functions, holographic labels)

### 6.5 Quality Control & Production Documentation

- **AQL (Acceptable Quality Limit) Inspection Plans** — sampling plans per ANSI/ASQ Z1.4, defect classification (critical/major/minor), and accept/reject criteria
- **Visual Inspection Criteria with Photo Standards** — golden sample and boundary sample photographs defining cosmetic acceptance limits
- **Functional End-of-Line (EOL) Test Specification** — 100% functional test protocol per unit: parameters, limits, pass/fail criteria, and fixture specification
- **Standard Operating Procedures (SOPs) per Station** — illustrated, step-by-step work instructions; multilingual where required
- **Training Materials & Certification Records for Assembly Workers**
- **PPAP (Production Part Approval Process) Documentation** — Part Submission Warrant (PSW), process flow diagram, PFMEA, control plan, MSA, dimensional results, and material certificates
- **PFMEA (Process Failure Mode & Effects Analysis)** — risk analysis of every manufacturing process step with detection controls
- **Control Plan** — process parameters, monitoring frequency, measurement methods, and reaction plans for out-of-control conditions
- **Statistical Process Control (SPC) Plans** — control charts for critical characteristics; Cpk targets

### 6.6 Packaging Design & Validation

- **Structural Dieline Files** — vector cut/fold files for all packaging components (retail carton, inner carton, master carton, insert trays)
- **Internal Cushioning Profile & Shock Absorption Data** — cushioning design analysis (fragility factor vs. cushion curve); pulp, foam, or molded material specifications
- **Packaged-Product Drop Simulation** — predicted g-loading on product within packaging
- **Packaging Material Specifications** — substrate type, flute grade, paper weight, coatings, recycled content, and FSC certification
- **Unboxing Experience (OOBE) Design Documentation** — sequence of reveals, component layout, and first-touch experience design rationale
- **Accessory & Insert Layout Documentation** — position of cables, adapters, documentation, and quick-start cards
- **Multilingual Printed Insert Specifications** — languages per market, translation review process, print spec, and regulatory content requirements
- **Regulatory Packaging Marks** — WEEE symbol, recycling marks, battery disposal marks, resin codes, and country-specific marks
- **Packaging Artwork & Print Specifications** — color profile (CMYK), bleed and safe zones, barcode placement and quiet zones, and print substrate
- **Retail-Ready Packaging Documentation** (where applicable) — shelf-ready carton specs, display window requirements, and planogram compliance
- **Packaging Certification Records** — ISTA 2A/3A and ASTM D4169 transport simulation test reports

### 6.7 Logistics, Shipping & Dangerous Goods

- **Palletization & Cubing Optimization Layout** — pallet pattern, layers per pallet, units per layer, orientation, and container loading plan
- **Pallet Specification** — pallet type, dimensions, weight capacity, ISPM 15 fumigation treatment, and labeling
- **Incoterms Documentation** — defined Incoterms per trade lane with responsibilities and insurance requirements
- **HTS / HS Code Classification Documentation** — Harmonized System codes for all products and sub-assemblies with classification rationale
- **ECCN (Export Control Classification Number) Documentation** — Export Control Classification for hardware, embedded software, and AI model weights `[AI/ROBOT/EV]`
- **Country-Specific Import Compliance Documentation** — import licenses, permits, pre-shipment inspection certificates
- **Dangerous Goods & Battery Transport Compliance:**
  - UN38.3 test summary reports for all cells and battery packs
  - IATA DGR compliance documentation (air freight PI 965–970)
  - IMO / IMDG Code compliance documentation (ocean freight)
  - State of Charge (SoC) restriction documentation (≤30% SoC for standalone cells in air freight)
  - Shipper's Declaration for Dangerous Goods forms
- **Customs & Trade Compliance Documentation** — country of origin determination, Rules of Origin compliance, free trade agreement applicability

> **Phase 6 Gate Archive Checkpoint:** Released master BOM, AVL, PPAP package, all tooling qualification records, AM production qualification records (if applicable), AQL plans, packaging certification, and logistics compliance documentation.

---
---

## PHASE 7 — QUALITY ASSURANCE

### 7.1 Incoming Inspection

- **Incoming Inspection Procedures** — documented inspection protocol for each category of incoming components with sampling plan, measurement method, and accept/reject criteria
- **Supplier Scorecard & Performance Tracking** — on-time delivery, incoming quality rate, and corrective action response time per supplier
- **Material Certification Verification Procedures** — process for validating that material certs accompany each shipment and meet specifications
- **Incoming Non-Conformance Documentation** — process for tagging, quarantining, and dispositioning non-conforming incoming material

### 7.2 In-Process Inspection

- **In-Process Inspection Criteria** — inspection checkpoints within the assembly flow with measurement methods, frequencies, and pass/fail limits
- **Process Audit Checklists** — layered process audits (LPA) at each assembly station
- **SPC Monitoring Records** — ongoing process control charts with out-of-control event responses documented
- **Assembly Error Log** — documented assembly errors found in-process, used for SOP improvement

### 7.3 Final Product Inspection

- **Final Product Inspection Criteria** — complete acceptance criteria for finished goods release
- **Cosmetic Inspection Standard** — documented cosmetic defect classification with reference photo standards
- **Functional Test Sign-Off Records** — EOL test pass records maintained per serialized unit
- **Product Audit Records** — periodic full-product audits against specification, with findings and corrective actions

### 7.4 Measurement System Analysis

- **Measurement System Analysis (MSA / Gauge R&R)** — documented Gauge Repeatability and Reproducibility studies for all critical measurement systems
- **Calibration Records** — calibration certificates and schedules for all measurement equipment used in production and inspection

### 7.5 Defect Management & CAPA

- **Defect Classification System** — master taxonomy of all possible defect types with severity classification and disposition rules
- **Corrective and Preventive Action (CAPA) Records** — structured root cause analysis, corrective actions implemented, verification of effectiveness, and closure records
- **Product Audit Records** — periodic full-product audits against specification, with findings and corrective actions

### 7.6 Warranty & Field Quality Setup

- **Warranty Claim Tracking System Documentation** — data fields captured, reporting cadence, and escalation thresholds
- **RMA (Return Merchandise Authorization) Process Documentation** — customer-facing RMA flow, internal routing logic, and tracking system
- **Customer Complaint Handling Process Documentation** — intake, categorization, investigation, response, and closure procedures
- **Field Failure Analysis Reports** — teardown documentation of returned units to identify manufacturing or design root causes

> **Phase 7 Gate Archive Checkpoint:** Initial yield data, AQL inspection records, MSA reports, calibration records, and initial CAPA register.

---
---

## PHASE 8 — DESIGN RELEASE & LAUNCH

### 8.1 Design Release & Configuration Management

- **Design Release Sign-Off & Approvals** — multi-discipline sign-off confirming the design is released for production
- **Product Configuration Baseline (Design Freeze Record)** — exact configuration released to production: BOM revision, software version, firmware version, and hardware revision
- **Released Drawing Package** — stamped/approved final versions of all engineering drawings, BOMs, and specifications
- **Released BOM (Final)** — final production BOM with all approved vendor selections confirmed
- **Engineering Change Order (ECO) Master Log** — formal log of all design changes after this freeze point

### 8.2 User-Facing Product Documentation

- **User Manuals & Product Guides** — complete illustrated user documentation for all markets; accessibility considerations (large print, screen-reader compatible PDF)
- **Quick-Start Guides (QSG)** — condensed first-use documentation included in the box
- **Safety Warnings & Regulatory Label Text** — all required safety statements, symbols, and language-specific translations
- **Online Help & Knowledge Base Content** — web-hosted troubleshooting guides and FAQ documentation

### 8.3 Marketing & Commercial Documentation

- **Product Data Sheet / Technical Spec Sheet** — customer-facing specification document listing all key performance parameters
- **Marketing Specifications** — documented features, benefits, and claims approved by engineering (claim substantiation records)
- **Pricing Documentation** — finalized MSRP, distributor pricing, and promotional pricing rules
- **Product Registration Documentation** — system for customer product registration, warranty activation
- **Product Removal from Sale Records** — documentation framework for when and how a SKU is deactivated from sale (used at EOL in Phase 10)

### 8.4 Training & Support Documentation

- **Training Materials — Internal Teams** — sales training decks, technical enablement content for customer success
- **Training Materials — Channel Partners & Distributors** — partner-facing training documentation
- **Spare Parts List & Part Numbers** — published spare parts catalog with ordering information
- **Service / Repair Manuals** — complete illustrated service documentation for authorized repair centers and field technicians
- **Customer Support Documentation** — troubleshooting trees, escalation guides, and known-issue documentation for support teams

> **Phase 8 Gate Archive Checkpoint:** Released drawing package, released BOM, all user-facing documentation, marketing spec, and training materials.

---
---

## PHASE 9 — IN-MARKET & FIELD OPERATIONS

### 9.1 Field Performance Monitoring

- **Field Performance & Reliability Data** — ongoing tracking of MTBF actuals vs. targets, failure modes in the field, and geographic/usage pattern correlations
- **Warranty & Return Rate Tracking** — warranty claim rates by failure code, return rates, and cost of quality tracking
- **Customer Feedback & Complaint Records** — structured capture of all field feedback with trend analysis
- **In-Market Quality Metrics Dashboard** — KPIs tracked (field failure rate, warranty return rate, repeat repair rate) and reporting cadence

### 9.2 Fleet Telemetry, OTA & Remote Operations
*[For connected edge AI, robotic, and EV products]*

- **Fleet Telemetry Architecture Documentation** `[AI/ROBOT/EV]` — data types collected per deployed unit, sampling rates, compression method, transmission protocol, and data retention policy
- **OTA (Over-The-Air) Update Protocol Documentation** `[AI/ROBOT/EV]` — update delivery mechanism, package signing and verification, staged rollout strategy, and bandwidth requirements
- **OTA Rollback Procedure Documentation** `[AI/ROBOT/EV]` — automatic and manual rollback triggers, fallback firmware version management, and customer communication protocol
- **Remote Diagnostics Capability Documentation** `[AI/ROBOT/EV]` — parameters diagnosable remotely, diagnostic command structure, and escalation workflow
- **Firmware Version Control & Compatibility Matrix** `[AI/ROBOT/EV]` — hardware revision vs. firmware version compatibility; minimum supported firmware
- **Edge Anomaly Detection Threshold Documentation** `[AI/ROBOT/EV]` — monitored parameters, threshold values, and alert escalation logic
- **Data Privacy & Telemetry Consent Documentation** `[AI/ROBOT/EV]` — user consent flow, anonymization procedures, data retention limits, and data subject access request process

### 9.3 Field Service & Maintenance

- **Field Service Manuals** — complete illustrated repair procedures organized by symptom/failure code
- **Diagnostic Software Tool Documentation** — interface documentation, supported commands, output interpretation guide, and version compatibility
- **Sensor Calibration Procedures** `[AI/ROBOT/EV]` — step-by-step calibration instructions for optical arrays, IMUs, and depth sensors after impact or replacement
- **Replacement Part Documentation** — part numbers, compatibility matrix, and recommended replacement intervals
- **Field Technician Training Materials & Certification Criteria**
- **Service Tool Kit Documentation** — required tools with part numbers, calibration requirements, and case specifications
- **Service Escalation Matrix** — tiered path from field technician → depot repair → factory return, with decision criteria at each tier
- **Service Bulletin Archive** — all issued service bulletins with date, affected serial number ranges, urgency level, and corrective action instructions

### 9.4 In-Market Engineering Changes

- **Running Change Management Documentation** — process for validating and releasing changes while in active production (cost reductions, component substitutions, quality improvements)
- **Product Variant & SKU Documentation** — documentation for all color variants, regional variants, bundle variants, and accessory combinations
- **Updated Regulatory Documentation** — re-certification records triggered by design changes (RF changes requiring new FCC testing, safety changes requiring re-UL, etc.)
- **Supplier Change Notification (SCN) Process Documentation** — procedure for evaluating and approving supplier-initiated component changes

### 9.5 Returns & Failure Analysis

- **RMA Process Documentation** — customer-facing RMA flow, internal routing logic, and tracking system
- **Failure Analysis Methodology (Teardown Protocol)** — standard operating procedure for disassembling and analyzing returned units
- **Customer Returns Data Tracking** — failure code taxonomy, root cause categorization, and trend analysis
- **Systematic Failure Identification Reports** — documented cases where a pattern of failures indicates a systemic design or manufacturing root cause
- **CAPA (Corrective and Preventive Action) Records** — root cause analysis, corrective actions, verification of effectiveness, and closure

### 9.6 Continuous Improvement

- **Continuous Improvement Records** — documented improvements to the product, manufacturing process, or service procedures made during the production lifetime
- **Supply Chain Change Documentation** — all approved supply chain changes with qualification evidence
- **Cost-Down Engineering Records** — documented cost reduction initiatives, design changes, and realized savings

> **Phase 9 Archive (Ongoing):** All ECOs, service bulletins, failure analysis reports, OTA release records, and CAPA closures archived on a rolling basis.

---
---

## PHASE 10 — END-OF-LIFE & CYCLE CLOSURE

### 10.1 Program Wind-Down

- **Product Discontinuation Plan & Timeline** — phased production wind-down schedule, sales close-out plan, and internal communication plan
- **Last-Time-Buy (LTB) Notification Documentation** — formal notification to customers, recommended LTB quantities analysis, and LTB order management
- **Spare Parts Availability Commitment Documentation** — contractual commitments for spare parts availability post-EOL; sourcing strategy for extended support period
- **Customer Communication Plan for Sunset** — timeline, messaging, alternative product guidance, and support transition plan
- **Product Removal from Sale Records** — formal deactivation of all SKUs from all sales channels with dates and authorization

### 10.2 End-of-Life Compliance & Sustainability

- **Regulatory Deregistration Documentation** — deregistration from applicable certification bodies and market registrations (where required)
- **Material Composition Disclosure (for Recycling)** — complete material composition report enabling responsible recycling and compliant disposal
- **WEEE & Take-Back Program Documentation** — take-back program participation, recycler certifications, and annual tonnage reporting
- **Environmental Disposal Records** — records of products disposed through certified recyclers with destruction certificates
- **IP Sunsetting Strategy** — documentation of which IP to maintain, which to abandon, and which to publish as open-source or defensive publications

### 10.3 Program Archive & Knowledge Closure

- **Complete Design Archive Package** — per the File Management & Archival specification (Section FM), a complete verified archive of all design files, released drawings, test records, compliance documentation, and correspondence
- **Post-Mortem & Lessons Learned Report** — structured retrospective covering what went well, what went wrong, quantified impact (cost, schedule, quality), and specific process improvements documented for the next program
- **Technology Transfer Documentation** — if relevant, documentation of what technology, IP, and know-how is transferred to successors, partners, or open-source

> **Phase 10 Final Archive Checkpoint:** Complete program archive package verified per FM.G, post-mortem report, all EOL compliance records, and IP disposition documentation.

---
---

## CROSS-CUTTING — DOCUMENTS ACTIVE THROUGHOUT ALL PHASES

*These are living documents maintained continuously from Phase 0 through Phase 10.*

### Program Governance
- **Stage Gate Review Records** — gate criteria, evidence packages submitted, issues raised, approved/hold/kill decisions, and action items with owners and dates
- **Project Charter & Scope Document** — formally authorized project definition with objectives, constraints, assumptions, and sponsor sign-off
- **Program Timeline & Master Schedule** — phase gate dates, critical path milestones, and schedule risk register
- **Budget & Cost Tracking** — actuals vs. plan by phase, cost-to-complete projections, and budget change requests
- **Meeting Minutes & Design Decision Records** — all design review and technical decision meetings with attendees, decisions made, and rationale
- **Action Item & Open Issues Tracker** — all open actions with owners, due dates, priority, and current status

### Change & Configuration Management
- **Document Control & Version Control Records** — version history for all controlled documents; access control and distribution records
- **Engineering Change Order (ECO) / ECN Master Log** — all changes post-design freeze; pre-production and in-production changes tracked separately
- **Change Impact Assessment Records** — documented evaluation of downstream effects of every design change (cost, compliance, timeline, quality)

### Risk Management
- **Risk Register** — all identified risks across technical, commercial, regulatory, and supply chain domains; updated at each gate with probability, impact, mitigation, and residual risk
- **DFMEA (Design FMEA)** — maintained and updated as design evolves
- **PFMEA (Process FMEA)** — developed alongside manufacturing documentation; updated based on production learnings
- **Assumptions & Constraints Log** — master list of all active assumptions and constraints across the program

### Sustainability & Responsibility
- **Product Carbon Footprint Report** — lifecycle GHG emissions (Scope 1, 2, 3) per unit manufactured
- **Conflict Minerals Compliance (CMRT)** — supply chain declarations maintained and updated annually
- **Restricted Substances Compliance Log** — tracking of global substance restriction changes (RoHS revisions, REACH SVHC additions) and impact assessments
- **Supply Chain ESG Documentation** — supplier code of conduct compliance, audit records, and corrective actions

### IP & Legal
- **IP Portfolio Tracking Document** — all patents (filed, pending, granted, abandoned), trademarks, and trade secrets
- **Third-Party License Compliance Register** — all licensed technologies, fonts, imagery, and open-source components with license obligations tracked
- **Legal Hold Records** — documentation preserved in response to litigation holds, with chain of custody

---
---

## FILE MANAGEMENT & ARCHIVAL SYSTEM

*This section defines the infrastructure, standards, and protocols for managing ALL documents and design files generated throughout the product lifecycle — from first strategy brief through the final program archive.*

---

### FM.A — Document Management Infrastructure

- **DMS / PLM System Selection & Configuration Documentation** — requirements that drove the system selection, chosen system, configuration decisions, admin setup, and user onboarding documentation
- **PLM / PDM System Architecture Document** — vault structure, project/product hierarchy, user roles, and integration points with ERP, CAD, and quality systems
- **System Access & User Roles Matrix** — documented permission levels (read, write, approve, release, admin) per role type (intern, engineer, lead, manager, compliance, external supplier)
- **DMS / PLM System Backup & Disaster Recovery Plan** — backup frequency, backup storage locations, recovery time objective (RTO), recovery point objective (RPO), and annual restoration test records
- **External Collaborator & Supplier Portal Documentation** — how external parties are given controlled access to documents; NDA linkage; access revocation process

### FM.B — File Naming & Directory Structure Standards

- **Master File Naming Convention Document** — rules for naming every file type in the program:
  - Part number / document number format (prefix codes by type, sequential numbering rules, revision identifier format)
  - Product family code, project code, and phase code conventions
  - Date format standard (ISO 8601: YYYY-MM-DD)
  - Language / locale code inclusion for multilingual documents
  - Prohibited characters and maximum filename length
  - Examples for each document type
- **Document Numbering System Architecture** — prefix codes by document category (e.g., ENG- for engineering specs, TEST- for test reports, COMP- for compliance, MFG- for manufacturing)
- **Master Folder / Directory Structure Standard** — documented template folder hierarchy with rationale for each level; applied consistently across all programs
- **Folder Structure Template per Phase** — standardized subfolder layout within each phase folder, pre-populated at program start

### FM.C — File Format Standards

- **Approved File Formats Matrix by Document Type:**

  | Document Type | Working Format | Archive / Exchange Format |
  |---|---|---|
  | CAD 3D Models | Native (.SLDPRT, .CATPart, .x_t) | STEP AP242 (.stp) |
  | CAD Assemblies | Native (.SLDASM, .CATProduct) | STEP AP242 (.stp) |
  | 2D Engineering Drawings | Native + PDF | PDF/A-3 (.pdf) |
  | Electrical Schematics | Native (Altium, KiCad, OrCAD) | IPC-2581 + PDF |
  | PCB Layout / Gerbers | Gerber RS-274X + ODB++ | ODB++ archive |
  | Specifications & Reports | DOCX / Google Docs | PDF/A-3 (.pdf) |
  | Spreadsheets / BOMs | XLSX | CSV + XLSX |
  | Test Data (numerical) | CSV, HDF5, proprietary | CSV + HDF5 |
  | Images (reference) | JPEG / PNG | TIFF (uncompressed) for archival |
  | Video Documentation | MP4 (H.264) | MP4 (H.264) |
  | Packaging Dielines | AI / PDF | PDF/X-4 |
  | AM Slicer Files | Native + .3MF | .3MF + print parameter PDF |
  | AM Build Files | .STL or .3MF | .3MF (preferred) |
  | Firmware / Software | Source + binary | Source in Git; binary + hash |

- **CAD Neutral File Exchange Standard** — documented export settings for STEP AP242: units, tolerance, PMI inclusion, color retention, and validation properties
- **PDF/A Compliance Requirement** — all documents archived long-term must conform to PDF/A-3 (ISO 19005-3); PDF/A compliance check tool and process documented
- **Raster Image Resolution Standard** — minimum DPI requirements for archived images: 300 DPI for documents, 600 DPI for inspection photos, uncompressed TIFF for archival masters

### FM.D — Version Control & Document Lifecycle Protocol

- **Document State Definitions & Rules:**
  - **Draft** — work in progress; not for external distribution
  - **In Review** — circulated for peer review; not yet approved
  - **Approved** — approved for use; not yet formally released
  - **Released** — formally released and configuration-controlled; changes require ECO
  - **Superseded** — replaced by a newer revision; retained in archive
  - **Obsolete** — withdrawn from use; retained in archive with obsolescence date
- **Major vs. Minor Revision Rules** — what triggers a new major revision letter (A→B: significant design change, new release) vs. minor revision number (A.0→A.1: minor correction, no design impact)
- **Revision History Requirements** — mandatory fields per revision history entry: revision identifier, date, author, reviewer, approver, and description of changes
- **CAD Check-In / Check-Out Protocol** — file locking rules, branch strategy for parallel work on variants, and conflict resolution procedure
- **Document Template Library** — approved templates for every document type with mandatory sections, headers, footers, version history table, and approval signature blocks pre-populated
- **Review & Approval Workflow** — required reviewers and approvers per document type and per phase; electronic approval platform and wet-signature requirements

### FM.E — Access Control & Data Security

- **IP Classification Taxonomy & Rules:**
  - **Public** — approved for unrestricted external distribution
  - **Internal Use** — for all employees; not for external distribution without approval
  - **Confidential** — restricted to named individuals or teams; NDA required for external sharing
  - **Restricted / Trade Secret** — highest sensitivity; named access list; air-gapped or tightly controlled storage
- **Access Control Matrix by Role & Document Type** — who can read, edit, approve, release, and delete each document category; reviewed and updated at each phase gate
- **Export Control Classification for Design Files** — ITAR / EAR classification of hardware drawings, software source code, AI model weights, and cryptographic keys; distribution restriction documentation `[AI/ROBOT/EV]`
- **Third-Party File Sharing Protocol:**
  - NDA requirement before any confidential document is shared
  - Approved secure transfer platforms (no personal email, no unencrypted USB)
  - Watermarking requirements for uncontrolled copies shared externally
  - Document expiry and remote revocation policy for shared files
- **Data Loss Prevention (DLP) Policy** — rules governing copying, printing, and transmitting controlled files; endpoint DLP tool configuration documentation
- **Data Destruction Protocol** — secure deletion methodology (NIST 800-88 or equivalent) for files that have reached end of retention; destruction certificate template and archival of destruction records

### FM.F — Long-Term Archival Standards & Retention Schedule

- **Archive Storage Architecture:**
  - Tier 1 (Active): PLM/DMS system — actively managed, immediate access
  - Tier 2 (Near-line): On-premise NAS or private cloud — rapid retrieval, 90-day redundancy
  - Tier 3 (Cold Archive): Off-site / geographically separate cold storage — disaster recovery, annual verification
  - Geographic redundancy requirement: minimum two separate physical locations
- **Archive Integrity Verification Protocol** — SHA-256 checksums generated at archive creation for every file; checksum manifest stored separately; annual re-verification of checksums against stored files; discrepancies logged and investigated
- **Encryption Standard for Archived Files** — AES-256 encryption at rest for all Confidential and Restricted documents; key management documentation
- **Document Retention Schedule by Category:**

  | Document Category | Minimum Retention Period |
  |---|---|
  | General engineering specifications | 10 years from product EOL |
  | Compliance & certification records | Lifetime of product + 10 years |
  | Safety-critical design records | As long as product is in service + 10 years |
  | Test reports (all) | 10 years from product EOL |
  | Manufacturing records (SOPs, work instructions) | 10 years from last production date |
  | Quality records (PPAP, CAPA, inspection) | 10 years from product EOL |
  | Financial & legal records | Per jurisdiction requirements (typically 7–10 years) |
  | Litigation hold documents | Indefinite until hold lifted + 5 years |
  | Raw research data | 7 years from program closure |
  | AM slicer files & print parameters | 10 years from EOL (production AM parts) |

- **Long-Term Format Migration Plan** — documented process for migrating archived files to updated formats when a format becomes obsolete (e.g., migrating from PDF 1.4 to PDF/A-3, migrating CAD from one STEP version to a successor); scheduled format review every 5 years
- **Archive Handover Procedure** — step-by-step process for transferring the complete program archive when the product moves to a new team, new company, or a custodial storage partner; handover receipt and verification checklist

### FM.G — Per-Phase Archive Checkpoints

*A complete, verified archive package must be assembled and signed off at each phase gate before proceeding. These are the minimum contents of each checkpoint archive.*

- **Phase 0 Archive:** Product strategy doc, business case, TAM analysis, patent search results, FTO analysis, competitive teardown, stakeholder register, IP agreements, systems architecture document
- **Phase 1 Archive:** All raw research data (anonymized per privacy policy), full research synthesis report, all persona documents, journey maps, assumption log, PRD, SRS, RTM
- **Phase 2 Archive:** All concept sketches and ideation records, Pugh matrix, concept validation report, CMF master spec, lighting behavior spec, all approved concept renders and CAD, behavioral architecture diagrams
- **Phase 3 Archive:** Complete CAD package (native + STEP exports), all GD&T drawings (released), DFMEA, all DFM reports (plastics, metal, AM), DFA/DFS/DFE analyses, FEA reports, PDR and CDR records, assumption closure matrix, updated risk register
- **Phase 4 Archive:** All prototype BOMs and version logs, deviation logs, EVT/DVT/PVT plans and reports, delta reports, all NCRs and resolutions, AI benchmarking logs, lessons learned per iteration
- **Phase 5 Archive:** V&V master plan, all test reports (structural, environmental, HALT/HASS, EMC, electrical safety, biocompatibility), all certification documentation (DoC, test lab reports, certificates), DVR, Design Validation Report
- **Phase 6 Archive:** Released master BOM, finalized AVL, all PPAP packages, all tooling qualification records, AM production qualification records (if applicable), AQL plans, packaging certification records, logistics compliance documentation
- **Phase 7 Archive:** Initial production yield data, AQL inspection records, MSA/Gauge R&R reports, calibration records, initial CAPA register
- **Phase 8 Archive:** Released drawing package, released BOM, all user-facing documentation (user manuals, QSG, safety labels), marketing spec with claim substantiation, training materials, spare parts list, service manuals
- **Phase 9 Archive (Rolling):** All ECOs and ECNs, all service bulletins, field failure analysis reports, OTA release records and rollback logs, CAPA records, continuous improvement records — archived on a rolling quarterly basis
- **Phase 10 Final Archive:** Complete program archive assembled from all above checkpoints, verified via checksum manifest; post-mortem report; all EOL compliance records (WEEE, deregistration, material composition); IP disposition documentation; program formally closed in PLM/DMS

### FM.H — Special File Handling Protocols

- **Large Assembly File Management** — strategy for managing large CAD assemblies (>500 components): lightweight mode configurations, reference sets, and LFS (Large File Storage) if using Git-based version control
- **Physical Sample & Golden Sample Archive** — protocol for physically archiving approved golden samples, boundary samples, CMF approval samples, and prototype units alongside digital records; location, labeling, and retention period
- **Original Research Data Custody** — raw interview recordings, survey data, and ethnographic footage stored with documented chain of custody; anonymization applied before sharing; access restricted to program leadership
- **Third-Party and Supplier Document Archive** — how documents received from suppliers (material certs, datasheets, test reports, PPAP submissions) are ingested, named, version-controlled, and stored within the DMS
- **Legacy File Migration Protocol** — procedure for migrating files from predecessor programs, acquired companies, or legacy storage systems into the current DMS with metadata integrity preserved

---
*End of Definitive Master Checklist — V3*
