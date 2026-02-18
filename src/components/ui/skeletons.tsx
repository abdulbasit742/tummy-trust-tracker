import { cn } from "@/lib/utils";

// Base skeleton with gradient shimmer animation
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-muted/60",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-background/60 to-transparent" />
    </div>
  );
}

// Card skeleton for dashboard sections
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card rounded-2xl p-5 border border-border shadow-soft", className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

// List item skeleton
function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between p-4", className)}>
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// Food list skeleton with card wrapper
function FoodListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden shadow-soft">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

// Metric card skeleton
function MetricSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card rounded-2xl p-5 border border-border shadow-soft", className)}>
      <Skeleton className="h-3 w-1/2 mb-3" />
      <Skeleton className="h-8 w-1/3 mb-2" />
      <Skeleton className="h-2 w-1/4" />
    </div>
  );
}

// Dashboard skeleton
function DashboardSkeleton() {
  return (
    <div className="px-5 py-6 space-y-5 animate-fade-in">
      {/* Welcome card skeleton */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-5 border border-border/50">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>

      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>

      {/* Section with list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <FoodListSkeleton count={3} />
      </div>

      {/* Another section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <CardSkeleton />
      </div>
    </div>
  );
}

// Insights skeleton - for inline use within the Insights page
function InsightsSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Progress-like card */}
      <CardSkeleton />
      
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
      
      {/* Another card */}
      <CardSkeleton />
    </div>
  );
}

// Profile skeleton
function ProfileSkeleton() {
  return (
    <div className="px-5 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Profile card */}
      <div className="bg-card rounded-2xl p-5 border border-border shadow-soft">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Status card */}
      <CardSkeleton />

      {/* Section */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-36" />
        <FoodListSkeleton count={4} />
      </div>
    </div>
  );
}

// Food checker skeleton
function FoodCheckerSkeleton() {
  return (
    <div className="px-5 py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Search input */}
      <Skeleton className="h-14 w-full rounded-xl" />

      {/* Browse section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <FoodListSkeleton count={5} />
      </div>
    </div>
  );
}

// Meal log item skeleton
function MealLogSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl p-4 border border-border shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Inline loading spinner
function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    default: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
  };
  
  return (
    <div
      className={cn(
        "animate-spin-slow rounded-full border-primary/30 border-t-primary",
        sizeClasses[size]
      )}
    />
  );
}

// Full page loading state
function PageLoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 animate-pulse" />
        <LoadingSpinner size="lg" />
      </div>
      <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
    </div>
  );
}

export {
  Skeleton,
  CardSkeleton,
  ListItemSkeleton,
  FoodListSkeleton,
  MetricSkeleton,
  DashboardSkeleton,
  InsightsSkeleton,
  ProfileSkeleton,
  FoodCheckerSkeleton,
  MealLogSkeleton,
  LoadingSpinner,
  PageLoadingState,
};
