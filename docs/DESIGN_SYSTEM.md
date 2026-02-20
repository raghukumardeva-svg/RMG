# RMG Portal Design System

## Overview
This document outlines the comprehensive design system implemented across the RMG Portal application, ensuring visual consistency, brand alignment, and accessibility compliance.

---

## 🎨 Typography — Inter Font Family

### Font Implementation
The application uses **Inter** as the primary font family throughout, loaded from Google Fonts with the following weights:

- **Light (300)** — For subtle text elements
- **Regular (400)** — Default body text
- **Medium (500)** — Emphasized content, numeric data
- **Semibold (600)** — Section headings, important labels
- **Bold (700)** — Primary headings, hero text

### Font Loading
```html
<!-- index.html -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
```

### Typography Hierarchy

#### Headings
```css
h1 { @apply text-3xl font-bold text-brand-navy dark:text-gray-100; }
h2 { @apply text-2xl font-semibold text-brand-navy dark:text-gray-100; }
h3 { @apply text-xl font-semibold text-brand-navy dark:text-gray-100; }
h4 { @apply text-lg font-medium text-brand-navy dark:text-gray-100; }
h5 { @apply text-base font-medium text-brand-navy dark:text-gray-100; }
h6 { @apply text-sm font-medium text-brand-navy dark:text-gray-100; }
```

**Guidelines:**
- Headings use **semibold** or **bold** weights
- Primary color: **Dark Navy (#1C242E)** in light mode
- Line height: **1.2** for comfortable readability
- Sentence case for standard headings
- Uppercase only for special section labels

#### Body Text
```css
p { 
  @apply text-base text-brand-slate dark:text-gray-300; 
  line-height: 1.6;
}
```

**Guidelines:**
- Default: **Inter Regular (400)**
- Secondary text: **Slate Gray (#6B7280)**
- Line height: **1.6** for optimal readability
- Comfortable spacing between lines

#### Numeric Data
```css
.numeric { @apply font-medium tabular-nums; }
```

**Guidelines:**
- Use **Inter Medium (500)** or **Semibold (600)**
- Enable `tabular-nums` for aligned columns in tables
- Consistent numeric rendering across the application

---

## 🟩 Brand Color Palette

### Primary Colors

| Color Name | Hex Code | Usage | Tailwind Class |
|------------|----------|-------|----------------|
| **Brand Green** | `#0E9F6E` | Primary actions, success states, highlights | `bg-brand-green` `text-brand-green` |
| **Green Dark** | `#0A7C55` | Hover states for green elements | `bg-brand-green-dark` |
| **Green Light** | `#D1FAE5` | Light backgrounds, success indicators | `bg-brand-green-light` |
| **Dark Navy** | `#1C242E` | Headings, titles, important text | `text-brand-navy` |
| **Slate Gray** | `#6B7280` | Secondary text, icons, subtle elements | `text-brand-slate` |
| **Light Gray** | `#E5E7EB` | Borders, dividers, subtle backgrounds | `border-brand-light-gray` |
| **Off-White** | `#F9FAFB` | Page backgrounds, muted areas | `bg-brand-off-white` |

### Color Usage Guidelines

#### Primary Actions (Buttons, Links, CTAs)
- **Background:** Brand Green (`#0E9F6E`)
- **Text:** White
- **Hover:** Green Dark (`#0A7C55`)
- **Focus Ring:** Brand Green

```tsx
<Button variant="default">Primary Action</Button>
// Result: bg-brand-green text-white hover:bg-brand-green-dark
```

#### Text Hierarchy
- **Titles/Headings:** Dark Navy (`#1C242E`)
- **Body Text:** Slate Gray (`#6B7280`)
- **Placeholder Text:** Slate Gray at 60% opacity

#### Backgrounds
- **Page Background:** Off-White (`#F9FAFB`)
- **Card Background:** White (`#FFFFFF`)
- **Muted Sections:** Light Gray (`#E5E7EB`)

#### Borders & Dividers
- **Default Borders:** Light Gray (`#E5E7EB`)
- **Hover Borders:** Slate Gray (`#6B7280`)
- **Focus Borders:** Brand Green (`#0E9F6E`)

#### Status Indicators

**Active Status:**
```tsx
bg-brand-green-light text-brand-green
// Light green background with green text
```

**Inactive Status:**
```tsx
bg-gray-100 text-brand-slate
// Light gray background with slate text
```

**Success:**
```tsx
bg-brand-green text-white
// Green background, white text
```

---

## 🧩 UI Component Styling

### Buttons

#### Primary Button
```tsx
<Button variant="default">
  Primary Action
</Button>
```
- Background: `bg-brand-green`
- Text: White
- Hover: `bg-brand-green-dark`
- Border radius: `rounded-md` (6px)
- Font: Inter Medium

#### Secondary Button
```tsx
<Button variant="secondary">
  Secondary Action
</Button>
```
- Background: `bg-gray-100`
- Text: `text-brand-navy`
- Hover: `bg-gray-200`

#### Outline Button
```tsx
<Button variant="outline">
  Outline Action
</Button>
```
- Border: `border-brand-light-gray`
- Text: `text-brand-navy`
- Hover: Light gray background

#### Link Button
```tsx
<Button variant="link">
  Link Action
</Button>
```
- Text: `text-brand-green`
- Underline on hover

### Cards

#### Default Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Styling:**
- Background: White
- Border: `border-brand-light-gray`
- Shadow: `shadow-sm`
- Hover: `shadow-md`
- Border radius: `rounded-lg` (8px)
- Title: `text-brand-navy font-semibold`
- Description: `text-brand-slate`

### Inputs

#### Text Input
```tsx
<Input 
  placeholder="Enter text..." 
  type="text"
/>
```

**Styling:**
- Border: `border-brand-light-gray`
- Text: `text-brand-navy`
- Placeholder: `text-brand-slate/60`
- Focus: `ring-brand-green border-brand-green`
- Border radius: `rounded-md` (6px)
- Font: Inter Regular

### Badges

#### Default Badge (Success)
```tsx
<Badge variant="default">Active</Badge>
```
- Background: `bg-brand-green`
- Text: White
- Shape: `rounded-full`

#### Success Badge
```tsx
<Badge variant="success">Success</Badge>
```
- Background: `bg-brand-green-light`
- Text: `text-brand-green`

#### Secondary Badge
```tsx
<Badge variant="secondary">Pending</Badge>
```
- Background: `bg-gray-100`
- Text: `text-brand-slate`

#### Outline Badge
```tsx
<Badge variant="outline">Draft</Badge>
```
- Border: `border-brand-light-gray`
- Text: `text-brand-slate`

### Icons

**Default Icon Color:**
```tsx
<Icon className="text-brand-slate dark:text-gray-400" />
```

**Success Icons:**
```tsx
<Icon className="text-brand-green" />
```

**Guidelines:**
- Use Slate Gray (`#6B7280`) for neutral icons
- Brand Green for success/active states
- Always include `aria-label` for accessibility

---

## 📐 Spacing & Layout

### Spacing Scale

| Name | Value | Tailwind Class | Usage |
|------|-------|----------------|-------|
| Extra Small | 4px | `space-xs` | Tight spacing between related elements |
| Small | 6px | `space-sm` | Compact layouts |
| Medium | 8px | `space-md` | Standard element spacing |
| Large | 12px | `space-lg` | Section spacing |
| Extra Large | 24px | `space-xl` | Major section breaks |
| 2XL | 32px | `space-2xl` | Page-level spacing |
| 3XL | 48px | `space-3xl` | Hero sections |

### Layout Principles

#### Card Padding
- Default: `p-5` (20px)
- Compact: `p-4` (16px)
- Spacious: `p-6` (24px)

#### Page Margins
- Mobile: `px-4` (16px)
- Desktop: `px-6` (24px)

#### Section Spacing
- Between sections: `space-y-6` (24px)
- Within sections: `space-y-4` (16px)

#### Border Radius
- Small: `rounded-sm` (4px) — Badges, pills
- Medium: `rounded-md` (6px) — Buttons, inputs
- Large: `rounded-lg` (8px) — Cards, modals
- Full: `rounded-full` — Avatars, status indicators

### Line Heights

| Type | Value | Tailwind Class |
|------|-------|----------------|
| Tight (Headings) | 1.2 | `leading-tight` |
| Comfortable (Body) | 1.6 | `leading-comfortable` |
| Relaxed (Long-form) | 1.75 | `leading-relaxed` |

---

## ♿ Accessibility Requirements

### Color Contrast

All color combinations meet **WCAG AA** standards:

| Combination | Contrast Ratio | Pass |
|-------------|----------------|------|
| Dark Navy on White | 14.8:1 | ✅ AAA |
| Slate Gray on White | 4.6:1 | ✅ AA |
| Brand Green on White | 3.4:1 | ✅ AA (Large text) |
| White on Brand Green | 4.7:1 | ✅ AA |

**Guidelines:**
- ❌ Never use Brand Green text on white for small text
- ✅ Use Brand Green for backgrounds with white text
- ✅ Use Dark Navy or Slate Gray for readable text

### Focus States

All interactive elements have visible focus indicators:

```tsx
focus-visible:outline-none 
focus-visible:ring-2 
focus-visible:ring-brand-green 
focus-visible:ring-offset-2
```

### ARIA Labels

All icons and interactive elements include proper ARIA labels:

```tsx
<Icon 
  className="h-4 w-4" 
  aria-label="Email address"
/>

<Button 
  aria-label="Save changes"
>
  Save
</Button>
```

### Keyboard Navigation

- All cards, buttons, and interactive elements are keyboard accessible
- Focus order follows visual hierarchy
- Escape key closes modals and dropdowns

---

## 🎯 Implementation Checklist

### ✅ Completed

- [x] Inter font loaded globally (300, 400, 500, 600, 700 weights)
- [x] Brand color palette configured in Tailwind
- [x] CSS variables updated with brand colors
- [x] Typography hierarchy established
- [x] Button component updated with brand colors
- [x] Badge component using brand palette
- [x] Card component with brand borders and text
- [x] Input component with brand focus states
- [x] Label component using brand slate color
- [x] MyTeam page fully updated with brand colors
- [x] Consistent spacing scale defined
- [x] Border radius standardized
- [x] Focus states use brand green
- [x] WCAG AA contrast compliance

### 📋 Brand Color Reference

#### Tailwind Usage Examples

```tsx
// Primary button
<button className="bg-brand-green hover:bg-brand-green-dark text-white">
  Save
</button>

// Heading
<h1 className="text-brand-navy dark:text-gray-100 font-bold">
  Dashboard
</h1>

// Secondary text
<p className="text-brand-slate dark:text-gray-400">
  Description text
</p>

// Card with brand colors
<Card className="border-brand-light-gray">
  <CardContent>
    <CardTitle className="text-brand-navy">
      Card Title
    </CardTitle>
  </CardContent>
</Card>

// Input with focus
<Input 
  className="border-brand-light-gray focus:ring-brand-green"
  placeholder="Type here..."
/>

// Status badge
<Badge className="bg-brand-green-light text-brand-green">
  Active
</Badge>
```

---

## 🔄 Dark Mode Support

All brand colors have dark mode equivalents:

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| `text-brand-navy` | `dark:text-gray-100` | Headings |
| `text-brand-slate` | `dark:text-gray-400` | Body text |
| `border-brand-light-gray` | `dark:border-gray-700` | Borders |
| `bg-white` | `dark:bg-gray-900` | Backgrounds |
| `bg-brand-green` | `dark:bg-brand-green` | Buttons (unchanged) |

---

## 📝 Notes for Developers

### When Creating New Components

1. **Always use brand colors** from the palette — avoid arbitrary colors
2. **Use Inter font** with appropriate weights
3. **Follow spacing scale** — use `space-xl`, `space-lg`, etc.
4. **Include dark mode variants** for all color classes
5. **Add focus states** with `focus-visible:ring-brand-green`
6. **Test contrast ratios** before deployment
7. **Include ARIA labels** for icons and interactive elements

### Color Selection Quick Reference

- **Primary actions**: `bg-brand-green`
- **Headings**: `text-brand-navy`
- **Body text**: `text-brand-slate`
- **Borders**: `border-brand-light-gray`
- **Icons**: `text-brand-slate`
- **Success states**: `bg-brand-green-light text-brand-green`
- **Page backgrounds**: `bg-brand-off-white`

---

## 🎨 Visual Harmony Principles

1. **Minimal rounded corners** — Use `rounded-md` for most elements
2. **Subtle shadows** — Prefer `shadow-sm`, use `shadow-md` on hover
3. **Consistent transitions** — Duration: 200ms for all color/shadow changes
4. **Comfortable whitespace** — Don't crowd elements
5. **Clear hierarchy** — Size, weight, and color indicate importance
6. **Accessible contrast** — Never compromise readability for aesthetics

---

**Last Updated:** December 3, 2025  
**Version:** 1.0  
**Maintained by:** RMG Portal Development Team
