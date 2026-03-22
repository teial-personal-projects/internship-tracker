import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

// Attach the current user's JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
