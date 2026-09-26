import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useInstrument } from '@/context/InstrumentContext';
import { VBOI } from '@/constants/testIds/vboi';

/**
 * ModuleShell - shared page template for every VBOI module.
 * Header (title + short blurb + save action) + a 2-column body (controls | output)
 * Children can be a single ReactNode or { controls, output, extra }.
 */
const ModuleShell = ({
  module,        // module config obj
  explainer,     // string / node - short concept explainer
  controls,      // ReactNode
  output,        // ReactNode
  extra,         // optional ReactNode below the grid
  onSave,        // () => payload object to store
  saveDisabled,
}) => {
  const { saveResult } = useInstrument();

  const handleSave = () => {
    if (!onSave) return;
    const payload = onSave();
    if (!payload) return;
    saveResult(module.id, module.name, payload);
    toast.success(`${module.name} saved to My Instrument`, {
      description: 'Open Results Dashboard to review.',
    });
  };

  const Icon = module.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="mt-1 w-12 h-12 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="vboi-chip">{module.tag}</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{module.section}</span>
            </div>
            <h1 data-testid={VBOI.moduleTitle} className="font-display text-3xl sm:text-4xl font-bold text-primary leading-tight">
              {module.name}
              <span className="ml-2 text-muted-foreground font-medium">— {module.subtitle}</span>
            </h1>
            <p data-testid={VBOI.moduleExplainer} className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {explainer}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            data-testid={VBOI.saveBtn}
            onClick={handleSave}
            disabled={saveDisabled}
            className="border-primary/30 text-primary hover:bg-primary/5"
          >
            <Bookmark className="w-4 h-4" />
            Save to My Instrument
          </Button>
        </div>
      </div>

      {/* Grid: controls (1) + output (2) */}
      {(controls || output) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {controls && (
            <Card className="vboi-card lg:col-span-1 p-5 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <div className="w-1 h-4 bg-accent rounded-full" />
                <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Parameters</h2>
              </div>
              {controls}
            </Card>
          )}
          {output && (
            <Card className="vboi-card lg:col-span-2 p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <div className="w-1 h-4 bg-primary rounded-full" />
                <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Output</h2>
              </div>
              {output}
            </Card>
          )}
        </div>
      )}

      {extra}

      {/* Footer nav hint */}
      <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          <span>Client-side approximation for teaching — real physics data can be uploaded per module.</span>
        </div>
        <Link
          to="/modules/results-dashboard"
          className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-mono uppercase tracking-wider"
        >
          Results Dashboard <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

export default ModuleShell;
