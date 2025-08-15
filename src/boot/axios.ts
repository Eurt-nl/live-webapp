import axios from 'axios';

// Configure axios met environment-based URL logica
const getApiUrl = (): string => {
  // Gebruik environment variable als die beschikbaar is
  if (import.meta.env.VITE_PB_URL) {
    return import.meta.env.VITE_PB_URL;
  }

  // Fallback naar live server URL
  return 'https://pb.pitch-putt.live';
};

const api = axios.create({
  baseURL: getApiUrl(),
});

export { api };

export default ({ app }) => {
  // Add axios to Vue instance
  app.config.globalProperties.$axios = api;
};
