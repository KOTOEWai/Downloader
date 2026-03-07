import axios from 'axios';

// Get API URL from environment variable, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true // 🍪 This allows Axios to send cookies automatically
});

// Axios automatically finds the 'XSRF-TOKEN' cookie and sends it as the 'X-XSRF-TOKEN' header for CSRF protection.


export default api;
export { API_BASE_URL };
