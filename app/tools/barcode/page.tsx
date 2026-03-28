"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Barcode, Download, AlertCircle, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const BARCODE_TYPES = [
  { 
    value: "qrcode", 
    label: "QR Code", 
    example: "https://example.com",
    description: "文献へのリンク、学会ポスター、連絡先交換、電子決済。"
  },
  { 
    value: "ean13", 
    label: "EAN-13 (JAN)", 
    example: "4901234567894",
    description: "日本国内での市販製品（試薬・備品）の購入・管理。"
  },
  { 
    value: "upca", 
    label: "UPC-A", 
    example: "012345678905",
    description: "米国製ソフトウェアや機材、輸入品の管理。"
  },
  { 
    value: "code128", 
    label: "CODE 128", 
    example: "LAB-999-XYZ",
    description: "研究室の在庫管理。英数字を扱えるため、検体IDの管理に最適。"
  },
  { 
    value: "datamatrix", 
    label: "Data Matrix", 
    example: "SN-2026-X1",
    description: "微小物の管理。マイクロチューブの底面や小型電子部品の識別。"
  },
  { 
    value: "isbn", 
    label: "ISBN / ISSN", 
    example: "9784000088275",
    description: "図書（ISBN）や学術雑誌（ISSN）の特定と文献管理。"
  },
];

const COLOR_PRESETS = [
  { name: "白黒", fg: "#000000", bg: "#ffffff" },
  { name: "アイボリー黒", fg: "#000000", bg: "#f8f7e9" },
  { name: "淡グレー", fg: "#ced0d2", bg: "#f8f7e9" },
  { name: "青写真", fg: "#1e3a8a", bg: "#eff6ff" },
  { name: "セピア", fg: "#432818", bg: "#fefae0" },
];

export default function BarcodePage() {
  const [text, setText] = useState("https://example.com");
  const [barcodeType, setBarcodeType] = useState("qrcode");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false); // For text copy
  const [pngCopied, setPngCopied] = useState(false); // For image copy
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getScale = useCallback(() => {
    return 4; // サイズは常にM (scale 4)
  }, []);

  const generateBarcode = useCallback(async () => {
    if (!canvasRef.current) return;
    setError(null);
    
    // 内容が空の場合はキャンバスをクリアして終了
    if (!text.trim()) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      return;
    }

    try {
      const bwipjs = (await import("bwip-js")).default;
      const is2D = ["qrcode", "datamatrix"].includes(barcodeType);
      
      let activeBcid = barcodeType;
      const digitsOnly = text.replace(/[\s-]/g, ""); // スペース・ハイフン除去
      let finalUpdateText = text;

      // JAN, UPC, ISBN/ISSN の場合はハイフン抜きで処理
      if (["ean13", "upca", "isbn"].includes(barcodeType)) {
        finalUpdateText = digitsOnly;
        
        if (barcodeType === "isbn") {
          if (digitsOnly.length === 8) {
            activeBcid = "issn";
          } else if (digitsOnly.length === 13) {
            activeBcid = "ean13";
          } else {
            activeBcid = "isbn";
          }
        }
      }

      const options: any = {
        bcid: activeBcid,
        text: finalUpdateText,
        scale: getScale(),
        includetext: !is2D,
        textxalign: "center",
        backgroundcolor: bgColor.replace("#", ""),
        barcolor: fgColor.replace("#", ""),
        textcolor: fgColor.replace("#", ""),
      };

      if (!is2D) {
        options.height = 15;
      }

      // Canvas rendering
      bwipjs.toCanvas(canvasRef.current, options);

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`生成エラー: ${msg}`);
      
      // エラー時は古いバーコードを消去
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [text, barcodeType, getScale, fgColor, bgColor]);

  useEffect(() => {
    const timer = setTimeout(generateBarcode, 300);
    return () => clearTimeout(timer);
  }, [generateBarcode]);
  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${barcodeType}_${text.slice(0, 10).replace(/[^a-z0-9]/gi, "_")}.png`;
    a.click();
  };

  const handleCopyPng = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>(resolve => 
        canvas.toBlob(resolve, 'image/png')
      );
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setPngCopied(true);
        setTimeout(() => setPngCopied(false), 2000);
      }
    } catch {
      setError("画像のコピーに失敗しました。");
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const bwipjs = (await import("bwip-js")).default;
      const is2D = ["qrcode", "datamatrix"].includes(barcodeType);
      
      let activeBcid = barcodeType;
      const digitsOnly = text.replace(/[\s-]/g, "");
      let finalUpdateText = text;

      if (["ean13", "upca", "isbn"].includes(barcodeType)) {
        finalUpdateText = digitsOnly;
        if (barcodeType === "isbn") {
          if (digitsOnly.length === 8) {
            activeBcid = "issn";
          } else if (digitsOnly.length === 13) {
            activeBcid = "ean13";
          } else {
            activeBcid = "isbn";
          }
        }
      }

      const options: any = {
        bcid: activeBcid,
        text: finalUpdateText,
        scale: getScale(),
        includetext: !is2D,
        textxalign: "center",
        backgroundcolor: bgColor.replace("#", ""),
        barcolor: fgColor.replace("#", ""),
        textcolor: fgColor.replace("#", ""),
      };

      if (!is2D) {
        options.height = 15;
      }

      const svg = (bwipjs as any).toSVG(options);

      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${barcodeType}_${text.slice(0, 10).replace(/[^a-z0-9]/gi, "_")}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("SVG生成に失敗しました。");
    }
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedType = BARCODE_TYPES.find((t) => t.value === barcodeType);

  return (
    <div className="p-4 md:p-6 w-full max-w-[1400px] mx-auto space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-extrabold text-white bg-gradient-to-r from-rose-400 to-pink-500 text-transparent bg-clip-text">
          Barcode &amp; QR Generator
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">
          様々な形式のバーコードとQRコードを即座に生成。SVG/PNGで保存可能。
        </p>
      </div>
      <Separator className="bg-zinc-800/50" />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Settings - 7 cols */}
        <div className="xl:col-span-7 space-y-6">
          {/* Barcode type grid */}
          <div className="space-y-3">
            <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">形式を選択</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BARCODE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setBarcodeType(t.value);
                    setText(t.example);
                  }}
                  className={cn(
                    "px-4 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 text-left flex flex-col gap-1",
                    barcodeType === t.value
                      ? "bg-rose-500/20 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/30"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  )}
                >
                  <span className={cn(
                    "text-sm",
                    barcodeType === t.value ? "text-rose-300" : "text-zinc-200"
                  )}>{t.label}</span>
                  <span className="text-[10px] leading-tight text-zinc-500 opacity-80 font-normal">
                    {t.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-800/50" />

          {/* Text input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider">テキストデータ</Label>
              <button
                onClick={copyText}
                className="text-[10px] flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "コピーしました" : "サンプルをコピー"}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="内容を入力..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-shadow transition-colors"
              />
              {selectedType && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                   <Badge variant="outline" className="text-[10px] py-0 h-5 border-zinc-700 text-zinc-500 uppercase">
                    {selectedType.value}
                   </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Controls: Color - 2 Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colors: FG */}
            <div className="space-y-3">
              <Label className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest pl-1">前景色</Label>
              <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl h-12">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-8 h-full rounded-lg overflow-hidden border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 bg-transparent text-zinc-300 text-[11px] font-mono focus:outline-none uppercase"
                />
              </div>
            </div>

            {/* Colors: BG */}
            <div className="space-y-3">
              <Label className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest pl-1">背景色</Label>
              <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-xl h-12">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-full rounded-lg overflow-hidden border-0 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 bg-transparent text-zinc-300 text-[11px] font-mono focus:outline-none uppercase"
                />
              </div>
            </div>
          </div>

          {/* Color Presets */}
          <div className="space-y-3">
            <Label className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest pl-1">配色プリセット</Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setFgColor(p.fg);
                    setBgColor(p.bg);
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group"
                >
                  <div className="w-full h-4 rounded-full flex overflow-hidden ring-1 ring-zinc-800 shadow-inner">
                    <div style={{ backgroundColor: p.fg }} className="w-1/2 h-full" />
                    <div style={{ backgroundColor: p.bg }} className="w-1/2 h-full" />
                  </div>
                  <span className="text-[9px] text-zinc-500 group-hover:text-zinc-300 transition-colors uppercase font-bold">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Button
              onClick={handleCopyPng}
              disabled={!!error || !text.trim()}
              variant="outline"
              className="h-12 border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold gap-2 transition-all active:scale-[0.98]"
            >
              {pngCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-rose-400" />}
              {pngCopied ? "コピー済" : "画像をコピー"}
            </Button>
            <Button
              onClick={handleDownloadPng}
              disabled={!!error || !text.trim()}
              variant="outline"
              className="h-12 border-zinc-800 hover:bg-zinc-800 text-zinc-400 rounded-xl font-bold gap-2 transition-all active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              PNG 保存
            </Button>
            <Button
              onClick={handleDownloadSvg}
              disabled={!!error || !text.trim()}
              className="h-12 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold gap-2 shadow-lg shadow-rose-900/20 transition-all active:scale-[0.98] sm:col-span-1"
            >
              <Download className="w-4 h-4" />
              SVG 保存
            </Button>
          </div>
        </div>

        {/* Preview Area - 5 cols */}
        <div className="xl:col-span-5 flex flex-col items-center gap-6 pt-7">
          <div className="w-full aspect-square flex flex-col items-center justify-center rounded-[2rem] bg-zinc-900/40 border border-zinc-800/60 p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {!text.trim() || error ? (
              <div className="flex flex-col items-center gap-3 text-zinc-800">
                <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-inner">
                  <Barcode className="w-12 h-12" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{error ? "ERROR" : "Waiting"}</p>
              </div>
            ) : (
              <div className="relative z-10 w-full h-full flex items-center justify-center transition-all duration-500 group-hover:scale-[1.03]">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full rounded-xl shadow-2xl"
                  style={{ 
                    imageRendering: "pixelated",
                    boxShadow: `0 30px 60px -12px ${fgColor}25`
                  }}
                />
              </div>
            )}
          </div>
          
          {!error && text.trim() && (
            <div className="text-center space-y-2">
              <Badge variant="outline" className="bg-zinc-900/50 text-zinc-500 border-zinc-800 px-3 py-1 text-[10px] tracking-wider uppercase">
                {selectedType?.label}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
