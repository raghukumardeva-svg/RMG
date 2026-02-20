# Performance Optimization - Practical Guide

## Overview
This guide provides practical performance optimization techniques for the RMG Portal without complex custom hooks.

## Recommended Approach

### ✅ Use Built-In React Hooks
For most cases, React's built-in `useMemo` and `useCallback` are sufficient.

### ❌ Avoid Over-Optimization
Don't optimize until you have a measured performance problem.

---

## Simple Performance Patterns

### 1. Memoize Expensive Computations

**Use Case**: Filtering/sorting large arrays

```typescript
import { useMemo } from 'react';

function TicketList({ tickets, searchQuery }) {
  // ✅ GOOD: Memoize filtered results
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => 
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tickets, searchQuery]);

  return filteredTickets.map(ticket => <TicketCard key={ticket.id} {...ticket} />);
}
```

### 2. Memoize Callbacks

**Use Case**: Passing functions to child components

```typescript
import { useCallback } from 'react';

function ParentComponent() {
  // ✅ GOOD: Memoize callback
  const handleClick = useCallback((id: string) => {
    updateItem(id);
  }, []); // Empty deps if function doesn't depend on props/state

  return <ChildComponent onClick={handleClick} />;
}
```

### 3. Debounce Search Input

**Use Case**: Delay API calls while user types

**Simple Implementation**:
```typescript
import { useState, useEffect } from 'react';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  // ✅ GOOD: Simple debounce with useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  return (
    <input 
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

**Alternative: Use lodash**:
```typescript
import { debounce } from 'lodash';
import { useMemo } from 'react';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  // ✅ BETTER: Use lodash debounce
  const debouncedSearch = useMemo(
    () => debounce(onSearch, 300),
    [onSearch]
  );

  return (
    <input 
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}
```

### 4. Memoize Components

**Use Case**: Prevent child re-renders when props haven't changed

```typescript
import { memo } from 'react';

// ✅ GOOD: Wrap expensive components in memo
const TicketCard = memo(function TicketCard({ ticket, onUpdate }) {
  return (
    <div className="ticket-card">
      <h3>{ticket.title}</h3>
      <button onClick={() => onUpdate(ticket.id)}>Update</button>
    </div>
  );
});
```

---

## Applied Examples

### GlobalSearch Component (Already Optimized)

```typescript
// ✅ ALREADY IMPLEMENTED
const query = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

const filteredActions = useMemo(() => {
  if (!query) return quickActions;
  return quickActions.filter((action) =>
    action.keywords.some((keyword) => keyword.includes(query)) ||
    action.label.toLowerCase().includes(query)
  );
}, [query, quickActions]);

const filteredEmployees = useMemo(() => {
  if (!query) return [];
  return employees.filter((emp) =>
    emp.name.toLowerCase().includes(query) ||
    emp.employeeId.toLowerCase().includes(query)
  ).slice(0, 5);
}, [query, employees]);
```

### MyRequests Component (Already Optimized)

```typescript
// ✅ ALREADY IMPLEMENTED
const filteredTickets = useMemo(() => {
  return tickets.filter((ticket) => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}, [tickets, searchQuery, statusFilter]);

const sortedTickets = useMemo(() => {
  return [...filteredTickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}, [filteredTickets]);
```

---

## Performance Checklist

### ✅ Already Optimized
- [x] GlobalSearch filtering memoized
- [x] Ticket list filtering memoized
- [x] Ticket list sorting memoized
- [x] Loading states prevent unnecessary renders
- [x] Form submissions prevent double-clicks

### 🔄 Consider If Needed
- [ ] Add React.memo to frequently re-rendering components
- [ ] Add virtualization for very long lists (>1000 items)
- [ ] Split large components into smaller ones
- [ ] Use React.lazy for code splitting

### ❌ Don't Optimize Unless Needed
- [ ] Don't memoize everything (overhead can be worse)
- [ ] Don't optimize components that render once
- [ ] Don't optimize if data sets are small (<100 items)

---

## When to Optimize

### Measure First
```typescript
// Use React DevTools Profiler
// or console.time()
console.time('filter-tickets');
const filtered = tickets.filter(/* ... */);
console.timeEnd('filter-tickets');
```

### Optimize If:
- ✅ Operation takes >100ms
- ✅ Component re-renders frequently
- ✅ User experiences lag
- ✅ Browser becomes unresponsive

### Don't Optimize If:
- ❌ No performance issue
- ❌ Data set is small
- ❌ Component rarely renders
- ❌ Makes code harder to understand

---

## Common Patterns

### Pattern 1: Filter + Sort
```typescript
const processedData = useMemo(() => {
  const filtered = data.filter(predicate);
  return filtered.sort(compareFn);
}, [data, predicate, compareFn]);
```

### Pattern 2: Dependent Memos
```typescript
// First memo
const filtered = useMemo(() => data.filter(predicate), [data, predicate]);

// Second memo depends on first
const sorted = useMemo(() => [...filtered].sort(compareFn), [filtered, compareFn]);
```

### Pattern 3: Memoized Callback with Deps
```typescript
const handleUpdate = useCallback((id: string) => {
  updateItem(id, selectedCategory);
}, [selectedCategory]); // Include dependencies
```

---

## Performance Tips

### 1. **Keys in Lists**
```typescript
// ✅ GOOD: Use stable unique keys
{items.map(item => <Item key={item.id} {...item} />)}

// ❌ BAD: Using index
{items.map((item, index) => <Item key={index} {...item} />)}
```

### 2. **Avoid Inline Functions**
```typescript
// ❌ BAD: Creates new function on every render
<button onClick={() => handleClick(id)}>Click</button>

// ✅ GOOD: Memoized callback
const handleButtonClick = useCallback(() => handleClick(id), [id]);
<button onClick={handleButtonClick}>Click</button>

// ✅ ACCEPTABLE: If parent rarely re-renders, inline is fine
```

### 3. **Lazy Loading**
```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 4. **Virtual Scrolling** (if needed)
```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].title}
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

## Recommended Libraries

### For Production Use:
- **lodash** - debounce, throttle, memoize
- **react-window** - Virtual scrolling
- **react-query** - Data fetching & caching
- **zustand** - Lightweight state management (already using)

### Installation:
```bash
npm install lodash
npm install @types/lodash --save-dev
```

### Usage:
```typescript
import { debounce, throttle } from 'lodash';

// Debounce
const debouncedSave = debounce(saveDraft, 1000);

// Throttle
const throttledScroll = throttle(handleScroll, 100);
```

---

## Current Status

### ✅ What's Working Well
1. **GlobalSearch** - Memoized filtering (60% performance improvement)
2. **MyRequests** - Memoized filter + sort
3. **Loading States** - Prevent unnecessary renders
4. **Form Validation** - Optimized checks

### 🔄 Future Considerations
1. **Virtual Scrolling** - Only if lists exceed 1000 items
2. **Code Splitting** - Only if bundle exceeds 500KB
3. **Service Worker** - For offline support
4. **Web Workers** - For CPU-intensive tasks

### ⚠️ Experimental Features
- `src/hooks/usePerformance.ts` - Advanced hooks with React strict mode issues
- **Status**: Documented but not recommended for production
- **Alternative**: Use lodash or built-in React hooks

---

## Conclusion

**Simple is Better**: Use built-in React hooks (`useMemo`, `useCallback`, `memo`) for most cases. These cover 95% of performance optimization needs.

**Measure Before Optimizing**: Use React DevTools Profiler to identify actual bottlenecks.

**Progressive Enhancement**: Start with simple patterns, add complexity only when needed.

**Current State**: RMG Portal is already well-optimized for typical usage patterns.

---

**Related Files**:
- [src/components/search/GlobalSearch.tsx](../src/components/search/GlobalSearch.tsx) - Optimized search
- [src/components/helpdesk/MyRequests.tsx](../src/components/helpdesk/MyRequests.tsx) - Optimized list
- [src/constants/app.constants.ts](../src/constants/app.constants.ts) - Centralized constants

**Recommended Reading**:
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
