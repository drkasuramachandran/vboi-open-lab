import React, { useMemo, useState } from 'react';
import ModuleShell from '@/components/ModuleShell';
import ResultChart from '@/components/ResultChart';
import ParameterSlider from '@/components/ParameterSlider';
import { MODULE_MAP } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useModulePrefill } from '@/hooks/useModulePrefill';

/**
 * Widefield vs Confocal PSF comparison:
 * confocal PSF ≈ widefield PSF^2 (schematic — narrower & lower background).
 */
const Microscope = () => {
  const module = MODULE_MAP['microscope'];
  const prefill = useModulePrefill('microscope', { mode: 'confocal', na: 1.2, pinhole: 1.0 });
  const [confocal, setConfocal] = useState(prefill.mode === 'confocal');
  const [na, setNa] = useState(prefill.na);
  const [pinhole, setPinhole] = useState(prefill.pinhole);

  const data = useMemo(() => {
    const pts = [];
    const sigma = 0.5 / na; // schematic
    for (let x = -3; x <= 3; x += 0.05) {
      const wf = Math.exp(-(x * x) / (2 * sigma * sigma));
      const conf = Math.pow(wf, 2) * (1 + 0.3 * (pinhole - 1));
      pts.push({ x: +x.toFixed(2), widefield: +wf.toFixed(4), confocal: +Math.max(0, Math.min(1, conf)).toFixed(4) });
    }
    return pts;
  }, [na, pinhole]);

  return (
    <ModuleShell
      module={module}
      explainer="Compare a widefield PSF against a confocal PSF (schematically the widefield PSF squared). The pinhole size trades signal for out-of-focus rejection: small pinhole → sharper section but dimmer image."
      onSave={() => ({
        summary: `${confocal ? 'Confocal' : 'Widefield'} · NA=${na.toFixed(2)} · pinhole=${pinhole.toFixed(1)} AU`,
        params: { mode: confocal ? 'confocal' : 'widefield', na, pinhole },
      })}
      controls={
        <>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <Label className="text-sm font-medium">Mode</Label>
              <div className="text-xs text-muted-foreground">
                {confocal ? 'Confocal — optically sectioned' : 'Widefield — full illumination'}
              </div>
            </div>
            <Switch
              data-testid={VBOI.microscopeMode}
              checked={confocal}
              onCheckedChange={setConfocal}
            />
          </div>
          <ParameterSlider
            label="Objective NA" units=""
            min={0.3} max={1.45} step={0.01}
            value={na} onChange={setNa}
            format={(v) => v.toFixed(2)}
          />
          <ParameterSlider
            label="Pinhole" units="AU"
            min={0.2} max={4} step={0.1}
            value={pinhole} onChange={setPinhole}
            format={(v) => `${v.toFixed(1)} AU`}
            hint="1 AU ≈ optimal"
          />
        </>
      }
      output={
        <>
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Point spread function · lateral
          </div>
          <ResultChart
            testId={VBOI.microscopePSFChart}
            data={data}
            xKey="x"
            xLabel="x / λ (schematic)"
            yLabel="Intensity"
            series={[
              { key: 'widefield', color: 'hsl(200, 15%, 55%)', name: 'Widefield' },
              ...(confocal ? [{ key: 'confocal', color: 'hsl(var(--primary))', strokeWidth: 2.5, name: 'Confocal' }] : []),
            ]}
          />
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider">Signal</div>
              <div className="text-primary font-mono">{confocal ? `${(pinhole * 25).toFixed(0)}%` : '100%'}</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider">Sectioning</div>
              <div className="text-primary font-mono">{confocal ? 'Yes' : 'No'}</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="font-mono text-[10px] uppercase tracking-wider">Background</div>
              <div className="text-primary font-mono">{confocal ? 'Rejected' : 'Full'}</div>
            </div>
          </div>
        </>
      }
      extra={
        <div className="vboi-card p-5 text-sm text-muted-foreground leading-relaxed">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mb-2">Pinhole trade-off</div>
          A smaller pinhole (&lt;1 AU) narrows the PSF and rejects more out-of-focus light,
          giving thinner optical sections at the cost of signal. Larger pinholes (&gt;1 AU) collect
          more photons but blur the axial sectioning — approaching a widefield response as it opens.
        </div>
      }
    />
  );
};

export default Microscope;
