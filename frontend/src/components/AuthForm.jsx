import { useState } from 'react';
import { Link } from 'react-router-dom';

function AuthForm({ formType, onSubmit }) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const isLogin = formType === 'login';
	const title = isLogin ? 'Login' : 'Register';
	const linkText = isLogin ? "Don't have an account? Register" : 'Already have an account? Login';
	const linkTo = isLogin ? '/register' : '/login';

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await onSubmit(email, password);
		} catch (err) {
			const errorMsg = err.response?.data?.detail || 'An unexpected error occurred.';
			setError(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex items-center justify-center pt-10">
			<div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center text-gray-900">{title}</h2>
				
				{error && (
					<div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
						{error}
					</div>
				)}
				
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div>
						<label 
							htmlFor="email" 
							className="block text-sm font-medium text-gray-700"
						>
							Email address
						</label>
						<div className="mt-1">
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>
					</div>

					<div>
						<label 
							htmlFor="password" 
							className="block text-sm font-medium text-gray-700"
						>
							Password
						</label>
						<div className="mt-1">
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
							/>
						</div>
					</div>

					<div>
						<button
							type="submit"
							disabled={loading}
							className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
						>
							{loading ? 'Submitting...' : title}
						</button>
					</div>
				</form>
				
				<div className="text-sm text-center">
					<Link to={linkTo} className="font-medium text-indigo-600 hover:text-indigo-500">
						{linkText}
					</Link>

					{isLogin && (
						<span className="mx-2 text-gray-400">|</span>
					)}
					{isLogin && (
						<Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
							Forgot password?
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}

export default AuthForm;