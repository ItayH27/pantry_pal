import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
	const { token, logout } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate('/login');
	};

	return (
		<nav className="bg-white shadow-md">
			<div className="container mx-auto px-4">
				<div className="flex justify-between items-center h-16">
					<Link to="/" className="text-2xl font-bold text-indigo-600">
						Pantry Pal 🥦
					</Link>
					<div className="flex items-center space-x-4">
						{token ? (
							<button
								onClick={handleLogout}
								className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
							>
								Logout
							</button>
						) : (
							<>
								<Link
									to="/login"
									className="text-sm font-medium text-gray-600 hover:text-indigo-600"
								>
									Login
								</Link>
								<Link
									to="/register"
									className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
								>
									Register
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;