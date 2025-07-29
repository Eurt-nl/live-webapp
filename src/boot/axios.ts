import axios from 'axios';

// Configure axios met dezelfde environment-based URL logica als PocketBase
const getApiUrl = (): string => {
  // In development (npm run dev) gebruik de live server
  if (process.env.NODE_ENV === 'development') {
    return 'https://pb.pitch-putt.live';
  }

  // In production (npm run build) gebruik de live server
  if (process.env.NODE_ENV === 'production') {
    return 'https://pb.pitch-putt.live';
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
