

# Staggered Entrance Animations + Enhanced Skeleton Shimmer

The next premium upgrade: cards, list items, and sections gracefully animate into view with staggered timing, and skeleton loaders get a polished shimmer effect -- making every screen feel alive from the moment it loads.

## What You'll See

- Dashboard sections (quick actions, meals, water tracker, safe/trigger foods) cascade in one-by-one with smooth fade+slide
- List items within cards stagger individually (e.g., today's meals, food search results)
- Insights tabs content animates in when switching tabs
- Profile sections cascade on load
- Skeleton loaders get a gradient shimmer sweep instead of basic pulse

## Technical Details

### 1. Create `src/components/ui/AnimatedList.tsx`
Reusable framer-motion wrapper components:
- `StaggerContainer` -- parent that orchestrates staggered children timing
- `StaggerItem` -- child wrapper with fade+slide+scale entrance
- `AnimatedCard` -- card-level entrance animation with configurable delay

### 2. Update `src/components/ui/skeletons.tsx`
- Replace `animate-pulse` with a CSS shimmer gradient animation
- Add the shimmer keyframe to tailwind config (a light gradient sweep left-to-right)

### 3. Update `src/pages/Dashboard.tsx`
- Wrap section groups in `StaggerContainer`
- Wrap each section (quick actions, starter foods, today's meals, water tracker, safe foods, trigger foods) in `StaggerItem`
- Wrap individual list items (meal entries, food search results) in nested `StaggerItem`

### 4. Update `src/pages/Insights.tsx`
- Wrap tab content sections in `StaggerContainer`/`StaggerItem`
- Animate metric cards, food lists, and doctor summary sections

### 5. Update `src/pages/Profile.tsx`
- Wrap profile sections (language toggle, profile card, early user status, share, custom tips, meal history) in `StaggerContainer`/`StaggerItem`

### 6. Update `tailwind.config.ts`
- Add `shimmer` keyframe: a gradient that sweeps across skeleton elements
- Add `stagger-fade-in` utility class

