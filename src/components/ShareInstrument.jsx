import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, ExternalLink, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useInstrument } from '@/context/InstrumentContext';
import { buildShareUrl } from '@/lib/shareEncoding';
import { VBOI } from '@/constants/testIds/vboi';

const ShareInstrument = () => {
  const { results, selected, projectName } = useInstrument();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = useMemo(
    () => buildShareUrl({ results, selected, projectName }),
    [results, selected, projectName]
  );
  const truncated = url.length > 120 ? url.slice(0, 120) + '…' : url;
  const size = new Blob([url]).size;
  const qrOk = url.length <= 2900;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Share link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not access clipboard — select and copy manually');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-testid={VBOI.shareBtn}
          className="w-full flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 hover:border-primary/40 transition-colors"
          disabled={results.length === 0}
          title={results.length === 0 ? 'Save at least one snapshot before sharing' : 'Share this instrument'}
        >
          <Share2 className="w-3.5 h-3.5" />
          Share instrument
        </button>
      </DialogTrigger>
      <DialogContent data-testid={VBOI.shareDialog} className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share &ldquo;{projectName}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Everything on your Results Dashboard is encoded into this URL. Copy the link or scan the
            QR code to open the instrument on another device — nothing is uploaded, the data lives
            entirely in the URL fragment.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          {/* Left column: URL + payload */}
          <div className="space-y-3 min-w-0">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Payload</div>
              <div className="text-sm font-mono break-all text-primary max-h-24 overflow-hidden">{truncated}</div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                data-testid={VBOI.shareInput}
                value={url}
                readOnly
                onFocus={(e) => e.target.select()}
                className="font-mono text-xs"
              />
              <Button
                data-testid={VBOI.shareCopy}
                onClick={copy}
                variant="default"
                className="shrink-0 bg-primary"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <Stat label="Snapshots" value={String(results.length)} />
              <Stat label="Combined" value={String(selected.length)} />
              <Stat label="URL size" value={`${(size / 1024).toFixed(1)} kB`} />
            </div>
          </div>

          {/* Right column: QR code */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <QrCode className="w-3 h-3" />
              Scan
            </div>
            <div data-testid={VBOI.shareQr} className="rounded-lg border border-border bg-white p-3">
              {qrOk ? (
                <QRCodeSVG
                  value={url}
                  size={168}
                  level="L"
                  bgColor="#ffffff"
                  fgColor="hsl(192, 70%, 22%)"
                  marginSize={0}
                />
              ) : (
                <div className="w-[168px] h-[168px] flex flex-col items-center justify-center text-center text-xs text-muted-foreground p-4">
                  <QrCode className="w-8 h-8 mb-2 opacity-30" />
                  URL too large<br />for a QR code
                </div>
              )}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
              {qrOk ? 'Error correction · L' : `${(size / 1024).toFixed(1)} kB / 2.9 kB max`}
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between gap-2 flex-wrap">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" /> Test link in a new tab
          </a>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-md bg-muted/40 border border-border py-1.5">
    <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="text-sm font-mono text-primary">{value}</div>
  </div>
);

export default ShareInstrument;
