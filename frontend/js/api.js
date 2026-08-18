// FreshGuard API Simulator
// Mocking FastAPI endpoints using Promises and MockStore

const API_URL = "http://localhost:8000";

const API = {
  // Authentication
  loginUser: (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = MockStore.getUsers();
        // Check standard demo passwords
        const demoCreds = {
          "admin@freshguard.com": "admin123",
          "manager@freshguard.com": "manager123",
          "warehouse@freshguard.com": "warehouse123",
          "consumer@freshguard.com": "consumer123",
          "inspector@freshguard.com": "inspector123"
        };

        const user = users.find(u => u.email === email.trim().toLowerCase());
        
        if (user) {
          const validPass = demoCreds[user.email] || "password123"; // default password for registered users
          if (password === validPass) {
            localStorage.setItem("fg_currentUser", JSON.stringify(user));
            resolve({ success: true, user });
          } else {
            reject(new Error("Invalid password credentials."));
          }
        } else {
          reject(new Error("Email address not found."));
        }
      }, 500);
    });
  },

  registerUser: (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = MockStore.getUsers();
        const exists = users.some(u => u.email === userData.email.trim().toLowerCase());
        if (exists) {
          reject(new Error("Email already registered."));
          return;
        }

        const newUser = {
          id: "u" + (users.length + 1),
          name: userData.fullName,
          email: userData.email,
          role: userData.role,
          status: "Active",
          createdDate: new Date().toISOString().split('T')[0]
        };

        users.push(newUser);
        MockStore.saveUsers(users);
        resolve({ success: true, user: newUser });
      }, 500);
    });
  },

  // Food Inventory
  getFoods: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MockStore.getFoods());
      }, 300);
    });
  },

  createFood: (food) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const foods = MockStore.getFoods();
        const newFood = {
          id: "f" + (foods.length + 1) + "_" + Date.now().toString().slice(-4),
          ...food
        };
        foods.unshift(newFood);
        MockStore.saveFoods(foods);
        resolve({ success: true, food: newFood });
      }, 400);
    });
  },

  updateFood: (id, updatedData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foods = MockStore.getFoods();
        const index = foods.findIndex(f => f.id === id);
        if (index === -1) {
          reject(new Error("Food record not found."));
          return;
        }
        foods[index] = { ...foods[index], ...updatedData };
        MockStore.saveFoods(foods);
        resolve({ success: true, food: foods[index] });
      }, 400);
    });
  },

  deleteFood: (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foods = MockStore.getFoods();
        const exists = foods.some(f => f.id === id);
        if (!exists) {
          reject(new Error("Food record not found."));
          return;
        }
        const filtered = foods.filter(f => f.id !== id);
        MockStore.saveFoods(filtered);
        resolve({ success: true });
      }, 300);
    });
  },

  // Freshness Analysis
  uploadFoodImage: (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return dummy image path (or standard data url placeholder)
        resolve({ success: true, url: "assets/images/uploaded_food.jpg" });
      }, 600);
    });
  },

  analyzeFreshness: (category, foodName, details) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate mock AI output specific to categories
        const visualCondition = details.visualCondition || Math.floor(Math.random() * 25) + 70; // 70-95
        const storageCondition = details.storageCondition || Math.floor(Math.random() * 20) + 75; // 75-95
        const shelfLifePred = details.shelfLifePred || Math.floor(Math.random() * 20) + 70; // 70-90
        const productAgeScore = details.productAgeScore || Math.floor(Math.random() * 15) + 80; // 80-95

        // Freshness formula: Visual Condition * 40% + Storage Conditions * 25% + Shelf-Life Prediction * 20% + Product Age * 15%
        const score = Math.round(
          visualCondition * 0.40 +
          storageCondition * 0.25 +
          shelfLifePred * 0.20 +
          productAgeScore * 0.15
        );

        let status = "Fresh";
        let spoilageProbability = Math.round((100 - score) * 0.4);
        if (score < 50) {
          status = "Spoiled";
          spoilageProbability = Math.round(80 + Math.random() * 15);
        } else if (score < 65) {
          status = "Near Spoilage";
          spoilageProbability = Math.round(55 + Math.random() * 20);
        } else if (score < 80) {
          status = "Warning";
          spoilageProbability = Math.round(20 + Math.random() * 25);
        }

        const report = {
          foodName: foodName || "Sample Food",
          category: category,
          freshnessScore: score,
          status: status,
          confidence: Math.floor(Math.random() * 10) + 88, // 88% - 98%
          spoilageProbability: spoilageProbability,
          visualAnalysis: {
            colorCondition: score > 75 ? "Excellent" : score > 55 ? "Moderate Fade" : "Discolored / Browned",
            textureCondition: score > 75 ? "Firm / Solid" : score > 55 ? "Softening" : "Mushy / Decayed",
            surfaceCondition: score > 75 ? "Smooth & Shiny" : score > 55 ? "Minor Bruises" : "Major Damage",
            moldDetection: score > 55 ? "Not Detected" : "Spore Growth Detected",
            bruising: score > 85 ? "None" : score > 65 ? "Minor" : "Severe Bruising",
            physicalDamage: score > 90 ? "None" : score > 70 ? "Scratched" : "Cracked Outer Skin"
          },
          remainingShelfLife: Math.max(0, Math.round(score * 0.15))
        };

        resolve(report);
      }, 2500); // simulate 2.5s scan
    });
  },

  // Shelf Life Forecast
  predictShelfLife: (params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const tempScore = Math.max(0, 100 - Math.abs(params.temperature - 4) * 5);
        const humScore = Math.max(0, 100 - Math.abs(params.humidity - 70) * 2);
        
        let multiplier = 1.0;
        if (params.packagingType === "Vacuum Seal") multiplier = 1.6;
        if (params.packagingType === "Sealed Plastic Bag") multiplier = 1.2;
        if (params.packagingType === "Crate / Loose") multiplier = 0.8;

        const maxLife = {
          "Fruits": 12, "Vegetables": 10, "Dairy Products": 14, "Meat & Poultry": 6,
          "Seafood": 4, "Bakery Products": 5, "Packaged Foods": 30, "Beverages": 15
        }[params.category] || 8;

        const factor = (tempScore * 0.6 + humScore * 0.4) / 100;
        const remainingDays = Math.max(1, Math.round(maxLife * factor * multiplier));
        const confidence = Math.floor(Math.random() * 8) + 88; // 88-96%
        
        let riskLevel = "Low";
        if (remainingDays <= 2) riskLevel = "High";
        else if (remainingDays <= 5) riskLevel = "Medium";

        resolve({
          remainingDays,
          expiryDate: getRelativeDateString(remainingDays),
          confidence,
          riskLevel
        });
      }, 2000);
    });
  },

  // Sensors & Alerts
  getAlerts: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MockStore.getAlerts());
      }, 200);
    });
  },

  updateAlerts: (alerts) => {
    return new Promise((resolve) => {
      MockStore.saveAlerts(alerts);
      resolve({ success: true });
    });
  },

  // Reports Summary
  getReports: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const foods = MockStore.getFoods();
        const total = foods.length;
        const fresh = foods.filter(f => f.status === "Fresh").length;
        const warning = foods.filter(f => f.status === "Warning").length;
        const nearSpoilage = foods.filter(f => f.status === "Near Spoilage").length;
        const spoiled = foods.filter(f => f.status === "Spoiled").length;

        resolve({
          timestamp: new Date().toLocaleString(),
          inventorySummary: { total, fresh, warning, nearSpoilage, spoiled },
          wasteRiskFactor: Math.round(((nearSpoilage * 0.5 + spoiled) / total) * 100),
          complianceIndex: 94
        });
      }, 300);
    });
  },

  // Advanced Analytics
  getAnalytics: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          freshnessTrend: [88, 87, 85, 89, 87, 86, 87],
          qualityDistribution: { fresh: 70, warning: 15, nearSpoilage: 10, spoiled: 5 },
          spoilageRisk: [4, 6, 8, 3, 5, 6, 4],
          shelfLifeDistribution: [12, 24, 18, 15, 10, 8, 11],
          storageTemperature: [4.1, 4.2, 4.5, 4.3, 4.2, 4.1, 4.2],
          humidityLogs: [60, 62, 65, 63, 62, 60, 61]
        });
      }, 300);
    })
  }
};
