import AuthForm from '../components/AuthForm';
import { registerUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
	const navigate = useNavigate();
	const { loginFromToken } = useAuth();

	const handleRegister = async (email, password) => {
		try {
			const response = await registerUser(email, password);
			const {access_token} = response.data;

			if (access_token) {
				// Auto-login after registration
				loginFromToken(access_token);
				navigate('/');
			
			} else {
				// Handle case where token wasn't returned (shouldn't happen if backend is correct)
				alert('Registration successful, but auto-login failed. Please log in manually.');
				navigate('/login');
			}
		}
		catch (error) {
			console.error('Registration Error:', error);
			throw error;
		}
	};

	return (
		<AuthForm
			formType="register"
			onSubmit={handleRegister}
		/>
	);
}

export default RegisterPage;