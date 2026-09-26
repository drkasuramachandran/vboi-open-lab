import React, { useEffect, useRef, useState } from 'react';
import ModuleShell from '@/components/ModuleShell';
import UploadDropzone from '@/components/UploadDropzone';
import { Button } from '@/components/ui/button';
import { MODULE_MAP } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { buildSampleImageDataUrl } from '@/lib/sampleData';
import { Contrast, Circle, GitBranch, RefreshCw } from 'lucide-react';
import ParameterSlider from '@/components/ParameterSlider';
import { useModulePrefill } from '@/hooks/useModulePrefill';

const applyFilter = (srcCanvas, filter, threshold) => {
  const w = srcCanvas.width, h = srcCanvas.height;
  const ctx = srcCanvas.getContext('2d');
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  if (filter === 'gray') {
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      d[i] = d[i+1] = d[i+2] = g;
    }
    ctx.putImageData(img, 0, 0);
  } else if (filter === 'threshold') {
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
      const v = g >= threshold ? 255 : 0;
      d[i] = d[i+1] = d[i+2] = v;
    }
    ctx.putImageData(img, 0, 0);
  } else if (filter === 'edge') {
    // Sobel
    const gray = new Uint8ClampedArray(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      gray[j] = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    }
    const out = new Uint8ClampedArray(d.length);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const gx =
          -gray[idx - w - 1] - 2*gray[idx - 1] - gray[idx + w - 1] +
           gray[idx - w + 1] + 2*gray[idx + 1] + gray[idx + w + 1];
        const gy =
          -gray[idx - w - 1] - 2*gray[idx - w] - gray[idx - w + 1] +
           gray[idx + w - 1] + 2*gray[idx + w] + gray[idx + w + 1];
        const g = Math.min(255, Math.hypot(gx, gy));
        const oi = idx * 4;
        out[oi] = out[oi+1] = out[oi+2] = g;
        out[oi+3] = 255;
      }
    }
    ctx.putImageData(new ImageData(out, w, h), 0, 0);
  }
};

const ImageProcessing = () => {
  const module = MODULE_MAP['image-processing'];
  const prefill = useModulePrefill('image-processing', { filter: 'none', threshold: 128 });
  const canvasRef = useRef(null);
  const [imgSrc, setImgSrc] = useState('');
  const [filename, setFilename] = useState(null);
  const [filter, setFilter] = useState(prefill.filter);
  const [threshold, setThreshold] = useState(prefill.threshold);

  useEffect(() => { setImgSrc(buildSampleImageDataUrl()); }, []);

  useEffect(() => {
    if (!imgSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const maxW = 480;
      const ratio = Math.min(1, maxW / img.width);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (filter !== 'none') applyFilter(canvas, filter, threshold);
    };
    img.src = imgSrc;
  }, [imgSrc, filter, threshold]);

  const handleFile = (f) => {
    const reader = new FileReader();
    reader.onload = () => setImgSrc(String(reader.result || ''));
    reader.readAsDataURL(f);
    setFilename(f.name);
    setFilter('none');
  };

  const reset = () => { setFilter('none'); setThreshold(128); };

  return (
    <ModuleShell
      module={module}
      explainer="Load a biomedical image (fluorescence, histology, OCT slice) and apply lightweight canvas-based filters: grayscale conversion, intensity thresholding, and Sobel edge detection."
      onSave={() => ({
        summary: `${filter === 'none' ? 'original' : filter} · ${filename || 'sample'}`,
        params: { filter, threshold, source: filename || 'sample' },
      })}
      controls={
        <>
          <UploadDropzone
            label="Upload image"
            hint="PNG · JPG · WEBP"
            accept="image/*"
            filename={filename}
            onFile={handleFile}
            onClear={() => { setImgSrc(buildSampleImageDataUrl()); setFilename(null); setFilter('none'); }}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              data-testid={VBOI.imgFilterGray}
              variant={filter === 'gray' ? 'default' : 'outline'}
              size="sm" onClick={() => setFilter('gray')}
            >
              <Contrast className="w-3.5 h-3.5" /> Grayscale
            </Button>
            <Button
              data-testid={VBOI.imgFilterThreshold}
              variant={filter === 'threshold' ? 'default' : 'outline'}
              size="sm" onClick={() => setFilter('threshold')}
            >
              <Circle className="w-3.5 h-3.5" /> Threshold
            </Button>
            <Button
              data-testid={VBOI.imgFilterEdge}
              variant={filter === 'edge' ? 'default' : 'outline'}
              size="sm" onClick={() => setFilter('edge')}
            >
              <GitBranch className="w-3.5 h-3.5" /> Edge
            </Button>
            <Button
              data-testid={VBOI.imgFilterReset}
              variant="ghost" size="sm" onClick={reset}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>
          {filter === 'threshold' && (
            <ParameterSlider
              label="Threshold"
              min={0} max={255} step={1}
              value={threshold} onChange={setThreshold}
              format={(v) => String(v)}
            />
          )}
        </>
      }
      output={
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Preview · filter: {filter}
          </div>
          <div className="rounded-lg border border-border overflow-hidden bg-[#020a10] flex items-center justify-center p-3">
            <canvas
              ref={canvasRef}
              data-testid={VBOI.imgCanvas}
              className="max-w-full h-auto rounded"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            All operations run client-side on the canvas — no data leaves the browser.
          </div>
        </div>
      }
    />
  );
};

export default ImageProcessing;
