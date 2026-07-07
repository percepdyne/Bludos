# Bludos Toolbox & Integrations Roadmap
*Brainstormed 2026-07-06 · status: proposal, nothing committed to build yet*

## The one mechanic that makes tools worth having

A calculator in a docs app is pointless if it's just a web calculator in a side panel — designers already have Google. The differentiator is:

> **Every tool has an "⤓ Insert as block" button that writes its inputs *and* results into the current document as a stamped table** (`CALC ▮ battery-runtime v1 · 2026-07-06 · by Swaraj`).

Calculations become documentation: traceable, archived, re-runnable, exported in gate packages, checksummed in manifests. That's the FM-lineage ethos applied to math, and no competitor does it. Every tool below assumes this mechanic.

Second rule: **tools ship in packs, off by default** (enable per-workspace in Settings). A robotics designer enables EV/Robotics; an architect enables Architecture. Nobody scrolls past 40 irrelevant tools.

---

## Tier 1 — Quick-use tools (hours each, pure client-side)

| Tool | Notes |
|---|---|
| **Color picker + eyedropper** | Chromium's native `EyeDropper` API; picked swatches accumulate in a per-project Palette page |
| **Color converter** | HEX ↔ RGB ↔ HSL ↔ CMYK(approx) ↔ CIELab ↔ **nearest RAL Classic** (public ~213-color table). ⚠ **Pantone is licensed IP** — we cannot ship Pantone tables (Adobe had to pull them). Offer nearest-RAL + user-importable palette libraries (.ASE/.ACO) so users with a Pantone license bring their own |
| **ΔE calculator (CIE76 / CIEDE2000)** | Two Lab/hex values → perceptual difference; pairs directly with the CMF Direction Sheet's ΔE limits |
| **Unit converter** | mm/in/mil/pt, g/oz, GSM, mesh↔micron, durometer scale reference, N·m↔kgf·cm↔in·lb |
| **Ratio & scale calculator** | Golden ratio, √2 paper series, model scale factors, 3D-print shrinkage compensation % |
| **Fibonacci / composition overlays** | Golden spiral, golden sections, rule of thirds, isometric grid — placed over any archive image with opacity/rotation controls; plus Fibonacci layout scaffolds as page templates |
| **Reference tables** | Metric/UNC thread + tap-drill + clearance holes; SPI/VDI finish grades; IP rating decoder; wire gauge ampacity |
| **Snap-fit / draft angle quick calcs** | Cantilever snap deflection & strain, minimum draft per texture depth |
| **SUS auto-scorer** | Reads the SUS table already in the usability template and computes the 0–100 score — first example of a *tool that reads the doc* |

## Tier 2 — Calculators with logic (a day each)

**EV / Robotics pack** (Perceptyne's home turf):
- **Battery consumption & runtime** — duty-cycle segments (mode, current, duration) + pack Wh + efficiency + temperature derating → runtime, average power, C-rate check
- **Motor load** — torque/speed requirement from load, gear ratio, efficiency → operating point vs. user-entered motor constants (Kt/Kv, stall, no-load); margin verdict
- **Battery pack designer** — target voltage/capacity → S/P configuration, pack energy, mass estimate, C-rate sanity
- **Vehicle dynamics (basic)** — mass, grade, rolling resistance, CdA → wheel torque/power for target acceleration & top speed; EV range estimate (Wh/km)
- **Wire gauge & voltage drop** — current, length, allowable drop → AWG/mm²

**Mechanical pack:**
- **Tolerance stack-up (live)** — the existing worksheet template, but computed: contributor rows → worst-case + RSS results inserted back into the page
- **Beam/deflection & factor of safety** — cantilever & simply-supported quick cases
- **Fastener torque & preload** — K-factor method
- **Thermal rough-cut** — dissipated W + surface area + airflow assumption → temp rise; heatsink first-pass sizing

**Manufacturing pack:**
- **Injection molding** — clamp tonnage (projected area × pressure), cooling time estimate, shot weight
- **3D printing** — time/cost from volume + infill; cusp-height vs layer-height on sloped faces
- **BOM cost roll-up** — line items with volume price breaks → landed cost ladder → margin → MSRP scenarios

**Architecture pack** (off by default):
- Stair rise/run with code presets, ramp slope / ADA check, area & occupancy, concrete volume, assembly R/U-value, sun angle & shadow length by latitude/date

**Research pack:**
- **Sample size calculator** (attribute & variable data) — ties into DVP&R sample-size column

## Tier 3 — Technical tools (multi-day builds)

1. **3D viewer — the honest answer to "Fusion 360 in the app."** Full CAD modeling in Bludos is a trap (decade of work, and Fusion exists). What designers actually need in a *documentation* tool: open STL/3MF/OBJ/GLB instantly (three.js — easy), and STEP via OpenCascade WASM (`occt-import-js`, heavier but proven); orbit/section/measure (bounding box, point-to-point); screenshot straight into the archive with the part's doc reference.
2. **Image measurer & annotator** — calibrate a photo against one known dimension, then measure lengths/angles/radii on it; arrows + notes; composition overlays from Tier 1; annotated copy saved to archive. Huge for teardowns and field studies.
3. **Comments on highlighted text** — TipTap mark-based ranges + a margin thread panel; author = operator name; stored in a sidecar JSON next to the page (keeps the .md clean). Solo value now (self-review, critique notes); becomes real collaboration when sync (P1) lands.
4. **Moodboard canvas** — freeform board of archive assets (drag/resize/pin), saved per project. Milanote-lite.
5. **Reference Vault — example document library.** The "grows slowly over time" database of real-world design-doc examples. Content strategy matters more than code: (a) ship as **downloadable content packs** (JSON) so the library grows without app releases; (b) start with legally safe sources — public-domain NASA/mil-spec examples, openly licensed PRDs, *summaries + links* for copyrighted teardowns rather than copies; (c) every entry annotated: "what this document does well, steal this structure." Later: user-submitted packs.
6. **OCR for archive images** (tesseract.js) — whiteboard photos become searchable.
7. **Design token export** — palette page → CSS variables / Figma-tokens JSON.

---

## Settings (Notion-style consolidation)

Today settings are scattered (✎ operator, ⇄ workspace, ⚙ webhook). One modal, left-nav sections:

- **Profile** — operator name, comment color/initials
- **Workspace** — current path, switch, recent workspaces, rebuild index, open data folder
- **Appearance** — accent (lime/cyan/amber), sheet light/dark, editor font & size, density
- **Toolbox** — enable/disable tool packs per workspace
- **Templates** — manage My Studio, default robotics toggle
- **Integrations** — Teams webhook, AI provider + API keys, clipper token, plugin list
- **Shortcuts** — reference card (Ctrl+P, etc.)
- **Data** — trash retention, backup/export-all, diagnostics

## Integrations & plugin architecture

**Local plugin system** — `.bludos/plugins/<name>/manifest.json` + JS module. A plugin can register: a tool panel, a template pack, an exporter, an editor slash-command. Start by restructuring our own tool packs *as* plugins (dogfooding the API), open to third parties later. ⚠ Plugins run with app privileges — needs a permissions declaration in the manifest before opening the gates.

**MCP — the highest-leverage AI move.** Before building any chat UI, expose **Bludos as a local MCP server**: tools like `search_pages`, `read_page`, `create_page_from_template`, `update_checklist_item`, `list_assets`, `archive_url`. Then Claude Desktop, Claude Code, or any agent can work *inside* the workspace — "draft a DFMEA for the gripper from this test report" happens in Claude Code and lands as a proper Bludos page with a doc number. One server, every AI client. (Later, Bludos can also act as an MCP *client* to consume other servers.)

**Claude / Gemini APIs** (user-supplied key in Settings; provider-abstracted, Claude default — `claude-sonnet-5` for quality, `claude-haiku-4-5` for cheap bulk jobs):
1. **Draft from template** — rough brief → filled template sections (marked as AI-drafted for review)
2. **Summarize for Teams** — exec summary generated into the share card
3. **Asset auto-tagging** — vision model tags/describes archive images on demand
4. **Requirement linting** — "find untestable/ambiguous requirements in this PRD" (maps to RTM discipline)
5. **Premortem generator** — seeds the failure-reasons table from the project's own pages
6. **Workspace Q&A with citations** — local embeddings index, answers cite pages
- **Privacy rule (non-negotiable for a local-first tool):** AI calls are explicit, per-action, visibly marked; nothing leaves the machine in the background. No key → features simply hidden.

**Chrome + Pinterest — one solution, not two.** Pinterest's official API needs app approval and gives less than scraping your own boards. Instead: a **"Bludos Clipper" Chrome extension (MV3)** that POSTs the current page/image/selection to a token-protected localhost endpoint in Bludos → lands in the archive with source URL and tags. Works on Pinterest, Behance, Dribbble, supplier datasheets, everything. (Paste-a-URL already works today; the clipper removes the copy-paste.)

**Teams — next steps in order:** gate-completion notifications via the existing webhook (cheap); Graph-API tab app with read-only gate dashboards (needs Azure AD app registration — confirm with IT first).

**Fusion 360 / CAD** — no public cloud API worth building on for this; the right integration is (a) a small **Fusion add-in** (Python) that pushes screenshots/parameters/BOM extracts to the Bludos localhost endpoint, and (b) a **watched-folder** feature: point Bludos at your CAD export directory and every new STEP/STL gets auto-archived with version increments.

**Figma** (not asked, but designers will ask): REST API embed of frame thumbnails into pages. Note for later.

---

## Converged recommendation

**Wave 1 (≈ a week):** Toolbox panel framework + insert-as-block mechanic · Settings modal · color picker/converter/ΔE · unit & ratio converters · Fibonacci overlays on archive images · battery runtime + motor load calculators · live tolerance stack-up · SUS scorer.
*Rationale: establishes the two architectural pieces (toolbox framework, settings) everything else plugs into, and ships the user's most-requested items.*

**Wave 2 (≈ 2 weeks):** image measurer/annotator · STL/3MF viewer · comments on highlights (local) · Chrome clipper + localhost clip endpoint · AI settings + first three AI actions (draft-from-template, Teams summary, asset auto-tag).

**Wave 3 (longer):** STEP viewer (OCCT WASM) · Bludos MCP server · Reference Vault + first content pack · moodboard canvas · plugin manifest system · Fusion add-in · vehicle dynamics + architecture packs.

**Deliberately not doing:** in-app CAD modeling (viewer only), shipping Pantone data (licensing), Pinterest official API (clipper covers it), background AI indexing without explicit opt-in.

**Still queued from earlier (unchanged priority):** Yjs peer sync remains the biggest single unlock for team adoption and should not fall behind the toolbox.
