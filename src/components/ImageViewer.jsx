import React from 'react';
import { cn } from '@/lib/utils';

/**
 * ImageViewer — shows an image (dataUrl or URL) inside a bordered, letterboxed frame
 * with a small footer strip for metadata.
 */
const ImageViewer = ({ src, alt = '', overlay, footer, testId, className, aspect = 'aspect-[16/9]' }) => {
  return (
    <div data-testid={testId} className={cn('vboi-card p-2 overflow-hidden', className)}>
      <div className={cn('relative w-full rounded-md bg-[#020a10] overflow-hidden', aspect)}>
        {src ? (
          <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/40 font-mono uppercase tracking-widest">
            No image loaded
          </div>
        )}
        <div className="absolute inset-0 vboi-scanline pointer-events-none" />
        {overlay}
      </div>
      {footer && (
        <div className="px-2 py-2 text-[11px] font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;
