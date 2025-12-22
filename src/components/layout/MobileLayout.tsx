import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, PlusCircle, BarChart3, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/food-checker', icon: Search, label: 'Check' },
  { path: '/log-meal', icon: PlusCircle, label: 'Log' },
  { path: '/tolerance', icon: BarChart3, label: 'Tolerance' },
  { path: '/suggestions', icon: Utensils, label: 'Meals' },
];

export function MobileLayout({ children, showNav = true }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={cn(
        "flex-1 overflow-auto",
        showNav && "pb-20"
      )}>
        {children}
      </main>
      
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated safe-bottom z-50">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mb-1 transition-transform",
                    isActive && "scale-110"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    isActive && "font-semibold"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
