export default function manifest() {
  return {
    id: '/',
    name: 'AnonBox',
    short_name: 'AnonBox',
    description:
      "Recevez des avis honnêtes, des confessions et des questions brûlantes de vos amis. 100% anonyme et sécurisé.",
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'any',
    lang: 'fr',
    dir: 'ltr',
    background_color: '#f1f2f6',
    theme_color: '#ff4757',
    categories: ['social', 'communication', 'productivity'],
    icons: [
      {
        src: '/pwa/icon-72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/pwa/icon-256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/pwa/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [
      {
        src: '/pwa/screenshot-mobile.png',
        sizes: '720x1280',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Vue mobile AnonBox',
      },
      {
        src: '/pwa/screenshot-desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Vue desktop AnonBox',
      },
    ],
    shortcuts: [
      {
        name: 'Créer mon lien',
        short_name: 'Créer',
        description: 'Créer une nouvelle inbox anonyme',
        url: '/create',
        icons: [{ src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: "Envoyer un message",
        short_name: 'Envoyer',
        description: 'Ouvrir la page d’accueil pour envoyer un message',
        url: '/',
        icons: [{ src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  }
}
