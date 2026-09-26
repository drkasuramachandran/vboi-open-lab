import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Zap, Cpu, Database, FileCheck, Sparkles, ArrowUpRight,
  Microscope as MicroscopeIcon, Layers as LayersIcon, Zap as ZapIcon, Rocket,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MODULES } from '@/lib/moduleConfig';
import { PRESETS } from '@/lib/presets';
import { useInstrument } from '@/context/InstrumentContext';
import { VBOI } from '@/constants/testIds/vboi';
import { toast } from 'sonner';

const PIPELINE = [
  { icon: Zap, label: 'Light Source' },
  { icon: Cpu, label: 'Optics' },
  { icon: Sparkles, label: 'Sample / Tissue' },
  { icon: Database, label: 'Detector' },
  { icon: FileCheck, label: 'Image / Data' },
];

const PRESET_ICONS = { Microscope: MicroscopeIcon, Zap: ZapIcon, Layers: LayersIcon };

const Home = () => {
  const { results, selected, loadPreset } = useInstrument();
  const [pendingPreset, setPendingPreset] = useState(null);

  const requestLoad = (preset) => {
    if (results.length > 0 || selected.length > 0) {
      setPendingPreset(preset);
    } else {
      applyLoad(preset);
    }
  };
  const applyLoad = (preset) => {
    loadPreset(preset);
    setPendingPreset(null);
    toast.success(`${preset.name} preset loaded`, {
      description: `${preset.snapshots.length} snapshots · ${preset.selected.length} modules combined`,
    });
  };

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="vboi-optical-hero relative rounded-2xl text-primary-foreground">
        <div className="vboi-optical-orbit" aria-hidden="true" />
        <div className="vboi-optical-beam" aria-hidden="true" />
        <div className="absolute right-[13%] top-[27%] hidden lg:block" aria-hidden="true">
          <div className="vboi-status-dot" />
        </div>
        <div className="absolute inset-0 vboi-scanline opacity-30" />
        <div className="relative z-10 px-8 sm:px-12 py-12 sm:py-16 lg:py-20 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 mb-6 text-[10px] font-mono uppercase tracking-[0.18em] text-white/75 backdrop-blur-md">
            <span className="vboi-status-dot !w-1.5 !h-1.5 !shadow-none" />
            Biomedical Optics · Virtual Laboratory
          </div>
          <div className="mb-4 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-white/45">
            <span>VBOI / OPEN LAB</span>
            <span className="h-px w-10 bg-white/20" />
            <span>RESEARCH · TEACHING · PROTOTYPING</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.03] tracking-tight max-w-3xl">
            From Theory to <span className="text-accent">Virtual Prototype.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-primary-foreground/75 max-w-2xl leading-relaxed">
            Explore biomedical optical instrumentation through interactive virtual experiments — from
            light–tissue interaction and ray tracing to Raman spectroscopy, OCT, microscopy and image processing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/modules/fundamentals">
              <Button
                data-testid={VBOI.heroCta}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/25"
              >
                Continue Building <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/modules/results-dashboard">
              <Button variant="outline" size="lg" className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white">
                My Instrument · {results.length}
              </Button>
            </Link>
          </div>
          <div className="mt-9 hidden sm:flex items-center gap-6 text-[10px] font-mono uppercase tracking-[0.18em] text-white/45">
            <span>12 interactive modules</span>
            <span className="h-3 w-px bg-white/15" />
            <span>Client-side scientific models</span>
            <span className="h-3 w-px bg-white/15" />
            <span>CSV · JSON · PNG · NPY</span>
          </div>
        </div>
      </section>

      {/* PRESET INSTRUMENTS */}
      <section data-testid={VBOI.presetsSection}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-accent rounded-full" />
            <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Preset instruments
            </h2>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Rocket className="w-3 h-3" /> One-click starter builds
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESETS.map((p) => {
            const Icon = PRESET_ICONS[p.icon] || Cpu;
            const accentColor = p.accent === 'amber' ? 'accent' : 'primary';
            return (
              <Card
                key={p.id}
                data-testid={VBOI.presetCard(p.id)}
                className="vboi-card p-5 flex flex-col hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
                    accentColor === 'accent'
                      ? 'bg-accent/15 border-accent/30'
                      : 'bg-primary/8 border-primary/15'
                  }`}>
                    <Icon className={`w-5 h-5 ${accentColor === 'accent' ? '' : 'text-primary'}`}
                          style={accentColor === 'accent' ? { color: 'hsl(var(--amber))' } : {}} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg font-semibold text-primary leading-tight">{p.name}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                      {p.snapshots.length} snapshots · {p.selected.length} modules
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{p.description}</p>
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-1 mb-3">
                  {p.selected.slice(0, 5).map((id) => {
                    const mod = MODULES.find((m) => m.id === id);
                    return mod ? (
                      <span key={id} className="vboi-chip">{mod.tag}</span>
                    ) : null;
                  })}
                </div>
                <Button
                  data-testid={VBOI.presetLoad(p.id)}
                  onClick={() => requestLoad(p)}
                  className={accentColor === 'accent'
                    ? 'bg-accent hover:bg-accent/90 text-accent-foreground w-full'
                    : 'bg-primary hover:bg-primary/90 w-full'}
                >
                  Load preset <ArrowRight className="w-4 h-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* SYSTEM DIAGRAM */}
      <section data-testid={VBOI.systemDiagram}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-accent rounded-full" />
          <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            System overview
          </h2>
        </div>
        <Card className="vboi-card p-6 sm:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-stretch">
            {PIPELINE.map((step, i) => (
              <div key={step.label} className="relative flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl border border-border bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="mt-3 text-xs font-mono uppercase tracking-wider text-muted-foreground text-center">
                  0{i + 1} · {step.label}
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="hidden sm:block absolute top-8 -right-3 w-6 h-px bg-border">
                    <div className="absolute right-0 -top-1 w-2 h-2 border-t border-r border-border rotate-45" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 pt-5 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <Stat label="Modules" value="12" />
            <Stat label="Saved" value={String(results.length)} accent />
            <Stat label="Formulas" value="JS · client-side" />
            <Stat label="Uploads" value="CSV · JSON · PNG · NPY" />
          </div>
        </Card>
      </section>

      {/* MODULE GRID */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-primary rounded-full" />
            <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              All modules
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Click a card to open the module</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((m) => (
            <Link
              key={m.id}
              to={m.path}
              data-testid={`home-module-card-${m.id}`}
              className="group"
            >
              <Card className="vboi-card vboi-module-glow p-5 h-full transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
                    <m.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-mono tracking-wider text-muted-foreground">{m.tag}</span>
                </div>
                <div className="font-display text-lg font-semibold text-primary group-hover:text-primary transition-colors">
                  {m.name}
                </div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  {m.subtitle}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.blurb}</p>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{m.section}</span>
                  <span className="text-primary group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Open <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Confirmation for preset overwrite */}
      <AlertDialog open={!!pendingPreset} onOpenChange={(o) => !o && setPendingPreset(null)}>
        <AlertDialogContent data-testid={VBOI.presetConfirmDialog}>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace current instrument?</AlertDialogTitle>
            <AlertDialogDescription>
              Loading <strong>{pendingPreset?.name}</strong> will replace your current {results.length} saved snapshot{results.length === 1 ? '' : 's'} and selected modules. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid={VBOI.presetConfirmCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid={VBOI.presetConfirmYes}
              onClick={() => applyLoad(pendingPreset)}
              className="bg-primary hover:bg-primary/90"
            >
              Replace & load
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Stat = ({ label, value, accent }) => (
  <div>
    <div className={`font-display text-2xl font-bold ${accent ? '' : 'text-primary'}`}
         style={accent ? { color: 'hsl(var(--amber))' } : {}}
    >
      {value}
    </div>
    <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mt-1">
      {label}
    </div>
  </div>
);

export default Home;
