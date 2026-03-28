# Web Utility Hub 🛠️

ブラウザ上で完結する、高速・安全なマルチユーティリティツール群です。
画像処理、PDF編集、コード生成、テキスト整形など、日常的な業務や研究で必要となるツールを一つのPWA（Progressive Web App）として統合しました。

すべての処理は**クライアントサイド（ブラウザ内）で実行されるため、ファイルやデータが外部サーバーに送信されることは一切ありません。** 機密性の高いドキュメントやデータも安心して処理できます。

> [!IMPORTANT]
> **オフライン対応 (PWA)**: 一度アクセスして「インストール」または「ホーム画面に追加」を行えば、インターネット接続がない環境（飛行機内や移動中）でも、ネイティブアプリのように一瞬で起動して利用可能です。

---

## 🧰 収録ツール一覧

### 1. Image Binarizer (画像2値化)
- 画像の輝度を計算し、自由な2色（前景色・背景色）に置き換えます。
- しきい値をリアルタイムで調整し、図録やスケッチのデジタル化に最適です。

### 2. PDF Split (PDF分割)
- 複数ページのPDFから、必要なページ範囲（例: 1-3, 5）を指定して新しいPDFとして抽出・分割保存します。

### 3. PDF Merge (PDF結合)
- 複数のPDFファイルをドラッグ＆ドロップで並べ替え、一つのPDFファイルに結合します。

### 4. PDF to PNG (PDF画像化)
- PDFの各ページを、指定した解像度（DPI）で高品質なPNG画像として書き出します。

### 5. Barcode & QR Generator (コード生成)
- 6種類の主要形式（QR Code, EAN-13, ISBN等）に対応。
- 用途に応じた説明付きで、前景色・背景色・サイズを自由にカスタマイズして、PNG/SVG形式で保存できます。

### 6. Text Cleaner (テキスト整形)
- 改行削除、空白除去、タブ変換、全角半角変換など、9種類の整形オプションをリアルタイムで適用します。
- 論文のコピペやログデータの整形に便利です。

---

## 🛡️ プライバシーとセキュリティ
- **Zero Server Upload**: 本アプリはサーバーサイドのAPIを一切使用しません。すべてのJavaScriptロジックはあなたのブラウザ上で動作します。
- **PWA Ready**: Service Worker によるキャッシュにより、オフラインでも全機能が利用可能です。

---

## 🛠️ 技術スタック
- **Frontend**: [Next.js](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI, Lucide Icons
- **PDF Engine**: `pdf-lib`, `pdfjs-dist`
- **Barcode Engine**: `bwip-js`
- **Deployment**: GitHub Pages (Static Export)

---

## 💻 開発と実行
### ローカル開発
```bash
npm install
npm run dev
```

### ビルド (静的エクスポート)
```bash
npm run build
```
`out/` ディレクトリに、サーバー不要で動作する静的ファイル一式が生成されます。

## 🏷️ デプロイについて
GitHub Actions により、`master` または `tools` (開発用) ブランチへのPushで自動的に GitHub Pages へデプロイされます。Next.js の `output: "export"` 設定により、完全に静的なサイトとして稼働します。

---
Created by [petrologyf](https://github.com/petrologyf)
