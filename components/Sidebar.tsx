"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ImageIcon,
  FileEdit,
  Barcode,
  AlignLeft,
  Layers,
  ChevronRight,
  MonitorDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// PWAインストールプロンプト用の型定義
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const tools = [
  {
    label: "Image Binarizer",
    href: "/tools/binarizer",
    icon: ImageIcon,
    description: "画像を2値化・色置換",
    color: "text-indigo-400",
    activeBg: "bg-indigo-500/10 border-indigo-500/30",
  },
  {
    label: "Edit PDF",
    href: "/tools/pdf-edit",
    icon: FileEdit,
    description: "PDFを抽出・結合・画像化",
    color: "text-amber-400",
    activeBg: "bg-amber-500/10 border-amber-500/30",
  },
  {
    label: "Barcode",
    href: "/tools/barcode",
    icon: Barcode,
    description: "バーコード & QRコード生成",
    color: "text-rose-400",
    activeBg: "bg-rose-500/10 border-rose-500/30",
  },
  {
    label: "Text Cleaner",
    href: "/tools/text-cleaner",
    icon: AlignLeft,
    description: "テキストを整形・クリーン",
    color: "text-teal-400",
    activeBg: "bg-teal-500/10 border-teal-500/30",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
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

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-zinc-900/80 border-r border-zinc-800 backdrop-blur-sm">
      {/* Logo / Header */}
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 ring-1 ring-indigo-500/30">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100 leading-tight">
              Web Utility Hub
            </h1>
            <p className="text-[10px] text-zinc-500 leading-tight">
              All-in-one browser tools
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Tools
        </p>
        {tools.map((tool) => {
          const isActive = pathname === tool.href || pathname.startsWith(tool.href + "/");
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200",
                isActive
                  ? cn("border", tool.activeBg, "text-zinc-100")
                  : "border-transparent hover:bg-zinc-800/60 hover:border-zinc-700/50 text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? tool.color : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-tight">
                  {tool.label}
                </p>
                <p className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">
                  {tool.description}
                </p>
              </div>
              {isActive && (
                <ChevronRight className={cn("w-3 h-3 flex-shrink-0", tool.color)} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-zinc-800 space-y-2">
        {isInstallable && (
          <button
            onClick={handleInstallPWA}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-indigo-900/30 text-xs ring-1 ring-indigo-500/40 animate-in fade-in zoom-in duration-300"
          >
            <MonitorDown className="w-4 h-4" />
            デスクトップアプリとして保存
          </button>
        )}
        <p className="text-[10px] text-zinc-600 text-center">
          すべての処理はブラウザ完結 🔒
        </p>
      </div>
    </aside>
  );
}
