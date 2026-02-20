# RMG Portal — Page-by-Page Redesign (Enterprise Neutral Elevate)

> Single unified design system: **Enterprise Neutral Elevate** (Light + Dark). Clean, professional, accessible, and modern. This document gives page-by-page redesign instructions, UI differences from the current format, and implementation notes for React + TypeScript + Tailwind + ShadCN.

---

## Table of contents

1. Goals & principles
2. Design tokens (light & dark)
3. Global layout & navigation
4. Global components
5. Page-by-page redesign

   * Dashboard
   * Employees (Directory)
   * My Team
   * My Profile
   * My Attendance
   * Leave & Remote Work
   * IT Helpdesk
   * Performance
   * Documents
   * Login
6. Responsive behavior
7. Animation & micro-interactions
8. Accessibility and contrast
9. Implementation notes & folder structure
10. QA checklist & handoff

---

# 1. Goals & principles

* **Single visual system** across the portal; avoid mixing decorative styles.
* **Enterprise tone**: calm neutrals, restrained accents (corporate blue), solid borders, subtle elevation.
* **Consistency**: same card, table, form and button styles everywhere.
* **Scalable**: components are atomic and composable (Tailwind + ShadCN).
* **Dark + Light**: parity in layout and hierarchy; tokens drive color changes.
* **Accessibility**: WCAG AA contrast, keyboard-first interactions, ARIA attributes.

---

# 2. Design tokens (Light & Dark)

> Use CSS variables and Tailwind theme to drive both modes. Keep tokens in `src/styles/tokens.css` and map to Tailwind via `:root` and `.theme-dark` classes.

## Core tokens

```css
:root {
  --bg-page: #F8FAFC;
  --surface-card: #FFFFFF;
  --text-primary: #111827;
  --text-secondary: #4B5563;
  --border: #E5E7EB;
  --muted: #9CA3AF;
  --primary: #3A5AFE;
  --primary-600: #2F4EEA;
  --success: #16A34A;
  --danger: #EF4444;
  --warning: #F59E0B;
  --glass: rgba(255,255,255,0.6);
}

.theme-dark {
  --bg-page: #0B0F1A;
  --surface-card: #0F1724;
  --text-primary: #E6EEF8;
  --text-secondary: #B6C2D6;
  --border: #1F2937;
  --muted: #9CA3AF;
  --primary: #4B6BFF;
  --primary-600: #3953E0;
  --success: #10B981;
  --danger: #F87171;
  --warning: #F59E0B;
  --glass: rgba(255,255,255,0.04);
}
```

## Typography & spacing (tokens)

* Base font: `Inter` or `Inter var`
* Font scale: `14px` base, `16px` body, headings 20/24/28/32
* Border radius: `--radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px`
* Spacing grid: 4/8/12/16/24/32/48

---

# 3. Global layout & navigation

## Header (Top bar)

* Height: 64px
* Background: `var(--surface-card)` (light) / `--surface-card` (dark)
* Left: compact brand + optional department label
* Center-left: global page title (breadcrumbs optional)
* Center-right: search input (36px tall, rounded 8px)
* Right: theme toggle, notification bell, quick actions, profile avatar
* Sticky at top; subtle shadow `0 1px 2px rgba(0,0,0,0.04)` in light and darker in dark theme.

## Sidebar (Left)

* Width expanded: 260px; collapsed width: 72px
* Background: dark neutral (`#1C1E26`) in dark mode, deep navy in light variant
* Nav item style: icon + label, 8px rounded hover background, active item filled primary background with white icon/text
* Footer: user compact card with email & quick menu

## Content area

* Page padding: `24px` (desktop)
* Max content width: 1260px centered, except pages that need full-width (tables can be full-width within content container)

---

# 4. Global components (single unified style)

> Implement these once and reuse.

## Card (base)

* Background: `var(--surface-card)`
* Border: `1px solid var(--border)`
* Border radius: `12px`
* Padding: `16px` or `24px` for large cards
* Shadow: `0 1px 4px rgba(2,6,23,0.04)` (light) / `0 6px 20px rgba(2,6,23,0.6)` (dark subtle)

## Buttons

* Primary: `bg: var(--primary)`, `hover: var(--primary-600)`, `text-white`, `rounded-md`, `height:40px`
* Secondary: `bg: transparent`, `border:1px solid var(--border)`, `text: var(--text-primary)`

## Inputs & Selects

* Height: 42px, rounded 8px
* Border: `1px solid var(--border)`
* Placeholder: `var(--muted)`
* Focus: `ring-2 ring-offset-1 ring-color(var(--primary) 20%)`

## Status Pills

* Rounded-full, small (height 24px)
* Use background tint (e.g. `bg-green-50` with `text-green-700`) in light or equivalent in dark.

## Table

* Container card, sticky header row, zebra optional
* Actions column right-aligned with icon buttons

---

# 5. Page-by-page redesign

> For each page: goals, layout, visual changes from current UI, key components, accessibility notes, and QA checklist.

## Dashboard

**Goals:** Provide quick context, announcements, KPIs, and action shortcuts at a glance.

**Layout:**

* Top small KPI strip: 4–6 KPIs in compact cards (Total tickets, Open, In progress, Resolved, Closed)
* Two-column grid below: left: larger cards (Announcements, Web Check-in, Leave Balances), right: activity feed + small analytics widgets
* Announcement card with activity comments and reactions

**Visual changes from current:**

* Cards adopt white background with visible 1px borders, slightly larger radius and consistent padding
* Announcement feed uses compact card list with subtle avatars and muted timestamps
* KPI cards use left-aligned numeric with small label, not big centered number; small sparkline

**Key components:** KPI card, announcement feed card, donut/area charts

**Accessibility:** All KPIs have aria-labels and numeric text is readable at 16–18px.

**QA:** Ensure keyboard navigation to announcements, correct alt text, color contrast for KPI numbers.

---

## Employees (Directory)

**Goals:** Faster discovery and actions (email/call/view profile).

**Layout:**

* Top: Search + filters (business unit, dept, location, legal entity) in a single responsive row
* Main: Grid of employee cards (3 columns desktop, 2 tablet, 1 mobile)

**Visual changes:**

* Employee card: left avatar circle, right content with name, title, department, 1-line location. Add action icons at the bottom (Email, View Profile). Status pill top-right.
* Card hover: light elevation (no scale), border color changes to primary tint

**Components:** Search + filters, EmployeeCard, Pagination

**Accessibility:** ensure avatars have alt text; keyboard focus shows outline on card and actions.

**QA:** filter behaviour, keyboard search, screen reader label for each card.

---

## My Team

**Goals:** Provide manager-focused overview: team status, quick contact, and reporting insights.

**Layout:**

* Top search + team filter (my department vs all)
* Grid of team member cards with contact actions (Email, View), status badge and location
* Right (optional): Org chart mini view accessible via toggle

**Visual changes:**

* Cleaner card; use 'On Time', 'WFH', 'Not in yet' badges with consistent colors

**QA:** Ensure manager-specific permissions for actions.

---

## My Profile

**Goals:** Present personal, job, and timeline information in readable sections.

**Layout:**

* Hero banner with gradient strip (subtle), circular avatar overlap
* Quick stats row (status, employee id, BU)
* Tabs below: About, Profile (contacts, emergency), Job, Assets

**Visual changes:**

* Replace full-width bland header with a closer, compact hero; keep data in card sections below

**Accessibility:** Tabs keyboard navigable; forms with labels and error messages.

---

## My Attendance

**Goals:** Clear attendance logs and quick punch-in/out.

**Layout:**

* Top buttons: 30 Days / month quick filters
* Table with Date, Attendance time, Effective Hours, Gross Hours
* Floating Punch-In card (right corner or top) with big primary button

**Visual changes:**

* Time stamps in monospace or semi-bold to help scanning
* Use pill tags for hours (contrast against background)

**QA:** Verify timezone handling and keyboard focus on punch-in.

---

## Leave & Remote Work

**Goals:** Manage leave balances, request submission, and history clearly.

**Layout:**

* Top: Leave balances cards (grid 4)
* Middle: Weekly pattern + consumed types + monthly stats cards
* Bottom: Leave History table with filters
* Right-side drawer for Apply Leave (width 480px)

**Visual changes:**

* Drawer uses same card style; strong Submit (primary) and Cancel (secondary)
* Calendar/heatmap added to weekly pattern card (small sparkline/heat)

**Accessibility:** Datepickers must be keyboard accessible; when drawer opens focus moves inside and returns when closed.

**QA:** Exclude weekends logic, days count calculation, ARIA live region for submission success.

---

## IT Helpdesk

**Goals:** Submit tickets, view status, quick delete/view actions.

**Layout:**

* Top: ticket stats cards
* Middle: Submit IT Request form card (collapsible) with Request Type, Urgency, Subject, Description, Attachments
* Bottom: My Requests table (Ticket ID, Type, Subject, Urgency, Status, Created, Actions)

**Visual changes:**

* Replace browser default confirm with custom modal (shadcn Dialog) when deleting
* Use colored status pills for urgency and status

**QA:** File attachment preview, custom confirm modal keyboard accessible, ticket deletion audit log.

---

## Performance

**Goals:** Visualize goals and feedback with clear progress indicators.

**Layout:**

* Top: performance score card and goals completed card
* Middle: Current Goals list with horizontal progress bars and badges (completed/in-progress)
* Bottom: Performance Feedback list (cards)

**Visual changes:**

* Use thin smooth progress bars with rounded caps and primary accent
* Provide small 'celebration' micro-animation when goal reached

**Accessibility:** Progress bars include `aria-valuenow` and textual % values.

---

## Documents

**Goals:** Centralized document listing and upload with quick filters.

**Layout:**

* Search + filter row (type, department, date)
* Table or card grid depending on type (policies as cards; payslips as table rows)

**Visual changes:**

* File type icons, quick download button, tags for confidentiality

**QA:** File previews open in new tab, correct MIME handling.

---

## Login

**Goals:** Strong, simple entry with corporate branding and SSO button.

**Layout & Visual:**

* Centered auth card (max-width 480px)
* Heading + subtitle
* Email & password fields with show/hide toggle and Sign in button
* Secondary SSO button (Sign in with Microsoft)

**Dark & Light:** Card background `var(--surface-card)`; body uses subtle gradient or neutral background token

**QA:** Keyboard focus, ARIA labels, error handling for invalid credentials.

---

# 6. Responsive behavior

* **Mobile:** Sidebar collapses to hamburger; topbar retains search icon that expands into full width search; cards stack vertically.
* **Tablet:** Employee grid 2 columns; tables become horizontally scrollable inside a card container.
* **Desktop:** Full grid layouts as described.

---

# 7. Animation & micro-interactions

* Use `Framer Motion` for subtle interactions: card hover lift `y: -4px`, modal/drawer slide, search expansion.
* Keep durations short: 180ms–250ms for UI interactions; 400ms–600ms for larger transitions.
* Avoid flashy confetti; micro-animations for success states only.

---

# 8. Accessibility and contrast

* Maintain WCAG AA contrast: text vs background (>= 4.5:1 for body text)
* Keyboard navigation: ensure all interactive elements reachable by Tab and activate by Enter/Space
* Use ARIA roles for dialogs, lists, and grid tables
* Form validation should be descriptive; use `aria-invalid` and `aria-describedby`

---

# 9. Implementation notes & folder structure

## Tech stack

* React + TypeScript
* Tailwind CSS (configured to use tokens via CSS variables)
* ShadCN components for primitives (Dialog, Drawer, Tabs, Input)
* Framer Motion for motion
* React Query for server state
* Recharts for charts
* lucide-react for icons

## Tailwind config (example snippet)

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        surface: 'var(--surface-card)',
        border: 'var(--border)'
      },
      borderRadius: {
        md: '12px'
      }
    }
  }
}
```

## Folder structure

```
/src
  /components
    /ui  (buttons, inputs, badges, table, card)
    /layout (header, sidebar, footer)
    /pages (per-page components)
  /hooks
  /styles (tokens.css, globals.css)
  /lib (api clients)
  /pages (react-router pages)
```

## Theming helper

* Add `class="theme-dark"` to root when toggling dark mode
* Variables drive Tailwind colors via CSS vars
* Provide `useTheme()` hook to persist theme in localStorage

---

# 10. QA checklist & handoff

## Visual QA

* [ ] All pages follow token colors
* [ ] Border radius and spacing consistent
* [ ] Typography scale consistent

## Functionality QA

* [ ] Search & filters operate correctly
* [ ] Drawer focus trap works
* [ ] Delete uses custom modal (no browser confirm)

## Accessibility QA

* [ ] Keyboard navigation complete
* [ ] ARIA attributes implemented for dialogs/tables
* [ ] Color contrast meets WCAG AA

## Handoff

* Provide Storybook for UI components
* Provide Figma tokens & components (component names match code)
* Provide a migration checklist for existing components

---

# Appendix — Quick component spec (preview)

### EmployeeCard

* Props: `{ id, name, title, dept, location, email, avatarUrl, status }`
* Structure: `<Card>`

  * avatar (left)
  * name (h4)
  * subtext (title + dept)
  * action row (email, view profile)
  * status pill top-right

### TableRow actions

* Use icon buttons with aria-labels: `View ticket`, `Delete ticket` (confirm modal)

---

# Next steps

* I can generate a **Figma tokens file**, **Storybook skeleton**, or **React + TypeScript components** for any 3 priority pages (suggest Dashboard, Employees, Leave).

---

*Document prepared for RMG Portal redesign. Use this as the single source of truth for the dev & design teams.*

---

# Appendix B — Figma Token Set (Design System Export)

Use this block directly in **Figma Tokens Plugin / Tokens Studio**.

```json
{
  "color": {
    "bg.page": "{light.bg.page}",
    "surface.card": "{light.surface.card}",
    "text.primary": "{light.text.primary}",
    "text.secondary": "{light.text.secondary}",
    "border": "{light.border}",
    "primary": "{light.primary}",
    "primary.600": "{light.primary.600}",

    "light": {
      "bg.page": "#F8FAFC",
      "surface.card": "#FFFFFF",
      "text.primary": "#111827",
      "text.secondary": "#4B5563",
      "border": "#E5E7EB",
      "primary": "#3A5AFE",
      "primary.600": "#2F4EEA"
    },

    "dark": {
      "bg.page": "#0B0F1A",
      "surface.card": "#0F1724",
      "text.primary": "#E6EEF8",
      "text.secondary": "#B6C2D6",
      "border": "#1F2937",
      "primary": "#4B6BFF",
      "primary.600": "#3953E0"
    }
  },

  "radius": {
    "sm": "8px",
    "md": "12px",
    "lg": "16px"
  },

  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "24px",
    "2xl": "32px",
    "3xl": "48px"
  },

  "font-size": {
    "sm": "14px",
    "base": "16px",
    "md": "18px",
    "lg": "20px",
    "xl": "24px",
    "2xl": "28px",
    "3xl": "32px"
  }
}
```

---

# Appendix C — Storybook Skeleton

This is the recommended Storybook folder and starter config. Place inside `/storybook`.

## `.storybook/main.js`

```js
module.exports = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"] ,
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "storybook-dark-mode"
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  }
};
```

## `.storybook/preview.js`

```js
import '../src/styles/tokens.css';
import '../src/styles/globals.css';

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: { expanded: true },
  backgrounds: {
    default: "light",
    values: [
      { name: "light", value: "#F8FAFC" },
      { name: "dark", value: "#0B0F1A" }
    ]
  }
};
```

## Example component story — `Button.stories.tsx`

```tsx
import { Button } from "../components/ui/button";

export default {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Click me"
  }
};

export const Primary = {
  args: {
    variant: "default"
  }
};

export const Secondary = {
  args: {
    variant: "outline"
  }
};
```

## Storybook Folders

```
storybook/
  .storybook/
    main.js
    preview.js
  stories/
    Button.stories.tsx
    Card.stories.tsx
    Input.stories.tsx
    Table.stories.tsx
```

---

If you'd like, I can also generate:

* Figma **component library spec** (atoms → molecules → organisms)
* Storybook **for all UI primitives** (Button, Card, Input, Tabs, Drawer, Dialog, Badge)
* Auto-generated documentation pages for Storybook using MDX
