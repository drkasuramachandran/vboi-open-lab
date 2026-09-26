import React, { useEffect, useMemo, useRef, useState } from 'react';
import ModuleShell from '@/components/ModuleShell';
import ResultChart from '@/components/ResultChart';
import UploadDropzone from '@/components/UploadDropzone';
import ImageViewer from '@/components/ImageViewer';
import { MODULE_MAP } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { buildOctSample, buildSampleOctBscanDataUrl } from '@/lib/sampleData';
import { parseCsvMatrix } from '@/lib/opticsMath';
import { Slider } from '@/components/ui/slider';

/**
 * OCT B-scan renderer.
 * Uploaded CSV formats supported:
 *   - MATRIX: many rows × many cols; each row is an A-scan at one lateral position
 *             columns are depth samples. Rendered as a full B-scan on canvas.
 *   - LONG:   3 columns  →  (lateral, depth, intensity). Reshaped into a matrix.
 *   - A-SCAN: 1 or 2 columns  →  single A-scan (existing behaviour).
 */
const detectFormat = (rows) => {
  if (rows.length === 0) return 'empty';
  const nCols = rows[0].length;
  if (nCols === 1) return 'ascan1';
  if (nCols === 2) return 'ascan2';
  if (nCols === 3 && rows.length > 20) return 'long';
  if (nCols >= 5 && rows.length >= 5) return 'matrix';
  return 'ascan2';
};

const longToMatrix = (rows) => {
  const lats = new Set(), deps = new Set();
  rows.forEach((r) => { lats.add(r[0]); deps.add(r[1]); });
  const latArr = [...lats].sort((a, b) => a - b);
  const depArr = [...deps].sort((a, b) => a - b);
  const latIdx = new Map(latArr.map((v, i) => [v, i]));
  const depIdx = new Map(depArr.map((v, i) => [v, i]));
  const M = Array.from({ length: latArr.length }, () => new Float32Array(depArr.length));
  rows.forEach((r) => {
    const li = latIdx.get(r[0]);
    const di = depIdx.get(r[1]);
    if (li !== undefined && di !== undefined) M[li][di] = r[2];
  });
  return { matrix: M, lateral: latArr, depth: depArr };
};

/**
 * Render a B-scan matrix onto a canvas. Rows of matrix = A-scans (lateral),
 * cols = depth. We render the canonical OCT convention: depth vertical, lateral horizontal.
 */
const renderBscanToCanvas = (canvas, matrix, colormap = 'hot') => {
  if (!canvas || !matrix.length) return;
  const nLat = matrix.length;
  const nDep = matrix[0].length;
  // Find min/max
  let vMin = Infinity, vMax = -Infinity;
  for (let i = 0; i < nLat; i++) {
    for (let j = 0; j < nDep; j++) {
      const v = matrix[i][j];
      if (v < vMin) vMin = v;
      if (v > vMax) vMax = v;
    }
  }
  const span = vMax - vMin || 1;
  canvas.width = nLat;
  canvas.height = nDep;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(nLat, nDep);
  const data = img.data;
  for (let x = 0; x < nLat; x++) {
    for (let y = 0; y < nDep; y++) {
      const v = (matrix[x][y] - vMin) / span; // 0..1
      const [r, g, b] = colormap === 'hot' ? hotColor(v) : grayColor(v);
      const idx = (y * nLat + x) * 4;
      data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
};

const grayColor = (v) => {
  const g = Math.round(Math.min(1, Math.max(0, v)) * 255);
  return [g, g, g];
};
const hotColor = (v) => {
  // Simple 3-segment "hot" colormap: black → red → yellow → white
  v = Math.min(1, Math.max(0, v));
  let r = 0, g = 0, b = 0;
  if (v < 0.375) { r = Math.round(v / 0.375 * 255); }
  else if (v < 0.75) { r = 255; g = Math.round((v - 0.375) / 0.375 * 255); }
  else { r = 255; g = 255; b = Math.round((v - 0.75) / 0.25 * 255); }
  return [r, g, b];
};

const OCT = () => {
  const module = MODULE_MAP['oct'];
  const [sampleA] = useState(() => buildOctSample());
  const [aScan, setAScan] = useState(sampleA.aScan);
  const [imgSrc, setImgSrc] = useState('');
  const [imgFilename, setImgFilename] = useState(null);
  const [csvFilename, setCsvFilename] = useState(null);
  const [bscanMatrix, setBscanMatrix] = useState(null);   // Float32[][]
  const [column, setColumn] = useState(0);                // which A-scan column to plot
  const canvasRef = useRef(null);

  useEffect(() => { setImgSrc(buildSampleOctBscanDataUrl()); }, []);

  // Whenever we have a real B-scan matrix, draw it and derive the display image
  useEffect(() => {
    if (bscanMatrix && canvasRef.current) {
      renderBscanToCanvas(canvasRef.current, bscanMatrix, 'hot');
      // Convert to data URL for the ImageViewer
      try {
        setImgSrc(canvasRef.current.toDataURL('image/png'));
      } catch (e) { /* tainted canvas → keep previous */ }
    }
  }, [bscanMatrix]);

  const handleImage = (f) => {
    const url = URL.createObjectURL(f);
    setImgSrc(url);
    setImgFilename(f.name);
    setBscanMatrix(null); // uploaded image supersedes matrix
  };

  const handleCsv = (f) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsvMatrix(String(reader.result || ''));
      const fmt = detectFormat(rows);
      if (fmt === 'matrix') {
        // rows = lateral A-scans, cols = depth samples
        const M = rows.map((r) => new Float32Array(r));
        setBscanMatrix(M);
        setColumn(Math.floor(M.length / 2));
        const middle = M[Math.floor(M.length / 2)];
        setAScan(Array.from(middle).map((v, i) => ({ depth: i, intensity: v })));
        setCsvFilename(f.name);
      } else if (fmt === 'long') {
        const { matrix } = longToMatrix(rows);
        setBscanMatrix(matrix);
        setColumn(Math.floor(matrix.length / 2));
        const middle = matrix[Math.floor(matrix.length / 2)];
        setAScan(Array.from(middle).map((v, i) => ({ depth: i, intensity: v })));
        setCsvFilename(f.name);
      } else if (fmt === 'ascan2') {
        const arr = rows.map((r) => ({ depth: r[0], intensity: r[1] })).filter((r) => Number.isFinite(r.intensity));
        if (arr.length) { setAScan(arr); setCsvFilename(f.name); setBscanMatrix(null); }
      } else if (fmt === 'ascan1') {
        const arr = rows.map((r, i) => ({ depth: i, intensity: r[0] }));
        if (arr.length) { setAScan(arr); setCsvFilename(f.name); setBscanMatrix(null); }
      }
    };
    reader.readAsText(f);
  };

  // When user scrubs column, update the A-scan chart
  useEffect(() => {
    if (bscanMatrix && bscanMatrix[column]) {
      setAScan(Array.from(bscanMatrix[column]).map((v, i) => ({ depth: i, intensity: v })));
    }
  }, [column, bscanMatrix]);

  const stats = useMemo(() => {
    if (!aScan.length) return { peakDepth: 0, mean: 0 };
    let maxIdx = 0;
    aScan.forEach((p, i) => { if (p.intensity > aScan[maxIdx].intensity) maxIdx = i; });
    const mean = aScan.reduce((a, b) => a + b.intensity, 0) / aScan.length;
    return { peakDepth: aScan[maxIdx].depth, mean: +mean.toFixed(3) };
  }, [aScan]);

  const source = imgFilename || csvFilename || 'sample';
  const bscanDims = bscanMatrix ? `${bscanMatrix.length} × ${bscanMatrix[0]?.length || 0}` : '480 × 260';

  const clearCsv = () => {
    setAScan(sampleA.aScan); setCsvFilename(null); setBscanMatrix(null);
    setImgSrc(buildSampleOctBscanDataUrl());
  };

  return (
    <ModuleShell
      module={module}
      explainer="Optical coherence tomography. Upload a full B-scan matrix as CSV (rows = lateral A-scans, columns = depth) — VBOI reconstructs and renders it with a hot colormap. Long-format CSVs (lateral, depth, intensity) are also supported. Any single-column upload is treated as a lone A-scan."
      onSave={() => ({
        summary: `${bscanMatrix ? `B-scan matrix ${bscanDims}` : `A-scan pts=${aScan.length}`} · ${source} · peak z=${stats.peakDepth}`,
        params: { source, hasMatrix: !!bscanMatrix, matrixShape: bscanMatrix ? [bscanMatrix.length, bscanMatrix[0].length] : null },
        metrics: { peakDepth: stats.peakDepth, mean: stats.mean },
      })}
      controls={
        <>
          <UploadDropzone
            label="Upload B-scan image"
            hint="PNG / JPG"
            accept="image/*"
            filename={imgFilename}
            onFile={handleImage}
            onClear={() => { setImgSrc(buildSampleOctBscanDataUrl()); setImgFilename(null); }}
          />
          <UploadDropzone
            label="Upload CSV (matrix or A-scan)"
            hint="matrix · long · A-scan"
            accept=".csv,.txt"
            filename={csvFilename}
            onFile={handleCsv}
            onClear={clearCsv}
          />
          {bscanMatrix && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-medium">A-scan column</label>
                <span className="vboi-value text-sm">{column} / {bscanMatrix.length - 1}</span>
              </div>
              <Slider
                data-testid={VBOI.octColumnScrubber}
                value={[column]}
                min={0} max={bscanMatrix.length - 1} step={1}
                onValueChange={(v) => setColumn(v[0])}
              />
              <div className="text-[10px] font-mono text-muted-foreground">
                Rendered from {csvFilename} · {bscanDims}
              </div>
            </div>
          )}
          <div className="pt-3 mt-3 border-t border-border grid grid-cols-2 gap-3">
            <Metric label="Peak depth" value={`${stats.peakDepth}`} />
            <Metric label="Mean I" value={String(stats.mean)} accent />
          </div>
        </>
      }
      output={
        <div className="space-y-4">
          <ImageViewer
            testId={VBOI.octImage}
            src={imgSrc}
            alt="OCT B-scan"
            footer={<>
              <span data-testid={VBOI.octRenderedFrom}>
                B-scan · {bscanMatrix ? `rendered from ${csvFilename}` : (imgFilename || 'sample image')}
              </span>
              <span className="tabular-nums">{bscanDims}</span>
            </>}
            aspect="aspect-[16/9]"
          />
          {/* Hidden canvas used for rendering matrix → dataURL */}
          <canvas
            ref={canvasRef}
            data-testid={VBOI.octBscanCanvas}
            className="hidden"
          />
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
              A-scan · depth profile{bscanMatrix ? ` (column ${column})` : ''}
            </div>
            <ResultChart
              testId={VBOI.octDepthChart}
              data={aScan}
              xKey="depth"
              xLabel="Depth (px)"
              yLabel="Intensity"
              type="area"
              series={[{ key: 'intensity', color: 'hsl(var(--primary))', fill: 'hsl(var(--primary))', fillOpacity: 0.15 }]}
              height={180}
            />
          </div>
        </div>
      }
    />
  );
};

const Metric = ({ label, value, accent }) => (
  <div className={`rounded-lg border p-3 ${accent ? 'border-accent/40 bg-accent/5' : 'border-border bg-muted/30'}`}>
    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="vboi-value text-lg mt-0.5" style={accent ? { color: 'hsl(var(--amber))' } : {}}>{value}</div>
  </div>
);

export default OCT;
