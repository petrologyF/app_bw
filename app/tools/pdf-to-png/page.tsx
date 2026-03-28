"use client";

import { useState, useCallback, useRef } from "react";
import {
  FileImage,
  UploadCloud,
  Download,
  AlertCircle,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface PageResult {
  page: number;
  dataUrl: string;
}

export default function PdfToPngPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(2); // 2x = ~144 DPI
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<PageResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (f: File) => {
    if (f.type !== "application/pdf") {
      setError("PDFファイルを選択してください。");
      return;
    }
    setError(null);
    setResults([]);
    setFile(f);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      setPageCount(pdf.numPages);
    } catch {
      setError("PDFの読み込みに失敗しました。");
      setFile(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) loadFile(f);
    },
    [loadFile]
  );

  const handleConvert = async () => {
    if (!file) return;
    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const newResults: PageResult[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        await page.render({ canvasContext: ctx, viewport }).promise;
        newResults.push({ page: i, dataUrl: canvas.toDataURL("image/png") });
        setProgress(Math.round((i / pdf.numPages) * 100));
      }
      setResults(newResults);
    } catch {
      setError("PDF変換中にエラーが発生しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  const dpi = Math.round(72 * scale);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white bg-gradient-to-r from-sky-400 to-cyan-400 text-transparent bg-clip-text">
          PDF to PNG
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">PDFの各ページをPNG画像に変換してダウンロード</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-zinc-700 hover:border-sky-500/50 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors bg-zinc-900/40 hover:bg-zinc-900/60"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
        />
        <div className="p-3 rounded-full bg-zinc-800 text-sky-400">
          <UploadCloud className="w-7 h-7" />
        </div>
        {file ? (
          <div className="text-center">
            <p className="text-zinc-100 font-medium flex items-center gap-2 justify-center">
              <FileText className="w-4 h-4 text-sky-400" />
              {file.name}
            </p>
            <p className="text-zinc-400 text-sm mt-1">{pageCount} ページ</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-zinc-300 font-medium">クリックまたはドロップしてPDFをアップロード</p>
            <p className="text-zinc-500 text-sm">各ページが個別のPNGになります</p>
          </div>
        )}
      </div>

      {/* Resolution slider */}
      {file && (
        <div className="space-y-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <Label className="text-zinc-300">解像度スケール</Label>
            <Badge variant="outline" className="text-sky-400 border-sky-500/30 font-mono">
              {scale}x &nbsp;≈&nbsp; {dpi} DPI
            </Badge>
          </div>
          <Slider
            min={1}
            max={4}
            step={0.5}
            value={[scale]}
            onValueChange={([v]) => setScale(v)}
            className="accent-sky-500"
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>1x (72 DPI)</span>
            <span>2x (144 DPI)</span>
            <span>4x (288 DPI)</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            変換中... {progress}%
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Button
        onClick={handleConvert}
        disabled={!file || isProcessing}
        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium gap-2"
      >
        <FileImage className="w-4 h-4" />
        PNGに変換
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-zinc-300">変換完了 — {results.length} ページ</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {results.map((r) => (
              <div key={r.page} className="group relative rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.dataUrl} alt={`Page ${r.page}`} className="w-full object-contain" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                  <a
                    href={r.dataUrl}
                    download={`page_${r.page}.png`}
                    className="flex flex-col items-center gap-1 text-white"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-xs">Page {r.page}</span>
                  </a>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-xs text-center py-1 text-zinc-300">
                  P{r.page}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
