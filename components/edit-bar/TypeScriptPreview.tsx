"use client";

import * as React from "react";
import { Copy, Download, Loader2, Code, Check } from "lucide-react";
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
}: TypeScriptPreviewProps) {
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
      <DialogContent className="sm:max-w-150 flex flex-col h-[80vh] max-h-150">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            <span>TypeScript Definition</span>
          </DialogTitle>
          <DialogDescription>
            Download or copy static type contracts compiled from your JSON response schema.
          </DialogDescription>
        </DialogHeader>

        {/* Code Viewport */}
        <div className="flex-1 min-h-0 bg-muted border border-border rounded-lg p-4 overflow-auto font-mono text-xs text-foreground relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <pre className="whitespace-pre-wrap">{code || "// Empty Schema"}</pre>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-4 border-t border-border flex flex-row justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy} disabled={loading || !code} className="gap-1.5 text-xs font-semibold">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </Button>
          <Button type="button" size="sm" onClick={handleDownload} disabled={loading || !code} className="gap-1.5 text-xs font-semibold">
            <Download className="h-3.5 w-3.5" />
            <span>Download .d.ts</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default TypeScriptPreview;
