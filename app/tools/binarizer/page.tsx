import ImageProcessor from "@/components/ImageProcessor";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Binarizer | Web Utility Hub",
  description: "画像を2値化し、暗部・明部に任意の色を割り当てられる高速画像処理ツール",
};

export default function BinarizerPage() {
  return (
    <div className="p-4 md:p-6 w-full max-w-[1400px] mx-auto space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-white bg-gradient-to-r from-indigo-400 to-fuchsia-400 text-transparent bg-clip-text">
          Image Binarizer
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">
          高速な画像2値化 &amp; 色置換ツール
        </p>
      </div>
      <Separator className="bg-zinc-800/50" />
      <div className="w-full">
        <ImageProcessor />
      </div>
    </div>
  );
}
