import React from 'react';
import { cn } from '@/lib/utils';
import { FoodStatus } from '@/types';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: FoodStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  safe: {
    label: 'Safe',
    icon: CheckCircle,
    className: 'bg-success/15 text-success border-success/30',
  },
  caution: {
    label: 'Caution',
    icon: AlertTriangle,
    className: 'bg-caution/15 text-caution border-caution/30',
  },
  avoid: {
    label: 'Avoid',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold border",
      config.className,
      sizeConfig[size],
      className
    )}>
      <Icon className={cn(
        size === 'sm' && 'w-3 h-3',
        size === 'md' && 'w-4 h-4',
        size === 'lg' && 'w-5 h-5',
      )} />
      {config.label}
    </span>
  );
}
