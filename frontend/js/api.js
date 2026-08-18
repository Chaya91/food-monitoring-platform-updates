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
  // ==========================================================
// Inventory API - Real FastAPI Connection
// ==========================================================

getFoods: async () => {

  const response = await fetch(
    `${API_URL}/inventory`
  );

  if (!response.ok) {
    throw new Error("Failed to load inventory.");
  }

  return await response.json();
},


createFood: async (food) => {

  const body = {
    user_id: food.user_id || 1,

    food_name:
      food.food_name ||
      food.name,

    category:
      food.category,

    batch_number:
      food.batch_number ||
      food.batchId ||
      null,

    quantity:
      Number(food.quantity) || 1,

    manufacture_date:
      food.manufacture_date ||
      food.purchaseDate ||
      null,

    expiry_date:
      food.expiry_date ||
      food.expiryDate ||
      null
  };


  const response = await fetch(
    `${API_URL}/inventory`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(body)
    }
  );


  if (!response.ok) {

    let errorMessage =
      "Failed to create inventory item.";

    try {

      const errorData =
        await response.json();

      errorMessage =
        errorData.error ||
        errorMessage;

    } catch (_) {}

    throw new Error(errorMessage);
  }


  const result =
    await response.json();

  return {
    success: true,
    food: result.inventory
  };
},


updateFood: async (id, food) => {

  const body = {
    user_id: food.user_id || 1,

    food_name:
      food.food_name ||
      food.name,

    category:
      food.category,

    batch_number:
      food.batch_number ||
      food.batchId ||
      null,

    quantity:
      Number(food.quantity) || 1,

    manufacture_date:
      food.manufacture_date ||
      food.purchaseDate ||
      null,

    expiry_date:
      food.expiry_date ||
      food.expiryDate ||
      null
  };


  const response = await fetch(
    `${API_URL}/inventory/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(body)
    }
  );


  if (!response.ok) {

    let errorMessage =
      "Failed to update inventory item.";

    try {

      const errorData =
        await response.json();

      errorMessage =
        errorData.error ||
        errorMessage;

    } catch (_) {}

    throw new Error(errorMessage);
  }


  const result =
    await response.json();

  return {
    success: true,
    food: result.inventory
  };
},


deleteFood: async (id) => {

  const response = await fetch(
    `${API_URL}/inventory/${id}`,
    {
      method: "DELETE"
    }
  );


  if (!response.ok) {

    let errorMessage =
      "Failed to delete inventory item.";

    try {

      const errorData =
        await response.json();

      errorMessage =
        errorData.error ||
        errorMessage;

    } catch (_) {}

    throw new Error(errorMessage);
  }


  return {
    success: true
  };
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

  analyzeFreshness: async (file, inventoryId = 1) => {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("inventory_id", inventoryId);

  const response = await fetch(
    `${API_URL}/predict?inventory_id=${inventoryId}`,
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    let errorMessage = "Freshness analysis failed.";

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch (_) {}

    throw new Error(errorMessage);
  }

  const result = await response.json();

  /*
   * The backend currently returns:
   * food_category
   * freshness_status
   * confidence
   * detection_confidence
   * rotten_regions
   * rotten_area_percent
   * image_id
   * inventory_id
   */

  let freshnessScore = result.confidence;

  let spoilageProbability = 0;

  if (result.freshness_status === "Spoiled") {
    spoilageProbability = 100;
  } else if (result.freshness_status === "Near Spoilage") {
    spoilageProbability = 70;
  } else if (result.freshness_status === "Unknown") {
    spoilageProbability = 50;
  }

  return {
    foodName: result.food_category,
    category: result.food_category,
    freshnessScore: freshnessScore,
    status: result.freshness_status,
    confidence: result.confidence,
    detectionConfidence: result.detection_confidence,
    spoilageProbability: spoilageProbability,

    visualAnalysis: {
      colorCondition: "Analyzed by ML pipeline",
      textureCondition: "Analyzed by ML pipeline",
      surfaceCondition: "Analyzed by ML pipeline",
      moldDetection:
        result.rotten_regions > 0
          ? "Possible spoilage regions detected"
          : "No rotten regions detected",
      bruising: "Analyzed by ML pipeline",
      physicalDamage: "Analyzed by ML pipeline"
    },

    rottenRegions: result.rotten_regions,
    rottenAreaPercent: result.rotten_area_percent,

    imageId: result.image_id,
    inventoryId: result.inventory_id,

    remainingShelfLife: null
  };
},
  // Shelf Life Forecast
  predictShelfLife: async (data) => {

  const response = await fetch(
    `${API_URL}/predict/shelf-life`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(data)
    }
  );


  if (!response.ok) {

    let errorMessage =
      "Shelf-life prediction failed.";

    try {

      const errorData =
        await response.json();

      errorMessage =
        errorData.detail ||
        errorData.error ||
        errorMessage;

    } catch (_) {}

    throw new Error(
      errorMessage
    );
  }


  return await response.json();
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
