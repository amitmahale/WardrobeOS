# Wardrobe OS — design system

## 1. Brand feel

Wardrobe OS should look like a calm premium operating system for clothing decisions:
- clean and structured
- sharp typography
- quiet luxury, not flashy luxury
- modern product design, not fashion editorial clutter

## 2. Layout system

### App shell
- left sidebar: 248px desktop
- top utility bar: 72px
- page max width inside content: 1320px
- default content padding: 24px desktop, 16px mobile

### Grid
- 12-column desktop grid
- 8px spacing system
- card radius: 20px
- input radius: 14px

## 3. Color tokens

### Neutrals
- background: `#0B1020`
- panel: `#121A2D`
- panel-alt: `#172039`
- border: `rgba(255,255,255,0.08)`
- text-primary: `#F4F7FB`
- text-secondary: `#A8B3C7`
- text-muted: `#7A8598`

### Accents
- brand: `#B7FF6A`
- brand-deep: `#8BDD39`
- blue: `#6EA8FE`
- amber: `#F8C15C`
- rose: `#F4849A`

### Semantic
- success: `#43C47B`
- warning: `#FFB74D`
- danger: `#FF6B6B`

## 4. Typography

- font family: Inter or system ui-sans
- hero: 56/60 semibold
- page title: 32/38 semibold
- section title: 20/28 semibold
- card title: 16/22 semibold
- body: 14/22 regular
- caption: 12/18 medium

## 5. Components

### Sidebar nav
- icon + label
- active item uses tinted background
- compact optional later

### Stat card
- title
- primary number
- delta/support line
- optional sparkline later

### Item card
- image block
- item name
- metadata chips
- wear count badge
- context actions

### Recommendation card
- title
- score pill
- rationale text
- linked items row
- CTA row

### Filters
- pill chips for common filters
- advanced filter drawer later

### Form controls
- use consistent inline labels
- never hide required fields
- use segmented control for formality and warmth where useful

## 6. Motion

- subtle hover only
- 120–180ms transitions
- no bouncy motion
- use opacity and translateY carefully

## 7. Imagery

- product images should be crisp and centered
- allow neutral card backgrounds behind clothing photos
- fallback item art should look intentional, not broken image placeholders

## 8. Copy style

Avoid:
- “slay”
- “drip”
- “iconic”
- overly fashion-blog language

Prefer:
- clear
- direct
- useful
- explainable