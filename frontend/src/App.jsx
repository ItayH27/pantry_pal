import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

function App() {
	const { token } = useAuth()

	return (
		<div className="min-h-screen bg-gray-100">
			<Navbar />
			<main className="container mx-auto p-4">
				<Routes>
					<Route 
						path="/" 
						element={token ? <HomePage /> : <Navigate to="/login" />} 
					/>
					<Route 
						path="/login" 
						element={!token ? <LoginPage /> : <Navigate to="/" />} 
					/>
					<Route 
						path="/register" 
						element={!token ? <RegisterPage /> : <Navigate to="/" />} 
					/>
					<Route
						path="/forgot-password"
						element={<ForgotPasswordPage />}
					/>
					<Route
						path="/reset-password"
						element={<ResetPasswordPage />}
					/>
				</Routes>
			</main>
		</div>
	)
}

export default App