import { useState }from 'react';
import ItemForm from './ItemForm';
import { updateItem } from '../services/api';

function ItemCard({ item, onDelete, onUpdate }) {
	const [isEditing, setIsEditing] = useState(false);

	const formatExpiry = (dateString) => {
		if (!dateString) return <span className="text-gray-500">N/A</span>;
		
		const today = new Date();
		today.setHours(0, 0, 0, 0); // Normalize today's date
		const expiryDate = new Date(dateString);
		
		// Add time to expiryDate to account for timezone issues (e.g., '2025-10-23' becoming '2025-10-22T23:00:00Z')
		expiryDate.setMinutes(expiryDate.getMinutes() + expiryDate.getTimezoneOffset());

		const diffTime = expiryDate - today;
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		let colorClass = 'text-green-600';
		let text = `Expires in ${diffDays} days`;

		if (diffDays < 0) {
			colorClass = 'text-red-600 font-bold';
			text = `Expired ${Math.abs(diffDays)} days ago`;
		} else if (diffDays === 0) {
			colorClass = 'text-yellow-600 font-bold';
			text = 'Expires today';
		} else if (diffDays <= 7) {
			colorClass = 'text-yellow-600';
			text = `Expires in ${diffDays} days`;
		}

		return (
			<span className={colorClass}>
				{expiryDate.toLocaleDateString()} ({text})
			</span>
		);
	};
	
	const handleUpdate = async (formData) => {
		try {
			await updateItem(item.id, formData);
			setIsEditing(false);
			onUpdate(); // Trigger refetch in parent
		} catch (err) {
			console.error("Failed to update item:", err);
			alert("Error updating item.");
		}
	};
	
	return (
		<div className="bg-white rounded-lg shadow-md overflow-hidden">
			{!isEditing ? (
				// --- Use flex to position image ---
				<div className="p-5 flex justify-between items-start"> {/* Added flex */}
					{/* --- Main content div --- */}
					<div className="flex-grow"> {/* Added flex-grow */}
						<div className="flex justify-between items-start">
							<div>
								<h3 className="text-xl font-semibold text-gray-900">{item.name || "Unnamed Item"}</h3>
								<p className="text-sm text-gray-500">{item.brand || "No Brand"}</p>
								<div className="mt-1 flex flex-wrap gap-1">
									{item.category && (
										<span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
											 Cat: {item.category}
										</span>
									)}
									{item.location && (
										<span className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
											 Loc: {item.location}
										</span>
									)}
								</div>
							</div>
							<div className="flex space-x-2 flex-shrink-0 ml-4"> {/* Added flex-shrink-0 and ml-4 */}
								<button
									onClick={() => setIsEditing(true)}
									className="text-sm text-indigo-600 hover:text-indigo-900"
								>
									Edit
								</button>
								<button
									onClick={() => onDelete(item.id)}
									className="text-sm text-red-600 hover:text-red-900"
								>
									Delete
								</button>
							</div>
						</div>

						<div className="mt-4 space-y-2 text-sm">
							<p>
								<strong>Quantity:</strong> {item.quantity || 'N/A'} {item.unit}
							</p>
							<p>
								<strong>Barcode:</strong> {item.barcode}
							</p>
							<p>
								<strong>Expires:</strong> {formatExpiry(item.expires_on)}
							</p>
							<p className="text-xs text-gray-400">
								Added: {new Date(item.created_at).toLocaleString()}
							</p>
						</div>
					</div>

					{/* --- ADD IMAGE HERE --- */}
					{item.image_url && (
						<div className="ml-4 flex-shrink-0"> {/* Container for image */}
							<img
								src={item.image_url}
								alt={item.name || 'Product Image'}
								className="w-20 h-20 object-contain rounded border border-gray-200" // Adjusted size and added border
							/>
						</div>
					)}
					{/* --- END IMAGE ADD --- */}

				</div>
			) : (
				<ItemForm
					initialData={item}
					onSubmit={handleUpdate}
					onCancel={() => setIsEditing(false)}
				/>
			)}
		</div>
	);
}

export default ItemCard;