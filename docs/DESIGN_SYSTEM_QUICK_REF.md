# Design System Quick Reference

## 🎨 Brand Colors - Quick Copy

### Primary Color Palette
```tsx
// Brand Green (Primary Actions)
className="bg-brand-green"              // #0E9F6E
className="hover:bg-brand-green-dark"   // #0A7C55
className="bg-brand-green-light"        // #D1FAE5

// Text Colors
className="text-brand-navy"             // #1C242E (Headings)
className="text-brand-slate"            // #6B7280 (Body/Icons)

// Borders & Backgrounds
className="border-brand-light-gray"     // #E5E7EB
className="bg-brand-off-white"          // #F9FAFB

// Focus States
className="focus-visible:ring-brand-green"
```

---

## 📋 Common UI Patterns

### Primary Button
```tsx
<Button variant="default">
  Save Changes
</Button>
// Auto applies: bg-brand-green hover:bg-brand-green-dark text-white
```

### Card with Brand Styling
```tsx
<Card className="border-brand-light-gray">
  <CardHeader>
    <CardTitle className="text-brand-navy dark:text-gray-100">
      Section Title
    </CardTitle>
    <CardDescription className="text-brand-slate">
      Subtitle or description
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Input with Brand Focus
```tsx
<Input 
  className="border-brand-light-gray focus:ring-brand-green"
  placeholder="Enter text..."
/>
// Auto applies brand colors via component defaults
```

### Active Status Badge
```tsx
<Badge className="bg-brand-green-light text-brand-green">
  Active
</Badge>
```

### Inactive Status Badge
```tsx
<Badge className="bg-gray-100 text-brand-slate">
  Inactive
</Badge>
```

### Icon with Brand Color
```tsx
<Mail className="h-4 w-4 text-brand-slate dark:text-gray-400" />
```

### Heading
```tsx
<h1 className="text-3xl font-bold text-brand-navy dark:text-gray-100">
  Page Title
</h1>
```

### Body Text
```tsx
<p className="text-base text-brand-slate dark:text-gray-300">
  Body content with comfortable line height
</p>
```

---

## ✨ Typography Quick Reference

```tsx
// H1 - Main page titles
<h1 className="text-3xl font-bold text-brand-navy dark:text-gray-100">

// H2 - Section headings
<h2 className="text-2xl font-semibold text-brand-navy dark:text-gray-100">

// H3 - Subsection headings
<h3 className="text-xl font-semibold text-brand-navy dark:text-gray-100">

// Body text
<p className="text-base text-brand-slate dark:text-gray-300">

// Small text / captions
<span className="text-sm text-brand-slate dark:text-gray-400">

// Numeric data
<span className="font-medium tabular-nums text-brand-navy">
```

---

## 🎯 Spacing Quick Reference

```tsx
// Section spacing
<div className="space-y-6">        // 24px between sections
<div className="space-y-4">        // 16px within sections
<div className="space-y-2">        // 8px tight spacing

// Padding
<div className="p-5">              // Card content: 20px
<div className="p-4">              // Compact: 16px
<div className="px-6 py-4">        // Custom: 24px horizontal, 16px vertical
```

---

## 🔲 Border Radius

```tsx
className="rounded-sm"    // 4px - Badges
className="rounded-md"    // 6px - Buttons, Inputs
className="rounded-lg"    // 8px - Cards
className="rounded-full"  // Circle - Avatars
```

---

## ♿ Accessibility Must-Haves

```tsx
// Focus states (always include)
focus-visible:outline-none 
focus-visible:ring-2 
focus-visible:ring-brand-green 
focus-visible:ring-offset-2

// ARIA labels for icons
<Icon aria-label="Description" />

// Keyboard navigation
tabIndex={0}
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    // Handle action
  }
}}
```

---

## 🌓 Dark Mode Pattern

```tsx
// Always pair light/dark colors
className="text-brand-navy dark:text-gray-100"
className="text-brand-slate dark:text-gray-400"
className="border-brand-light-gray dark:border-gray-700"
className="bg-white dark:bg-gray-900"

// Brand green stays the same
className="bg-brand-green"  // No dark: variant needed
```

---

## ❌ Don't Use These

```tsx
// ❌ Avoid arbitrary colors
className="bg-blue-500"
className="text-purple-600"

// ❌ Avoid inline colors
style={{ color: '#FF0000' }}

// ✅ Use brand colors instead
className="bg-brand-green"
className="text-brand-navy"
```

---

## 📦 Complete Component Example

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export function ExampleComponent() {
  return (
    <Card className="border-brand-light-gray">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-brand-navy dark:text-gray-100">
            Employee Details
          </CardTitle>
          <Badge className="bg-brand-green-light text-brand-green">
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-brand-slate dark:text-gray-400" />
          <span className="text-sm text-brand-navy dark:text-gray-300">
            employee@company.com
          </span>
        </div>
        <Button variant="default">
          Send Email
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 🎨 Color Contrast Guide

### ✅ Safe Combinations

| Text | Background | Use Case |
|------|------------|----------|
| White | Brand Green | Buttons, badges |
| Brand Navy | White | Headings on cards |
| Brand Slate | White | Body text |
| Brand Green | Green Light | Success badges |

### ❌ Avoid These

| Text | Background | Issue |
|------|------------|-------|
| Brand Green | White | Low contrast for small text |
| Light Gray | White | Insufficient contrast |
| Slate Gray | Light Gray | Poor readability |

---

**Pro Tip:** When in doubt, use the component defaults. All UI components are pre-configured with brand colors!
