# ◆ Bludos — Blue Dossier

A **local-first Notion alternative for product designers**. Blue as in *blueprint* — the earliest way to archive design.

Bludos combines structured design-process documentation with an inspiration/asset archive, entirely on your machine. No cloud, no accounts; every page is a plain Markdown file you can read without the app.

Spec: see `../design-docs-app/PRD_v4_DesignDock.md` (Bludos is that PRD's build).

## Install (Windows)

Build the packages with `npm run dist`, then in `release/`:

- **Bludos-Setup-0.2.0.exe** — one-click installer: desktop shortcut, Start-menu entry, launches on finish.
- **Bludos-Portable-0.2.0.exe** — single file, no install; double-click to run from anywhere.

Both are unsigned, so Windows SmartScreen may ask once — choose "More info → Run anyway".

## Develop

```
npm install
npm start        # rebuild templates + UI, launch dev app
npm run app      # quick relaunch without rebuilding
npm run dist     # build Windows installer + portable exe into release/
```

## What's inside (v0.2)

- **Projects with the full design-phase structure** — every project is born with 11 phase folders (Strategy → End-of-Life) plus Living Docs.
- **115-template library in 18 packs:**
  - **12 phase packs** auto-converted from the V3 master checklist (`resources/v3-checklist.md`), including a gate checklist per phase. An `[AI/ROBOT/EV]` toggle strips robotics items for simpler products.
  - **6 method packs** (`resources/method-library.mjs`) — 34 detailed working documents translated from other industries: AIAG-VDA DFMEA, Ford 8D, DVP&R, Toyota A3, Amazon PR/FAQ, DACI decision memos, ADR-style decision records, NASA-style PDR/CDR review packages, military After-Action Reviews, FDA design-control DHF & traceability, APQP/PPAP, ECO forms, Kano, premortems, usability test plans with SUS scoring, contextual inquiry (AEIOU), CMF direction sheets, semantic differential evaluation, OOBE storyboards, and more.
  - Every inserted document is stamped with a **document number** (`BLU-P03-XXXXXX`, FM.B style), a doc-control header line, and a revision-history table.
- **"Technical dossier" UI** — dark industrial chrome with speckle texture, lime primary, cyan data accents, monospace micro-labels, barcode motifs, and a light spec-sheet writing surface. Inspired by industrial label sheets, HUD panels, and technical schematic graphics.
- **Notion-style editor** (TipTap) — headings, checklists, tables, callouts; autosaves as Markdown with YAML frontmatter.
- **Archive** — drag-drop any file (images, PDFs, CAD) or paste inspiration URLs; tagged, checksummed (SHA-256), rendered as label-sheet cards with image thumbnails.
- **Project export** — ⤓ on any project in the sidebar copies the full phase-folder tree plus page media and project-tagged assets to a chosen destination, with a `MANIFEST.md` listing SHA-256 integrity checksums for every file (FM.F/FM.G style) **and a styled read-only HTML copy** (`HTML/index.html`) so non-designers can read the package without any tooling. Explorer opens on the exported folder.
- **Images in documents** — paste a screenshot, drop an image file, or use the 🖼 toolbar button; images are stored per-project in `_media/` and referenced by portable relative paths.
- **Document lifecycle** — the status chip is a live control (Draft → In Review → Approved → Released → Superseded → Obsolete, per FM.D), and pages are stamped with `author`/`updatedBy` from the operator name (✎ in the sidebar readout).
- **Save your own templates** — ▤+ on any page saves it into `.bludos/templates/`, appearing in the template browser under "My Studio".
- **Quick-open** — Ctrl+P jumps to any document; recents shown when empty.
- **Workspace picker** — ⇄ in the sidebar readout points Bludos at any folder (including a shared or synced drive). External edits are respected: folders and files created outside the app appear in the tree, and archive files added or removed externally are reconciled into the index at startup.
- **Full-text search**, **Trash** (30-day retention for pages *and* archive assets), **Share to Teams** (Adaptive Card via Workflows webhook — configure once via ⚙ next to the Share button).
- **Data safety** — all app indexes are written atomically with `.bak` fallbacks; late autosaves can never resurrect renamed or trashed pages.

## Where your data lives

`Documents\Bludos Workspace\` — projects are folders, pages are `.md` files, archived assets sit in `_archive\`, app metadata in `.bludos\`. Delete the app and your content remains readable.

## Regenerating templates

Edit `resources/v3-checklist.md` or `resources/method-library.mjs`, then `npm run templates`. The converter (`scripts/build-templates.mjs`) maps:
- `## PHASE N` → template pack · `### x.y Subsection` → template
- `> **Phase N Gate Archive Checkpoint:**` → gate checklist
- `## CROSS-CUTTING` → Living Docs pack · `## FILE MANAGEMENT` → skipped (implemented as app features instead)
- method library entries → method packs, wrapped with the same doc-control header/footer

## Testing

```
npx electron scripts/smoke.cjs
```

Headless end-to-end test of the backend: pages, doc-ID stamping, rename, trash/restore, archive with checksums, search, project export with manifest verification, and Teams share against a local mock webhook.

## Roadmap (per PRD)

- **P1** — peer sync via Yjs CRDTs over a self-hosted relay or Tailscale; phase-gate progress rollups; archive naming conventions.
- **P2** — custom Microsoft Teams tab app (read-only views); web clipper; approval workflow.
