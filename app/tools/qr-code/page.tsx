"use client";

import { useState } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { QrCode, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type ErrorLevel = "L" | "M" | "Q" | "H";

export default function QrCodePage() {
  const [text, setText] = useState("https://example.com");
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#000000");
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");
  const [includeMargin, setIncludeMargin] = useState(true);
  const [copied, setCopied] = useState(false);

  const downloadSvg = () => {
    const svgEl = document.getElementById("qr-svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.png";
    a.click();
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = text.trim().length > 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-white bg-gradient-to-r from-violet-400 to-purple-400 text-transparent bg-clip-text">
          QR Code Generator
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">テキスト・URLからQRコードをリアルタイム生成</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings panel */}
        <div className="space-y-5">
          {/* Text input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">テキスト / URL</Label>
              <span className="text-xs text-zinc-500">{text.length} 文字</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://example.com"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 placeholder:text-zinc-500 resize-none"
            />
          </div>

          <Separator className="bg-zinc-800" />

          {/* Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-300">サイズ</Label>
              <Badge variant="outline" className="text-violet-400 border-violet-500/30 font-mono">
                {size} × {size} px
              </Badge>
            </div>
            <Slider
              min={128}
              max={512}
              step={32}
              value={[size]}
              onValueChange={([v]) => setSize(v)}
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">前景色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-9 p-1 rounded bg-zinc-800 cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="flex-1 bg-zinc-800 text-zinc-200 text-sm rounded-md px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300 text-sm">背景色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-9 p-1 rounded bg-zinc-800 cursor-pointer border-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="flex-1 bg-zinc-800 text-zinc-200 text-sm rounded-md px-3 py-2 border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Error correction */}
          <div className="space-y-2">
            <Label className="text-zinc-300 text-sm">エラー訂正レベル</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["L", "M", "Q", "H"] as ErrorLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setErrorLevel(level)}
                  className={`py-2 rounded-lg text-sm font-semibold border transition-all ${
                    errorLevel === level
                      ? "bg-violet-600/30 border-violet-500/50 text-violet-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500">L=7% / M=15% / Q=25% / H=30% 復元可能</p>
          </div>

          {/* Margin */}
          <div className="flex items-center justify-between">
            <Label className="text-zinc-300 text-sm">余白（マージン）</Label>
            <Switch
              checked={includeMargin}
              onCheckedChange={setIncludeMargin}
            />
          </div>

          <Separator className="bg-zinc-800" />

          {/* Download buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={downloadSvg}
              disabled={!hasContent}
              variant="outline"
              className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 gap-2"
            >
              <Download className="w-4 h-4" />
              SVG
            </Button>
            <Button
              onClick={downloadPng}
              disabled={!hasContent}
              className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
            >
              <Download className="w-4 h-4" />
              PNG
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full aspect-square max-w-xs flex items-center justify-center rounded-2xl bg-zinc-800/60 border border-zinc-700 p-4 shadow-2xl">
            {hasContent ? (
              <QRCodeSVG
                id="qr-svg"
                value={text}
                size={size}
                fgColor={fgColor}
                bgColor={bgColor}
                level={errorLevel}
                marginSize={includeMargin ? 4 : 0}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-600">
                <QrCode className="w-12 h-12" />
                <p className="text-sm">テキストを入力してください</p>
              </div>
            )}
          </div>

          {/* Hidden canvas for PNG export */}
          {hasContent && (
            <div className="hidden">
              <QRCodeCanvas
                id="qr-canvas"
                value={text}
                size={size}
                fgColor={fgColor}
                bgColor={bgColor}
                level={errorLevel}
                marginSize={includeMargin ? 4 : 0}
              />
            </div>
          )}

          {hasContent && (
            <button
              onClick={copyText}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">コピーしました</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  テキストをコピー
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
