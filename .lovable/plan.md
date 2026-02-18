

# Staggered Animations for FoodChecker + LogMeal Pages

Extend the staggered entrance animations to the two remaining pages that still use basic `animate-fade-in` / `animate-slide-up`, bringing them in line with the premium feel of Dashboard, Insights, and Profile.

## What You'll See

- FoodChecker: header, search bar, food list, and detail cards cascade in with staggered timing instead of all appearing at once
- LogMeal: form sections (food input, portion picker, notes, submit button) stagger in sequentially; symptom step cards also cascade
- Food search results animate in individually as a staggered list
- Consistent animation language across every page in the app

## Technical Details

### 1. Update `src/pages/FoodChecker.tsx`
- Import `StaggerContainer` and `StaggerItem` from `AnimatedList`
- Wrap the main content `div` in `StaggerContainer`
- Wrap header, search input, custom food warning, selected food detail, food list section, and disclaimer each in `StaggerItem`
- Wrap individual food list items (browse + search results) in a nested `StaggerContainer`/`StaggerItem` for per-item stagger

### 2. Update `src/pages/LogMeal.tsx`
- Import `StaggerContainer` and `StaggerItem` from `AnimatedList`
- Wrap the meal step form sections (food name input, portion size, notes, submit button) in `StaggerContainer`/`StaggerItem`
- Wrap the symptom step sections (bloating slider, pain slider, stool toggle, buttons) in a separate `StaggerContainer`/`StaggerItem`
- Replace existing `animate-slide-up` with `StaggerItem` wrappers for consistent timing
- Remove manual `animationDelay` style props (the stagger container handles timing automatically)
