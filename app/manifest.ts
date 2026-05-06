import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WordZoo',
    short_name: 'WordZoo',
    description: 'Learn languages with memorable mnemonics',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FDF8EE',
    theme_color: '#FF8A3D',
    icons: [
      {
        src: '/brand/logo-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/logo-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
