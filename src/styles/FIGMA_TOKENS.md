Figma tokens for Chess.od

How to import

1. Install a tokens plugin in Figma (e.g., "Design Tokens" or "Tokens Studio").
2. Open the plugin, choose import, and paste the contents of `src/styles/figma-tokens.json`.
3. Map token groups to Figma styles:
   - `color.*` → Create Color Styles
   - `typography.font.*` → Create Text Styles (set family and weight manually)
   - `typography.size.*` → Use to set font sizes in Text Styles
   - `radius.*` → Create Corner Radius tokens
   - `shadow.*` → Create Effects (drop-shadow)

Notes & recommendations
- Use `background` and `card-bg` for background fills in frames and cards.
- Use `accent` / `cta` for primary actions; `cta-hover` for hover states.
- Create Text Styles: `H1` (font: Montserrat, size: 44, weight: 700), `Body` (Open Sans 14–16), `Button` (uppercase 14, letter-spacing 1px).
- Export icons as monochrome SVG and color with Color Styles in Figma.

If you want, I can also produce a single-file `.figma-tokens.json` formatted for a specific plugin—tell me which plugin you use.
