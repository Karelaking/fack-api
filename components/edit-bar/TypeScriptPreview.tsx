"use client";

import * as React from "react";
import { RiFileCopyLine, RiDownloadLine, RiLoader2Line, RiCodeLine, RiCheckLine } from "@remixicon/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface TypeScriptPreviewProps {
  routeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog component to compile, display, and download TypeScript interfaces.
 */
export function TypeScriptPreview({
  routeId,
  open,
  onOpenChange,
}: TypeScriptPreviewProps): React.JSX.Element {
  const [loading, setLoading] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const fetchCode = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/typescript/${routeId}`);
      if (!res.ok) throw new Error("Failed to load Types");
      const text = await res.text();
      setCode(text);
    } catch (err) {
      toast.error("Failed to generate TypeScript interface");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCode();
    }
  }, [open, fetchCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `types.d.ts`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Type definition file downloaded!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-h-150 flex-col sm:max-w-150">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <RiCodeLine className="text-primary h-5 w-5" />
            <span>TypeScript Definition</span>
          </DialogTitle>
          <DialogDescription>
            Download or copy static type contracts compiled from your JSON
            response schema.
          </DialogDescription>
        </DialogHeader>

        {/* Code Viewport */}
        <div className="bg-muted border-border text-foreground relative min-h-0 flex-1 overflow-auto rounded-lg border p-4 font-mono text-xs">
          {loading ? (
            <div className="bg-muted/50 absolute inset-0 flex items-center justify-center">
              <RiLoader2Line className="text-primary h-6 w-6 animate-spin" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap">
              {code || "// Empty Schema"}
            </pre>
          )}
        </div>

        <DialogFooter className="border-border flex shrink-0 flex-row justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={loading || !code}
            className="gap-1.5 text-xs font-semibold"
          >
            {copied ? (
              <RiCheckLine className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <RiFileCopyLine className="h-3.5 w-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleDownload}
            disabled={loading || !code}
            className="gap-1.5 text-xs font-semibold"
          >
            <RiDownloadLine className="h-3.5 w-3.5" />
            <span>Download .d.ts</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default TypeScriptPreview;
