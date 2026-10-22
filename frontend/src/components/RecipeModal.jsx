import { useEffect, useState } from 'react';
import { generateRecipe, getRecipeQuota } from '../services/api';

const MEAL_TYPES = [
	{ value: 'breakfast', label: 'Breakfast' },
	{ value: 'lunch', label: 'Lunch' },
	{ value: 'dinner', label: 'Dinner' },
	{ value: 'snack', label: 'Snack' },
];

const DIETARY_OPTIONS = [
	{ value: 'vegetarian', label: 'Vegetarian' },
	{ value: 'vegan', label: 'Vegan' },
	{ value: 'gluten_free', label: 'Gluten-free' },
	{ value: 'dairy_free', label: 'Dairy-free' },
	{ value: 'kosher', label: 'Kosher' },
	{ value: 'halal', label: 'Halal' },
	{ value: 'high_protein', label: 'High protein' },
	{ value: 'low_carb', label: 'Low carb' },
	{ value: 'low_calorie', label: 'Low calorie' },
];

const TIME_OPTIONS = [15, 30, 45, 60];

const DIFFICULTY_OPTIONS = [
	{ value: 'easy', label: 'Easy' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'hard', label: 'Hard' },
];

const CUISINE_OPTIONS = [
	{ value: 'italian', label: 'Italian' },
	{ value: 'asian', label: 'Asian' },
	{ value: 'mexican', label: 'Mexican' },
	{ value: 'middle_eastern', label: 'Middle Eastern' },
	{ value: 'indian', label: 'Indian' },
	{ value: 'mediterranean', label: 'Mediterranean' },
	{ value: 'american', label: 'American' },
	{ value: 'french', label: 'French' },
];

const DEFAULT_OPTIONS = {
	mode: 'prioritize_expiring',
	meal_type: null,
	dietary: [],
	max_time_minutes: null,
	difficulty: null,
	cuisine: null,
};

function Chip({ active, onClick, children }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`px-3 py-1 rounded-full text-sm border transition-colors ${
				active
					? 'bg-indigo-600 text-white border-indigo-600'
					: 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
			}`}
		>
			{children}
		</button>
	);
}

function describeError(err) {
	const status = err.response?.status;
	const detail = err.response?.data?.detail;

	if (status === 429) {
		const minutes = Math.ceil((detail?.retry_after_seconds ?? 3600) / 60);
		return `You've used all your recipe ideas for this hour. Try again in ${minutes} min.`;
	}
	if (typeof detail === 'string') return detail;
	return "Couldn't generate a recipe right now. Please try again.";
}

function RecipeModal({ onClose }) {
	const [options, setOptions] = useState(DEFAULT_OPTIONS);
	const [quota, setQuota] = useState(null);
	const [recipe, setRecipe] = useState(null);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState(null);

	const refreshQuota = async () => {
		try {
			const response = await getRecipeQuota();
			setQuota(response.data);
		} catch (err) {
			console.error("Failed to fetch recipe quota:", err);
		}
	};

	useEffect(() => {
		refreshQuota();
	}, []);

	// Close on Escape
	useEffect(() => {
		const handleKey = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	}, [onClose]);

	const setOption = (field, value) => setOptions(prev => ({ ...prev, [field]: value }));

	// Clicking the selected chip again clears it
	const toggleSingle = (field, value) => setOption(field, options[field] === value ? null : value);

	const toggleDietary = (value) => {
		setOption('dietary', options.dietary.includes(value)
			? options.dietary.filter(d => d !== value)
			: [...options.dietary, value]);
	};

	const handleGenerate = async () => {
		setGenerating(true);
		setError(null);
		try {
			const response = await generateRecipe(options);
			setRecipe(response.data.recipe);
		} catch (err) {
			console.error("Failed to generate recipe:", err);
			setError(describeError(err));
		} finally {
			setGenerating(false);
			refreshQuota();
		}
	};

	const isExpiringIngredient = (name) => {
		const lower = name.toLowerCase();
		return recipe.used_expiring_items.some(item => {
			const itemLower = item.toLowerCase();
			return lower.includes(itemLower) || itemLower.includes(lower);
		});
	};

	const outOfQuota = quota?.remaining === 0;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			onClick={onClose}
		>
			<div
				className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex justify-between items-start mb-4">
					<div>
						<h2 className="text-2xl font-bold">✨ Recipe Ideas</h2>
						{quota && (
							<p className={`text-sm ${outOfQuota ? 'text-red-600' : 'text-gray-500'}`}>
								{quota.remaining} of {quota.limit} recipe ideas left this hour
								{outOfQuota && quota.retry_after_seconds &&
									` (next one in ${Math.ceil(quota.retry_after_seconds / 60)} min)`}
							</p>
						)}
					</div>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none" aria-label="Close">
						&times;
					</button>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
						{error}
					</div>
				)}

				{generating ? (
					<div className="py-16 text-center text-gray-600">
						<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mb-3"></div>
						<p>Cooking up ideas…</p>
					</div>
				) : recipe ? (
					/* Result */
					<div className="space-y-5">
						<div>
							<h3 className="text-xl font-semibold text-gray-900">{recipe.title}</h3>
							<p className="text-gray-600 mt-1">{recipe.description}</p>
							<div className="flex flex-wrap gap-2 mt-2 text-xs">
								<span className="bg-gray-100 px-2.5 py-0.5 rounded">⏱ {recipe.total_time_minutes} min</span>
								<span className="bg-gray-100 px-2.5 py-0.5 rounded">🍽 {recipe.servings} servings</span>
								<span className="bg-gray-100 px-2.5 py-0.5 rounded capitalize">{recipe.difficulty}</span>
							</div>
						</div>

						<div>
							<h4 className="font-semibold mb-2">Ingredients</h4>
							<ul className="space-y-1 text-sm">
								{recipe.ingredients.map((ing, i) => {
									const expiring = ing.source === 'pantry' && isExpiringIngredient(ing.name);
									return (
										<li key={i} className={expiring ? 'text-orange-700 font-medium' : ing.source === 'staple' ? 'text-gray-500' : ''}>
											{ing.source === 'missing' ? '🛒' : '✅'} {ing.amount} {ing.name}
											{expiring && (
												<span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">expiring soon</span>
											)}
										</li>
									);
								})}
							</ul>
							{recipe.missing_ingredients.length > 0 && (
								<p className="text-xs text-gray-500 mt-2">
									🛒 To buy: {recipe.missing_ingredients.join(', ')}
								</p>
							)}
						</div>

						<div>
							<h4 className="font-semibold mb-2">Steps</h4>
							<ol className="list-decimal list-inside space-y-2 text-sm">
								{recipe.steps.map((step, i) => <li key={i}>{step}</li>)}
							</ol>
						</div>

						{recipe.nutrition_per_serving && (
							<p className="text-xs text-gray-500">
								<strong>Nutrition (per serving, estimated):</strong> {recipe.nutrition_per_serving}
							</p>
						)}

						<div className="flex flex-wrap gap-3 pt-2">
							<button
								onClick={handleGenerate}
								disabled={outOfQuota}
								className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Try another
							</button>
							<button
								onClick={() => { setRecipe(null); setError(null); }}
								className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
							>
								Change options
							</button>
							<button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900">
								Close
							</button>
						</div>
					</div>
				) : (
					/* Options form */
					<div className="space-y-5">
						<div>
							<h4 className="text-sm font-medium text-gray-700 mb-2">What should the recipe focus on?</h4>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{[
									{ value: 'prioritize_expiring', title: '🕒 Use expiring items first', text: "Rescue food that's about to go bad" },
									{ value: 'balanced', title: '⚖️ Use the whole pantry', text: 'Treat all items equally' },
								].map(m => (
									<button
										key={m.value}
										type="button"
										onClick={() => setOption('mode', m.value)}
										className={`text-left p-3 rounded-lg border-2 transition-colors ${
											options.mode === m.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
										}`}
									>
										<div className="font-medium">{m.title}</div>
										<div className="text-xs text-gray-500">{m.text}</div>
									</button>
								))}
							</div>
						</div>

						<div>
							<h4 className="text-sm font-medium text-gray-700 mb-2">Meal type</h4>
							<div className="flex flex-wrap gap-2">
								{MEAL_TYPES.map(m => (
									<Chip key={m.value} active={options.meal_type === m.value} onClick={() => toggleSingle('meal_type', m.value)}>
										{m.label}
									</Chip>
								))}
							</div>
						</div>

						<div>
							<h4 className="text-sm font-medium text-gray-700 mb-2">Dietary restrictions &amp; nutrition</h4>
							<div className="flex flex-wrap gap-2">
								{DIETARY_OPTIONS.map(d => (
									<Chip key={d.value} active={options.dietary.includes(d.value)} onClick={() => toggleDietary(d.value)}>
										{d.label}
									</Chip>
								))}
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
							<div>
								<label htmlFor="recipe-time" className="block text-sm font-medium text-gray-700 mb-1">Max time</label>
								<select
									id="recipe-time"
									value={options.max_time_minutes ?? ''}
									onChange={(e) => setOption('max_time_minutes', e.target.value ? Number(e.target.value) : null)}
									className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								>
									<option value="">Any</option>
									{TIME_OPTIONS.map(t => <option key={t} value={t}>{t} min</option>)}
								</select>
							</div>
							<div>
								<label htmlFor="recipe-difficulty" className="block text-sm font-medium text-gray-700 mb-1">Effort</label>
								<select
									id="recipe-difficulty"
									value={options.difficulty ?? ''}
									onChange={(e) => setOption('difficulty', e.target.value || null)}
									className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								>
									<option value="">Any</option>
									{DIFFICULTY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
								</select>
							</div>
							<div>
								<label htmlFor="recipe-cuisine" className="block text-sm font-medium text-gray-700 mb-1">Cuisine &amp; region</label>
								<select
									id="recipe-cuisine"
									value={options.cuisine ?? ''}
									onChange={(e) => setOption('cuisine', e.target.value || null)}
									className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								>
									<option value="">Any</option>
									{CUISINE_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
								</select>
							</div>
						</div>

						<div className="flex justify-end gap-3 pt-2">
							<button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-900">
								Cancel
							</button>
							<button
								onClick={handleGenerate}
								disabled={outOfQuota}
								className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								✨ Generate recipe
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default RecipeModal;
