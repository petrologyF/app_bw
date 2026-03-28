"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { UploadCloud, Download, Image as ImageIcon, Copy, Check } from "lucide-react";
import { rgbToY, hexToRgb } from "@/lib/utils";


export default function ImageProcessor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // パラメータ
  const [threshold, setThreshold] = useState<number>(128);
  const [darkColor, setDarkColor] = useState<string>("#000000");
  const [lightColor, setLightColor] = useState<string>("#ffffff");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ----- 画像読み込みハンドリング -----
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match("image/(png|jpeg|jpg|webp)")) {
      setImageError("PNG/JPEG/WEBP形式の画像を選択してください。");
      return;
    }
    setImageError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.match("image/(png|jpeg|jpg|webp)")) {
      setImageError("PNG/JPEG/WEBP形式の画像を選択してください。");
      return;
    }
    setImageError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ----- 画像処理ロジック (2値化) -----
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const { width, height } = img;
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      const parsedDark = hexToRgb(darkColor) || { r: 0, g: 0, b: 0 };
      const parsedLight = hexToRgb(lightColor) || { r: 255, g: 255, b: 255 };

      // Y = 0.299R + 0.587G + 0.114B による輝度算出と置き換え
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const y = rgbToY(r, g, b); // 外部ユーティリティを使用
        
        if (y < threshold) {
          data[i] = parsedDark.r;
          data[i + 1] = parsedDark.g;
          data[i + 2] = parsedDark.b;
        } else {
          data[i] = parsedLight.r;
          data[i + 1] = parsedLight.g;
          data[i + 2] = parsedLight.b;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    };
  }, [imageSrc, threshold, darkColor, lightColor]);

  const handleDownload = () => {
    if (!canvasRef.current || !imageSrc) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "binarized-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current || !imageSrc) return;
    try {
      const blob = await new Promise<Blob | null>(resolve => 
        canvasRef.current?.toBlob(resolve, 'image/png')
      );
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setImageError("画像のコピーに失敗しました。このブラウザではサポートされていない可能性があります。");
    }
  };

  return (
    <div className="flex flex-col xl:flex-row w-full min-h-[600px] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm shadow-2xl">
      {/* 操作パネル */}
      <div className="w-full xl:w-80 p-6 flex flex-col gap-6 border-b xl:border-b-0 xl:border-r border-zinc-800 bg-zinc-900/80">
        
        <h2 className="text-xl font-bold font-sans text-zinc-100 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-400" />
          Settings
        </h2>

        {/* 閾値スライダー */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-zinc-300">Threshold (0-255)</label>
            <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-200">{threshold}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
          />
        </div>

        <div className="w-full h-[1px] bg-zinc-800 my-2"></div>

        {/* カラーピッカー */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Dark Side (Y &lt; Threshold)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="w-10 h-10 p-1 rounded bg-zinc-800 cursor-pointer border-0"
              />
              <input 
                type="text" 
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                className="bg-zinc-800 text-zinc-200 text-sm rounded-md px-3 py-2 w-full border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Light Side (Y &ge; Threshold)</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                className="w-10 h-10 p-1 rounded bg-zinc-800 cursor-pointer border-0"
              />
              <input 
                type="text" 
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                className="bg-zinc-800 text-zinc-200 text-sm rounded-md px-3 py-2 w-full border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="w-full h-[1px] bg-zinc-800 my-1"></div>

        {/* プリセット */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-400">Color Presets</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setDarkColor("#000000"); setLightColor("#ffffff"); }}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded text-zinc-300 transition-colors flex items-center justify-center gap-1.5 ring-1 ring-zinc-700"
            >
              <div className="w-3 h-3 rounded-full flex overflow-hidden ring-1 ring-zinc-500"><div className="w-1/2 bg-black"></div><div className="w-1/2 bg-white"></div></div>
              白黒
            </button>
            <button
              onClick={() => { setDarkColor("#000000"); setLightColor("#f8f7e9"); }}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded text-zinc-300 transition-colors flex items-center justify-center gap-1.5 ring-1 ring-zinc-700"
            >
              <div className="w-3 h-3 rounded-full flex overflow-hidden ring-1 ring-zinc-500"><div className="w-1/2 bg-[#000000]"></div><div className="w-1/2 bg-[#f8f7e9]"></div></div>
              アイボリー黒
            </button>
            <button
              onClick={() => { setDarkColor("#ced0d2"); setLightColor("#f8f7e9"); }}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded text-zinc-300 transition-colors flex items-center justify-center gap-1.5 ring-1 ring-zinc-700"
            >
              <div className="w-3 h-3 rounded-full flex overflow-hidden ring-1 ring-zinc-500"><div className="w-1/2 bg-[#ced0d2]"></div><div className="w-1/2 bg-[#f8f7e9]"></div></div>
              淡グレー
            </button>
            <button
              onClick={() => { setDarkColor("#1e3a8a"); setLightColor("#eff6ff"); }}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded text-zinc-300 transition-colors flex items-center justify-center gap-1.5 ring-1 ring-zinc-700"
            >
              <div className="w-3 h-3 rounded-full flex overflow-hidden ring-1 ring-zinc-500"><div className="w-1/2 bg-[#1e3a8a]"></div><div className="w-1/2 bg-[#eff6ff]"></div></div>
              青写真
            </button>
            <button
              onClick={() => { setDarkColor("#432818"); setLightColor("#fefae0"); }}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium rounded text-zinc-300 transition-colors flex items-center justify-center gap-1.5 ring-1 ring-zinc-700 col-span-2"
            >
              <div className="w-3 h-3 rounded-full flex overflow-hidden ring-1 ring-zinc-500"><div className="w-1/2 bg-[#432818]"></div><div className="w-1/2 bg-[#fefae0]"></div></div>
              セピア
            </button>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={handleCopyImage}
            disabled={!imageSrc}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 h-12"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            disabled={!imageSrc}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 h-12"
          >
            <Download className="w-5 h-5" />
            Download
          </button>
        </div>
      </div>

      {/* プレビュー領域 */}
      <div className="flex-1 bg-zinc-950 p-6 flex flex-col items-center justify-center relative min-h-[400px]">
        {!imageSrc ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="w-full max-w-lg p-12 border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-2xl bg-zinc-900/50 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer relative"
          >
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="p-4 rounded-full bg-zinc-800 text-indigo-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-zinc-200 font-medium">クリックまたはドロップして画像をアップロード</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 p-4">
             <div className="relative rounded-lg overflow-hidden ring-1 ring-zinc-800 shadow-2xl flex max-h-full items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMmUyZTMzIi8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzFmMWYyMiIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZjFmMjIiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzJlMmUzMyIvPjwvc3ZnPg==')]">
               <canvas
                 ref={canvasRef}
                 className="max-w-full max-h-[80vh] object-contain"
               />
             </div>
             
             <div className="absolute top-4 right-4 z-10">
               <label className="cursor-pointer bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 backdrop-blur px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ring-1 ring-zinc-700 shadow-lg">
                 <UploadCloud className="w-4 h-4" />
                 Change
                 <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                 />
               </label>
             </div>
          </div>
        )}
        
        {imageError && (
          <div className="absolute bottom-6 bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-3 rounded-lg text-sm font-medium backdrop-blur">
            {imageError}
          </div>
        )}
      </div>
    </div>
  );
}
