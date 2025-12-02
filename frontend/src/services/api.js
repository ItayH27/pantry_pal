import axios from 'axios';

// Get the API URL from environment variables (VITE_API_URL)
// Fallback to localhost:8000 for local development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
	baseURL: API_URL,
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers['Authorization'] = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// --- Auth Service ---

export const loginUser = (email, password) => {
	// The backend /auth/login expects form data, not JSON
	const formData = new FormData();
	formData.append('username', email); // 'username' is what OAuth2PasswordRequestForm expects
	formData.append('password', password);
	
	return api.post('/auth/login', formData, {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	});
};

export const registerUser = (email, password) => {
	return api.post('/auth/register', { email, password });
};

export const requestPasswordReset = (email) => {
	return api.post('/auth/request-password-reset/', { email });
};

export const resetPassword = (token, newPassword) => {
	return api.post('/auth/reset-password/', { token, new_password: newPassword });
};

// --- Item Service ---

export const lookupBarcode = (barcode) => {
	const encodedBarcode = encodeURIComponent(barcode);
	return api.get(`/items/barcode-lookup/${encodedBarcode}`);
};

export const getItems = () => {
	return api.get('/items/');
};

export const getExpiringItems = () => {
	return api.get('/items/expiring_soon/');
};

export const getStats = () => {
	return api.get('/stats/');
};

export const addItem = (itemData) => {
	// { barcode, name?, brand?, quantity?, unit?, expires_on? }
	return api.post('/items/', itemData);
};

export const updateItem = (itemId, itemData) => {
	// { name?, brand?, quantity?, unit?, expires_on? }
	return api.patch(`/items/${itemId}`, itemData);
};

export const deleteItem = (itemId) => {
	return api.delete(`/items/${itemId}`);
};

export default api;