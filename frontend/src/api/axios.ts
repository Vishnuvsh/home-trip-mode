import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://hometrip-backend-6mpk.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
