import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, PlusCircle, BarChart3, User, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/food-checker', icon: Search, label: 'Check' },
  { path: '/log-meal', icon: PlusCircle, label: 'Log' },
  { path: '/insights', icon: BarChart3, label: 'Insights' },
  { path: '/suggestions', icon: Lightbulb, label: 'Tips' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export function MobileLayout({ children, showNav = true }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[100vw] overflow-x-hidden">
      <main className={cn(
        "flex-1 overflow-x-hidden",
        showNav && "pb-20"
      )}>
        {children}
      </main>
      
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elevated safe-bottom z-50">
          <div className="flex items-center justify-around px-1 py-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center px-1.5 py-1.5 rounded-lg transition-all duration-200 min-w-[48px]",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 mb-0.5 transition-transform",
                    isActive && "scale-110"
                  )} />
                  <span className={cn(
                    "text-[9px] font-medium leading-tight",
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
