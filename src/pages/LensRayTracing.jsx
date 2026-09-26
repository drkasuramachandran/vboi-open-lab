import React, { useMemo, useState } from 'react';
import ModuleShell from '@/components/ModuleShell';
import ParameterSlider from '@/components/ParameterSlider';
import { MODULE_MAP } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { M_thinLens, M_translation, traceCollimatedRay } from '@/lib/opticsMath';
import { useModulePrefill } from '@/hooks/useModulePrefill';

/**
 * Thin-lens simulation using ABCD matrices + third-order aberrations
 * (spherical, coma, astigmatism).  Ray coordinates in the pupil are (yx, yy)
 * and normalized as ρ = √(yx² + yy²). Transverse aberrations at the paraxial
 * image plane are added on top of the ABCD prediction:
 *
 *   Δ_SA(yx,yy)   = −k_SA · ρ² · (yx, yy) / f              (radial, ρ³)
 *   Δ_Coma(yx,yy) = k_C  · (3·yx² + yy², 2·yx·yy) / f      (comet along +x)
 *   Δ_Ast(yx,yy)  = k_AST · ρ · (yx, −yy) / f              (elliptical)
 */
const LensRayTracing = () => {
  const module = MODULE_MAP['lens-ray-tracing'];
  const prefill = useModulePrefill('lens-ray-tracing', {
    focal: 50, aperture: 20, radius: 35, kSA: 0, kC: 0, kAST: 0,
  });
  const [focal, setFocal] = useState(prefill.focal);
  const [aperture, setAperture] = useState(prefill.aperture);
  const [radius, setRadius] = useState(prefill.radius);
  const [kSA, setKSA] = useState(prefill.kSA);
  const [kComa, setKComa] = useState(prefill.kC);
  const [kAst, setKAst] = useState(prefill.kAST);

  const fNumber = focal / aperture;
  const d1 = focal;
  const d2 = focal;

  const systemMatrix = useMemo(() => {
    const T1 = M_translation(d1);
    const L = M_thinLens(focal);
    const T2 = M_translation(d2);
    const LT1 = [
      [L[0][0]*T1[0][0] + L[0][1]*T1[1][0], L[0][0]*T1[0][1] + L[0][1]*T1[1][1]],
      [L[1][0]*T1[0][0] + L[1][1]*T1[1][0], L[1][0]*T1[0][1] + L[1][1]*T1[1][1]],
    ];
    return [
      [T2[0][0]*LT1[0][0] + T2[0][1]*LT1[1][0], T2[0][0]*LT1[0][1] + T2[0][1]*LT1[1][1]],
      [T2[1][0]*LT1[0][0] + T2[1][1]*LT1[1][0], T2[1][0]*LT1[0][1] + T2[1][1]*LT1[1][1]],
    ];
  }, [focal, d1, d2]);

  // 1D ABCD trace for the meridional ray-diagram (SA-only in the sagittal plane)
  const rays = useMemo(() => {
    const N = 9;
    const out = [];
    for (let i = 0; i < N; i++) {
      const y0 = -aperture / 2 + (i * aperture) / (N - 1);
      const { atImage } = traceCollimatedRay(y0, focal, d1, d2, kSA);
      out.push({ y0, atImage });
    }
    return out;
  }, [aperture, focal, d1, d2, kSA]);

  // 2D spot-diagram with all three aberrations applied
  const spotData = useMemo(() => {
    const N = 260;
    const R = aperture / 2;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const r = R * Math.sqrt((i + 0.5) / N);
      const theta = i * 2.3999632;  // golden angle
      const yx = r * Math.cos(theta);
      const yy = r * Math.sin(theta);
      const rho2 = yx * yx + yy * yy;
      const rho = Math.sqrt(rho2);

      // Spherical (radial, ρ³)
      const saCoef = -(kSA * rho2) / focal;
      let dx = saCoef * yx;
      let dy = saCoef * yy;

      // Coma along +x (ρ², asymmetric)
      dx += (kComa * (3 * yx * yx + yy * yy)) / focal;
      dy += (kComa * 2 * yx * yy) / focal;

      // Astigmatism (elliptical stretching)
      dx += (kAst * yx * rho) / focal;
      dy -= (kAst * yy * rho) / focal;

      // Small diffraction blur floor
      const blur = 0.003 * fNumber;
      const u = Math.random(), v = Math.random();
      const g = Math.sqrt(-2 * Math.log(Math.max(u, 1e-6))) * blur;
      const gt = 2 * Math.PI * v;
      pts.push({
        x: +(dx + g * Math.cos(gt)).toFixed(4),
        y: +(dy + g * Math.sin(gt)).toFixed(4),
      });
    }
    return pts;
  }, [aperture, focal, kSA, kComa, kAst, fNumber]);

  const rmsSpot = useMemo(() => {
    if (spotData.length === 0) return 0;
    const mx = spotData.reduce((a, b) => a + b.x, 0) / spotData.length;
    const my = spotData.reduce((a, b) => a + b.y, 0) / spotData.length;
    const sq = spotData.reduce((a, b) => a + (b.x - mx) ** 2 + (b.y - my) ** 2, 0) / spotData.length;
    return Math.sqrt(sq);
  }, [spotData]);

  const W = 640, H = 260;
  const lensX = W * 0.35;
  const cy = H / 2;
  const scaleX = (W * 0.6) / (d1 + d2);
  const scaleY = 1.6;
  const apPx = aperture * scaleY;

  return (
    <ModuleShell
      module={module}
      explainer="Thin-lens ABCD trace with third-order aberrations. The spot-diagram accumulates spherical (radial ρ³), coma (comet-shaped ρ² along +x), and astigmatism (elliptical stretch) contributions — turn each dial to see its signature."
      onSave={() => ({
        summary: `f=${focal} mm · Ø=${aperture} mm · f/${fNumber.toFixed(1)} · RMS spot=${rmsSpot.toFixed(3)} mm`,
        params: { focal, aperture, radius, kSA, kC: kComa, kAST: kAst },
        metrics: { fNumber: +fNumber.toFixed(2), rmsSpot_mm: +rmsSpot.toFixed(4) },
      })}
      controls={
        <>
          <ParameterSlider
            label="Focal length f" units="mm"
            min={10} max={200} step={1}
            value={focal} onChange={setFocal}
            testId={VBOI.lensFocalLength}
          />
          <ParameterSlider
            label="Aperture Ø" units="mm"
            min={4} max={60} step={1}
            value={aperture} onChange={setAperture}
            testId={VBOI.lensAperture}
          />
          <ParameterSlider
            label="Surface radius R" units="mm"
            min={10} max={120} step={1}
            value={radius} onChange={setRadius}
            testId={VBOI.lensRadius}
          />
          <div className="pt-3 mt-1 border-t border-border">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Third-order aberrations</div>
            <div className="space-y-4">
              <ParameterSlider
                label="Spherical  k_SA" units=""
                min={0} max={0.02} step={0.0005}
                value={kSA} onChange={setKSA}
                format={(v) => v.toFixed(4)}
                testId={VBOI.lensSA}
                hint="radial ρ³"
              />
              <ParameterSlider
                label="Coma  k_C" units=""
                min={0} max={0.02} step={0.0005}
                value={kComa} onChange={setKComa}
                format={(v) => v.toFixed(4)}
                testId={VBOI.lensComa}
                hint="comet along +x"
              />
              <ParameterSlider
                label="Astigmatism  k_AST" units=""
                min={0} max={0.02} step={0.0005}
                value={kAst} onChange={setKAst}
                format={(v) => v.toFixed(4)}
                testId={VBOI.lensAst}
                hint="elliptical stretch"
              />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-border grid grid-cols-2 gap-3">
            <Metric label="f-number" value={`f/${fNumber.toFixed(1)}`} />
            <Metric label="RMS spot" value={`${rmsSpot.toFixed(3)} mm`} accent />
          </div>
          <div className="mt-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">System ABCD</div>
            <AbcdMatrixDisplay M={systemMatrix} />
          </div>
        </>
      }
      output={
        <div className="space-y-6">
          <div data-testid={VBOI.lensRayDiagram}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Ray diagram · ABCD trace (meridional)
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">T(d₂) · L(f) · T(d₁)</div>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56 bg-white rounded-lg border border-border">
              <defs>
                <linearGradient id="lensGrad" x1="0" x2="1">
                  <stop offset="0" stopColor="hsl(192, 70%, 45%)" stopOpacity="0.15" />
                  <stop offset="1" stopColor="hsl(192, 70%, 22%)" stopOpacity="0.35" />
                </linearGradient>
              </defs>
              {Array.from({ length: 16 }).map((_, i) => (
                <line key={`gx-${i}`} x1={(W/16)*i} y1={0} x2={(W/16)*i} y2={H} stroke="hsl(200, 20%, 92%)" strokeWidth="1" />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <line key={`gy-${i}`} x1={0} y1={(H/6)*i} x2={W} y2={(H/6)*i} stroke="hsl(200, 20%, 92%)" strokeWidth="1" />
              ))}
              <line x1={0} y1={cy} x2={W} y2={cy} stroke="hsl(200, 20%, 70%)" strokeDasharray="4 4" />
              <ellipse cx={lensX} cy={cy} rx={12} ry={apPx / 2}
                       fill="url(#lensGrad)" stroke="hsl(192, 70%, 30%)" strokeWidth="1.5" />
              <circle cx={lensX + focal * scaleX} cy={cy} r={4} fill="hsl(var(--amber))" />
              <text x={lensX + focal * scaleX + 8} y={cy - 8} fontFamily="IBM Plex Mono" fontSize="10" fill="hsl(var(--muted-foreground))">F&apos; paraxial</text>
              {rays.map((r, i) => {
                const y1 = cy - r.y0 * scaleY;
                const y3 = cy - r.atImage[0] * scaleY;
                return (
                  <g key={`ray-${i}`}>
                    <line x1={20} y1={y1} x2={lensX} y2={y1} stroke="hsl(var(--amber))" strokeWidth="1.2" opacity="0.85" />
                    <line x1={lensX} y1={y1} x2={lensX + d2 * scaleX} y2={y3} stroke="hsl(var(--amber))" strokeWidth="1.2" opacity="0.85" />
                  </g>
                );
              })}
              <text x={16} y={20} fontFamily="IBM Plex Mono" fontSize="10" fill="hsl(var(--muted-foreground))">collimated input · d₁={d1} mm</text>
              <text x={lensX - 22} y={H - 12} fontFamily="IBM Plex Mono" fontSize="10" fill="hsl(var(--muted-foreground))">lens</text>
              <text x={lensX + d2 * scaleX - 34} y={H - 12} fontFamily="IBM Plex Mono" fontSize="10" fill="hsl(var(--muted-foreground))">image plane</text>
            </svg>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Spot diagram · image plane (3rd-order aberrations)
              </div>
              <div className="text-[10px] font-mono text-muted-foreground">N = {spotData.length} rays · RMS {rmsSpot.toFixed(3)} mm</div>
            </div>
            <SpotDiagram points={spotData} testId={VBOI.lensSpotDiagram} extent={Math.max(0.05, rmsSpot * 4)} />
            <AberrationLegend kSA={kSA} kComa={kComa} kAst={kAst} />
          </div>
        </div>
      }
    />
  );
};

const AberrationLegend = ({ kSA, kComa, kAst }) => (
  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono">
    <LegendChip label="SA" value={kSA.toFixed(4)} on={kSA > 0} />
    <LegendChip label="Coma" value={kComa.toFixed(4)} on={kComa > 0} />
    <LegendChip label="Ast" value={kAst.toFixed(4)} on={kAst > 0} />
  </div>
);

const LegendChip = ({ label, value, on }) => (
  <div className={`rounded-md border px-2 py-1.5 flex items-center justify-between ${on ? 'border-accent/50 bg-accent/10' : 'border-border bg-muted/30'}`}>
    <span className="uppercase tracking-wider text-muted-foreground">{label}</span>
    <span className={on ? 'text-primary' : 'text-muted-foreground/60'}>{value}</span>
  </div>
);

const AbcdMatrixDisplay = ({ M }) => (
  <div data-testid={VBOI.lensAbcdMatrix} className="rounded-lg border border-border bg-muted/30 p-3 font-mono text-sm">
    <div className="flex items-center gap-2">
      <div className="border-l-2 border-r-2 border-primary px-3 py-1.5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-center">
          <span className="text-primary tabular-nums">{M[0][0].toFixed(3)}</span>
          <span className="text-primary tabular-nums">{M[0][1].toFixed(3)}</span>
          <span className="text-primary tabular-nums">{M[1][0].toFixed(4)}</span>
          <span className="text-primary tabular-nums">{M[1][1].toFixed(3)}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        <div>det = {(M[0][0]*M[1][1] - M[0][1]*M[1][0]).toFixed(3)}</div>
        <div>trace = {(M[0][0] + M[1][1]).toFixed(3)}</div>
      </div>
    </div>
  </div>
);

const SpotDiagram = ({ points, testId, extent }) => {
  const scale = 0.9 / (extent || 0.1);
  return (
    <div data-testid={testId} className="bg-white rounded-lg border border-border p-3">
      <svg viewBox="-1 -1 2 2" className="w-56 h-56 mx-auto">
        <circle cx="0" cy="0" r="0.6" fill="none" stroke="hsl(200, 20%, 90%)" strokeWidth="0.008" />
        <circle cx="0" cy="0" r="0.3" fill="none" stroke="hsl(200, 20%, 90%)" strokeWidth="0.008" />
        <line x1="-0.9" y1="0" x2="0.9" y2="0" stroke="hsl(200, 20%, 88%)" strokeWidth="0.005" strokeDasharray="0.02 0.02" />
        <line x1="0" y1="-0.9" x2="0" y2="0.9" stroke="hsl(200, 20%, 88%)" strokeWidth="0.005" strokeDasharray="0.02 0.02" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x * scale} cy={p.y * scale} r="0.012" fill="hsl(var(--primary))" opacity="0.55" />
        ))}
        <text x="-0.95" y="0.98" fontFamily="IBM Plex Mono" fontSize="0.08" fill="hsl(var(--muted-foreground))">
          ±{extent.toFixed(3)} mm
        </text>
      </svg>
    </div>
  );
};

const Metric = ({ label, value, accent }) => (
  <div className={`rounded-lg border p-3 ${accent ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/30'}`}>
    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="vboi-value text-lg mt-0.5" style={accent ? { color: 'hsl(var(--amber))' } : {}}>{value}</div>
  </div>
);

export default LensRayTracing;
