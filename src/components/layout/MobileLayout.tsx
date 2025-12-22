import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/food-checker', icon: Search, label: 'Food Check' },
  { path: '/log-meal', icon: PlusCircle, label: 'Log Meal' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function MobileLayout({ children, showNav = true }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className={cn(
        "flex-1 overflow-x-hidden",
        showNav && "pb-20"
      )}>
        {children}
      </main>
      
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated safe-bottom z-50">
          <div className="flex items-center justify-around px-1 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 min-w-[70px]",
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
                    "text-[11px] font-medium leading-tight",
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
