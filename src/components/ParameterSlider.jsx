import React from 'react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

/**
 * ParameterSlider - a labelled slider with live numeric readout.
 */
const ParameterSlider = ({
  label,
  units,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
  hint,
  testId,
  className,
}) => {
  const display = format ? format(value) : `${value}${units ? ` ${units}` : ''}`;
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="vboi-value text-sm">{display}</span>
      </div>
      <Slider
        data-testid={testId}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
      <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
        <span>{format ? format(min) : `${min}${units ? ` ${units}` : ''}`}</span>
        {hint && <span className="normal-case tracking-normal">{hint}</span>}
        <span>{format ? format(max) : `${max}${units ? ` ${units}` : ''}`}</span>
      </div>
    </div>
  );
};

export default ParameterSlider;
