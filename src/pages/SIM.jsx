import React, { useEffect, useRef, useState } from 'react';
import ModuleShell from '@/components/ModuleShell';
import { MODULE_MAP } from '@/lib/moduleConfig';
import { VBOI } from '@/constants/testIds/vboi';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * Draws two panels: a diffraction-limited blob (widefield) and a
 * sharpened / patterned version (SIM). Illustrative only.
 */
const drawPanel = (canvas, sim) => {
  if (!canvas) return;
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#050f14';
  ctx.fillRect(0, 0, w, h);

  const targets = [
    { x: 0.28, y: 0.35, r: sim ? 8 : 22 },
    { x: 0.42, y: 0.38, r: sim ? 6 : 20 },
    { x: 0.55, y: 0.60, r: sim ? 7 : 22 },
    { x: 0.72, y: 0.42, r: sim ? 5 : 18 },
    { x: 0.32, y: 0.68, r: sim ? 6 : 20 },
  ];

  targets.forEach((t) => {
    const cx = t.x * w, cy = t.y * h;
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, t.r);
    grad.addColorStop(0, sim ? 'rgba(255,220,140,1)' : 'rgba(240,200,100,0.9)');
    grad.addColorStop(1, 'rgba(240,200,100,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, t.r, 0, Math.PI * 2); ctx.fill();
  });

  if (sim) {
    // Faint grid overlay (illumination pattern reconstruction hint)
    ctx.strokeStyle = 'rgba(240,180,60,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
  }
};

const SIM = () => {
  const module = MODULE_MAP['sim'];
  const [on, setOn] = useState(true);
  const beforeRef = useRef(null);
  const afterRef = useRef(null);

  useEffect(() => {
    [beforeRef.current, afterRef.current].forEach((c) => {
      if (c) { c.width = 380; c.height = 220; }
    });
    drawPanel(beforeRef.current, false);
    drawPanel(afterRef.current, on);
  }, [on]);

  return (
    <ModuleShell
      module={module}
      explainer="Structured Illumination Microscopy encodes high-frequency information into the passband of the microscope by illuminating with a fine pattern. Toggle SIM to see the illustrative resolution gain against a widefield reference."
      onSave={() => ({
        summary: `SIM ${on ? 'enabled' : 'disabled'} — illustrative`,
        params: { simEnabled: on },
      })}
      controls={
        <>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <Label className="text-sm font-medium">Structured illumination</Label>
              <div className="text-xs text-muted-foreground">Reconstruction on/off</div>
            </div>
            <Switch
              data-testid={VBOI.simToggle}
              checked={on}
              onCheckedChange={setOn}
            />
          </div>
          <div className="rounded-lg border border-border p-3 space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Lateral resolution</span>
              <span className="font-mono text-primary">{on ? '~2× improved' : 'diffraction-limited'}</span></div>
            <div className="flex justify-between"><span>Frames required</span>
              <span className="font-mono text-primary">{on ? '9 (3 phases × 3 angles)' : '1'}</span></div>
            <div className="flex justify-between"><span>Post-processing</span>
              <span className="font-mono text-primary">{on ? 'Fourier reconstruction' : 'none'}</span></div>
          </div>
        </>
      }
      output={
        <div data-testid={VBOI.simComparison}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Panel label="Widefield reference">
              <canvas ref={beforeRef} className="w-full h-auto rounded-md" />
            </Panel>
            <Panel label={`SIM · ${on ? 'reconstructed' : 'idle'}`} accent={on}>
              <canvas ref={afterRef} className="w-full h-auto rounded-md" />
            </Panel>
          </div>
          <div className="mt-4 text-xs text-muted-foreground leading-relaxed">
            The right-hand panel is a schematic representation: sharper blobs illustrate the
            resolution improvement. Replace with your real SIM reconstruction (uploaded image) later.
          </div>
        </div>
      }
    />
  );
};

const Panel = ({ label, children, accent }) => (
  <div className={`rounded-xl border p-3 bg-[#020a10] ${accent ? 'border-accent/50' : 'border-border'}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-white/60">{label}</span>
      {accent && <span className="text-[10px] font-mono text-accent-foreground bg-accent/90 px-1.5 py-0.5 rounded">ON</span>}
    </div>
    {children}
  </div>
);

export default SIM;
