"use client";

import { useState, useRef } from "react";
import { 
  FileText, 
  UploadCloud, 
  Download, 
  Scissors, 
  FilePlus2, 
  FileImage, 
  X, 
  AlertCircle, 
  Loader2, 
  GripVertical,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface MergeFile {
  id: string;
  file: File;
  pageCount: number;
}

interface PageImage {
  page: number;
  dataUrl: string;
}

export default function PdfEditPage() {
  const [activeTab, setActiveTab] = useState("split");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- Split State ---
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitPageCount, setSplitPageCount] = useState(0);
  const [splitRanges, setSplitRanges] = useState("");
  const [splitResults, setSplitResults] = useState<{ name: string; url: string }[]>([]);
  const splitInputRef = useRef<HTMLInputElement>(null);

  // --- Merge State ---
  const [mergeFiles, setMergeFiles] = useState<MergeFile[]>([]);
  const [mergeResultUrl, setMergeResultUrl] = useState<string | null>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // --- Image State ---
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPageCount, setImgPageCount] = useState(0);
  const [imgScale, setImgScale] = useState(2);
  const [imgResults, setImgResults] = useState<PageImage[]>([]);
  const [copiedPage, setCopiedPage] = useState<number | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Helper: File Size Check
  const validateFileSize = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size too large (Max 100MB). Selected file: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return false;
    }
    return true;
  };

  // --- Split Logic ---
  const loadSplitFile = async (f: File) => {
    if (f.type !== "application/pdf") return setError("Please select a valid PDF file.");
    if (!validateFileSize(f)) return;
    setError(null);
    setSplitResults([]);
    setSplitFile(f);
    try {
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      setSplitPageCount(doc.getPageCount());
      setSplitRanges(`1-${doc.getPageCount()}`);
    } catch {
      setError("Failed to load PDF.");
      setSplitFile(null);
    }
  };

  const handleSplit = async () => {
    if (!splitFile || !splitRanges.trim()) return;
    setError(null);
    const parsed = parseRanges(splitRanges, splitPageCount);
    if (!parsed) {
      setError(`Invalid range format. Example: "1-3, 5, 7-10"`);
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    try {
      const srcBuf = await splitFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(srcBuf);
      const newResults: { name: string; url: string }[] = [];
      for (let i = 0; i < parsed.length; i++) {
        const pages = parsed[i];
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, pages);
        copied.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blob = new Blob([bytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const label = pages.length === 1 ? `p${pages[0] + 1}` : `p${pages[0] + 1}-${pages[pages.length - 1] + 1}`;
        newResults.push({ name: `split_${label}.pdf`, url });
        setProgress(Math.round(((i + 1) / parsed.length) * 100));
      }
      setSplitResults(newResults);
    } catch {
      setError("An error occurred during PDF splitting.");
    } finally {
      setIsProcessing(false);
    }
  };

  const parseRanges = (str: string, total: number): number[][] | null => {
    const parts = str.split(",").map(p => p.trim());
    const res: number[][] = [];
    for (const p of parts) {
      if (!p) continue;
      if (p.includes("-")) {
        const [a, b] = p.split("-").map(Number);
        if (isNaN(a) || isNaN(b) || a < 1 || b > total || a > b) return null;
        res.push(Array.from({ length: b - a + 1 }, (_, i) => a - 1 + i));
      } else {
        const n = Number(p);
        if (isNaN(n) || n < 1 || n > total) return null;
        res.push([n - 1]);
      }
    }
    return res.length ? res : null;
  };

  // --- Merge Logic ---
  const addMergeFiles = async (newFiles: File[]) => {
    setError(null);
    setMergeResultUrl(null);
    const pdfs = newFiles.filter(f => f.type === "application/pdf");
    for (const f of pdfs) {
      if (!validateFileSize(f)) continue;
      try {
        const buf = await f.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        setMergeFiles(prev => [...prev, { id: crypto.randomUUID(), file: f, pageCount: doc.getPageCount() }]);
      } catch {
        setError(`Failed to load "${f.name}".`);
      }
    }
  };

  const handleMerge = async () => {
    if (mergeFiles.length < 2) return setError("At least 2 PDFs are required to merge.");
    setError(null);
    setIsProcessing(true);
    setProgress(0);
    try {
      const mergedDoc = await PDFDocument.create();
      for (let i = 0; i < mergeFiles.length; i++) {
        const buf = await mergeFiles[i].file.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => mergedDoc.addPage(p));
        setProgress(Math.round(((i + 1) / mergeFiles.length) * 90));
      }
      const bytes = await mergedDoc.save();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMergeResultUrl(URL.createObjectURL(new Blob([bytes as any], { type: "application/pdf" })));
      setProgress(100);
    } catch {
      setError("An error occurred during PDF merging.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const re = [...mergeFiles];
      const [remed] = re.splice(dragItem.current, 1);
      re.splice(dragOverItem.current, 0, remed);
      setMergeFiles(re);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // --- Image Logic ---
  const loadImgFile = async (f: File) => {
    if (f.type !== "application/pdf") return setError("Please select a valid PDF file.");
    if (!validateFileSize(f)) return;
    setError(null);
    setImgResults([]);
    setImgFile(f);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      setImgPageCount(pdf.numPages);
    } catch {
      setError("Failed to load PDF.");
      setImgFile(null);
    }
  };

  const handleToImage = async () => {
    if (!imgFile) return;
    setError(null);
    setIsProcessing(true);
    setProgress(0);
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const buf = await imgFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const res: PageImage[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: imgScale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = vp.width;
        canvas.height = vp.height;
        if (ctx) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await page.render({ canvasContext: ctx, viewport: vp } as any).promise;
          res.push({ page: i, dataUrl: canvas.toDataURL("image/png") });
        }
        setProgress(Math.round((i / pdf.numPages) * 100));
      }
      setImgResults(res);
    } catch {
      setError("An error occurred during PDF conversion.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPage = async (dataUrl: string, pageNum: number) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      setCopiedPage(pageNum);
      setTimeout(() => setCopiedPage(null), 2000);
    } catch {
      setError("Failed to copy image.");
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="mb-2">
          <h2 className="text-2xl font-extrabold text-white bg-gradient-to-r from-amber-400 to-orange-400 text-transparent bg-clip-text">
            Edit PDF
          </h2>
          <p className="text-zinc-400 text-sm mt-0.5">Split, Merge, &amp; Convert PDFs (Max 100MB)</p>
        </div>
        <Tabs defaultValue="split" onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <TabsTrigger value="split" className="gap-2 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-400">
              <Scissors className="w-3.5 h-3.5" /> Split
            </TabsTrigger>
            <TabsTrigger value="merge" className="gap-2 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400">
              <FilePlus2 className="w-3.5 h-3.5" /> Merge
            </TabsTrigger>
            <TabsTrigger value="image" className="gap-2 rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-sky-400">
              <FileImage className="w-3.5 h-3.5" /> Convert to Image
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator className="bg-zinc-800/50" />

      {/* Common Error Display */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl px-5 py-4 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* --- SPLIT TAB --- */}
        {activeTab === "split" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div 
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); e.dataTransfer.files?.[0] && loadSplitFile(e.dataTransfer.files[0]); }}
              onClick={() => splitInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-blue-500/50 rounded-[2rem] h-56 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all bg-zinc-900/40 hover:bg-zinc-900/60 group px-6"
            >
              <input ref={splitInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files?.[0] && loadSplitFile(e.target.files[0])} />
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-blue-400" />
              </div>
              {splitFile ? (
                <div className="text-center truncate max-w-full">
                  <p className="text-zinc-100 font-bold truncate px-4">{splitFile.name}</p>
                  <Badge variant="outline" className="mt-2 border-zinc-700 text-zinc-500 uppercase tracking-tighter">{splitPageCount} Pages</Badge>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-zinc-300 font-bold text-lg">Extract Pages</p>
                  <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-black">Drop file center</p>
                </div>
              )}
            </div>

            {splitFile && (
              <div className="space-y-4 bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300 font-bold">Pages to Extract</Label>
                  <Badge className="bg-blue-500/20 text-blue-400 border-none">Total: {splitPageCount}</Badge>
                </div>
                <input 
                  type="text" value={splitRanges} onChange={e => setSplitRanges(e.target.value)} 
                  placeholder="e.g., 1-3, 5, 7-10"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-blue-500/40 outline-none"
                />
                <Button onClick={handleSplit} disabled={isProcessing} className="w-full h-12 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scissors className="w-4 h-4 mr-2" />}
                  Extract &amp; Save
                </Button>
              </div>
            )}

            {splitResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {splitResults.map(r => (
                  <div key={r.url} className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl group hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="text-sm font-medium text-zinc-300">{r.name}</span>
                    </div>
                    <a href={r.url} download={r.name} className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400">
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- MERGE TAB --- */}
        {activeTab === "merge" && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div 
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addMergeFiles(Array.from(e.dataTransfer.files)); }}
              onClick={() => mergeInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-[2rem] h-56 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all bg-zinc-900/40 hover:bg-zinc-900/60 group px-6"
            >
              <input ref={mergeInputRef} type="file" multiple accept="application/pdf" className="hidden" onChange={e => e.target.files && addMergeFiles(Array.from(e.target.files))} />
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-400 group-hover:scale-110 transition-transform">
                <FilePlus2 className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-zinc-300 font-bold text-lg">Merge PDFs</p>
                <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-black">Drag & drop multiple files</p>
              </div>
            </div>

            {mergeFiles.length > 0 && (
              <div className="space-y-3">
                 <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Merge List</span>
                    <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">{mergeFiles.length} files</Badge>
                 </div>
                 <div className="space-y-2">
                    {mergeFiles.map((f, i) => (
                      <div 
                        key={f.id} draggable onDragStart={() => dragItem.current = i} onDragEnter={() => dragOverItem.current = i} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                        className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:border-emerald-500/30 group"
                      >
                        <GripVertical className="w-4 h-4 text-zinc-700" />
                        <span className="w-6 text-xs font-black text-rose-500/40">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-200 truncate">{f.file.name}</p>
                          <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">{f.pageCount} pages</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setMergeFiles(prev => prev.filter(x => x.id !== f.id)); }} className="text-zinc-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                 </div>
                 <Button onClick={handleMerge} disabled={mergeFiles.length < 2 || isProcessing} className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 rounded-[1.2rem] font-black text-lg shadow-xl shadow-emerald-900/20">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FilePlus2 className="w-5 h-5 mr-2" />}
                    Merge into One PDF
                 </Button>
              </div>
            )}

            {mergeResultUrl && (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-between animate-in zoom-in-95 grow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Merge Complete!</p>
                    <p className="text-xs text-emerald-500/60 uppercase font-bold tracking-widest">merged_document.pdf</p>
                  </div>
                </div>
                <a href={mergeResultUrl} download="merged.pdf" className="p-4 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-2xl text-emerald-400 transition-colors">
                  <Download className="w-6 h-6" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* --- IMAGE TAB --- */}
        {activeTab === "image" && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div 
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); e.dataTransfer.files?.[0] && loadImgFile(e.dataTransfer.files[0]); }}
              onClick={() => imgInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-sky-500/50 rounded-[2rem] h-56 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all bg-zinc-900/40 hover:bg-zinc-900/60 group px-6"
            >
              <input ref={imgInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files?.[0] && loadImgFile(e.target.files[0])} />
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 group-hover:scale-110 transition-transform">
                <FileImage className="w-8 h-8 text-sky-400" />
              </div>
              {imgFile ? (
                <div className="text-center truncate max-w-full">
                  <p className="text-zinc-100 font-bold truncate px-4">{imgFile.name}</p>
                  <p className="text-zinc-500 text-xs mt-1 uppercase tracking-tighter">{imgPageCount} Pages</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-zinc-300 font-bold text-lg">Convert PDF to Image</p>
                  <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-black">Export to PNG</p>
                </div>
              )}
            </div>

            {imgFile && (
              <div className="space-y-5 bg-zinc-900/40 p-6 rounded-[2rem] border border-zinc-800">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-300 font-bold">Resolution Settings</Label>
                  <Badge className="bg-sky-500/20 text-sky-400 border-none font-mono tracking-tighter uppercase">{Math.round(72 * imgScale)} DPI ({imgScale}x)</Badge>
                </div>
                <Slider 
                   min={1} max={4} step={1} 
                   value={[imgScale]} 
                   onValueChange={(val) => setImgScale(Array.isArray(val) ? val[0] : val)} 
                   className="py-2" 
                />
                <div className="flex justify-between text-[10px] text-zinc-600 font-bold tracking-widest uppercase">
                   <span>Standard (72)</span>
                   <span>High (144)</span>
                   <span>Print (288)</span>
                </div>
                <Button onClick={handleToImage} disabled={isProcessing} className="w-full h-12 bg-sky-600 hover:bg-sky-500 rounded-xl font-bold">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                  Convert All to PNG
                </Button>
              </div>
            )}

            {imgResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {imgResults.map(r => (
                  <div key={r.page} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/80">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.dataUrl} alt={`Page ${r.page}`} className="w-full h-full object-contain p-2" />
                    <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all px-2">
                       <div className="flex gap-2">
                         <button
                           onClick={() => handleCopyPage(r.dataUrl, r.page)}
                           className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                           title="Copy Image"
                         >
                           {copiedPage === r.page ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                         </button>
                         <a 
                           href={r.dataUrl} 
                           download={`page_${r.page}.png`} 
                           className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"
                           title="Download PNG"
                         >
                            <Download className="w-5 h-5" />
                         </a>
                       </div>
                       <span className="text-[10px] text-white/50 font-bold tracking-widest uppercase">
                         {copiedPage === r.page ? "Copied!" : `PAGE ${r.page}`}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="fixed bottom-8 right-8 w-80 bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-5">
           <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Processing</span>
                <span className="text-xs font-mono text-zinc-500">{progress}%</span>
              </div>
              <Progress value={progress} className={cn(
                "h-1.5 transition-all",
                activeTab === "split" ? "bg-blue-900/20 indicator-blue-500" : 
                activeTab === "merge" ? "bg-emerald-900/20 indicator-emerald-500" : "bg-sky-900/20 indicator-sky-500"
              )} />
              <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Please keep this window open...</p>
           </div>
        </div>
      )}
    </div>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full", className)} />;
}
