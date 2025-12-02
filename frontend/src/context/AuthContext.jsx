import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser } from '../services/api'; // Only needed for traditional login

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
	// Initialize state directly from localStorage for cleaner setup
	const [token, setToken] = useState(() => localStorage.getItem('token'));

	// Traditional login via email/password
	const login = async (email, password) => {
		try {
			const response = await loginUser(email, password);
			const { access_token } = response.data;
			localStorage.setItem('token', access_token);
			setToken(access_token);
			return true; // Indicate success
		} catch (error) {
			console.error("Login failed:", error);
			localStorage.removeItem('token');
			setToken(null);
			throw error; // Re-throw for component handling
		}
	};

	const loginFromToken = (newToken) => {
		if (newToken) {
			localStorage.setItem('token', newToken);
			setToken(newToken);
		} else {
			logout();
		}
	};

	const logout = () => {
		localStorage.removeItem('token');
		setToken(null);
	};

	// Effect to sync state if token changes in another tab
	// This helps if the user logs out in one tab, others update.
	useEffect(() => {
		const handleStorageChange = (event) => {
			if (event.key === 'token') {
				setToken(event.newValue);
			}
		};
		// Listen for changes in localStorage from other tabs/windows
		window.addEventListener('storage', handleStorageChange);
		// Cleanup listener when component unmounts
		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, []); 

	return (
		<AuthContext.Provider value={{ token, login, logout, loginFromToken }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	return useContext(AuthContext);
};