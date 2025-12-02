import { useState } from 'react';
import { requestPasswordReset } from '../services/api';

function ForgotPasswordPage() {
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setError('');
		setMessage('');
		try {
			const response = await requestPasswordReset(email);
			setMessage(response.data.message);
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
				<h2 className="text-2xl font-bold text-center text-gray-900">Forgot Password</h2>
				<p className="text-center text-sm text-gray-600">
					Enter your email address and we'll send you a link to reset your password.
				</p>

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
						<label htmlFor="email" className="block text-sm font-medium text-gray-700">
							Email address
						</label>
						<div className="mt-1">
							<input
								id="email" name="email" type="email" autoComplete="email"
								required value={email} onChange={(e) => setEmail(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
							/>
						</div>
					</div>
					<div>
						<button
							type="submit" disabled={loading}
							className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50"
						>
							{loading ? 'Sending...' : 'Send Reset Link'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default ForgotPasswordPage;