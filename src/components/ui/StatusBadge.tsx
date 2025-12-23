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
    className: 'bg-success/12 text-success border-success/25',
  },
  caution: {
    label: 'Caution',
    icon: AlertTriangle,
    className: 'bg-caution/12 text-caution border-caution/25',
  },
  avoid: {
    label: 'Avoid',
    icon: XCircle,
    className: 'bg-destructive/12 text-destructive border-destructive/25',
  },
};

const sizeConfig = {
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3.5 py-1.5 text-sm gap-2',
  lg: 'px-4 py-2 text-base gap-2',
};

const iconSizeConfig = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-4.5 h-4.5',
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
