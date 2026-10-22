import { use, useEffect, useState, useMemo } from 'react';
import { getItems, addItem, deleteItem, getExpiringItems, getStats } from '../services/api';
import ItemCard from '../components/ItemCard';
import ItemForm from '../components/ItemForm';
import RecipeModal from '../components/RecipeModal';

function HomePage() {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [expiringItems, setExpiringItems] = useState([]);
	const [expiringLoading, setExpiringLoading] = useState(true);

	const [stats, setStats] = useState({ total_items: 0, expiring_soon: 0, recently_added: 0 });
	const [loadingStats, setLoadingStats] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState('All');
	const [selectedLocation, setSelectedLocation] = useState('All');
	const [categories, setCategories] = useState(['All']);
	const [locations, setLocations] = useState(['All']);
	const [showRecipeModal, setShowRecipeModal] = useState(false);

	const fetchItems = async () => {
		try {
			setLoading(true);
			const response = await getItems();
			const fetchItems = response.data;
			setItems(fetchItems);

			const uniqueCategories = [...new Set(fetchItems.map(item => item.category).filter(Boolean))].sort();
			const uniqueLocations = [...new Set(fetchItems.map(item => item.location).filter(Boolean))].sort();
			setCategories(['All', ...uniqueCategories]);
			setLocations(['All', ...uniqueLocations]);

			setError(null);
		} catch (err) {
			setError("Failed to fetch items.");
			console.error("Fetch Items Error:", err);
		} finally {
			setLoading(false);
		}
	};

	const fetchExpiringItems = async () => {
		try {
			setExpiringLoading(true);
			const response = await getExpiringItems();
			setExpiringItems(response.data);
		} catch (err) {
			console.error("Failed to fetch expiring items:", err);
		} finally {
			setExpiringLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			setLoadingStats(true);
			const response = await getStats();
			setStats(response.data);
		} catch (err) {
			console.error("Failed to fetch stats:", err);
		} finally {
			setLoadingStats(false);
		}
	};

	useEffect(() => {
		fetchItems();
		fetchExpiringItems();
		fetchStats();
	}, []);

	const refreshAllData = () => {
		fetchItems();
		fetchExpiringItems();
		fetchStats();
	};

	const handleAddItem = async (itemData) => {
		try {
			await addItem(itemData);
			refreshAllData();
		} catch (err) {
			console.error("Failed to add item:", err);
			const errorDetail = err.response?.data?.detail;
			const errorMessage = typeof errorDetail === 'string' ? errorDetail : "Error adding item. Check console for details.";
			alert(errorMessage);
		}
	};

	const handleDeleteItem = async (id) => {
		if (window.confirm("Are you sure you want to delete this item?")) {
			try {
				await deleteItem(id);
				refreshAllData();
			} catch (err) {
				console.error("Failed to delete item:", err);
				alert("Error deleting item. Check console for details.");
			}
		}
	};

	const formatDate = (dateStr) => {
		if (!dateStr) return 'N/A';
		const date = new Date(dateStr);
		date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
		return date.toLocaleDateString();
	}

	const filteredItems = useMemo(() => {
		return items.filter(item => {
			const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
			const locationMatch = selectedLocation === 'All' || item.location === selectedLocation;
			return categoryMatch && locationMatch;
		});
	}, [items, selectedCategory, selectedLocation]);

	return (
		<div className="space-y-8">

			{/* Expiring Soon Section */}
			<div>
				<h2 className="text-2xl font-semibold mb-3 text-orange-600">Expiring Soon (Next 7 Days)</h2>
				{expiringLoading && <p>Loading expiring items...</p>}
				{!expiringLoading && expiringItems.length === 0 && (
					<p className="text-gray-500 text-sm">No items expiring soon.</p>
				)}
				{!expiringLoading && expiringItems.length > 0 && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
						<ul className="list-disc list-inside text-sm">
							{expiringItems.map(item => (
								<li key={item.id}>
									{item.name || 'Unnamed Item'} ({item.brand || 'No Brand'})
									- <span className={new Date(item.expires_on) < new Date() ? 'text-red-600 font-bold' : 'text-orange-700'}>
										Expires: {formatDate(item.expires_on)}
									  </span>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
			
			{/* Add Item Form */}
			<div>
				<h1 className="text-3xl font-bold mb-4">Add New Item</h1>
				<ItemForm onSubmit={handleAddItem} />
			</div>

			{/* Main Pantry List Container */}
			<div>
				{/* Page Title + AI recipe button */}
				<div className="flex flex-wrap justify-between items-center gap-3 mb-4">
					<h1 className="text-3xl font-bold">Your Pantry</h1>
					<button
						onClick={() => setShowRecipeModal(true)}
						disabled={items.length === 0}
						title={items.length === 0 ? 'Add items to your pantry first' : 'Get a recipe idea from your pantry'}
						className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						✨ Get a recipe
					</button>
				</div>

				{/* Filters */}
				<div className="flex flex-wrap gap-4">
						{/* Category Filter */}
						{categories.length > 1 && (
							<div>
								<label htmlFor="category-filter" className="text-sm font-medium text-gray-700 mr-2">Category:</label>
								<select id="category-filter" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
									{categories.map(cat => ( <option key={cat} value={cat}>{cat}</option> ))}
								</select>
							</div>
						)}
						{/* Location Filter */}
						{locations.length > 1 && (
							<div>
								<label htmlFor="location-filter" className="text-sm font-medium text-gray-700 mr-2">Location:</label>
								<select id="location-filter" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
									{locations.map(loc => ( <option key={loc} value={loc}>{loc}</option> ))}
								</select>
							</div>
						)}
				</div>

				{/* Stats Overview */}
				<div className="mb-6">
					<h3 className="text-2xl font-semibold mb-3">Pantry Overview</h3>
					{loadingStats ? <p>Loading stats...</p> : (
						<div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-center">
							<div className="bg-gray-100 p-4 rounded-lg shadow">
								<div className="text-3xl font-bold">{stats.total_items}</div>
								<div className="text-sm text-gray-600">Total Items</div>
							</div>
							<div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
								<div className="text-3xl font-bold text-blue-600">{stats.recently_added}</div>
								<div className="text-sm text-gray-600">Added Recently (3d)</div>
							</div>
						</div>
					)}
				</div>

				
				{/* Loading/Error/Empty States for Item List */}
				{loading && <p>Loading items...</p>}
				{error && <p className="text-red-500">{error}</p>}
				{!loading && items.length === 0 && (
					<p className="text-gray-500">Your pantry is empty. Add an item above!</p>
				)}
				{!loading && items.length > 0 && filteredItems.length === 0 && ( // Check filtered length for message
					<p className="text-gray-500">No items match the selected filters.</p>
				)}

				{/* Item Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredItems.map((item) => (
						<ItemCard 
							key={item.id} 
							item={item} 
							onDelete={handleDeleteItem} 
							onUpdate={fetchItems} // Just refetch all items on update
						/>
					))}
				</div>
			</div>

			{showRecipeModal && <RecipeModal onClose={() => setShowRecipeModal(false)} />}
		</div>
	);
}

export default HomePage;