"use client";

import { useState, useCallback, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { FileText, UploadCloud, Download, Scissors, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function PdfSplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [ranges, setRanges] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; url: string }[]>([]);
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
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      setPageCount(doc.getPageCount());
      setRanges(`1-${doc.getPageCount()}`);
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

  const parseRanges = (
    rangeStr: string,
    total: number
  ): Array<number[]> | null => {
    const parts = rangeStr.split(",").map((s) => s.trim());
    const result: Array<number[]> = [];
    for (const part of parts) {
      if (!part) continue;
      if (part.includes("-")) {
        const [a, b] = part.split("-").map(Number);
        if (isNaN(a) || isNaN(b) || a < 1 || b > total || a > b) return null;
        result.push(
          Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i)
        );
      } else {
        const n = Number(part);
        if (isNaN(n) || n < 1 || n > total) return null;
        result.push([n - 1]);
      }
    }
    return result.length ? result : null;
  };

  const handleSplit = async () => {
    if (!file || !ranges.trim()) return;
    setError(null);
    const parsed = parseRanges(ranges, pageCount);
    if (!parsed) {
      setError(`無効な範囲指定です。例: "1-3, 5, 7-10"（1〜${pageCount}の範囲で指定）`);
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    try {
      const srcBuf = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(srcBuf);
      const newResults: { name: string; url: string }[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const pages = parsed[i];
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, pages);
        copied.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const label =
          pages.length === 1
            ? `p${pages[0] + 1}`
            : `p${pages[0] + 1}-${pages[pages.length - 1] + 1}`;
        newResults.push({ name: `split_${label}.pdf`, url });
        setProgress(Math.round(((i + 1) / parsed.length) * 100));
      }
      setResults(newResults);
    } catch {
      setError("PDF分割中にエラーが発生しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white bg-gradient-to-r from-amber-400 to-orange-400 text-transparent bg-clip-text">
          PDF Split
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">PDFを指定したページ範囲で分割してダウンロード</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed border-zinc-700 hover:border-amber-500/50 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors bg-zinc-900/40 hover:bg-zinc-900/60"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
        />
        <div className="p-3 rounded-full bg-zinc-800 text-amber-400">
          <UploadCloud className="w-7 h-7" />
        </div>
        {file ? (
          <div className="text-center">
            <p className="text-zinc-100 font-medium flex items-center gap-2 justify-center">
              <FileText className="w-4 h-4 text-amber-400" />
              {file.name}
            </p>
            <p className="text-zinc-400 text-sm mt-1">
              {pageCount} ページ
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-zinc-300 font-medium">クリックまたはドロップしてPDFをアップロード</p>
            <p className="text-zinc-500 text-sm">PDF ファイルのみ対応</p>
          </div>
        )}
      </div>

      {/* Range input */}
      {file && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">
              ページ範囲（カンマ区切りで複数指定可）
            </label>
            <Badge variant="outline" className="text-amber-400 border-amber-500/30">
              {pageCount} ページ
            </Badge>
          </div>
          <input
            type="text"
            value={ranges}
            onChange={(e) => setRanges(e.target.value)}
            placeholder="例: 1-3, 5, 7-10"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder:text-zinc-500"
          />
          <p className="text-xs text-zinc-500">
            各範囲が個別のPDFファイルとして生成されます
          </p>
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
            処理中... {progress}%
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Button
        onClick={handleSplit}
        disabled={!file || isProcessing}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium gap-2"
      >
        <Scissors className="w-4 h-4" />
        PDFを分割
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">分割済みファイル</h3>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {results.length} ファイル
            </Badge>
          </div>
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-zinc-200">{r.name}</span>
                </div>
                <a
                  href={r.url}
                  download={r.name}
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  ダウンロード
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
