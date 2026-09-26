import React, { useMemo, useState } from 'react';
import ModuleShell from '@/components/ModuleShell';
import ResultChart from '@/components/ResultChart';
import UploadDropzone from '@/components/UploadDropzone';
import ParameterSlider from '@/components/ParameterSlider';
import { MODULE_MAP } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { buildRamanSample } from '@/lib/sampleData';
import { asLsBaseline, fitPseudoVoigt, pseudoVoigt, parseCsvMatrix } from '@/lib/opticsMath';
import { useModulePrefill } from '@/hooks/useModulePrefill';

const parseSpectrumCsv = (text) => {
  const rows = parseCsvMatrix(text);
  if (rows.length === 0) return null;
  const parsed = rows.map((r, i) => {
    if (r.length >= 2) return { shift: r[0], raw: r[1] };
    return { shift: 400 + i * 2, raw: r[0] };
  });
  return parsed;
};

const findPeakCenters = (xs, ys, minProm = 0.15) => {
  const peaks = [];
  for (let i = 3; i < xs.length - 3; i++) {
    const v = ys[i];
    let isPeak = true;
    for (let k = 1; k <= 3; k++) {
      if (v <= ys[i - k] || v <= ys[i + k]) { isPeak = false; break; }
    }
    if (isPeak && v > minProm) peaks.push({ i, x: xs[i], y: v });
  }
  // Deduplicate nearby peaks (keep highest)
  const dedup = [];
  peaks.sort((a, b) => b.y - a.y);
  for (const p of peaks) {
    if (dedup.every((q) => Math.abs(q.x - p.x) > 20)) dedup.push(p);
    if (dedup.length >= 8) break;
  }
  return dedup.sort((a, b) => a.x - b.x);
};

const Raman = () => {
  const module = MODULE_MAP['raman'];
  const prefill = useModulePrefill('raman', { baselineOn: true, logLam: 5, pAsym: 0.01 });
  const [sample] = useState(() => buildRamanSample());
  const [data, setData] = useState(sample.points);       // [{shift, raw}]
  const [filename, setFilename] = useState(null);
  const [baselineOn, setBaselineOn] = useState(prefill.baselineOn);
  const [logLam, setLogLam] = useState(prefill.logLam);
  const [pAsym, setPAsym] = useState(prefill.pAsym);
  const [fitResults, setFitResults] = useState(null);    // array of fit dicts

  // Compute AsLS baseline whenever data or λ/p changes
  const { corrected, baseline } = useMemo(() => {
    const y = data.map((d) => d.raw);
    const bl = asLsBaseline(y, Math.pow(10, logLam), pAsym, 10, 30);
    const corr = y.map((v, i) => v - bl[i]);
    return { corrected: corr, baseline: bl };
  }, [data, logLam, pAsym]);

  const chartData = useMemo(() => data.map((d, i) => ({
    shift: d.shift,
    intensity: baselineOn ? +corrected[i].toFixed(4) : +d.raw.toFixed(4),
    baseline: +baseline[i].toFixed(4),
    fit: fitResults
      ? +fitResults.reduce((acc, r) => acc + r.A * pseudoVoigt(d.shift, r.x0, r.gamma, r.eta), 0).toFixed(4)
      : null,
  })), [data, baseline, corrected, baselineOn, fitResults]);

  const peaks = useMemo(() => {
    const xs = data.map((d) => d.shift);
    const ys = baselineOn ? corrected : data.map((d) => d.raw);
    return findPeakCenters(xs, ys);
  }, [data, corrected, baselineOn]);

  const handleFile = (f) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseSpectrumCsv(String(reader.result || ''));
      if (parsed) {
        setData(parsed);
        setFilename(f.name);
        setFitResults(null);
      }
    };
    reader.readAsText(f);
  };

  const reset = () => {
    setData(sample.points);
    setFilename(null);
    setFitResults(null);
  };

  const runFit = () => {
    const xs = data.map((d) => d.shift);
    const ys = corrected; // fit on baseline-corrected spectrum
    const fits = peaks.map((p) => {
      // window of ±30 cm⁻¹ around the peak
      const idxLo = Math.max(0, xs.findIndex((x) => x >= p.x - 30));
      const idxHi = Math.max(idxLo + 5, xs.findIndex((x) => x >= p.x + 30));
      const wxs = xs.slice(idxLo, idxHi > 0 ? idxHi : xs.length);
      const wys = ys.slice(idxLo, idxHi > 0 ? idxHi : xs.length);
      return fitPseudoVoigt(wxs, wys, p.x, 10);
    });
    setFitResults(fits);
  };

  return (
    <ModuleShell
      module={module}
      explainer="Load a Raman spectrum (CSV: shift, intensity) or use the built-in sample. The baseline is estimated with the Eilers & Boelens asymmetric-least-squares (AsLS) algorithm — tune smoothness λ and asymmetry p. Click Fit peaks to run a pseudo-Voigt fit on every detected band."
      onSave={() => ({
        summary: `${filename || 'sample'} · ${peaks.length} peaks · λ=1e${logLam} p=${pAsym.toFixed(3)}${fitResults ? ` · Voigt-fit` : ''}`,
        params: { source: filename || 'sample', baselineOn, logLam, pAsym, fitted: !!fitResults },
        metrics: {
          peakCount: peaks.length,
          peaks: peaks.map((p) => +p.x.toFixed(1)),
          fwhm: fitResults ? fitResults.map((f) => +f.fwhm.toFixed(1)) : [],
        },
      })}
      controls={
        <>
          <UploadDropzone
            label="Upload spectrum CSV"
            hint="or drop CSV / TXT here"
            accept=".csv,.txt"
            filename={filename}
            onFile={handleFile}
            onClear={reset}
          />
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <Label className="text-sm font-medium">Baseline correction</Label>
              <div className="text-xs text-muted-foreground">Asymmetric least-squares (AsLS)</div>
            </div>
            <Switch
              data-testid={VBOI.ramanBaselineToggle}
              checked={baselineOn}
              onCheckedChange={setBaselineOn}
            />
          </div>

          <ParameterSlider
            label="Smoothness log₁₀ λ" units=""
            min={2} max={8} step={0.1}
            value={logLam} onChange={setLogLam}
            format={(v) => `10^${v.toFixed(1)}`}
            testId={VBOI.ramanLambda}
            hint="rigid → flexible"
          />
          <ParameterSlider
            label="Asymmetry p" units=""
            min={0.001} max={0.1} step={0.001}
            value={pAsym} onChange={setPAsym}
            format={(v) => v.toFixed(3)}
            testId={VBOI.ramanP}
          />

          <Button
            data-testid={VBOI.ramanFitBtn}
            onClick={runFit}
            disabled={peaks.length === 0}
            className="w-full"
            variant="outline"
          >
            <Wand2 className="w-4 h-4" /> Fit peaks (pseudo-Voigt)
          </Button>

          <div className="pt-3 mt-3 border-t border-border">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Detected peaks (cm⁻¹)</div>
            <div className="flex flex-wrap gap-1.5">
              {peaks.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
              {peaks.map((p, i) => (
                <span key={i} className="vboi-chip !bg-accent/10 !border-accent/30 !text-primary">{Math.round(p.x)}</span>
              ))}
            </div>
          </div>
        </>
      }
      output={
        <>
          <ResultChart
            testId={VBOI.ramanChart}
            data={chartData}
            xKey="shift"
            xLabel="Raman shift (cm⁻¹)"
            yLabel="Intensity (a.u.)"
            series={[
              { key: 'intensity', color: 'hsl(var(--primary))', strokeWidth: 1.5, name: baselineOn ? 'Corrected' : 'Raw' },
              ...(baselineOn ? [] : [{ key: 'baseline', color: 'hsl(var(--muted-foreground))', name: 'AsLS baseline' }]),
              ...(fitResults ? [{ key: 'fit', color: 'hsl(var(--amber))', name: 'Voigt fit', strokeWidth: 2 }] : []),
            ]}
            refDots={peaks.map((p) => ({ x: p.x, y: p.y, fill: 'hsl(var(--amber))' }))}
            height={340}
          />

          {fitResults && (
            <div className="mt-4" data-testid={VBOI.ramanFitTable}>
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Pseudo-Voigt fit results</div>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">#</th>
                      <th className="text-right px-3 py-2">Center (cm⁻¹)</th>
                      <th className="text-right px-3 py-2">FWHM</th>
                      <th className="text-right px-3 py-2">Amplitude</th>
                      <th className="text-right px-3 py-2">η (L/G)</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono tabular-nums">
                    {fitResults.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-1.5 text-right text-primary">{r.x0.toFixed(1)}</td>
                        <td className="px-3 py-1.5 text-right">{r.fwhm.toFixed(1)}</td>
                        <td className="px-3 py-1.5 text-right">{r.A.toFixed(3)}</td>
                        <td className="px-3 py-1.5 text-right">{r.eta.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      }
    />
  );
};

export default Raman;
