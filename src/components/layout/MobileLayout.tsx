import React, { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, PlusCircle, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NetworkStatus } from '@/components/ui/NetworkStatus';
import { hapticNavigation } from '@/lib/haptics';
import { useLanguage } from '@/contexts/LanguageContext';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export function MobileLayout({ children, showNav = true }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isUrdu } = useLanguage();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: t('nav.home') },
    { path: '/food-checker', icon: Search, label: t('nav.check') },
    { path: '/log-meal', icon: PlusCircle, label: t('nav.log'), isMain: true },
    { path: '/insights', icon: BarChart3, label: t('nav.insights') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const handleNavClick = useCallback((path: string) => {
    hapticNavigation();
    navigate(path);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-[100vw] overflow-x-hidden">
      <NetworkStatus />
      <main className={cn(
        "flex-1 overflow-x-hidden",
        showNav && "pb-32" // Extra padding to prevent content overlap with nav
      )}>
        {children}
      </main>
      
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-bottom z-50 shadow-elevated">
          <div className="flex items-end justify-around px-2 pt-2 pb-1.5 max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              if (item.isMain) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className={cn(
                      "flex flex-col items-center justify-center -mt-6 transition-all duration-200"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200",
                      isActive 
                        ? "gradient-calm shadow-glow scale-105" 
                        : "bg-primary shadow-card hover:shadow-elevated hover:scale-105"
                    )}>
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold mt-1.5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground",
                      isUrdu && "font-medium"
                    )}>
                      {item.label}
                    </span>
                  </button>
                );
              }
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200",
                    "min-w-[64px] min-h-[56px]", // Touch-friendly size
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
                    isActive && "font-semibold",
                    isUrdu && "font-medium"
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
