import React, { useMemo, useState } from 'react';
import ModuleShell from '@/components/ModuleShell';
import ParameterSlider from '@/components/ParameterSlider';
import ResultChart from '@/components/ResultChart';
import { MODULE_MAP } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { useModulePrefill } from '@/hooks/useModulePrefill';

// Beer-Lambert: I(z) = I0 * exp(-mu_t * z), where mu_t = mu_a + mu_s'
// Penetration depth d_p ≈ 1/mu_t (client-side approximation for teaching).

const Fundamentals = () => {
  const module = MODULE_MAP['fundamentals'];
  const prefill = useModulePrefill('fundamentals', { wavelength: 700, muA: 0.15, muS: 2.0 });
  const [wavelength, setWavelength] = useState(prefill.wavelength);   // nm
  const [muA, setMuA] = useState(prefill.muA);                        // 1/mm
  const [muS, setMuS] = useState(prefill.muS);                        // 1/mm

  const { data, penetrationDepth } = useMemo(() => {
    const muT = muA + muS;
    const depth = muT > 0 ? 1 / muT : 0; // mm
    const pts = [];
    for (let z = 0; z <= 20; z += 0.2) {
      pts.push({ z: +z.toFixed(2), I: +Math.exp(-muT * z).toFixed(5) });
    }
    return { data: pts, penetrationDepth: depth };
  }, [muA, muS]);

  return (
    <ModuleShell
      module={module}
      explainer="Slide wavelength and tissue optical properties to see how far light penetrates using the Beer–Lambert law. Absorption and scattering combine into a total attenuation coefficient μₜ; penetration depth is 1/μₜ."
      onSave={() => ({
        summary: `λ ${wavelength} nm · μₐ ${muA.toFixed(2)} · μₛ' ${muS.toFixed(2)} · depth ${penetrationDepth.toFixed(2)} mm`,
        params: { wavelength, muA, muS },
        metrics: { penetrationDepth_mm: +penetrationDepth.toFixed(3) },
      })}
      controls={
        <>
          <ParameterSlider
            label="Wavelength"
            units="nm"
            min={400} max={1300} step={5}
            value={wavelength} onChange={setWavelength}
            testId={VBOI.fundWavelength}
            hint="visible → NIR"
          />
          <ParameterSlider
            label="Absorption μₐ"
            units="mm⁻¹"
            min={0.01} max={2} step={0.01}
            value={muA} onChange={setMuA}
            format={(v) => `${v.toFixed(2)} mm⁻¹`}
            testId={VBOI.fundAbsorption}
            hint="hemoglobin / water"
          />
          <ParameterSlider
            label="Reduced Scattering μₛ'"
            units="mm⁻¹"
            min={0.1} max={10} step={0.1}
            value={muS} onChange={setMuS}
            format={(v) => `${v.toFixed(1)} mm⁻¹`}
            testId={VBOI.fundScattering}
            hint="tissue microstructure"
          />
          <div className="pt-3 mt-3 border-t border-border grid grid-cols-2 gap-3">
            <MetricCard label="μₜ" value={`${(muA + muS).toFixed(2)} mm⁻¹`} />
            <MetricCard label="Penetration" value={`${penetrationDepth.toFixed(2)} mm`} accent />
          </div>
        </>
      }
      output={
        <>
          <div className="text-xs text-muted-foreground mb-2">
            Normalized intensity <span className="font-mono">I(z) = I₀·exp(-μₜz)</span>
          </div>
          <ResultChart
            testId={VBOI.fundDepthChart}
            data={data}
            xKey="z"
            xLabel="Depth z (mm)"
            yLabel="I / I₀"
            type="area"
            domainY={[0, 1]}
            series={[{ key: 'I', color: 'hsl(var(--primary))', fill: 'hsl(var(--primary))', fillOpacity: 0.15 }]}
            refLines={[{ x: penetrationDepth, label: '1/μₜ' }]}
          />
        </>
      }
    />
  );
};

const MetricCard = ({ label, value, accent }) => (
  <div className={`rounded-lg border p-3 ${accent ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/30'}`}>
    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className={`vboi-value text-lg mt-0.5 ${accent ? '!text-accent-foreground' : ''}`}
         style={accent ? { color: 'hsl(var(--amber))' } : {}}>
      {value}
    </div>
  </div>
);

export default Fundamentals;
