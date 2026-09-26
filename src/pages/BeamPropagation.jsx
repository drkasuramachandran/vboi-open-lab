import React, { useMemo, useState } from 'react';
import ModuleShell from '@/components/ModuleShell';
import ParameterSlider from '@/components/ParameterSlider';
import ResultChart from '@/components/ResultChart';
import { MODULE_MAP } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { X, FileUp, Rows3, Columns3 } from 'lucide-react';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { parseNpy, renderMatrixToDataUrl } from '@/lib/npyParser';
import { useModulePrefill } from '@/hooks/useModulePrefill';

/**
 * Gaussian beam waist evolution:
 * w(z) = w0 * sqrt(1 + (z / zR)^2), zR = pi * w0^2 / lambda
 * Gallery accepts PNG images AND numpy .npy field arrays (rendered with a
 * viridis colormap client-side).
 */
const BeamPropagation = () => {
  const module = MODULE_MAP['beam-propagation'];
  const prefill = useModulePrefill('beam-propagation', { w0: 50, lambda: 633 });
  const [w0, setW0] = useState(prefill.w0);
  const [lambda, setLambda] = useState(prefill.lambda);
  const [images, setImages] = useState([]);    // { name, url, kind, meta, matrix }
  const [crossSel, setCrossSel] = useState(0);      // which NPY item
  const [crossAxis, setCrossAxis] = useState('row'); // row | col
  const [crossIdx, setCrossIdx] = useState(0);      // index along axis

  const { data, zR } = useMemo(() => {
    const w0_um = w0;
    const lam_um = lambda / 1000;
    const zR_um = Math.PI * w0_um * w0_um / lam_um;
    const pts = [];
    for (let z = -zR_um * 3; z <= zR_um * 3; z += zR_um / 40) {
      const w = w0_um * Math.sqrt(1 + Math.pow(z / zR_um, 2));
      pts.push({ z: +(z / 1000).toFixed(3), wPos: +w.toFixed(3), wNeg: +(-w).toFixed(3) });
    }
    return { data: pts, zR: zR_um };
  }, [w0, lambda]);

  const handleImage = (files) => {
    const newOnes = Array.from(files).slice(0, 4 - images.length).map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      kind: 'image',
      meta: null,
    }));
    setImages((cur) => [...cur, ...newOnes]);
  };

  const handleNpy = async (f) => {
    if (images.length >= 4) {
      toast.error('Gallery is full — remove an item first');
      return;
    }
    try {
      const buf = await f.arrayBuffer();
      const parsed = parseNpy(buf);
      if (parsed.shape.length !== 2) {
        toast.error(`Only 2D arrays supported (got ${parsed.shape.length}D)`);
        return;
      }
      const { url, vMin, vMax } = renderMatrixToDataUrl(parsed.matrix, 'viridis');
      setImages((cur) => [...cur, {
        name: f.name,
        url,
        kind: 'npy',
        matrix: parsed.matrix,   // keep raw values for cross-section
        meta: {
          shape: parsed.shape,
          dtype: parsed.dtype,
          fortranOrder: parsed.fortranOrder,
          vMin, vMax,
        },
      }]);
      toast.success(`Loaded ${f.name}`, {
        description: `${parsed.shape[0]}×${parsed.shape[1]} · ${parsed.dtype} · [${vMin.toExponential(2)}, ${vMax.toExponential(2)}]`,
      });
    } catch (e) {
      toast.error('Could not parse NPY file', { description: String(e.message || e) });
    }
  };

  return (
    <ModuleShell
      module={module}
      explainer="A collimated Gaussian beam expands as w(z)=w₀√(1+(z/z_R)²). Drop PNG plots or raw MEEP / Tidy3D .npy field arrays (2D, C-order, float32/float64/int) into the gallery — .npy files are parsed and rendered client-side with a viridis colormap."
      onSave={() => ({
        summary: `w₀=${w0} µm · λ=${lambda} nm · z_R=${(zR/1000).toFixed(2)} mm · gallery=${images.length}`,
        params: { w0, lambda, gallery: images.map((i) => ({ name: i.name, kind: i.kind })) },
        metrics: { rayleighRange_mm: +(zR / 1000).toFixed(3) },
      })}
      controls={
        <>
          <ParameterSlider
            label="Beam waist w₀" units="µm"
            min={5} max={500} step={1}
            value={w0} onChange={setW0}
            testId={VBOI.beamWaist}
          />
          <ParameterSlider
            label="Wavelength λ" units="nm"
            min={400} max={1550} step={1}
            value={lambda} onChange={setLambda}
            testId={VBOI.beamWavelength}
          />
          <div className="pt-3 mt-3 border-t border-border grid grid-cols-2 gap-3">
            <Metric label="Rayleigh z_R" value={`${(zR / 1000).toFixed(2)} mm`} />
            <Metric label="Divergence θ" value={`${((lambda / 1000) / (Math.PI * w0) * 1000).toFixed(2)} mrad`} accent />
          </div>

          {/* NPY upload */}
          <div className="pt-3 mt-3 border-t border-border">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">MEEP / Tidy3D · .npy</div>
            <label className="flex items-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/40 px-3 py-3 cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
              <input
                data-testid={VBOI.beamNpyUpload}
                type="file"
                accept=".npy"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleNpy(f);
                  e.target.value = '';
                }}
              />
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                <FileUp className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-primary">Upload .npy field</div>
                <div className="text-[11px] text-muted-foreground">
                  2D array, C-order · f4 / f8 / i2 / i4 / u1
                </div>
              </div>
            </label>
          </div>
        </>
      }
      output={
        <ResultChart
          testId={VBOI.beamProfileChart}
          data={data}
          xKey="z"
          xLabel="Propagation z (mm)"
          yLabel="Beam radius (µm)"
          series={[
            { key: 'wPos', color: 'hsl(var(--primary))', name: '+w(z)' },
            { key: 'wNeg', color: 'hsl(var(--primary))', name: '−w(z)' },
          ]}
          refLines={[{ x: 0, label: 'waist' }]}
        />
      }
      extra={
        <>
          <div data-testid={VBOI.beamGallery} className="mt-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-4 bg-accent rounded-full" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Imported FDTD / Tidy3D result gallery
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative rounded-lg overflow-hidden border border-border bg-[#020a10] aspect-[4/3]">
                  <img src={img.url} alt={img.name} className="w-full h-full object-contain" />
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      img.kind === 'npy' ? 'bg-accent/90 text-accent-foreground' : 'bg-black/60 text-white/80'
                    }`}>
                      {img.kind === 'npy' ? 'NPY' : 'IMG'}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] text-white/80 font-mono truncate">
                    {img.name}
                  </div>
                  {img.kind === 'npy' && img.meta && (
                    <div data-testid={VBOI.beamNpyMeta} className="absolute inset-x-0 bottom-6 bg-black/70 px-2 py-0.5 text-[9px] text-white/70 font-mono truncate">
                      {img.meta.shape[0]}×{img.meta.shape[1]} · {img.meta.dtype}
                    </div>
                  )}
                  <button
                    onClick={() => setImages((cur) => cur.filter((_, idx) => idx !== i))}
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 text-white/80 hover:bg-black"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <label className="rounded-lg border-2 border-dashed border-border p-3 flex items-center justify-center aspect-[4/3] cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors text-xs text-muted-foreground">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImage(e.target.files || [])}
                  />
                  <span className="text-center">+ Drop image<br /><span className="text-[10px] font-mono uppercase tracking-wider">PNG · JPG</span></span>
                </label>
              )}
            </div>
          </div>

          <CrossSectionPanel
            images={images}
            crossSel={crossSel}
            crossAxis={crossAxis}
            crossIdx={crossIdx}
            onSelChange={setCrossSel}
            onAxisChange={setCrossAxis}
            onIdxChange={setCrossIdx}
          />
        </>
      }
    />
  );
};

const CrossSectionPanel = ({ images, crossSel, crossAxis, crossIdx, onSelChange, onAxisChange, onIdxChange }) => {
  const npyItems = images.map((img, i) => ({ img, i })).filter((x) => x.img.kind === 'npy' && x.img.matrix);
  const selected = npyItems.find((x) => x.i === crossSel) || npyItems[0] || null;
  const matrix = selected?.img.matrix;
  const shape = selected?.img.meta?.shape || [0, 0];
  const [rows, cols] = shape;
  const maxIdx = Math.max(0, (crossAxis === 'row' ? rows - 1 : cols - 1));
  const clampedIdx = Math.min(crossIdx, maxIdx);

  const data = React.useMemo(() => {
    if (!matrix) return [];
    if (crossAxis === 'row') {
      const row = matrix[clampedIdx] || [];
      return Array.from(row).map((v, i) => ({ x: i, intensity: +v.toFixed(6) }));
    }
    return matrix.map((row, r) => ({ x: r, intensity: +row[clampedIdx].toFixed(6) }));
  }, [matrix, clampedIdx, crossAxis]);

  if (!selected) return null;

  return (
    <div data-testid={VBOI.beamCrossSection} className="mt-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-4 bg-primary rounded-full" />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Field-map cross-section
        </h2>
      </div>
      <div className="vboi-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">Source</label>
            <Select
              value={String(selected.i)}
              onValueChange={(v) => onSelChange(Number(v))}
            >
              <SelectTrigger data-testid={VBOI.beamCrossSectionSelect}>
                <SelectValue placeholder="Pick a field map" />
              </SelectTrigger>
              <SelectContent>
                {npyItems.map(({ img, i }) => (
                  <SelectItem key={i} value={String(i)}>
                    {img.name} · {img.meta.shape[0]}×{img.meta.shape[1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">Axis</label>
            <div data-testid={VBOI.beamCrossSectionAxis} className="grid grid-cols-2 gap-1.5 h-10">
              <Button
                type="button"
                variant={crossAxis === 'row' ? 'default' : 'outline'}
                size="sm"
                className="h-full"
                onClick={() => onAxisChange('row')}
              >
                <Rows3 className="w-3.5 h-3.5" /> Row
              </Button>
              <Button
                type="button"
                variant={crossAxis === 'col' ? 'default' : 'outline'}
                size="sm"
                className="h-full"
                onClick={() => onAxisChange('col')}
              >
                <Columns3 className="w-3.5 h-3.5" /> Column
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {crossAxis === 'row' ? 'Row index' : 'Column index'}
              </label>
              <span className="vboi-value text-sm">{clampedIdx} / {maxIdx}</span>
            </div>
            <Slider
              data-testid={VBOI.beamCrossSectionIndex}
              value={[clampedIdx]}
              min={0}
              max={maxIdx}
              step={1}
              onValueChange={(v) => onIdxChange(v[0])}
              className="mt-3"
            />
          </div>
        </div>

        <ResultChart
          testId={VBOI.beamCrossSectionChart}
          data={data}
          xKey="x"
          xLabel={crossAxis === 'row' ? 'Column index' : 'Row index'}
          yLabel="Intensity"
          type="area"
          series={[{
            key: 'intensity',
            color: 'hsl(var(--primary))',
            fill: 'hsl(var(--primary))',
            fillOpacity: 0.18,
          }]}
          height={220}
        />

        <div className="text-xs text-muted-foreground">
          Cross-section along <span className="font-mono text-primary">{crossAxis} {clampedIdx}</span> of{' '}
          <span className="font-mono text-primary">{selected.img.name}</span>. Compare this line-out
          against the analytical w(z) envelope above.
        </div>
      </div>
    </div>
  );
};

const Metric = ({ label, value, accent }) => (
  <div className={`rounded-lg border p-3 ${accent ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/30'}`}>
    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="vboi-value text-lg mt-0.5" style={accent ? { color: 'hsl(var(--amber))' } : {}}>{value}</div>
  </div>
);

export default BeamPropagation;
