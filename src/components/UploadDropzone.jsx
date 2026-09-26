import React from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Compact upload dropzone. Accepts a File and calls onFile.
 * `accept` is passed to the underlying <input>.
 */
const UploadDropzone = ({
  label = 'Upload file',
  hint = 'or drop it here',
  accept,
  onFile,
  testId,
  filename,
  onClear,
  className,
}) => {
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef(null);

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={cn(
        'rounded-lg border-2 border-dashed px-3 py-3 flex items-center gap-3 transition-colors',
        drag ? 'border-accent bg-accent/5' : 'border-border bg-muted/40',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        data-testid={testId}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Upload className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-primary hover:underline"
        >
          {filename ? 'Replace file' : label}
        </button>
        <div className="text-[11px] text-muted-foreground truncate">
          {filename ? filename : hint}
        </div>
      </div>
      {filename && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="p-1 rounded hover:bg-muted"
          aria-label="Remove file"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default UploadDropzone;
