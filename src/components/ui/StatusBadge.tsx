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
  recommended: {
    label: 'Recommended',
    icon: CheckCircle,
    className: 'status-recommended',
  },
  caution: {
    label: 'Caution',
    icon: AlertTriangle,
    className: 'status-caution',
  },
  avoid: {
    label: 'Avoid',
    icon: XCircle,
    className: 'status-avoid',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function StatusBadge({ status, size = 'md', showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-semibold border",
      config.className,
      sizeConfig[size],
      className
    )}>
      {showIcon && <Icon className={cn(
        size === 'sm' && 'w-3 h-3',
        size === 'md' && 'w-4 h-4',
        size === 'lg' && 'w-5 h-5',
      )} />}
      {config.label}
    </span>
  );
}
