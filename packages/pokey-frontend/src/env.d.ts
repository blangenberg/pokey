/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_STAGE?: string;
  readonly VITE_OKTA_BASE_URL?: string;
  readonly VITE_OKTA_CLIENT_ID?: string;
  readonly VITE_OKTA_REDIRECT_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
