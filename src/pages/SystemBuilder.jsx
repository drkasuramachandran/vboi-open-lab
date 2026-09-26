import React from 'react';
import ModuleShell from '@/components/ModuleShell';
import { MODULE_MAP, MODULES } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useInstrument } from '@/context/InstrumentContext';
import { Link } from 'react-router-dom';
import { Cpu, ArrowRight } from 'lucide-react';

const SystemBuilder = () => {
  const module = MODULE_MAP['system-builder'];
  const { selected, toggleSelected, projectName, setProjectName, results, saveResult } = useInstrument();

  // Only offer instrument-related modules for combination
  const combinable = MODULES.filter((m) => !['system-builder', 'results-dashboard', 'report'].includes(m.id));

  const savedByModule = React.useMemo(() => {
    const map = {};
    results.forEach((r) => {
      if (!map[r.moduleId]) map[r.moduleId] = r;
    });
    return map;
  }, [results]);

  const compile = () => {
    const chosen = selected
      .map((id) => ({ id, name: MODULE_MAP[id]?.name, latestResult: savedByModule[id]?.payload?.summary }))
      .filter((x) => x.name);
    saveResult('system-builder', 'System Builder', {
      summary: `${projectName} · ${chosen.length} modules combined`,
      params: { projectName, modules: chosen.map((c) => c.id) },
      metrics: { moduleCount: chosen.length },
    });
  };

  return (
    <ModuleShell
      module={module}
      explainer="Assemble your virtual instrument by picking which module outputs to include. Give the instrument a name; the compile action logs a summary entry to your Results Dashboard and the Report Generator."
      onSave={compile}
      saveDisabled={selected.length === 0}
      controls={
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Instrument name</label>
            <Input
              data-testid={VBOI.systemBuilderName}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="font-display"
            />
          </div>
          <div className="pt-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Combined modules</div>
            <div className="text-3xl font-display font-bold text-primary tabular-nums">{selected.length}<span className="text-sm text-muted-foreground font-normal ml-1">/ {combinable.length}</span></div>
          </div>
          <Button
            data-testid={VBOI.systemBuilderCompile}
            className="w-full bg-primary hover:bg-primary/90"
            onClick={compile}
            disabled={selected.length === 0}
          >
            <Cpu className="w-4 h-4" /> Compile & Save Instrument
          </Button>
          <Link to="/modules/report" className="block">
            <Button variant="outline" className="w-full">
              Open Report Generator <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </>
      }
      output={
        <div className="space-y-2.5">
          {combinable.map((m) => {
            const checked = selected.includes(m.id);
            const latest = savedByModule[m.id];
            return (
              <label
                key={m.id}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  checked ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/40'
                }`}
              >
                <Checkbox
                  data-testid={VBOI.systemBuilderCheckbox(m.id)}
                  checked={checked}
                  onCheckedChange={() => toggleSelected(m.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <m.icon className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm text-foreground">{m.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{m.tag}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {latest ? (
                      <span><span className="text-primary font-mono">saved:</span> {latest.payload?.summary}</span>
                    ) : (
                      <span>No result saved yet — visit {m.name} and click <em>Save to My Instrument</em>.</span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      }
    />
  );
};

export default SystemBuilder;
