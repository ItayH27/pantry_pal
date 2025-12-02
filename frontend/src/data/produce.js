// Catalog of loose fruits & vegetables (no barcode) for ProduceForm.
// Each item inherits its group's defaults and overrides only what differs.
// emoji is null when no emoji truly depicts the item; ProduceIcon then draws
// a colored circle with the item's initials using `color`.

export const PRODUCE_GROUPS = [
	// Fruits
	{ id: 'apples', label: 'Apples', type: 'fruit', defaults: { defaultUnit: 'pcs', shelfLifeDays: 30, location: 'Fridge' } },
	{ id: 'pears', label: 'Pears', type: 'fruit', defaults: { defaultUnit: 'pcs', shelfLifeDays: 7, location: 'Countertop' } },
	{ id: 'bananas', label: 'Bananas & Plantains', type: 'fruit', defaults: { defaultUnit: 'pcs', shelfLifeDays: 5, location: 'Countertop' } },
	{ id: 'citrus', label: 'Citrus', type: 'fruit', defaults: { defaultUnit: 'pcs', shelfLifeDays: 14, location: 'Countertop' } },
	{ id: 'stone', label: 'Stone Fruits', type: 'fruit', defaults: { defaultUnit: 'pcs', shelfLifeDays: 5, location: 'Countertop' } },
	{ id: 'melons', label: 'Melons', type: 'fruit', defaults: { defaultUnit: 'pcs', shelfLifeDays: 7, location: 'Countertop' } },
	{ id: 'tropical', label: 'Tropical & Other', type: 'fruit', defaults: { defaultUnit: 'pcs', shelfLifeDays: 5, location: 'Countertop' } },
	// Vegetables
	{ id: 'roots', label: 'Roots & Tubers', type: 'vegetable', defaults: { defaultUnit: 'g', shelfLifeDays: 21, location: 'Cupboard' } },
	{ id: 'alliums', label: 'Alliums', type: 'vegetable', defaults: { defaultUnit: 'g', shelfLifeDays: 30, location: 'Cupboard' } },
	{ id: 'cruciferous', label: 'Cruciferous & Large Heads', type: 'vegetable', defaults: { defaultUnit: 'pcs', shelfLifeDays: 7, location: 'Fridge' } },
	{ id: 'squashes', label: 'Squashes & Gourds', type: 'vegetable', defaults: { defaultUnit: 'pcs', shelfLifeDays: 7, location: 'Fridge' } },
	{ id: 'nightshades', label: 'Peppers & Nightshades', type: 'vegetable', defaults: { defaultUnit: 'pcs', shelfLifeDays: 7, location: 'Fridge' } },
	{ id: 'stalks', label: 'Stalks & Greens', type: 'vegetable', defaults: { defaultUnit: 'pcs', shelfLifeDays: 7, location: 'Fridge' } },
	{ id: 'aromatics', label: 'Aromatics', type: 'vegetable', defaults: { defaultUnit: 'g', shelfLifeDays: 21, location: 'Fridge' } },
];

const ITEMS = [
	// Apples
	{ name: 'Red apple', group: 'apples', emoji: '🍎', color: '#D32F2F' },
	{ name: 'Green apple', group: 'apples', emoji: '🍏', color: '#7CB342' },
	{ name: 'Yellow apple', group: 'apples', emoji: null, color: '#F4D03F' },
	// Pears
	{ name: 'Green pear', group: 'pears', emoji: '🍐', color: '#AED581' },
	{ name: 'Brown/Bosc pear', group: 'pears', emoji: null, color: '#A0703C' },
	{ name: 'Asian pear', group: 'pears', emoji: null, color: '#D9B867', shelfLifeDays: 14, location: 'Fridge' },
	// Bananas & Plantains
	{ name: 'Yellow banana', group: 'bananas', emoji: '🍌', color: '#FFD54F' },
	{ name: 'Green banana', group: 'bananas', emoji: null, color: '#9CCC65', shelfLifeDays: 7 },
	{ name: 'Plantain', group: 'bananas', emoji: null, color: '#C9A227', shelfLifeDays: 7 },
	// Citrus
	{ name: 'Orange', group: 'citrus', emoji: '🍊', color: '#FB8C00' },
	{ name: 'Blood orange', group: 'citrus', emoji: null, color: '#B71C1C' },
	{ name: 'Mandarin/Clementine', group: 'citrus', emoji: '🍊', color: '#FF9800' },
	{ name: 'Grapefruit', group: 'citrus', emoji: null, color: '#F06A55' },
	{ name: 'Lemon', group: 'citrus', emoji: '🍋', color: '#FDD835', shelfLifeDays: 21, location: 'Fridge' },
	{ name: 'Lime', group: 'citrus', emoji: null, color: '#689F38', shelfLifeDays: 21, location: 'Fridge' },
	{ name: 'Pomelo', group: 'citrus', emoji: null, color: '#DCE775' },
	// Stone Fruits
	{ name: 'Peach', group: 'stone', emoji: '🍑', color: '#FFAB91' },
	{ name: 'Nectarine', group: 'stone', emoji: null, color: '#E57357' },
	{ name: 'Plum', group: 'stone', emoji: null, color: '#6A1B9A' },
	{ name: 'Apricot', group: 'stone', emoji: null, color: '#F5A04A' },
	// Melons
	{ name: 'Watermelon', group: 'melons', emoji: '🍉', color: '#2E7D32' },
	{ name: 'Cantaloupe', group: 'melons', emoji: '🍈', color: '#F4B183' },
	{ name: 'Honeydew', group: 'melons', emoji: '🍈', color: '#C5E1A5' },
	// Tropical & Other
	{ name: 'Pineapple', group: 'tropical', emoji: '🍍', color: '#F9A825' },
	{ name: 'Mango', group: 'tropical', emoji: '🥭', color: '#FFB300' },
	{ name: 'Papaya', group: 'tropical', emoji: null, color: '#FF8A50' },
	{ name: 'Avocado', group: 'tropical', emoji: '🥑', color: '#558B2F' },
	{ name: 'Kiwi', group: 'tropical', emoji: '🥝', color: '#8D6E63', shelfLifeDays: 14, location: 'Fridge' },
	{ name: 'Pomegranate', group: 'tropical', emoji: null, color: '#AD1457', shelfLifeDays: 30, location: 'Fridge' },
	{ name: 'Persimmon', group: 'tropical', emoji: null, color: '#EF6C00' },
	{ name: 'Coconut', group: 'tropical', emoji: '🥥', color: '#6D4C41', shelfLifeDays: 30 },
	// Roots & Tubers
	{ name: 'Brown potato', group: 'roots', emoji: '🥔', color: '#A1887F', shelfLifeDays: 30 },
	{ name: 'Red potato', group: 'roots', emoji: null, color: '#A0413C', shelfLifeDays: 30 },
	{ name: 'Sweet potato', group: 'roots', emoji: '🍠', color: '#C0592B' },
	{ name: 'Carrot', group: 'roots', emoji: '🥕', color: '#F57C00', location: 'Fridge' },
	{ name: 'Beet', group: 'roots', emoji: null, color: '#880E4F', location: 'Fridge' },
	{ name: 'Radish', group: 'roots', emoji: null, color: '#E53962', shelfLifeDays: 10, location: 'Fridge' },
	{ name: 'Turnip', group: 'roots', emoji: null, color: '#B39DDB', location: 'Fridge' },
	{ name: 'Parsnip', group: 'roots', emoji: null, color: '#EFE3B5', location: 'Fridge' },
	// Alliums
	{ name: 'Yellow onion', group: 'alliums', emoji: '🧅', color: '#D4A24C' },
	{ name: 'Red onion', group: 'alliums', emoji: null, color: '#7B1F4B' },
	{ name: 'White onion', group: 'alliums', emoji: null, color: '#F2EFE6' },
	{ name: 'Shallot', group: 'alliums', emoji: null, color: '#B5695A' },
	{ name: 'Garlic', group: 'alliums', emoji: '🧄', color: '#EDE7D9', defaultUnit: 'pcs' },
	{ name: 'Leek', group: 'alliums', emoji: null, color: '#7FAF4E', defaultUnit: 'pcs', shelfLifeDays: 10, location: 'Fridge' },
	// Cruciferous & Large Heads
	{ name: 'Broccoli', group: 'cruciferous', emoji: '🥦', color: '#388E3C' },
	{ name: 'Cauliflower', group: 'cruciferous', emoji: null, color: '#F5F0E1' },
	{ name: 'Green cabbage', group: 'cruciferous', emoji: null, color: '#9CCC65', shelfLifeDays: 21 },
	{ name: 'Red cabbage', group: 'cruciferous', emoji: null, color: '#6A1B9A', shelfLifeDays: 21 },
	// Squashes & Gourds
	{ name: 'Green zucchini', group: 'squashes', emoji: null, color: '#33691E' },
	{ name: 'Yellow squash', group: 'squashes', emoji: null, color: '#FBC02D' },
	{ name: 'Butternut squash', group: 'squashes', emoji: null, color: '#E0A458', shelfLifeDays: 30, location: 'Cupboard' },
	{ name: 'Pumpkin', group: 'squashes', emoji: null, color: '#EF6C00', shelfLifeDays: 30, location: 'Cupboard' },
	// Peppers & Nightshades
	{ name: 'Red bell pepper', group: 'nightshades', emoji: null, color: '#C62828' },
	{ name: 'Green bell pepper', group: 'nightshades', emoji: '🫑', color: '#43A047' },
	{ name: 'Yellow bell pepper', group: 'nightshades', emoji: null, color: '#FDD835' },
	{ name: 'Chili pepper', group: 'nightshades', emoji: '🌶️', color: '#D32F2F', defaultUnit: 'g' },
	{ name: 'Eggplant', group: 'nightshades', emoji: '🍆', color: '#4A148C' },
	{ name: 'Red tomato', group: 'nightshades', emoji: '🍅', color: '#E53935', defaultUnit: 'g', location: 'Countertop' },
	{ name: 'Green tomato', group: 'nightshades', emoji: null, color: '#7CB342', defaultUnit: 'g', location: 'Countertop' },
	// Stalks & Greens
	{ name: 'Celery', group: 'stalks', emoji: null, color: '#9CCC65', shelfLifeDays: 14 },
	{ name: 'Corn on the cob', group: 'stalks', emoji: '🌽', color: '#FBC02D', shelfLifeDays: 3 },
	{ name: 'Fennel', group: 'stalks', emoji: null, color: '#D7E8B5' },
	{ name: 'Lettuce head', group: 'stalks', emoji: '🥬', color: '#7CB342' },
	// Aromatics
	{ name: 'Ginger', group: 'aromatics', emoji: '🫚', color: '#C8A165' },
	{ name: 'Turmeric', group: 'aromatics', emoji: null, color: '#E68A00' },
];

const GROUPS_BY_ID = Object.fromEntries(PRODUCE_GROUPS.map(g => [g.id, g]));

// Items with group defaults merged in, plus `type` from the group
export const PRODUCE = ITEMS.map(item => {
	const group = GROUPS_BY_ID[item.group];
	return { ...group.defaults, type: group.type, ...item };
});
