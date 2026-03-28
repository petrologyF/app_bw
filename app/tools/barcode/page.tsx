"use client";

import { useState, useRef, useEffect } from "react";
import { Barcode, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const BARCODE_TYPES = [
  { value: "code128", label: "CODE 128", example: "Hello World 123" },
  { value: "ean13", label: "EAN-13", example: "5901234123457" },
  { value: "ean8", label: "EAN-8", example: "12345670" },
  { value: "upca", label: "UPC-A", example: "012345678905" },
  { value: "code39", label: "CODE 39", example: "HELLO-123" },
  { value: "qrcode", label: "QR Code", example: "https://example.com" },
  { value: "datamatrix", label: "Data Matrix", example: "Hello" },
  { value: "pdf417", label: "PDF417", example: "Hello World" },
];

export default function BarcodePage() {
  const [text, setText] = useState("Hello World 123");
  const [barcodeType, setBarcodeType] = useState("code128");
  const [scale, setScale] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateBarcode = async () => {
      if (!canvasRef.current || !text.trim()) return;
      setError(null);
      try {
        const bwipjs = (await import("bwip-js")).default;
        bwipjs.toCanvas(canvasRef.current, {
          bcid: barcodeType,
          text: text,
          scale: scale,
          height: barcodeType === "qrcode" || barcodeType === "datamatrix" || barcodeType === "pdf417" ? 30 : 15,
          includetext: !["qrcode", "datamatrix"].includes(barcodeType),
          textxalign: "center",
          backgroundcolor: "09090b",
          barcolor: "e4e4e7",
          textcolor: "e4e4e7",
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`生成エラー: ${msg}`);
      }
    };

    const timer = setTimeout(generateBarcode, 300);
    return () => clearTimeout(timer);
  }, [text, barcodeType, scale]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode_${barcodeType}.png`;
    a.click();
  };

  const selectedType = BARCODE_TYPES.find((t) => t.value === barcodeType);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white bg-gradient-to-r from-rose-400 to-pink-400 text-transparent bg-clip-text">
          Barcode Generator
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">様々な形式のバーコードを生成してダウンロード</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings */}
        <div className="space-y-5">
          {/* Barcode type */}
          <div className="space-y-2">
            <Label className="text-zinc-300">バーコード形式</Label>
            <div className="grid grid-cols-2 gap-2">
              {BARCODE_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setBarcodeType(t.value);
                    setText(t.example);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm text-left border transition-all ${
                    barcodeType === t.value
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Text input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">テキストデータ</Label>
              {selectedType && (
                <Badge variant="outline" className="text-rose-400 border-rose-500/30 text-xs">
                  例: {selectedType.example}
                </Badge>
              )}
            </div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="バーコードに埋め込むテキスト"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 placeholder:text-zinc-500"
            />
          </div>

          {/* Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">スケール</Label>
              <Badge variant="outline" className="text-rose-400 border-rose-500/30 font-mono">
                {scale}x
              </Badge>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`flex-1 py-1.5 rounded-lg text-sm border transition-all ${
                    scale === s
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleDownload}
            disabled={!!error || !text.trim()}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-medium gap-2"
          >
            <Download className="w-4 h-4" />
            PNG でダウンロード
          </Button>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full flex flex-col items-center justify-center rounded-2xl bg-zinc-900/60 border border-zinc-700 p-6 min-h-48 gap-4 shadow-2xl">
            {!text.trim() || error ? (
              <div className="flex flex-col items-center gap-2 text-zinc-600">
                <Barcode className="w-12 h-12" />
                <p className="text-sm">{error ? "エラー" : "テキストを入力してください"}</p>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="max-w-full rounded-md"
                style={{ imageRendering: "pixelated" }}
              />
            )}
          </div>
          {!error && text.trim() && (
            <p className="text-xs text-zinc-500 text-center">
              {selectedType?.label} — &quot;{text}&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
