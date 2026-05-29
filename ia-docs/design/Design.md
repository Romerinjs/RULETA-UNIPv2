# Design System: UNIPUTUMAYO[cite: 1]

> Category: Institutional & Educational Design System
> Visual creation platform. Palette based on the Andean-Amazonian nature, structured yet accessible geometry, strong typographic contrast[cite: 1].

## 1. Visual Theme & Atmosphere

The visual system of UNIPUTUMAYO projects seriousness and trust, while simultaneously conveying energy and innovation[cite: 1]. The layout is built on a clean white canvas (`#ffffff`) that respects the brand guideline of using light backgrounds to highlight its identity[cite: 1]. The chromatic system relies on strategic combinations: **Blue and Green** for formal institutional contexts, and **Blue and Orange** for digital applications and marketing, providing vitality[cite: 1].

Typography establishes a clear hierarchy using **Heavitas** and **Raleway** for headlines, bringing modernity and institutional weight, while **Fira Sans** and **Roboto** guarantee high readability in text blocks[cite: 1]. Surfaces feature generous padding with moderate border radii (8px), striking a balance between corporate (straight) and friendly (curved).

**Key Characteristics:**
- White canvas (`#ffffff`) that allows institutional colors to stand out[cite: 1].
- Typography combination: Heavitas/Raleway (Display) and Fira Sans/Roboto (Body)[cite: 1].
- Radii of 8px to 12px; a more formal structure than pure consumer platforms, but without being rigid.
- Subtle, cool shadows that add depth without muddying the interface.
- Use of Orange (`#F5A51D`) for digital calls to action (CTAs) and Green (`#80BF1F`) for elements related to the environmental surroundings[cite: 1].

## 2. Color Palette & Roles

### Primary Brand
- **Institutional Blue** (`#18668F`): Primary color[cite: 1]. Represents security, trust, and serenity[cite: 1].
- **Nature Green** (`#80BF1F`): Secondary color[cite: 1]. Symbolizes sustainability, growth, and well-being[cite: 1].
- **Energy Orange** (`#F5A51D`): Digital accent color[cite: 1]. Dynamism, creativity, and innovation[cite: 1].
- **Main Gray** (`#595957`): Support for text and secondary hierarchy[cite: 1].

### Surfaces
- **Canvas** (`#ffffff`): Main background[cite: 1].
- **Surface Subtle** (`#f4f5f7`): Section breaks, card backgrounds.
- **Surface Active** (`#e8eaed`): Hover states and highlighted blocks.

### Ink & Text
- **Dark Ink** (`#000000`): High-impact headlines[cite: 1].
- **Primary Ink** (`#595957`): Main institutional text (Brand Gray)[cite: 1].
- **Secondary Ink** (`#B2B6B9`): Descriptions, metadata, and support text[cite: 1].

### Borders
- **Border Default** (`#e1e3e6`): Standard hairline.
- **Border Strong** (`#B2B6B9`): Hover state or emphasized borders[cite: 1].

## 3. Typography Rules

### Font Families
- **Display / Headlines**: `Heavitas`, `Raleway`, with `sans-serif` fallback[cite: 1].
- **Body / UI**: `Fira Sans`, `Roboto`, with `system-ui, sans-serif` fallback[cite: 1].

### Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
|------|------|------|--------|-------------|-------|
| Hero | Heavitas / Raleway | 56px | 800 | 1.1 | Main hero message. |
| H1 | Raleway | 36px | 700 | 1.2 | Page heading. |
| H2 | Raleway | 24px | 700 | 1.25 | Section heading. |
| H3 | Raleway | 18px | 600 | 1.3 | Card title. |
| Body L| Fira Sans / Roboto | 16px | 400 | 1.55 | Introductory text. |
| Body | Fira Sans / Roboto | 14px | 400 | 1.5 | Standard UI prose. |
| Button| Fira Sans / Roboto | 14px | 600 | 1.2 | Button label. |
| Tag | Fira Sans | 11px | 600 | 1.2 | Uppercase category chip. |

## 4. Component Stylings

### Buttons

**Digital Primary (Blue-Orange Gradient)**
- Background: `linear-gradient(135deg, #18668F, #F5A51D)`
- Text: `#ffffff`
- Padding: 12px 24px
- Radius: 8px
- Shadow: `0 4px 12px rgba(24, 102, 143, 0.2)`
- Use: Marketing CTAs, enrollments.

**Institutional (Solid Blue)**
- Background: `#18668F`
- Text: `#ffffff`
- Hover: `#125174` (Darkened Blue)

**Secondary**
- Background: `#ffffff`
- Text: `#18668F`
- Border: 1px solid `#18668F`
- Hover: Background `rgba(24, 102, 143, 0.05)`

### Cards / Information Modules
- Background: `#ffffff`
- Border: 1px solid `#e1e3e6`
- Radius: 8px
- Shadow at rest: `0 2px 6px rgba(0,0,0,0.05)`
- Shadow on hover: `0 8px 24px rgba(24, 102, 143, 0.1)`, slight elevation.

### Tags / Chips
- Background: Green or Orange with 15% opacity.
- Text: Dark Green (`#5c8f12`) or Dark Orange (`#c48011`).
- Padding: 4px 12px
- Radius: 9999px
- Font: 11px / 600 / Uppercase.