# Web Utility Hub 🛠️

ブラウザ上で完結する、高速・安全なマルチユーティリティツール群です。
画像処理、PDF編集、コード生成、テキスト整形など、日常的な業務や研究で必要となるツールを一つのPWA（Progressive Web App）として統合しました。

すべての処理は**クライアントサイド（ブラウザ内）で実行されるため、ファイルやデータが外部サーバーに送信されることは一切ありません。** 機密性の高いドキュメントやデータも安心して処理できます。

> [!NOTE]
> **English UI**: アプリケーションのUIはすべて英語（Professional English）で統一されています（本READMEは日本語です）。

> [!IMPORTANT]
> **オフライン対応 (PWA)**: サイドバー下部の「Install Desktop App」からインストールを行えば、インターネット接続がない環境（飛行機内や移動中）でも、ネイティブアプリのように起動して利用可能です。デスクトップの画面分割（スプリットビュー）にも最適化されたレスポンシブデザインを採用しています。

---

## 🧰 収録ツール一覧

### 1. Image Binarizer (画像2値化 & 色置換)
- 画像の輝度を計算し、自由な2色（前景色・背景色）に置き換えます。
- しきい値をリアルタイムで調整し、図録やスケッチのデジタル化に最適です。
- 処理後の画像はワンクリックでクリップボードにコピー（Copy Image）でき、他のアプリに直接貼り付け可能です。

### 2. Edit PDF (PDF編集・変換)
- **分割 (Split)**: 指定したページ範囲を新しいPDFとして抽出します。
- **結合 (Merge)**: 複数のPDFをドラッグ＆ドロップで並べ替え、一つに統合します。
- **画像化 (Convert to Image)**: PDFの各ページを高画質なPNG画像として一括書き出しします。生成されたページ画像ごとにクリップボードへのコピーが可能です。
- *※ ブラウザの安定動作のため、1ファイル最大100MBまでの処理に対応しています。*

### 3. Barcode & QR Generator (コード生成)
- 6種類の主要形式（QR Code, EAN-13, ISBN, Data Matrixなど）に対応。
- 前景色・背景色・サイズを自由にカスタマイズ可能。Binarizerと共通の「青写真」や「セピア」などのカラープリセットも搭載。
- PNG/SVG形式での保存に加え、生成したコードを直接クリップボードにコピーできます。

### 4. Text Cleaner (テキスト整形)
- 改行パターンの正規化、空白除去、タブ変換、大文字/小文字変換など、9種類の整形オプションをリアルタイムで適用します。
- 論文からの引用時のコピペ処理や、ログデータの整形に便利です。ワンクリックでクリーンアップしたテキストをコピーできます。

---

## 🛡️ プライバシーとセキュリティ
- **Zero Server Upload**: 本アプリはサーバーサイドのAPIを一切使用しません。すべてのJavaScriptロジックはあなたのブラウザ上で動作します。
- **Privacy First**: 銀行の書類や研究データなど、外部に見せたくないファイルも、あなたのデバイス内だけで安全に処理されます。

---

## 🛠️ 技術スタック
- **Frontend**: [Next.js](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Tabs, Slider, etc.), Lucide Icons
- **PDF Engine**: `pdf-lib`, `pdfjs-dist`
- **Barcode Engine**: `bwip-js`
- **PWA**: PWA-enabled with offline caching capabilities (next-pwa)

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

## 🏷️ デプロイ
GitHub Actions により、`master` ブランチへのPushで自動的に GitHub Pages 等へホスティング可能な静的サイトが生成されます（`output: "export"`）。完全にスタンドアロンなクライアントアプリとして稼働します。

---
Created by [petrologyf](https://github.com/petrologyf)
