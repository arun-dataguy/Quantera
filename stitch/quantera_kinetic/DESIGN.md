# Design System Strategy: Precision & Luminescence

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Kinetic Architect."** 

In the world of AI-powered trading, data can often feel chaotic or overwhelming. This system rejects the cluttered "terminal" aesthetic in favor of high-end editorial precision. We move beyond the "standard SaaS" look by treating the interface as a living, breathing canvas. By leveraging intentional asymmetry, expansive negative space, and a "light-first" approach to depth, we create a platform that feels like a premium financial instrument—authoritative, calm, and incredibly fast.

To break the "template" feel, layouts should avoid perfectly symmetrical grids. Use staggered card heights and overlapping data visualizations that bleed into the background, signaling that the platform is constantly processing information beyond the visible frame.

---

## 2. Color & Tonal Architecture
The palette is rooted in a high-contrast foundation of `on_surface` (#161b2b) and `surface` (#faf8ff), punctuated by the "Electric Primary" (#0050cb).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. The "box" is a relic. Instead, boundaries must be established through **Background Color Shifts**. 
*   Place a `surface_container_lowest` card on top of a `surface_container_low` section. 
*   Use `surface_dim` for sidebars to create a natural, architectural recess without drawing a single line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine paper and frosted glass:
- **Base Layer:** `surface` (#faf8ff)
- **Sectioning Layer:** `surface_container_low` (#f2f3ff)
- **Interactive/Content Layer:** `surface_container_lowest` (#ffffff)
- **High-Focus Elements:** `surface_bright` 

### The "Glass & Gradient" Rule
To elevate the experience, floating elements (like hover tooltips or mobile navigation) must utilize **Glassmorphism**. Apply `surface` at 70% opacity with a `20px` backdrop-blur. 
*   **Signature Textures:** Main CTAs should not be flat. Use a subtle linear gradient from `primary` (#0050cb) to `primary_container` (#0066ff) at a 135-degree angle to provide a "luminous" quality that suggests the energy of live market data.

---

## 3. Typography: Editorial Authority
We utilize **Inter** not as a utility font, but as a branding tool. The hierarchy is designed to feel like a high-end financial journal.

*   **Display & Headline (The Statement):** Use `display-lg` and `headline-lg` with tight tracking (-2%) to create a bold, "Linear-style" impact. These are reserved for high-level portfolio metrics and AI insights.
*   **Title (The Navigation):** `title-lg` and `title-md` act as the anchor points for cards. 
*   **Body (The Content):** `body-md` is the workhorse. Maintain a generous line-height (150%) to ensure readability during high-volatility market sessions.
*   **Label (The Utility):** `label-md` should be used for secondary data points, often in `on_surface_variant` (#424656) to recede visually, allowing the "Electric Blue" of the data signals to pop.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often messy. This system uses **Ambient Light Physics.**

### The Layering Principle
Depth is achieved by "stacking" the surface-container tiers. A `surface_container_highest` element naturally feels closer to the user than a `surface_container_low` element.

### Ambient Shadows
When an element must "float" (e.g., a modal or a primary signal card):
*   **Blur:** 32px to 64px.
*   **Opacity:** 4%–6%.
*   **Tint:** Use a tinted shadow based on `surface_tint` (#0054d6) rather than pure black. This mimics natural light reflecting off the blue-toned surfaces.

### The "Ghost Border" Fallback
If accessibility requirements demand a border, use the **Ghost Border**: `outline_variant` at **10% opacity**. It should be felt, not seen.

---

## 5. Components & Interface Elements

### Buttons: The Kinetic Trigger
*   **Primary:** Gradient fill (`primary` to `primary_container`), `DEFAULT` (8px) radius, white text. No shadow on rest; a 5% `surface_tint` shadow on hover.
*   **Secondary:** `surface_container_high` background with `primary` text. No border.
*   **Tertiary:** Ghost style. Transparent background, `primary` text, becomes `surface_container_low` on hover.

### Cards & Lists: The No-Divider Standard
*   **Strict Rule:** No horizontal rules/dividers. Separate list items using `16px` gaps. 
*   **Grouping:** Use a subtle background shift (`surface_container_low`) to group related list items rather than enclosing them in a boxed border.

### Chips: Data Tags
*   **Trading Signals:** Use `secondary` (#006c46) for Buy and `error` (#ba1a1a) for Sell.
*   **Styling:** 6px radius (`sm`), low-opacity background (10% of the color) with high-opacity text for a "modern pill" look.

### Input Fields: The Subtle Canvas
*   **Default State:** `surface_container_low` background, no border, `DEFAULT` (8px) radius.
*   **Active State:** `surface_container_lowest` background with a 1px `primary` Ghost Border (20% opacity).

### Specialized Component: The Signal Glow-Card
For "Strong Buy/Sell" signals, use a `surface_container_lowest` card with a 2px left-accent bar in `secondary` or `error`. Apply a very faint, wide-spread glow of the same color behind the card (3% opacity) to signify AI-confidence levels.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a structural element. If an interface feels "empty," increase the typography scale rather than adding lines.
*   **DO** use `surface_container` tiers to create hierarchy.
*   **DO** ensure all "Electric Blue" interactive elements have a 4.5:1 contrast ratio against their background.

### Don’t
*   **DON’T** use 100% opaque black or grey for shadows. 
*   **DON’T** use `outline` (#727687) at 100% opacity for any structural container.
*   **DON’T** use standard "Material Design" cards with heavy shadows and borders. 
*   **DON’T** clutter the viewport. If a piece of data isn't essential for the current trading decision, move it to a `surface_container_low` "Drawer" or secondary tab.