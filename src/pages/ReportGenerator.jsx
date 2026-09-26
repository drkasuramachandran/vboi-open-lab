import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Printer, Download, Atom } from 'lucide-react';
import { useInstrument } from '@/context/InstrumentContext';
import { MODULE_MAP, MODULES } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { toast } from 'sonner';

const ReportGenerator = () => {
  const { results, projectName, selected } = useInstrument();

  const grouped = React.useMemo(() => {
    const g = {};
    results.forEach((r) => {
      if (!g[r.moduleId]) g[r.moduleId] = [];
      g[r.moduleId].push(r);
    });
    return g;
  }, [results]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const payload = {
      instrument: projectName,
      generatedAt: new Date().toISOString(),
      selected,
      results,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_').toLowerCase()}_vboi_report.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported as JSON');
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-start justify-between gap-4 flex-wrap no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="vboi-chip">M12</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Portfolio</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary leading-tight">
            Report Generator
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            A clean, printable summary of your virtual instrument. Use your browser&apos;s <em>Print → Save as PDF</em>
            option to export a portfolio-ready document.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button data-testid={VBOI.reportExport} variant="outline" onClick={handleExportJson}>
            <Download className="w-4 h-4" /> Export JSON
          </Button>
          <Button data-testid={VBOI.reportPrint} className="bg-primary" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* Printable area */}
      <div id="printable-report" className="space-y-6">
        {/* Report header (printable) */}
        <Card className="vboi-card p-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center">
              <Atom className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
                VBOI Instrument Report
              </div>
              <h2 className="font-display text-3xl font-bold text-primary mt-1">{projectName}</h2>
              <div className="text-sm text-muted-foreground mt-1">
                Generated {new Date().toLocaleString()} · {results.length} snapshot{results.length === 1 ? '' : 's'} across {Object.keys(grouped).length} modules
              </div>
            </div>
          </div>
          {selected.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Selected modules</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.map((id) => (
                  <span key={id} className="vboi-chip">{MODULE_MAP[id]?.name || id}</span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Empty state */}
        {results.length === 0 && (
          <Card className="vboi-card p-8 text-center text-muted-foreground">
            No results saved yet. Save a snapshot from any module to populate this report.
          </Card>
        )}

        {/* Per-module sections */}
        {MODULES.filter((m) => grouped[m.id]).map((m, idx) => (
          <Card key={m.id} className="vboi-card p-6 sm:p-8 break-inside-avoid">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
                <m.icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  Section {String(idx + 1).padStart(2, '0')} · {m.section}
                </div>
                <div className="font-display text-xl font-semibold text-primary">{m.name}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{m.blurb}</p>
            <div className="space-y-3">
              {grouped[m.id].map((r) => (
                <div key={r.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="text-sm text-foreground flex-1 min-w-0">{r.payload?.summary}</div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
                      {new Date(r.savedAt).toLocaleString()}
                    </div>
                  </div>
                  {r.payload?.metrics && (
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(r.payload.metrics).map(([k, v]) => (
                        <div key={k} className="rounded bg-white border border-border px-2 py-1.5">
                          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{k}</div>
                          <div className="text-xs font-mono text-primary truncate" title={String(v)}>
                            {Array.isArray(v) ? v.join(', ') : String(v)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.payload?.params && (
                    <div className="mt-2 text-[11px] font-mono text-muted-foreground line-clamp-2">
                      params: {JSON.stringify(r.payload.params)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}

        {/* Footer */}
        <div className="text-center text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground py-6">
          VBOI · Virtual Biomedical Optical Instrument · From Theory to Virtual Prototype
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
