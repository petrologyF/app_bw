"use client";

import { useState, useCallback, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import {
  FilePlus2,
  UploadCloud,
  Download,
  X,
  GripVertical,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PdfFile {
  id: string;
  file: File;
  pageCount: number;
}

export default function PdfMergePage() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const addFiles = useCallback(async (newFiles: File[]) => {
    setError(null);
    setResultUrl(null);
    const pdfs = newFiles.filter((f) => f.type === "application/pdf");
    if (pdfs.length !== newFiles.length) {
      setError("PDFファイルのみアップロードできます。");
    }
    const processed: PdfFile[] = [];
    for (const f of pdfs) {
      try {
        const buf = await f.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        processed.push({ id: crypto.randomUUID(), file: f, pageCount: doc.getPageCount() });
      } catch {
        setError(`"${f.name}" の読み込みに失敗しました。`);
      }
    }
    setFiles((prev) => [...prev, ...processed]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setResultUrl(null);
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };
  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const reordered = [...files];
      const [removed] = reordered.splice(dragItem.current, 1);
      reordered.splice(dragOverItem.current, 0, removed);
      setFiles(reordered);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("結合するには2つ以上のPDFが必要です。");
      return;
    }
    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setResultUrl(null);
    try {
      const mergedDoc = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const buf = await files[i].file.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => mergedDoc.addPage(p));
        setProgress(Math.round(((i + 1) / files.length) * 90));
      }
      const bytes = await mergedDoc.save();
      setProgress(100);
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError("PDF結合中にエラーが発生しました。");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-white bg-gradient-to-r from-emerald-400 to-teal-400 text-transparent bg-clip-text">
          PDF Merge
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">複数のPDFを順番に結合して1つのファイルに</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors bg-zinc-900/40 hover:bg-zinc-900/60"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
        />
        <div className="p-3 rounded-full bg-zinc-800 text-emerald-400">
          <UploadCloud className="w-7 h-7" />
        </div>
        <div className="text-center">
          <p className="text-zinc-300 font-medium">PDFをクリックまたはドロップして追加</p>
          <p className="text-zinc-500 text-sm">複数ファイル選択可・ドラッグで順序変更</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">
              結合順序（ドラッグで並び替え）
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                {files.length} ファイル
              </Badge>
              <Badge variant="outline" className="text-zinc-400 border-zinc-600">
                計 {totalPages} ページ
              </Badge>
            </div>
          </div>
          {files.map((f, index) => (
            <div
              key={f.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-emerald-500/30 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              <span className="text-xs font-mono text-zinc-500 w-5 text-center flex-shrink-0">
                {index + 1}
              </span>
              <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="flex-1 text-sm text-zinc-200 truncate">{f.file.name}</span>
              <span className="text-xs text-zinc-500 flex-shrink-0">{f.pageCount}p</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
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
            結合中... {progress}%
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Button
        onClick={handleMerge}
        disabled={files.length < 2 || isProcessing}
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2"
      >
        <FilePlus2 className="w-4 h-4" />
        PDFを結合
      </Button>

      {resultUrl && (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">結合完了 — merged.pdf</span>
          </div>
          <a
            href={resultUrl}
            download="merged.pdf"
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            ダウンロード
          </a>
        </div>
      )}
    </div>
  );
}
