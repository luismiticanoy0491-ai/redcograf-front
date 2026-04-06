import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:4000"
  baseURL: "https://redcograf-back.onrender.com"
});

// Interceptor para inyectar Token y Tenant ID automáticamente a todas las llamadas
API.interceptors.request.use((config) => {
  // Verificamos primero si hay token de admin SaaS y sino el token normal de terminal
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
