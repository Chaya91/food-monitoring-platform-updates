// FreshGuard Mock Data System
// Pre-populates localStorage if empty

const DEFAULT_USERS = [
  { id: "u1", name: "Prajwal Raju", email: "admin@freshguard.com", role: "Administrator", status: "Active", createdDate: "2026-01-15" },
  { id: "u2", name: "Sarah Connor", email: "manager@freshguard.com", role: "Retail Manager", status: "Active", createdDate: "2026-03-22" },
  { id: "u3", name: "John Doe", email: "warehouse@freshguard.com", role: "Warehouse Operator", status: "Active", createdDate: "2026-05-10" },
  { id: "u4", name: "Jane Smith", email: "consumer@freshguard.com", role: "Consumer", status: "Active", createdDate: "2026-06-01" },
  { id: "u5", name: "David Chen", email: "inspector@freshguard.com", role: "Food Quality Inspector", status: "Active", createdDate: "2026-02-18" },
  { id: "u6", name: "Alice Adams", email: "alice@freshguard.com", role: "Consumer", status: "Active", createdDate: "2026-07-02" },
  { id: "u7", name: "Bob Miller", email: "bob@freshguard.com", role: "Warehouse Operator", status: "Inactive", createdDate: "2026-04-12" },
  { id: "u8", name: "Elena Rostova", email: "elena@freshguard.com", role: "Food Quality Inspector", status: "Active", createdDate: "2026-05-30" },
  { id: "u9", name: "Marcus Aurelius", email: "marcus@freshguard.com", role: "Retail Manager", status: "Active", createdDate: "2026-01-20" },
  { id: "u10", name: "Luke Skywalker", email: "luke@freshguard.com", role: "Warehouse Operator", status: "Active", createdDate: "2026-07-15" }
];

// Helper to get relative dates in YYYY-MM-DD
function getRelativeDateString(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

const DEFAULT_FOODS = [
  {
    id: "f1",
    name: "Red Apples (Fuji)",
    category: "Fruits",
    batchId: "AP501",
    quantity: 120,
    purchaseDate: getRelativeDateString(-5),
    storageDate: getRelativeDateString(-5),
    expiryDate: getRelativeDateString(10),
    packagingType: "Crate / Loose",
    storageLocation: "Cold Storage A",
    temperature: 3.8,
    humidity: 85,
    airCirculation: "Optimal",
    lightExposure: "None",
    visualCondition: 92,
    storageCondition: 90,
    productAge: 95, // Freshness decreases with age; 95 represents a young fresh state
    freshnessScore: 91, // Calculated formula: 92*0.4 + 90*0.25 + 92*0.2 + 95*0.15 = 90.35 (approx 91)
    spoilageProbability: 4,
    qualityScore: 92,
    shelfLifeRemainingDays: 10,
    status: "Fresh"
  },
  {
    id: "f2",
    name: "Cavendish Bananas",
    category: "Fruits",
    batchId: "BA302",
    quantity: 85,
    purchaseDate: getRelativeDateString(-6),
    storageDate: getRelativeDateString(-5),
    expiryDate: getRelativeDateString(2),
    packagingType: "Plastic Wrap",
    storageLocation: "Shelf B1",
    temperature: 18.2,
    humidity: 62,
    airCirculation: "Good",
    lightExposure: "Medium",
    visualCondition: 65,
    storageCondition: 50,
    productAge: 40,
    freshnessScore: 57, // 65*0.4 + 50*0.25 + 60*0.2 + 40*0.15 = 56.5 (approx 57)
    spoilageProbability: 38,
    qualityScore: 62,
    shelfLifeRemainingDays: 2,
    status: "Warning"
  },
  {
    id: "f3",
    name: "Roma Tomatoes",
    category: "Vegetables",
    batchId: "TM404",
    quantity: 200,
    purchaseDate: getRelativeDateString(-2),
    storageDate: getRelativeDateString(-2),
    expiryDate: getRelativeDateString(8),
    packagingType: "Carton Box",
    storageLocation: "Shelf C2",
    temperature: 14.5,
    humidity: 70,
    airCirculation: "Good",
    lightExposure: "Low",
    visualCondition: 88,
    storageCondition: 85,
    productAge: 90,
    freshnessScore: 87, // 88*0.4 + 85*0.25 + 88*0.2 + 90*0.15 = 87.55
    spoilageProbability: 8,
    qualityScore: 89,
    shelfLifeRemainingDays: 8,
    status: "Fresh"
  },
  {
    id: "f4",
    name: "Whole Milk 1L",
    category: "Dairy Products",
    batchId: "ML202",
    quantity: 50,
    purchaseDate: getRelativeDateString(-7),
    storageDate: getRelativeDateString(-7),
    expiryDate: getRelativeDateString(1),
    packagingType: "Tetra Pak",
    storageLocation: "Cold Storage B",
    temperature: 4.5,
    humidity: 60,
    airCirculation: "Optimal",
    lightExposure: "None",
    visualCondition: 85,
    storageCondition: 90,
    productAge: 20,
    freshnessScore: 69, // 85*0.4 + 90*0.25 + 50*0.2 + 20*0.15 = 69.5
    spoilageProbability: 25,
    qualityScore: 78,
    shelfLifeRemainingDays: 1,
    status: "Warning"
  },
  {
    id: "f5",
    name: "Boneless Chicken Breast",
    category: "Meat & Poultry",
    batchId: "CH102",
    quantity: 40,
    purchaseDate: getRelativeDateString(-5),
    storageDate: getRelativeDateString(-5),
    expiryDate: getRelativeDateString(-1),
    packagingType: "Vacuum Seal",
    storageLocation: "Freezer Zone A",
    temperature: -1.2,
    humidity: 45,
    airCirculation: "Low",
    lightExposure: "None",
    visualCondition: 30,
    storageCondition: 45,
    productAge: 10,
    freshnessScore: 26, // 30*0.4 + 45*0.25 + 10*0.2 + 10*0.15 = 26.75
    spoilageProbability: 95,
    qualityScore: 18,
    shelfLifeRemainingDays: 0,
    status: "Spoiled"
  },
  {
    id: "f6",
    name: "Cheddar Cheese Block",
    category: "Dairy Products",
    batchId: "CH309",
    quantity: 35,
    purchaseDate: getRelativeDateString(-12),
    storageDate: getRelativeDateString(-12),
    expiryDate: getRelativeDateString(25),
    packagingType: "Wax Paper Wrap",
    storageLocation: "Cold Storage A",
    temperature: 4.1,
    humidity: 82,
    airCirculation: "Optimal",
    lightExposure: "None",
    visualCondition: 90,
    storageCondition: 92,
    productAge: 80,
    freshnessScore: 87, // 90*0.4 + 92*0.25 + 85*0.2 + 80*0.15 = 88 (approx 87)
    spoilageProbability: 2,
    qualityScore: 92,
    shelfLifeRemainingDays: 25,
    status: "Fresh"
  },
  {
    id: "f7",
    name: "Fresh Atlantic Salmon",
    category: "Seafood",
    batchId: "SF705",
    quantity: 25,
    purchaseDate: getRelativeDateString(-2),
    storageDate: getRelativeDateString(-2),
    expiryDate: getRelativeDateString(2),
    packagingType: "Ice Tray / Styrofoam",
    storageLocation: "Cold Storage B",
    temperature: 1.5,
    humidity: 90,
    airCirculation: "Optimal",
    lightExposure: "None",
    visualCondition: 86,
    storageCondition: 95,
    productAge: 70,
    freshnessScore: 83, // 86*0.4 + 95*0.25 + 75*0.2 + 70*0.15 = 83.65
    spoilageProbability: 12,
    qualityScore: 85,
    shelfLifeRemainingDays: 2,
    status: "Fresh"
  },
  {
    id: "f8",
    name: "Sourdough Bread Loaf",
    category: "Bakery Products",
    batchId: "BR808",
    quantity: 30,
    purchaseDate: getRelativeDateString(-4),
    storageDate: getRelativeDateString(-4),
    expiryDate: getRelativeDateString(1),
    packagingType: "Paper Bag",
    storageLocation: "Shelf A1",
    temperature: 21.0,
    humidity: 55,
    airCirculation: "High",
    lightExposure: "High",
    visualCondition: 70,
    storageCondition: 60,
    productAge: 40,
    freshnessScore: 61, // 70*0.4 + 60*0.25 + 50*0.2 + 40*0.15 = 59 (close to 61)
    spoilageProbability: 35,
    qualityScore: 68,
    shelfLifeRemainingDays: 1,
    status: "Warning"
  },
  {
    id: "f9",
    name: "Greek Yogurt 500g",
    category: "Dairy Products",
    batchId: "YG411",
    quantity: 60,
    purchaseDate: getRelativeDateString(-4),
    storageDate: getRelativeDateString(-4),
    expiryDate: getRelativeDateString(12),
    packagingType: "Plastic Tub",
    storageLocation: "Cold Storage B",
    temperature: 3.9,
    humidity: 62,
    airCirculation: "Optimal",
    lightExposure: "None",
    visualCondition: 92,
    storageCondition: 90,
    productAge: 85,
    freshnessScore: 89, // 92*0.4 + 90*0.25 + 85*0.2 + 85*0.15 = 89.05
    spoilageProbability: 3,
    qualityScore: 92,
    shelfLifeRemainingDays: 12,
    status: "Fresh"
  },
  {
    id: "f10",
    name: "Organic Carrots 1kg",
    category: "Vegetables",
    batchId: "CR606",
    quantity: 110,
    purchaseDate: getRelativeDateString(-8),
    storageDate: getRelativeDateString(-7),
    expiryDate: getRelativeDateString(6),
    packagingType: "Mesh Bag",
    storageLocation: "Shelf C3",
    temperature: 15.1,
    humidity: 78,
    airCirculation: "Good",
    lightExposure: "Medium",
    visualCondition: 80,
    storageCondition: 75,
    productAge: 65,
    freshnessScore: 77, // 80*0.4 + 75*0.25 + 70*0.2 + 65*0.15 = 76.5
    spoilageProbability: 15,
    qualityScore: 80,
    shelfLifeRemainingDays: 6,
    status: "Fresh"
  },
  {
    id: "f11",
    name: "Spinach Bunch 250g",
    category: "Vegetables",
    batchId: "SP909",
    quantity: 45,
    purchaseDate: getRelativeDateString(-3),
    storageDate: getRelativeDateString(-3),
    expiryDate: getRelativeDateString(1),
    packagingType: "Perforated Plastic",
    storageLocation: "Cold Storage A",
    temperature: 4.3,
    humidity: 88,
    airCirculation: "Good",
    lightExposure: "None",
    visualCondition: 65,
    storageCondition: 85,
    productAge: 40,
    freshnessScore: 65, // 65*0.4 + 85*0.25 + 50*0.2 + 40*0.15 = 63.25
    spoilageProbability: 45,
    qualityScore: 60,
    shelfLifeRemainingDays: 1,
    status: "Warning"
  },
  {
    id: "f12",
    name: "Grade A Large Eggs (12pk)",
    category: "Dairy Products",
    batchId: "EG111",
    quantity: 90,
    purchaseDate: getRelativeDateString(-10),
    storageDate: getRelativeDateString(-10),
    expiryDate: getRelativeDateString(14),
    packagingType: "Pulp Carton",
    storageLocation: "Cold Storage B",
    temperature: 4.0,
    humidity: 50,
    airCirculation: "Optimal",
    lightExposure: "None",
    visualCondition: 88,
    storageCondition: 92,
    productAge: 75,
    freshnessScore: 84, // 88*0.4 + 92*0.25 + 75*0.2 + 75*0.15 = 84.45
    spoilageProbability: 1,
    qualityScore: 89,
    shelfLifeRemainingDays: 14,
    status: "Fresh"
  },
  {
    id: "f13",
    name: "Fresh Orange Juice 1L",
    category: "Beverages",
    batchId: "OJ420",
    quantity: 75,
    purchaseDate: getRelativeDateString(-3),
    storageDate: getRelativeDateString(-3),
    expiryDate: getRelativeDateString(7),
    packagingType: "Plastic Bottle",
    storageLocation: "Cold Storage B",
    temperature: 4.2,
    humidity: 55,
    airCirculation: "Good",
    lightExposure: "None",
    visualCondition: 90,
    storageCondition: 90,
    productAge: 85,
    freshnessScore: 88, // 90*0.4 + 90*0.25 + 80*0.2 + 85*0.15 = 87.25
    spoilageProbability: 5,
    qualityScore: 90,
    shelfLifeRemainingDays: 7,
    status: "Fresh"
  },
  {
    id: "f14",
    name: "Russet Potatoes 5kg",
    category: "Vegetables",
    batchId: "PT333",
    quantity: 130,
    purchaseDate: getRelativeDateString(-14),
    storageDate: getRelativeDateString(-14),
    expiryDate: getRelativeDateString(20),
    packagingType: "Sack Bag",
    storageLocation: "Shelf C1",
    temperature: 15.8,
    humidity: 75,
    airCirculation: "High",
    lightExposure: "None",
    visualCondition: 82,
    storageCondition: 80,
    productAge: 70,
    freshnessScore: 80, // 82*0.4 + 80*0.25 + 80*0.2 + 70*0.15 = 79.3
    spoilageProbability: 6,
    qualityScore: 84,
    shelfLifeRemainingDays: 20,
    status: "Fresh"
  },
  {
    id: "f15",
    name: "Prepackaged Salad Mix",
    category: "Packaged Foods",
    batchId: "SL714",
    quantity: 65,
    purchaseDate: getRelativeDateString(-6),
    storageDate: getRelativeDateString(-6),
    expiryDate: getRelativeDateString(0),
    packagingType: "Sealed Plastic Bag",
    storageLocation: "Cold Storage A",
    temperature: 4.5,
    humidity: 85,
    airCirculation: "Good",
    lightExposure: "None",
    visualCondition: 45,
    storageCondition: 90,
    productAge: 30,
    freshnessScore: 49, // 45*0.4 + 90*0.25 + 20*0.2 + 30*0.15 = 49
    spoilageProbability: 75,
    qualityScore: 42,
    shelfLifeRemainingDays: 0,
    status: "Near Spoilage" // Near Spoilage category uses yellow/orange
  }
];

const DEFAULT_ALERTS = [
  {
    id: "a1",
    type: "Spoilage Alert",
    level: "Critical",
    title: "High spoilage probability detected",
    target: "Chicken Batch #CH102",
    details: "Sensors report elevated visual degradation and surface bacteria indications. Action recommended.",
    timestamp: "10 minutes ago",
    read: false
  },
  {
    id: "a2",
    type: "Shelf-Life Warning",
    level: "Warning",
    title: "Remaining shelf life: 1 day",
    target: "Milk Batch #ML202",
    details: "Expiration date is tomorrow. Immediate distribution or retail markdown required.",
    timestamp: "1 hour ago",
    read: false
  },
  {
    id: "a3",
    type: "Storage Alert",
    level: "Critical",
    title: "Storage temperature limit exceeded",
    target: "Cold Storage B",
    details: "Zone temperature spike to 8.2°C (limit 5.0°C) recorded for over 45 minutes.",
    timestamp: "3 hours ago",
    read: false
  },
  {
    id: "a4",
    type: "Freshness Alert",
    level: "Information",
    title: "Freshness analysis completed",
    target: "Apple Batch #AP501",
    details: "Visual AI scan logs record 91% freshness factor compliance.",
    timestamp: "5 hours ago",
    read: true
  },
  {
    id: "a5",
    type: "Inventory Alert",
    level: "Warning",
    title: "Prepackaged Salad Mix approaching boundary",
    target: "Salad Batch #SL714",
    details: "Item listed with 0 days remaining shelf life. Move to discount rack.",
    timestamp: "1 day ago",
    read: true
  },
  {
    id: "a6",
    type: "Storage Alert",
    level: "Warning",
    title: "Humidity slightly high",
    target: "Shelf C2 (Tomatoes)",
    details: "Relative humidity hit 78% (optimal 65-70%). Keep eye on ventilation flow.",
    timestamp: "1 day ago",
    read: false
  },
  {
    id: "a7",
    type: "Freshness Alert",
    level: "Critical",
    title: "Cavendish Bananas Browning fast",
    target: "Banana Batch #BA302",
    details: "Remaining shelf life shortened to 2 days after latest visual profile check.",
    timestamp: "2 days ago",
    read: false
  },
  {
    id: "a8",
    type: "Inventory Alert",
    level: "Information",
    title: "New inventory added",
    target: "Russet Potatoes #PT333",
    details: "Batch added to database by John Doe (Warehouse Operator).",
    timestamp: "2 days ago",
    read: true
  },
  {
    id: "a9",
    type: "Storage Alert",
    level: "Information",
    title: "Freezer zone defrosted successfully",
    target: "Freezer Zone A",
    details: "Routine maintenance cycle completed and temperature back to -1.2°C.",
    timestamp: "3 days ago",
    read: true
  },
  {
    id: "a10",
    type: "Freshness Alert",
    level: "Information",
    title: "Yogurt Freshness Confirmed",
    target: "Yogurt Batch #YG411",
    details: "Batch validated by Food Quality Inspector David Chen.",
    timestamp: "4 days ago",
    read: true
  }
];

const DEFAULT_SETTINGS = {
  theme: "light",
  emailNotifications: true,
  freshnessAlerts: true,
  expiryAlerts: true,
  storageAlerts: true,
  criticalLimitTemp: 5.0,
  criticalLimitHumidity: 80.0
};

// Initialize localStorage databases
if (!localStorage.getItem("fg_users")) {
  localStorage.setItem("fg_users", JSON.stringify(DEFAULT_USERS));
}
if (!localStorage.getItem("fg_foods")) {
  localStorage.setItem("fg_foods", JSON.stringify(DEFAULT_FOODS));
}
if (!localStorage.getItem("fg_alerts")) {
  localStorage.setItem("fg_alerts", JSON.stringify(DEFAULT_ALERTS));
}
if (!localStorage.getItem("fg_settings")) {
  localStorage.setItem("fg_settings", JSON.stringify(DEFAULT_SETTINGS));
}

// Global data utility to fetch current state
const MockStore = {
  getUsers: () => JSON.parse(localStorage.getItem("fg_users")),
  saveUsers: (data) => localStorage.setItem("fg_users", JSON.stringify(data)),
  
  getFoods: () => JSON.parse(localStorage.getItem("fg_foods")),
  saveFoods: (data) => localStorage.setItem("fg_foods", JSON.stringify(data)),
  
  getAlerts: () => JSON.parse(localStorage.getItem("fg_alerts")),
  saveAlerts: (data) => localStorage.setItem("fg_alerts", JSON.stringify(data)),
  
  getSettings: () => JSON.parse(localStorage.getItem("fg_settings")),
  saveSettings: (data) => localStorage.setItem("fg_settings", JSON.stringify(data)),

  getCurrentUser: () => JSON.parse(localStorage.getItem("fg_currentUser"))
};
