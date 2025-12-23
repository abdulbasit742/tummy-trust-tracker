import React from 'react';
import { cn } from '@/lib/utils';
import { FoodStatus } from '@/types';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: FoodStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  safe: {
    label: 'Safe',
    icon: CheckCircle,
    className: 'bg-success/12 text-success border-success/20 shadow-[inset_0_1px_0_0_hsl(158_55%_42%/0.1)]',
  },
  caution: {
    label: 'Caution',
    icon: AlertTriangle,
    className: 'bg-caution/12 text-caution border-caution/20 shadow-[inset_0_1px_0_0_hsl(38_92%_50%/0.1)]',
  },
  avoid: {
    label: 'Avoid',
    icon: XCircle,
    className: 'bg-destructive/12 text-destructive border-destructive/20 shadow-[inset_0_1px_0_0_hsl(0_72%_52%/0.1)]',
  },
};

const sizeConfig = {
  sm: 'px-2.5 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
  lg: 'px-4 py-2 text-base gap-2',
};

const iconSizeConfig = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export function StatusBadge({ status, size = 'md', showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-semibold border transition-all duration-200",
      config.className,
      sizeConfig[size],
      className
    )}>
      {showIcon && <Icon className={iconSizeConfig[size]} />}
      {config.label}
    </span>
  );
}
