# Yukteswar Mantha: research portfolio

Static site (HTML/CSS/JS, no build step, no frameworks). The visual language (Space Grotesk + Funnel Display, blue / navy / stone / ink sections, column-grid backdrop, dithered offset shadows, a narrating mascot) follows sebg.ch. All code, copy, art and the mascot (Pip, a map pin) are original.

## Preview locally
```
python -m http.server 8000
```
Then open http://localhost:8000.

## Pages
- `index.html`: the portfolio. Hero (name), About, Research cards (Seed, ControlTraj), Research interests (Computer Vision, LLMs), Writing & LLMs (Continual Learning Cookbook, SLM Bug Localizer), Contact.
- `seed.html`, `controltraj.html`: one page per paper, with the paper summary, my problem statement (*How can you generate real-time synthetic trajectories from sparse data for Gurgaon City?*), and a pinned scroll tour on Gurgaon's real road network. The animation is illustrative only; it is not model output.

## Edit content
Everything is in `js/content.js`: bio line, problem statement, each paper's summary, "where this paper fits" and tour steps, the interests, and the writing/LLM cards.

## Files
- `css/styles.css`: tokens, layout, Pip animations
- `js/site.js`: shared by all pages (Pip, reveals, click-to-copy email)
- `js/map.js`: Gurgaon road graph, random-walk trips, generated card art
- `js/home.js`: renders the homepage cards
- `js/paper.js`: renders a paper page and its map tour
- `js/gurgaon-roads.js`: motorway to tertiary roads for Gurgaon (bbox 28.40–28.51 N, 76.99–77.11 E), simplified. Data © OpenStreetMap contributors, ODbL.
- `assets/pip.svg`: favicon (Pip, the site's original map-pin mascot)

## Deploy (GitHub Pages)
Push to a repo named `yukteswar23.github.io` (`.gitignore` already leaves out the PDFs and `_old-desk-design/`), then go to Settings → Pages → Deploy from branch → `main` / root.
