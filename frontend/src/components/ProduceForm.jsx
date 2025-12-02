import { useMemo, useState } from 'react';
import { PRODUCE, PRODUCE_GROUPS } from '../data/produce';
import { PRESET_LOCATIONS } from '../data/presets';

const TYPE_FILTERS = [
	{ value: 'all', label: 'All' },
	{ value: 'fruit', label: '🍎 Fruits' },
	{ value: 'vegetable', label: '🥕 Vegetables' },
];

const UNIT_OPTIONS = [
	{ value: 'g', label: 'Grams', placeholder: 'e.g. 500' },
	{ value: 'pcs', label: 'Quantity', placeholder: 'e.g. 6' },
];

// Local date N days from today as YYYY-MM-DD (toISOString would shift to UTC)
const dateInDays = (days) => {
	const d = new Date();
	d.setDate(d.getDate() + days);
	const pad = (n) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// "Blood orange" -> "BO", "Plum" -> "P"
const initials = (name) =>
	name.split(/[\s/]+/).slice(0, 2).map(word => word[0].toUpperCase()).join('');

// Dark text on light colors (yellow, white produce), white text otherwise
const isLight = (hex) => {
	const n = parseInt(hex.slice(1), 16);
	const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
	return (0.299 * r + 0.587 * g + 0.114 * b) > 170;
};

// Emoji when one truly depicts the item, otherwise a colored circle with initials
function ProduceIcon({ item }) {
	if (item.emoji) {
		return <span className="text-3xl leading-10 h-10" aria-hidden="true">{item.emoji}</span>;
	}
	return (
		<span
			aria-hidden="true"
			className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border border-black/10 ${isLight(item.color) ? 'text-gray-800' : 'text-white'}`}
			style={{ backgroundColor: item.color }}
		>
			{initials(item.name)}
		</span>
	);
}

function ProduceForm({ onSubmit }) {
	const [search, setSearch] = useState('');
	const [typeFilter, setTypeFilter] = useState('all');
	const [selected, setSelected] = useState(null);
	const [unit, setUnit] = useState('pcs');
	const [quantity, setQuantity] = useState('');
	const [location, setLocation] = useState('');
	const [expiresOn, setExpiresOn] = useState('');

	// Groups (in display order) with their items matching the search & type filter
	const visibleGroups = useMemo(() => {
		const query = search.trim().toLowerCase();
		return PRODUCE_GROUPS
			.filter(group => typeFilter === 'all' || group.type === typeFilter)
			.map(group => {
				const groupMatches = group.label.toLowerCase().includes(query);
				const items = PRODUCE.filter(item =>
					item.group === group.id && (groupMatches || item.name.toLowerCase().includes(query))
				);
				return { ...group, items };
			})
			.filter(group => group.items.length > 0);
	}, [search, typeFilter]);

	const handleSelect = (item) => {
		setSelected(item);
		setUnit(item.defaultUnit);
		setQuantity('');
		setLocation(item.location);
		setExpiresOn(dateInDays(item.shelfLifeDays));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const parsedQuantity = parseFloat(quantity);
		if (!selected || !(parsedQuantity > 0)) return;

		onSubmit({
			barcode: null,
			name: selected.name,
			brand: null,
			quantity: parsedQuantity,
			unit,
			category: 'Produce',
			location: location || null,
			expires_on: expiresOn || null,
			image_url: null,
		});

		setSelected(null);
		setQuantity('');
		setLocation('');
		setExpiresOn('');
	};

	const unitOption = UNIT_OPTIONS.find(option => option.value === unit);

	return (
		<form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md space-y-4">

			{/* Search & type filter */}
			<div className="flex flex-col sm:flex-row gap-3">
				<input
					type="search" placeholder="Search fruits & vegetables..."
					value={search} onChange={(e) => setSearch(e.target.value)}
					className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				/>
				<div className="flex gap-2 shrink-0">
					{TYPE_FILTERS.map(filter => (
						<button
							key={filter.value} type="button"
							onClick={() => setTypeFilter(filter.value)}
							className={`px-3 py-1.5 text-sm rounded-full border ${typeFilter === filter.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
						>
							{filter.label}
						</button>
					))}
				</div>
			</div>

			{/* Grouped produce picker */}
			<div className="max-h-96 overflow-y-auto space-y-4 pr-1">
				{visibleGroups.length === 0 && (
					<p className="text-sm text-gray-500">No fruits or vegetables match "{search}".</p>
				)}
				{visibleGroups.map(group => (
					<div key={group.id}>
						<h3 className="text-sm font-semibold text-gray-600 mb-2">{group.label}</h3>
						<div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
							{group.items.map(item => {
								const isSelected = selected?.name === item.name;
								return (
									<button
										key={item.name} type="button"
										onClick={() => handleSelect(item)}
										aria-pressed={isSelected}
										className={`flex flex-col items-center gap-1 p-2 rounded-md border text-xs text-center ${isSelected ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500' : 'border-gray-200 hover:bg-gray-50'}`}
									>
										<ProduceIcon item={item} />
										<span className="text-gray-700">{item.name}</span>
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>

			{/* Details for the selected item */}
			{selected && (
				<div className="border-t pt-4 space-y-4">
					<div className="flex items-center gap-3">
						<ProduceIcon item={selected} />
						<span className="text-lg font-medium">{selected.name}</span>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Grams / Quantity toggle + amount */}
						<div className="md:col-span-2">
							<span className="block text-sm font-medium text-gray-700">Add by</span>
							<div className="mt-1 flex gap-2">
								<div className="inline-flex rounded-md shadow-sm shrink-0">
									{UNIT_OPTIONS.map((option, i) => (
										<button
											key={option.value} type="button"
											onClick={() => setUnit(option.value)}
											aria-pressed={unit === option.value}
											className={`px-4 py-2 text-sm font-medium border ${i === 0 ? 'rounded-l-md' : '-ml-px rounded-r-md'} ${unit === option.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
										>
											{option.label}
										</button>
									))}
								</div>
								<input
									type="number" id="produce-quantity" required
									min="1" step="1"
									placeholder={unitOption.placeholder}
									value={quantity} onChange={(e) => setQuantity(e.target.value)}
									aria-label={unit === 'g' ? 'Weight in grams' : 'Number of pieces'}
									className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								/>
								<span className="self-center text-sm text-gray-500 w-8">{unit}</span>
							</div>
						</div>

						{/* Location */}
						<div>
							<label htmlFor="produce-location" className="block text-sm font-medium text-gray-700"> Location </label>
							<input
								list="produce-location-suggestions" type="text" id="produce-location"
								value={location} onChange={(e) => setLocation(e.target.value)}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
							<datalist id="produce-location-suggestions">
								{PRESET_LOCATIONS.map(loc => <option key={loc} value={loc} />)}
							</datalist>
						</div>

						{/* Expiry, pre-filled from typical shelf life */}
						<div>
							<label htmlFor="produce-expires" className="block text-sm font-medium text-gray-700"> Expiration Date </label>
							<input
								type="date" id="produce-expires"
								value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)}
								className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							/>
							<p className="mt-1 text-xs text-gray-500">Suggested: about {selected.shelfLifeDays} days</p>
						</div>
					</div>
				</div>
			)}

			{/* Form Buttons */}
			<div className="flex justify-end space-x-3 pt-2">
				<button
					type="submit"
					disabled={!selected}
					className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{selected ? `Add ${selected.name}` : 'Pick an item'}
				</button>
			</div>

		</form>
	);
}

export default ProduceForm;
