import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/api';

function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [token, setToken] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const tokenFromUrl = searchParams.get('token');
		if (tokenFromUrl) {
			setToken(tokenFromUrl);
		} else {
			setError("No reset token found. Please request a new link.");
		}
	}, [searchParams]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		if (password.length < 6) { // Add basic validation
			setError("Password must be at least 6 characters long.");
			return;
		}
		
		setLoading(true);
		setError('');
		setMessage('');
		try {
			const response = await resetPassword(token, password);
			setMessage(response.data.message + " You can now log in.");
			// Redirect to login after a short delay
			setTimeout(() => {
				navigate('/login');
			}, 3000);
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
				<h2 className="text-2xl font-bold text-center text-gray-900">Set New Password</h2>
				
				{message && (
					<div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
						{message}
					</div>
				)}
				{error && (
					<div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
						{error}
					</div>
				)}
				
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div>
						<label htmlFor="password" className="block text-sm font-medium text-gray-700">
							New Password
						</label>
						<div className="mt-1">
							<input
								id="password" name="password" type="password"
								required value={password} onChange={(e) => setPassword(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
							/>
						</div>
					</div>
					<div>
						<label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
							Confirm New Password
						</label>
						<div className="mt-1">
							<input
								id="confirm-password" name="confirm-password" type="password"
								required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
							/>
						</div>
					</div>
					<div>
						<button
							type="submit" disabled={loading || !token || !!message}
							className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
						>
							{loading ? 'Saving...' : 'Save New Password'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default ResetPasswordPage;