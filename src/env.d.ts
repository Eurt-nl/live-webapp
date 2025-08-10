declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: 'hash' | 'history' | 'abstract' | undefined;
    VUE_ROUTER_BASE: string | undefined;
    // Rafi configuratie
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    ALLOWED_ORIGIN?: string;
    RATE_LIMIT_MAX_PER_MIN?: string;
  }
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_PB_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_RAFI_LOGGING: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
