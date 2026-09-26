import { useState } from 'react';
import { useInstrument } from '@/context/InstrumentContext';

/**
 * Returns the initial params for a module, merging saved snapshot params
 * (from the most recent result of this moduleId) on top of provided defaults.
 * Captured ONCE on component mount so future context updates don't reset sliders.
 */
export const useModulePrefill = (moduleId, defaults) => {
  const { results } = useInstrument();
  const [prefill] = useState(() => {
    const latest = results.find((r) => r.moduleId === moduleId);
    if (!latest || !latest.payload || !latest.payload.params) return defaults;
    return { ...defaults, ...latest.payload.params };
  });
  return prefill;
};
