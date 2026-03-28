import ImageProcessor from '@/components/ImageProcessor'

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full point-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/20 blur-[120px] rounded-full point-events-none" />

      <div className="z-10 w-full max-w-7xl mx-auto mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 bg-gradient-to-r from-indigo-400 to-fuchsia-400 text-transparent bg-clip-text">
          Binarize & Colorize
        </h1>
        <p className="text-zinc-400 text-sm md:text-base">
          高速な画像2値化 & 色置換ツール
        </p>
      </div>

      <div className="z-10 w-full flex-grow flex items-center justify-center">
        <ImageProcessor />
      </div>

    </main>
  )
}
