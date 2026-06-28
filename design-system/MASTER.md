# SRF-web Design System — MASTER

> **Source of Truth** for all UI/UX decisions in San Rafael SaaS.
> Hierarchical retrieval: check `design-system/pages/*.md` first (overrides), then this file.

---

## 1. Product Profile

| Field | Value |
|-------|-------|
| Product type | Multi-tenant SaaS (e-commerce platform) |
| Sub-products | Public store frontends + Admin dashboard |
| Stack | React 19 + TypeScript + Vite + FastAPI |
| CSS approach | CSS files per component, CSS variables for theming |
| Icon library | **react-icons/hi** (Heroicons v1 Outline) — exclusive |

---

## 2. Style

| Property | Value |
|----------|-------|
| Primary style | Clean, professional, modern e-commerce |
| Visual language | Solid cards with subtle shadows (NOT glassmorphism on light backgrounds) |
| Corner radius | 12px (cards), 8px (inputs/buttons), 999px (badges) |
| Shadow level | `0 1px 3px rgba(0,0,0,0.05)` default, `0 4px 12px rgba(0,0,0,0.08)` on hover |
| Animations | 150ms–300ms transitions, NO aggressive pulse/shake effects |
| Borders | `1px solid var(--border)` visible in light mode |

### Anti-patterns (DO NOT USE)
- `backdrop-filter: blur()` on light backgrounds (creates muddy gray)
- `background: rgba(0,0,0,0.3)` inputs on light themes
- Emojis as UI icons (use Heroicons instead)
- Hardcoded dummy data in charts/tables
- Mixing Material Symbols font with React Icons

---

## 3. Color System

### Admin Theme (`.admin-theme`)
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#694634` (Chocolate Cremoso) | Brand accent, active states |
| `--primary-light` | `#8B6B52` | Hover, borders on hover |
| `--bg` | `#F5F0EB` (Beige claro) | App background |
| `--surface` | `#FFFFFF` | Card backgrounds (solid white) |
| `--text-primary` | `#1C1917` (slate-900 equiv) | Headings, body |
| `--text-secondary` | `#57534E` (slate-600 min) | Labels, captions |
| `--text-muted` | `#78716C` | Placeholders |
| `--border` | `#E7E5E4` (warm gray) | Card/input borders |
| `--success` | `#16A34A` | Confirmations |
| `--error` | `#DC2626` | Errors, destructive |
| `--warning` | `#D97706` | Warnings |

### Store Theme (`.store-theme`)
| Token | Source |
|-------|--------|
| `--primary` | Dynamic per tienda (`tienda.color_primario`) |
| `--secondary` | Dynamic per tienda (`tienda.color_secundario`) |
| Rest | Same neutrals as admin |

### Default Theme (`:root`)
Used on login, registro, landing. Inherits admin palette.

### Contrast Requirements (WCAG AA)
- Body text on light: minimum `#57534E` (4.5:1)
- Links on dark auth bg: minimum `#A68B6F` (4.5:1 against `#2D2C2F`)
- Muted text: never lighter than `#78716C` on white

---

## 4. Typography

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 2.25rem | 800 | Page titles, hero |
| H2 | 1.75rem | 700 | Section headers |
| H3 | 1.375rem | 600 | Card titles |
| Body | 1rem | 400 | Paragraphs, inputs |
| Small / Caption | 0.875rem | 400 | Labels, meta |
| Button | 0.9375rem | 600 | Button text |

**Hierarchy rule**: A price should NEVER compete with a title. Price size ≤ H2.

Font family: `Inter, system-ui, -apple-system, sans-serif` (fallback from existing)
Store display font: `Manrope` (already loaded via `style_1.css`)

---

## 5. Icon System

**Library**: `react-icons/hi` (Heroicons v1 Outline)

| Concept | Icon |
|---------|------|
| Shopping bag | `HiOutlineShoppingBag` |
| Cart | `HiOutlineShoppingCart` |
| Search | `HiOutlineSearch` |
| Plus | `HiOutlinePlus` |
| Minus | `HiOutlineMinus` |
| Close / X | `HiOutlineX` |
| Menu | `HiOutlineMenu` |
| Delete | `HiOutlineTrash` |
| Edit | `HiOutlinePencil` |
| Eye | `HiOutlineEye` |
| Save | `HiOutlineSave` |
| Check | `HiOutlineCheck` |
| Check circle | `HiOutlineCheckCircle` |
| Verified badge | `HiOutlineBadgeCheck` |
| Truck / shipping | `HiOutlineTruck` |
| Support | `HiOutlineSupport` |
| Chat | `HiOutlineChatAlt2` |
| Phone | `HiOutlinePhone` |
| Email | `HiOutlineMail` |
| Location | `HiOutlineMap` |
| Arrow left | `HiOutlineArrowLeft` |
| Arrow up | `HiOutlineArrowUp` |
| Arrow down | `HiOutlineArrowDown` |
| Inbox (empty) | `HiOutlineInbox` |
| Credit card | `HiOutlineCreditCard` |
| Warning | `HiOutlineExclamation` |
| Sparkles | `HiOutlineSparkles` |
| Store | `HiOutlineOfficeBuilding` |

**Rules**:
- Size: `size={20}` or `size={24}` for standard UI
- Never use `material-symbols-outlined` spans
- Never use emojis as functional icons

---

## 6. Component Patterns

### Cards
```css
.card {
  background: #FFFFFF;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
```

### Empty States
```tsx
<div className="empty-state">
  <HiOutlineInbox size={48} className="empty-state-icon" />
  <p className="empty-state-title">No hay pedidos aún</p>
  <Link className="empty-state-action">Ver tienda pública</Link>
</div>
```

### Floating Navbar
```css
.navbar {
  position: fixed;
  top: 1rem; left: 1rem; right: 1rem;
  z-index: 50;
}
```
Content must account for fixed navbar height.

### Tables (Mobile)
```css
.table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
```

---

## 7. Interaction Rules

| Rule | Implementation |
|------|----------------|
| Cursor pointer | All clickable elements: `cursor: pointer` |
| Hover feedback | Color/shadow transition only — NO scale transforms that shift layout |
| Transition speed | 150ms–300ms (`duration-200`) |
| Focus visible | `outline: 2px solid var(--primary); outline-offset: 2px;` |
| Disabled state | `opacity: 0.5; cursor: not-allowed;` + visual distinction |

---

## 8. Accessibility Checklist

- [ ] All inputs have `<label>` (visually hidden if needed)
- [ ] Color is not the only indicator
- [ ] Focus visible on all interactive elements
- [ ] `prefers-reduced-motion` respected (disable skeleton/shimmer animations)
- [ ] Toast container has `aria-live="polite"`
- [ ] Modals trap focus and handle Escape key
- [ ] Images have alt text
- [ ] Contrast ≥ 4.5:1 for body text

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Notes |
|------------|-------|-------|
| Mobile S | 375px | Minimum target |
| Mobile | 480px | Cart sidebar adjustments |
| Tablet | 768px | Sidebar collapses, grid → 2 cols |
| Desktop | 1024px | Full sidebar, multi-column |
| Wide | 1440px | Max content width 1200px centered |

---

## 10. Loading States

| Pattern | When to use |
|---------|-------------|
| Skeleton screen | Product grids, dashboard cards, lists |
| Spinner | Button actions, small inline waits |
| Branded loader | Full page (ProtectedRoute) |

Skeleton MUST respect:
```css
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
```

---

## 11. Content Rules

- No hardcoded testimonials without real data
- No dummy chart data (show empty state if no history)
- No emojis in professional UI (replace with Heroicons)
- "Sobre Nosotros" uses `tienda.descripcion` or is omitted if empty