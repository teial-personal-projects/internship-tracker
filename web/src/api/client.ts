import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

const CLIENT_VERSION = import.meta.env.VITE_APP_VERSION;
let versionMismatchDispatched = false;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

function checkServerVersion(serverVersion: string | null) {
  if (versionMismatchDispatched || !serverVersion || serverVersion === 'unknown') {
    return;
  }

  if (serverVersion !== CLIENT_VERSION) {
    versionMismatchDispatched = true;
    window.dispatchEvent(new CustomEvent('app:version-mismatch'));
  }
}

// Attach the current user's JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use((response) => {
  checkServerVersion(response.headers['x-app-version'] ?? null);
  return response;
}, (error) => {
  checkServerVersion(error.response?.headers?.['x-app-version'] ?? null);
  return Promise.reject(error);
});
