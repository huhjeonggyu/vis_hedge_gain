# Dynamic Allocation Explorer — v5

This build adds a few presentation changes for the paper-facing static site:

- adds **Buy and Hold** as a benchmark
- keeps the default comparison on the **hedging pair**
- renames the old paper preset to **Paper 4**
- renames universe labels so they no longer look like pure FF6 / FF25 / FF49 equity-only universes
- adds **universe help** and **factor-zoo help** panels with bundle / macro / Treasury descriptions
- keeps the site fully static for GitHub + Vercel deployment

## Local preview

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Main files

- `index.html` — static shell
- `app_v5.js` — client logic and Plotly rendering
- `styles.css` — styles
- `data/` — prebuilt JSON for the explorer
- `scripts/postprocess_v4_data_v5.py` — fast patcher that upgrades the existing v4 JSON data using `base_bundles_only.tar.gz`
- `scripts/export_v57_site_data.py` — exporter source kept in the repo for reference

## Deploy

Upload the folder contents to a GitHub repo and connect that repo to Vercel.
Use the static / `Other` preset.
