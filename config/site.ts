import type { Metadata } from 'next'

export const siteConfig = {
  name: '𝙼𝚄𝚂𝚃𝙰𝙵𝙰',
  description: 'موقعي الشخصي لعرض المشاريع والمهارات',
  url: 'https://mern-stack-nine-vert.vercel.app',
}

export const defaultMetadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
  },
}
