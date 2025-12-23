import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, PlusCircle, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/food-checker', icon: Search, label: 'Check' },
  { path: '/log-meal', icon: PlusCircle, label: 'Log', isMain: true },
  { path: '/insights', icon: BarChart3, label: 'Insights' },
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
        showNav && "pb-28" // Extra padding to prevent content overlap with nav
      )}>
        {children}
      </main>
      
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/40 safe-bottom z-50">
          <div className="flex items-end justify-around px-3 pt-2.5 pb-2 max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              if (item.isMain) {
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "flex flex-col items-center justify-center -mt-5 transition-all duration-200"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-elevated transition-all duration-200",
                      isActive 
                        ? "gradient-calm shadow-glow" 
                        : "bg-primary hover:shadow-glow"
                    )}>
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold mt-1.5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                  </button>
                );
              }
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-200",
                    "min-w-[60px] min-h-[52px]", // Touch-friendly size
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground active:text-primary"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-xl transition-all duration-200",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      isActive && "scale-110"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium mt-0.5 transition-all",
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
