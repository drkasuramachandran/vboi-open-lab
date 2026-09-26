import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, FileText, Plus, Download } from 'lucide-react';
import { useInstrument } from '@/context/InstrumentContext';
import { MODULE_MAP, MODULES } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { toast } from 'sonner';
import { downloadSnapshotCsv } from '@/lib/csvExport';

const ResultsDashboard = () => {
  const { results, deleteResult, clearResults, projectName } = useInstrument();
  const grouped = React.useMemo(() => {
    const g = {};
    results.forEach((r) => {
      if (!g[r.moduleId]) g[r.moduleId] = [];
      g[r.moduleId].push(r);
    });
    return g;
  }, [results]);

  const moduleIdsWithResults = Object.keys(grouped);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="vboi-chip">M11</span>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Portfolio</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary leading-tight">
            Results Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Every result you saved from any module lives here. This is your running capstone project — the
            snapshots feed straight into the report generator.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/modules/report">
            <Button variant="default" className="bg-primary">
              <FileText className="w-4 h-4" /> Generate Report
            </Button>
          </Link>
          <Button
            data-testid={VBOI.resultsClear}
            variant="outline"
            onClick={() => {
              if (results.length === 0) return;
              clearResults();
              toast.success('Cleared all saved results');
            }}
            disabled={results.length === 0}
          >
            <Trash2 className="w-4 h-4" /> Clear all
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Instrument" value={projectName} />
        <SummaryCard label="Saved results" value={String(results.length)} accent />
        <SummaryCard label="Distinct modules" value={String(moduleIdsWithResults.length)} />
        <SummaryCard label="Last update" value={results[0] ? new Date(results[0].savedAt).toLocaleString() : '—'} />
      </div>

      {/* Empty state */}
      {results.length === 0 && (
        <Card className="vboi-card p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="font-display text-lg font-semibold text-primary">No results yet</div>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Open any module, tweak the parameters, and hit <em>Save to My Instrument</em>. Your saved snapshots will appear here.
          </p>
          <Link to="/modules/fundamentals">
            <Button className="mt-5 bg-primary">Start with Fundamentals</Button>
          </Link>
        </Card>
      )}

      {/* Grouped list */}
      {results.length > 0 && (
        <div data-testid={VBOI.resultsList} className="space-y-8">
          {MODULES.filter((m) => grouped[m.id]).map((m) => (
            <section key={m.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/15 flex items-center justify-center">
                  <m.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="font-display font-semibold text-primary">{m.name}</div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {grouped[m.id].length} snapshot{grouped[m.id].length === 1 ? '' : 's'}
                </span>
                <Link to={m.path} className="ml-auto text-xs text-primary hover:underline">
                  Return to module →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {grouped[m.id].map((r) => (
                  <ResultCard
                    key={r.id}
                    r={r}
                    projectName={projectName}
                    onDelete={() => { deleteResult(r.id); toast('Snapshot removed'); }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

const ResultCard = ({ r, onDelete, projectName }) => {
  const m = MODULE_MAP[r.moduleId];
  return (
    <Card data-testid={VBOI.resultCard(r.id)} className="vboi-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {new Date(r.savedAt).toLocaleString()}
          </div>
          <div className="mt-1 text-sm text-foreground line-clamp-2">
            {r.payload?.summary || `${m?.name || r.moduleName} snapshot`}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            data-testid={VBOI.resultDownload(r.id)}
            onClick={() => {
              downloadSnapshotCsv(r, projectName);
              toast.success('CSV downloaded');
            }}
            className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary"
            aria-label="Download snapshot as CSV"
            title="Download as CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            data-testid={VBOI.resultDelete(r.id)}
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {r.payload?.metrics && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(r.payload.metrics).map(([k, v]) => (
            <span key={k} className="vboi-chip">
              <span className="text-muted-foreground/80">{k}</span>
              <span className="text-primary font-semibold">{Array.isArray(v) ? v.length : String(v)}</span>
            </span>
          ))}
        </div>
      )}
    </Card>
  );
};

const SummaryCard = ({ label, value, accent }) => (
  <Card className={`vboi-card p-4 ${accent ? '!border-accent/40' : ''}`}>
    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    <div
      className="font-display text-lg font-semibold text-primary mt-1 truncate"
      style={accent ? { color: 'hsl(var(--amber))' } : {}}
      title={value}
    >
      {value}
    </div>
  </Card>
);

export default ResultsDashboard;
