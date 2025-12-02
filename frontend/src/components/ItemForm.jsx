import { useState } from 'react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import { lookupBarcode } from '../services/api';

const PRESET_CATEGORIES = ["Canned Goods", "Spices", "Produce", "Dry Goods", "Snacks", "Beverages", "Other"];
const PRESET_LOCATIONS = ["Fridge", "Freezer", "Pantry Shelf", "Cupboard", "Countertop", "Other"];

function ItemForm({ onSubmit, initialData = {}, onCancel }) {
	const [formData, setFormData] = useState({
		barcode: initialData.barcode || '',
		name: initialData.name || '',
		brand: initialData.brand || '',
		quantity: initialData.quantity || '',
		unit: initialData.unit || '',
		expires_on: initialData.expires_on || '',
		category: initialData.category || '',
		location: initialData.location || '',
		image_url: initialData.image_url || '',
	});

	const [showScanner, setShowScanner] = useState(false);
	const [isFetchingDetails, setIsFetchingDetails] = useState(false);
	const [fetchMessage, setFetchMessage] = useState('');
	const [fetchMessageType, setFetchMessageType] = useState('info');
	const isEditMode = !!initialData.id;

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleScan = (error, result) => {
		if (result) {
			setFormData(prev => ({ ...prev, barcode: result.text }));
			setShowScanner(false);
		}
		if (error) {
			console.error("Scan error:", error);
		}
	};

	const handleFetchDetails = async () => {
		// Don't fetch if no barcode or already fetching
		if (!formData.barcode || isFetchingDetails) return;

		setIsFetchingDetails(true);
		setFetchMessage('Fetching details...');
		const barcode = formData.barcode.trim(); // Use trimmed barcode for lookup

		try {
			// Call your backend lookup endpoint
			const response = await lookupBarcode(barcode);
			const details = response.data; // Data structure matches BarcodeLookupOut

			if (details) {
				// Update form data state with fetched details
				// Only update fields if the fetched detail is not null/undefined
				// Keep existing user input otherwise
				setFormData(prev => ({
					...prev,
					name: details.name || prev.name,
					brand: details.brand || prev.brand,
					quantity: details.quantity !== null && details.quantity !== undefined ? details.quantity : prev.quantity,
					unit: details.unit || prev.unit,
					image_url: details.image_url || prev.image_url,
				}));

				// Provide feedback based on whether any useful data was returned
				if (details.name || details.brand || details.quantity !== null || details.unit || details.image_url) {
					setFetchMessage('Details fetched!');
				} else {
					setFetchMessage('Product found, but no details available.');
				}
			} else {
				// This case might not happen if backend always returns the model structure,
				// but good practice to handle potentially empty responses
				setFetchMessage('Product not found.');
			}
		} catch (error) {
			console.error("Error fetching details via backend:", error);
			// Try to get a specific error message from the backend response
			const errorDetail = error.response?.data?.detail;
			setFetchMessage(errorDetail ? `Error: ${errorDetail}` : 'Error fetching details.');
		} finally {
			// Ensure loading state is turned off regardless of success/failure
			setIsFetchingDetails(false);
		}
	};


	const handleSubmit = (e) => {
        e.preventDefault();

        // Prepare data for API from the component's state
        const dataToSubmit = {
            barcode: formData.barcode, // Use the state value
            name: formData.name || null,
            brand: formData.brand || null,
            quantity: formData.quantity ? parseFloat(formData.quantity) : null,
            unit: formData.unit || null,
            expires_on: formData.expires_on || null,
			category: formData.category || null,
			location: formData.location || null,
			image_url: formData.image_url || null,
        };

        // Don't send barcode on edit
        if (isEditMode) {
            delete dataToSubmit.barcode;
            // Ensure barcode isn't required during edit by backend logic
        } else if (!dataToSubmit.barcode) {
             // Basic check to prevent submitting if barcode somehow became empty
             alert("Barcode is required."); // Or use a nicer notification
             return;
        }


        // Send the populated data object
        onSubmit(dataToSubmit);

        // Clear form only if not in edit mode
        if (!isEditMode) {
            setFormData({
                barcode: '', name: '', brand: '', quantity: '', unit: '', expires_on: '', category: '', location: '',
            });
        }
    };

	const getMessageClass = (type) => {
        switch (type) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'loading': return 'text-gray-500 italic';
            case 'info':
            default: return 'text-gray-500';
        }
    };

	return (
		<form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md space-y-4">

			{!isEditMode && showScanner && (
				<div className="relative border p-2 rounded overflow-hidden">
					<p className="text-sm text-center mb-2">Point camera at barcode</p>
					<BarcodeScanner
						onUpdate={handleScan}
						width="100%"
						height="300px" // Adjust height as needed
					/>
					<div className="scanner-reticle"></div>
					<button
						type="button"
						onClick={() => setShowScanner(false)}
						className="relative z-20 mt-2 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50" // Added relative z-20
					>
						Cancel Scan
					</button>
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Barcode Input & Buttons Section */}
				{!isEditMode && (
					<div className="md:col-span-2">
						<label htmlFor="barcode" className="block text-sm font-medium text-gray-700"> Barcode (required) </label>
						<div className="mt-1 flex rounded-md shadow-sm">
                            <input
                                type="text" name="barcode" id="barcode" required
                                value={formData.barcode} onChange={handleChange}
                                className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                            {/* Scan Button - Adjust padding if needed */}
                            <button
                                type="button"
                                onClick={() => setShowScanner(prev => !prev)}
                                // Example: Reduced padding px-3 instead of px-4
                                className="relative -ml-px inline-flex items-center space-x-2 rounded-none border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <span>📷</span>
                                <span>{showScanner ? 'Close' : 'Scan'}</span>
                            </button>
                            {/* Fetch Button - Adjust padding if needed */}
                            <button
                                type="button"
                                onClick={handleFetchDetails}
                                disabled={!formData.barcode || isFetchingDetails}
                                // Example: Reduced padding px-3 instead of px-4
                                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isFetchingDetails ? 'Fetching...' : 'Fetch'} {/* Shortened text */}
                            </button>
                        </div>
						{/* Display Fetch Message */}
						{fetchMessage && (
							<p className={`mt-1 text-xs ${getMessageClass(fetchMessageType)}`}>
								{fetchMessage}
							</p>
						)}
					</div>
				)}

				{/* Name Input */}
				<div>
					<label htmlFor="name" className="block text-sm font-medium text-gray-700"> Name </label>
					<input
						type="text" name="name" id="name"
						value={formData.name} onChange={handleChange}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
				</div>

				{/* Brand Input */}
				<div>
					<label htmlFor="brand" className="block text-sm font-medium text-gray-700"> Brand </label>
					<input
						type="text" name="brand" id="brand"
						value={formData.brand} onChange={handleChange}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
				</div>

				{/* Quantity Input */}
				<div>
					<label htmlFor="quantity" className="block text-sm font-medium text-gray-700"> Quantity </label>
					<input
						type="number" name="quantity" id="quantity" step="0.01"
						value={formData.quantity} onChange={handleChange}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
				</div>

				{/* Unit Input */}
				<div>
					<label htmlFor="unit" className="block text-sm font-medium text-gray-700"> Unit (e.g., kg, g, lbs, items) </label>
					<input
						type="text" name="unit" id="unit"
						value={formData.unit} onChange={handleChange}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
				</div>

				{/* Category Input */}
				<div>
					<label htmlFor="category" className="block text-sm font-medium text-gray-700"> Category </label>
					<input
						list="category-suggestions" type="text" name="category" id="category"
						value={formData.category} onChange={handleChange}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
					<datalist id="category-suggestions">
						{PRESET_CATEGORIES.map(cat => <option key={cat} value={cat} />)}
					</datalist>
				</div>

				{/* Location Input */}
				<div>
					<label htmlFor="location" className="block text-sm font-medium text-gray-700"> Location </label>
					<input
						list="location-suggestions" type="text" name="location" id="location"
						value={formData.location} onChange={handleChange}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
					<datalist id="location-suggestions">
						{PRESET_LOCATIONS.map(loc => <option key={loc} value={loc} />)}
					</datalist>
				</div>

				{/* Expires On Input */}
				<div>
					<label htmlFor="expires_on" className="block text-sm font-medium text-gray-700"> Expiration Date </label>
					<input
						type="date" name="expires_on" id="expires_on"
						value={formData.expires_on} onChange={handleChange}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
				</div>

			</div> {/* End of grid */}

			{/* Form Buttons */}
			<div className="flex justify-end space-x-3 pt-2">
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						Cancel
					</button>
				)}
				<button
					type="submit"
					className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
				>
					{isEditMode ? 'Save Changes' : 'Add Item'}
				</button>
			</div>

		</form>
	);
}
export default ItemForm;