import React, { useMemo, useState } from 'react';
import ModuleShell from '@/components/ModuleShell';
import ParameterSlider from '@/components/ParameterSlider';
import { MODULE_MAP } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { useModulePrefill } from '@/hooks/useModulePrefill';

/**
 * Simple fiber probe design:
 *   Acceptance angle theta_a = arcsin(NA)
 *   Spot size at working distance d: 2 * (core/2 + d * tan(theta_a))
 */
const FiberOptic = () => {
  const module = MODULE_MAP['fiber-optic'];
  const prefill = useModulePrefill('fiber-optic', { na: 0.22, core: 200, wd: 2 });
  const [na, setNa] = useState(prefill.na);
  const [core, setCore] = useState(prefill.core);
  const [wd, setWd] = useState(prefill.wd);

  const { thetaDeg, spotUm } = useMemo(() => {
    const theta = Math.asin(Math.min(0.999, na));
    const wd_um = wd * 1000;
    const spot = core + 2 * wd_um * Math.tan(theta);
    return { thetaDeg: +(theta * 180 / Math.PI).toFixed(2), spotUm: spot };
  }, [na, core, wd]);

  return (
    <ModuleShell
      module={module}
      explainer="A step-index multimode fiber probe: numerical aperture defines the acceptance cone, and combined with the working distance and core diameter gives the illuminated spot size on the sample."
      onSave={() => ({
        summary: `NA=${na.toFixed(2)} · core=${core} µm · spot=${(spotUm/1000).toFixed(2)} mm`,
        params: { na, core, wd },
        metrics: { acceptanceDeg: thetaDeg, spot_um: +spotUm.toFixed(1) },
      })}
      controls={
        <>
          <ParameterSlider
            label="Numerical Aperture (NA)" units=""
            min={0.05} max={0.6} step={0.01}
            value={na} onChange={setNa}
            format={(v) => v.toFixed(2)}
            testId={VBOI.fiberNA}
          />
          <ParameterSlider
            label="Core diameter" units="µm"
            min={50} max={1000} step={10}
            value={core} onChange={setCore}
            testId={VBOI.fiberCore}
          />
          <ParameterSlider
            label="Working distance" units="mm"
            min={0.1} max={20} step={0.1}
            value={wd} onChange={setWd}
            format={(v) => `${v.toFixed(1)} mm`}
          />
          <div className="pt-3 mt-3 border-t border-border grid grid-cols-2 gap-3">
            <Metric label="Acceptance θ" value={`${thetaDeg}°`} />
            <Metric label="Spot Ø" value={`${(spotUm / 1000).toFixed(2)} mm`} accent />
          </div>
        </>
      }
      output={
        <div data-testid={VBOI.fiberSchematic} className="bg-white rounded-lg border border-border p-4">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Probe schematic</div>
          <FiberSchematic na={na} core={core} wd={wd} spotUm={spotUm} thetaDeg={thetaDeg} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="NA" v={na.toFixed(2)} />
            <MiniStat label="Core" v={`${core} µm`} />
            <MiniStat label="WD" v={`${wd} mm`} />
          </div>
        </div>
      }
    />
  );
};

const FiberSchematic = ({ na, core, wd, spotUm, thetaDeg }) => {
  const W = 600, H = 200;
  const fiberEndX = 90;
  const sampleX = fiberEndX + 380;
  const cy = H / 2;
  const coreHalf = Math.min(28, Math.max(6, core / 20));
  const spotHalf = Math.min(H / 2 - 15, spotUm / 30);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52">
      {/* Fiber */}
      <rect x="10" y={cy - coreHalf - 8} width={fiberEndX - 10} height={(coreHalf + 8) * 2} fill="hsl(200, 15%, 88%)" />
      <rect x="10" y={cy - coreHalf} width={fiberEndX - 10} height={coreHalf * 2} fill="hsl(var(--primary))" opacity="0.85" />
      <text x="14" y={cy - coreHalf - 12} fontSize="10" fontFamily="IBM Plex Mono" fill="hsl(var(--muted-foreground))">cladding</text>
      <text x="14" y={cy + coreHalf + 20} fontSize="10" fontFamily="IBM Plex Mono" fill="hsl(var(--primary))">core</text>

      {/* Acceptance cone */}
      <polygon
        points={`${fiberEndX},${cy - coreHalf} ${sampleX},${cy - spotHalf} ${sampleX},${cy + spotHalf} ${fiberEndX},${cy + coreHalf}`}
        fill="hsl(var(--amber))" fillOpacity="0.18" stroke="hsl(var(--amber))" strokeWidth="1"
      />
      {/* Sample surface */}
      <line x1={sampleX} y1="10" x2={sampleX} y2={H - 10} stroke="hsl(var(--primary))" strokeDasharray="4 3" />
      <text x={sampleX + 6} y="20" fontSize="10" fontFamily="IBM Plex Mono" fill="hsl(var(--muted-foreground))">sample</text>

      {/* Labels */}
      <text x={(fiberEndX + sampleX) / 2 - 20} y={cy - spotHalf - 8} fontSize="11" fontFamily="IBM Plex Mono" fill="hsl(var(--foreground))">
        θ = {thetaDeg}°
      </text>
      <text x={sampleX + 6} y={cy + 5} fontSize="10" fontFamily="IBM Plex Mono" fill="hsl(var(--amber))">
        spot Ø {(spotUm / 1000).toFixed(2)} mm
      </text>
    </svg>
  );
};

const Metric = ({ label, value, accent }) => (
  <div className={`rounded-lg border p-3 ${accent ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/30'}`}>
    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="vboi-value text-lg mt-0.5" style={accent ? { color: 'hsl(var(--amber))' } : {}}>{value}</div>
  </div>
);

const MiniStat = ({ label, v }) => (
  <div className="rounded-md bg-muted/40 border border-border py-1.5">
    <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-mono text-primary">{v}</div>
  </div>
);

export default FiberOptic;
