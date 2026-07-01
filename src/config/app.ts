export const APP_CONFIG = {
  name: import.meta.env['VITE_APP_NAME'] ?? 'Memora',
  url: import.meta.env['VITE_APP_URL'] ?? 'http://localhost:3000',
  description: 'AI-powered meeting intelligence',
  version: '0.1.0',

  features: {
    analytics: import.meta.env['VITE_ENABLE_ANALYTICS'] === 'true',
    devtools: import.meta.env['VITE_ENABLE_DEVTOOLS'] === 'true',
  },

  upload: {
    maxFileSizeMb: 500,
    acceptedAudioTypes: ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/webm'],
    acceptedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    acceptedTranscriptTypes: ['text/plain', 'application/pdf', 'text/vtt', 'text/srt'],
  },

  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
} as const

export type AppConfig = typeof APP_CONFIG
