import AuthForm from '../components/AuthForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleLogin = async (email, password) => {
		await login(email, password);
		navigate('/'); // Navigate to home on successful login
	};

	return (
		<AuthForm
			formType="login"
			onSubmit={handleLogin}
		/>
	);
}

export default LoginPage;