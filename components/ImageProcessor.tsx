"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { UploadCloud, Download, Image as ImageIcon, DownloadCloud, MonitorDown } from "lucide-react";
import { rgbToY, hexToRgb } from "@/lib/utils";

// PWAインストールプロンプト用の型定義
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function ImageProcessor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  
  // PWAインストール関連のState
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // パラメータ
  const [threshold, setThreshold] = useState<number>(128);
  const [darkColor, setDarkColor] = useState<string>("#000000");
  const [lightColor, setLightColor] = useState<string>("#ffffff");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ----- PWA インストールハンドリング -----
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // イベントを保存して後で引き起こせるようにする
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // インストール完了時のハンドラ
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      console.log("PWAとしてインストールされました");
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

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

  return (
    <div className="flex flex-col lg:flex-row h-full w-full max-w-7xl mx-auto rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm shadow-2xl">
      {/* 操作パネル */}
      <div className="w-full lg:w-80 p-6 flex flex-col gap-6 border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-900/80">
        
        {/* PWAインストールボタン (インストール可能な場合のみ表示) */}
        {isInstallable && (
          <button
            onClick={handleInstallPWA}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm w-full mb-2 animate-in fade-in zoom-in duration-300 ring-1 ring-emerald-400/50"
          >
            <MonitorDown className="w-5 h-5" />
            デスクトップアプリとして保存
          </button>
        )}

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

        <div className="flex-grow"></div>

        {/* ダウンロードボタン */}
        <button
          onClick={handleDownload}
          disabled={!imageSrc}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
        >
          <Download className="w-5 h-5" />
          Download Image
        </button>
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
