import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Lock } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { MODULES, SIDEBAR_SECTIONS } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Toaster, toast } from 'sonner';
import { useInstrument } from '@/context/InstrumentContext';

const MobileNav = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="font-display font-bold text-primary">VBOI</div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-3">
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) => cn('block px-3 py-2 rounded-md text-sm mb-4',
              isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground')}
          >
            Overview
          </NavLink>
          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section} className="mb-4">
              <div className="px-3 mb-1 text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground">{section}</div>
              {MODULES.filter((m) => m.section === section).map((m) => (
                <NavLink
                  key={m.id}
                  to={m.path}
                  onClick={onClose}
                  className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
                >
                  <m.icon className="w-4 h-4" />
                  <span className="flex-1">{m.name}</span>
                  <span className="text-[9px] font-mono opacity-60">{m.tag}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Header = ({ onMenu }) => {
  const location = useLocation();
  const current = MODULES.find((m) => m.path === location.pathname);
  return (
    <header
      data-testid={VBOI.header}
      className="sticky top-0 z-20 border-b border-border bg-white/80 backdrop-blur-xl"
    >
      <div className="px-4 lg:px-8 h-14 flex items-center gap-3">
        <button
          onClick={onMenu}
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-muted"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors font-mono uppercase tracking-wider text-[11px]">
            VBOI
          </Link>
          {current && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                {current.section}
              </span>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-medium text-primary">{current.name}</span>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 vboi-chip">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live scaffold</span>
          </div>
          <div className="hidden md:block text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            From Theory to Virtual Prototype
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const { _loadedFromShare, projectName, results, clearShareFlag, locked } = useInstrument();

  // Fire the "shared instrument loaded" toast at the Layout level so it works
  // on every viewport (Sidebar is hidden on mobile).
  React.useEffect(() => {
    if (_loadedFromShare) {
      toast.success('Shared instrument loaded', {
        id: VBOI.shareLoadedToast,
        description: `${projectName} · ${results.length} snapshot${results.length === 1 ? '' : 's'} imported`,
        duration: 5000,
      });
      clearShareFlag();
    }
  }, [_loadedFromShare, projectName, results.length, clearShareFlag]);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <MobileNav open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-72">
        <Header onMenu={() => setOpen(true)} />
        {locked && (
          <div
            data-testid={VBOI.lockBanner}
            className="sticky top-14 z-10 px-4 lg:px-8 py-2 border-b border-accent/40 bg-accent/15 backdrop-blur"
          >
            <div className="max-w-[1400px] mx-auto flex items-center gap-2 text-xs">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono uppercase tracking-wider text-primary">Instructor mode · read-only</span>
              <span className="text-muted-foreground">— sliders, uploads and Save are disabled while locked</span>
            </div>
          </div>
        )}
        <main
          className={cn(
            'px-4 lg:px-8 py-6 lg:py-10 max-w-[1400px] mx-auto',
            locked && 'pointer-events-none select-none opacity-95'
          )}
          aria-disabled={locked || undefined}
        >
          {children}
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
};

export default Layout;
