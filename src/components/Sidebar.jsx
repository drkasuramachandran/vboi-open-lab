import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Atom, Home, Sparkles, Lock, Unlock } from 'lucide-react';
import { MODULES, SIDEBAR_SECTIONS } from '@/lib/moduleConfig';
import { useInstrument } from '@/context/InstrumentContext';
import { VBOI } from '@/constants/testIds/vboi';
import { cn } from '@/lib/utils';
import ShareInstrument from '@/components/ShareInstrument';

const Sidebar = () => {
  const { results, locked, toggleLock } = useInstrument();

  return (
    <aside
      data-testid={VBOI.sidebar}
      className="hidden lg:flex fixed inset-y-0 left-0 w-72 flex-col border-r border-border bg-white/85 backdrop-blur-xl z-30"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Atom className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-accent border-2 border-white" />
          </div>
          <div>
            <div className="font-display text-lg font-bold text-primary leading-tight">VBOI</div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
              Virtual Biomedical Optical Instrument
            </div>
          </div>
        </div>
      </div>

      {/* Home link */}
      <div className="px-3 pt-4">
        <NavLink
          to="/"
          end
          data-testid={VBOI.sidebarLink('home')}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-primary/8 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )
          }
        >
          <Home className="w-4 h-4" />
          <span>Overview</span>
        </NavLink>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section}>
            <div className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              {section}
            </div>
            <ul className="space-y-0.5">
              {MODULES.filter((m) => m.section === section).map((m) => (
                <li key={m.id}>
                  <NavLink
                    to={m.path}
                    data-testid={VBOI.sidebarLink(m.id)}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all relative',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <m.icon className={cn('w-4 h-4 shrink-0', isActive ? '' : 'text-primary/60 group-hover:text-primary')} />
                        <span className="flex-1 truncate">{m.name}</span>
                        <span className={cn(
                          'text-[9px] font-mono tracking-wider tabular-nums',
                          isActive ? 'text-primary-foreground/70' : 'text-muted-foreground/60'
                        )}>
                          {m.tag}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
          </ul>
          </div>
        ))}
      </nav>

      {/* Footer: saved count + share */}
      <div className="border-t border-border p-4 space-y-2">
        <div className="flex items-center gap-3 rounded-lg bg-amber/10 border border-accent/30 px-3 py-2.5"
             style={{ background: 'hsl(var(--amber) / 0.08)' }}>
          <Sparkles className="w-4 h-4 text-accent-foreground" />
          <div className="flex-1">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Saved to instrument</div>
            <div className="text-sm font-display font-semibold text-primary" data-testid={VBOI.savedCount}>
              {results.length} result{results.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <ShareInstrument />
        <button
          data-testid={VBOI.lockToggle}
          onClick={toggleLock}
          className={cn(
            'w-full flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors',
            locked
              ? 'border-accent bg-accent/15 text-primary hover:bg-accent/25'
              : 'border-border bg-white text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          aria-pressed={locked}
        >
          {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          <span className="flex-1 text-left">Instructor mode</span>
          <span className={cn(
            'text-[9px] font-mono uppercase tracking-wider',
            locked ? 'text-accent-foreground' : 'text-muted-foreground/60'
          )}>
            {locked ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
