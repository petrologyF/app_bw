import type { MetadataRoute } from 'next'

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
  const repoString = process.env.GITHUB_REPOSITORY || '';
  const repoName = repoString ? `/${repoString.split('/')[1]}` : '';
  const basePath = isGithubActions ? repoName : '';

  return {
    name: 'Image Binarizer',
    short_name: 'Binarizer',
    description: 'ブラウザ上で高速に画像を2値化するツール',
    start_url: `${basePath}/`,
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#4f46e5',
    orientation: 'portrait-primary',
    icons: [
      {
        src: `${basePath}/icons/icon-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${basePath}/icons/icon-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
