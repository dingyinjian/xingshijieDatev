/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_HIKVISION_ENABLED: string
  readonly VITE_HIKVISION_BASE_URL: string
  readonly VITE_HIKVISION_CHANNEL: string
  readonly VITE_HIKVISION_REGION_ID: string
  readonly VITE_HIKVISION_TIMEZONE: string
  readonly VITE_HIKVISION_POLL_INTERVAL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
