# ◆ Bludos — Blue Dossier

A **local-first Notion alternative for product designers**. Blue as in *blueprint* — the earliest way to archive design.

Bludos combines structured design-process documentation with an inspiration/asset archive, entirely on your machine. No cloud, no accounts; every page is a plain Markdown file you can read without the app.

Spec: see `../design-docs-app/PRD_v4_DesignDock.md` (Bludos is that PRD's P0 build).

## Run it

```
npm install
npm start
```

`npm start` regenerates templates, builds the UI, and opens the app. After the first build you can relaunch faster with `npm run app`.

## What's inside (v0.1 — P0)

- **Projects with the full design-phase structure** — every project is born with 11 phase folders (Strategy → End-of-Life) plus Living Docs.
- **81 templates seeded from the V3 master checklist** (`resources/v3-checklist.md`) — one insertable template per checklist subsection, plus a gate checklist per phase. A toggle includes/strips `[AI/ROBOT/EV]` items for non-robotics products.
- **Notion-style editor** — headings, checklists, tables, callouts; autosaves as Markdown with YAML frontmatter (title, status, timestamps).
- **Archive** — drag-drop any file (images, PDFs, CAD) or paste inspiration URLs; tagged, checksummed (SHA-256), thumbnailed for images.
- **Full-text search** across all pages and asset names/tags.
- **Trash** with 30-day retention and restore.

## Where your data lives

`Documents\Bludos Workspace\` — projects are folders, pages are `.md` files, archived assets sit in `_archive\`, app metadata in `.bludos\`. Delete the app and your content remains readable.

## Regenerating templates

Edit `resources/v3-checklist.md`, then `npm run templates`. The converter (`scripts/build-templates.mjs`) maps:
- `## PHASE N` → template pack · `### x.y Subsection` → template
- `> **Phase N Gate Archive Checkpoint:**` → gate checklist
- `## CROSS-CUTTING` → Living Docs pack · `## FILE MANAGEMENT` → skipped (implemented as app features instead)

## Testing

```
npx electron scripts/smoke.cjs
```

Headless end-to-end test of the workspace backend (pages, rename, trash/restore, archive, search).

## Roadmap (per PRD)

- **P1** — peer sync via Yjs CRDTs over a self-hosted relay or Tailscale; "Share to Teams" webhook; phase-gate progress rollups; archive naming conventions.
- **P2** — custom Microsoft Teams tab app (read-only views); phase-gate export packages (PDF + checksum manifest); web clipper; approval workflow.
