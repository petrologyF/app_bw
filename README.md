# Image Binarizer Pro 🌓
ブラウザ上で高速に画像を2値化（Binarize）し、お好みの2色で置き換えができる高性能な画像処理ツールです。
すべてクライアントサイド（ブラウザの中）で処理されるため、**画像ファイルが外部のサーバーに送信されることは一切なく、安全・高速**に利用できます。

> [!TIP]
> **PWA（Progressive Web App）対応済みです。** 一度ブラウザで開き「デスクトップアプリとして保存」を行えば、以降はオフライン環境でもPCのネイティブアプリのように一瞬で起動・利用が可能です。

## 🚀 主な機能
- **リアルタイム画像変換**: アップロードした画像から即座にCanvas上でピクセルごとの輝度（Luminance）を計算し、2値化を行います。
- **しきい値の柔軟な調整**: 0〜255の範囲でしきい値をスライダー操作し、白黒にする境界線をリアルタイムで調整可能です。
- **カスタムカラー置換**: 単なる白黒（モノクロ）ではなく、暗部（Dark Side）と明部（Light Side）の色をカラーピッカーで自由な色に変更できます。
- **オフライン動作（PWA）**: 一度ページを読み込んだ後は、Service Worker と Manifest によってローカルにキャッシュされ、飛行機の中などオフライン環境でも機能します。
- **元の解像度でダウンロード**: 処理後の画像は、アップロードされた元の解像度・品質を保ったままPNG形式でダウンロードできます。

## 🛠️ 技術スタック
- **Framework**: [Next.js](https://nextjs.org/) (App Router, v14+)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **PWA**: `@ducanh2912/next-pwa` (Next.js App Router 対応フォーク)

## 🌐 使い方
### 1. アプリへのアクセス
以下のGitHub Pages の URL からアクセスしてください。
🔗 **[Live Demo (GitHub Pages)](https://petrologyf.github.io/app_bw/)**

### 2. PWA としてのインストール（推奨）
PC（Chrome, Edge等）やスマートフォン（Safari, Chrome等）からアクセスすると、画面上部に「**デスクトップアプリとして保存**」ボタン、もしくはアドレスバーの右端にインストール用のアイコンが表示されます。
インストールすることで、スタートメニュー・Dock から直接起動できるようになります。

### 3. 画像の処理手順
1. 左側の枠内に画像をドラッグ＆ドロップ、またはクリックしてファイル（PNG, JPEG, WEBP）を選択します。
2. 左パネルのスライダーで **Threshold（しきい値）** を変更し、境界を調整します。
3. **Dark Side Color** と **Light Side Color** のカラーピッカーでお好みの色に変更します。
4. 調整が終わったら、「**Download Image**」ボタンから画像を保存します。

---

## 💻 開発環境のセットアップ
ローカル環境で開発を続ける場合の手順です。

### 前提条件
- Node.js (v18 以降推奨)
- npm または yarn

### インストールコマンド
```bash
# リポジトリのクローン
git clone https://github.com/petrologyf/app_bw.git
cd app_bw

# パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```
ブラウザで `http://localhost:3000` にアクセスすると確認できます。
> [!NOTE]
> 開発環境（`next dev`）では、キャッシュ等による不具合を防ぐため PWA（Service Worker）機能は意図的に無効化されています。PWAの挙動をテストしたい場合は `npm run build` のあとに `npm run start` を行ってください。

## 🏷️ GitHub Pages へのデプロイ
このリポジトリは GitHub Actions を用いて自動で GitHub Pages へデプロイされるよう設定されています（`.github/workflows/nextjs.yml` 参照）。
`master` ブランチに変更を Push するだけで、静的ファイルとしてビルドされ自動的に公開環境が更新されます。

```bash
git add .
git commit -m "Update feature"
git push origin master
```
*※ Next.js の `output: "export"` 機能を使用しているため、GitHub Pages 上でも Node.js サーバー無しで正常に稼働します（マニフェスト等も動的にパッチされます）。*
