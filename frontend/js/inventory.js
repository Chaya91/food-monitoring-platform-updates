// FreshGuard Inventory Controller

let inventoryData = [];
let activeFilters = {
  search: "",
  category: "All",
  freshness: "All",
  expiry: "All"
};

document.addEventListener("DOMContentLoaded", async () => {
  // Check role
  const user = MockStore.getCurrentUser();
  if (!user) return;

  // Bind redirection for Add Food
  const addFoodBtn = document.getElementById("add-food-redirect-btn");
  if (addFoodBtn) {
    addFoodBtn.addEventListener("click", () => {
      window.location.href = "add-food.html";
    });
  }

  // Load items
  await refreshInventory();

  // Bind local filter listeners
  setupFilters();

  // Attach search hook for global search in navbar
  window.InventoryPage = {
    handleSearch: (value) => {
      activeFilters.search = value;
      // sync with local search input if it exists
      const localSearch = document.getElementById("inventory-search");
      if (localSearch) localSearch.value = value;
      renderTable();
    }
  };
});

async function refreshInventory() {
  inventoryData = await API.getFoods();
  renderTable();
}

function setupFilters() {
  const localSearch = document.getElementById("inventory-search");
  const catFilter = document.getElementById("filter-category");
  const freshFilter = document.getElementById("filter-freshness");
  const expFilter = document.getElementById("filter-expiry");

  if (localSearch) {
    localSearch.addEventListener("input", (e) => {
      activeFilters.search = e.target.value.trim().toLowerCase();
      renderTable();
    });
  }
  if (catFilter) {
    catFilter.addEventListener("change", (e) => {
      activeFilters.category = e.target.value;
      renderTable();
    });
  }
  if (freshFilter) {
    freshFilter.addEventListener("change", (e) => {
      activeFilters.freshness = e.target.value;
      renderTable();
    });
  }
  if (expFilter) {
    expFilter.addEventListener("change", (e) => {
      activeFilters.expiry = e.target.value;
      renderTable();
    });
  }
}

// Map categories to visual Font Awesome icons
const CATEGORY_ICONS = {
  "Fruits": { icon: "fa-apple-whole", class: "cat-fruits" },
  "Vegetables": { icon: "fa-carrot", class: "cat-vegetables" },
  "Dairy Products": { icon: "fa-cheese", class: "cat-dairy" },
  "Meat & Poultry": { icon: "fa-drumstick-bite", class: "cat-meat" },
  "Seafood": { icon: "fa-fish", class: "cat-seafood" },
  "Bakery Products": { icon: "fa-bread-slice", class: "cat-bakery" },
  "Packaged Foods": { icon: "fa-box", class: "cat-packaged" },
  "Beverages": { icon: "fa-glass-water", class: "cat-beverages" }
};

function renderTable() {
  const tableBody = document.getElementById("inventory-table-body");
  if (!tableBody) return;

  const filtered = inventoryData.filter(item => {
    // Search
    const matchesSearch = item.name.toLowerCase().includes(activeFilters.search) || 
                          item.batchId.toLowerCase().includes(activeFilters.search);
    
    // Category
    const matchesCat = activeFilters.category === "All" || item.category === activeFilters.category;

    // Freshness
    const matchesFresh = activeFilters.freshness === "All" || item.status === activeFilters.freshness;

    // Expiry filters
    let matchesExp = true;
    if (activeFilters.expiry !== "All") {
      const today = new Date();
      const expDate = new Date(item.expiryDate);
      const diffTime = expDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (activeFilters.expiry === "Expired") {
        matchesExp = diffDays < 0;
      } else if (activeFilters.expiry === "3days") {
        matchesExp = diffDays >= 0 && diffDays <= 3;
      } else if (activeFilters.expiry === "7days") {
        matchesExp = diffDays >= 0 && diffDays <= 7;
      }
    }

    return matchesSearch && matchesCat && matchesFresh && matchesExp;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: var(--text-muted); padding: 3rem 0;">
          <i class="fa-solid fa-circle-question" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; opacity: 0.5;"></i>
          No food records matching current criteria.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(item => {
    const catMeta = CATEGORY_ICONS[item.category] || { icon: "fa-utensils", class: "cat-packaged" };
    
    // Map status classes
    let statusClass = "fresh";
    if (item.status === "Warning") statusClass = "warning";
    else if (item.status === "Near Spoilage") statusClass = "near-spoilage";
    else if (item.status === "Spoiled") statusClass = "spoiled";

    return `
      <tr>
        <td>
          <div class="category-icon-frame ${catMeta.class}">
            <i class="fa-solid ${catMeta.icon}"></i>
          </div>
        </td>
        <td style="font-weight: 600;">${item.name}</td>
        <td><span style="font-size: 0.85rem; color: var(--text-muted);">${item.category}</span></td>
        <td><code>${item.batchId}</code></td>
        <td>${item.quantity}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px; min-width: 110px;">
            <div class="progress-bar-fg" style="flex: 1; height: 6px;">
              <div class="progress-bar-fill bg-${statusClass}" style="width: ${item.freshnessScore}%"></div>
            </div>
            <span style="font-size: 0.75rem; font-weight: 700;">${item.freshnessScore}%</span>
          </div>
        </td>
        <td>${item.shelfLifeRemainingDays} days</td>
        <td style="font-size: 0.85rem; font-weight: 500;">${item.expiryDate}</td>
        <td><span class="badge-status ${statusClass}">${item.status}</span></td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 4px; justify-content: flex-end;">
            <button class="table-action-btn" title="View details" onclick="window.location.href='food-details.html?id=${item.id}'">
              <i class="fa-solid fa-eye"></i>
            </button>
            <button class="table-action-btn" title="Edit food" onclick="openEditModal('${item.id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="table-action-btn delete" title="Delete record" onclick="deleteFoodRecord('${item.id}', '${item.name}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

// Modal handling
let currentEditingId = null;

window.openEditModal = (id) => {
  const item = inventoryData.find(f => f.id === id);
  if (!item) return;

  currentEditingId = id;
  document.getElementById("edit-id").value = item.id;
  document.getElementById("edit-name").value = item.name;
  document.getElementById("edit-category").value = item.category;
  document.getElementById("edit-batch").value = item.batchId;
  document.getElementById("edit-quantity").value = item.quantity;
  document.getElementById("edit-expiry").value = item.expiryDate;
  document.getElementById("edit-temp").value = item.temperature;
  document.getElementById("edit-humidity").value = item.humidity;

  document.getElementById("edit-food-modal").classList.add("active");
};

window.closeEditModal = () => {
  document.getElementById("edit-food-modal").classList.remove("active");
  currentEditingId = null;
};

// Save Edit handler
const saveBtn = document.getElementById("save-edit-btn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    if (!currentEditingId) return;

    const name = document.getElementById("edit-name").value.trim();
    const category = document.getElementById("edit-category").value;
    const batchId = document.getElementById("edit-batch").value.trim();
    const quantity = parseInt(document.getElementById("edit-quantity").value);
    const expiryDate = document.getElementById("edit-expiry").value;
    const temperature = parseFloat(document.getElementById("edit-temp").value);
    const humidity = parseInt(document.getElementById("edit-humidity").value);

    if (!name || !batchId || isNaN(quantity) || !expiryDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const originalItem = inventoryData.find(f => f.id === currentEditingId);
    
    // Recalculate shelf life remaining relative to expiry date
    const today = new Date();
    const expDate = new Date(expiryDate);
    const shelfLifeRemainingDays = Math.max(0, Math.ceil((expDate - today) / (1000 * 60 * 60 * 24)));

    // Adjust status dynamically based on score
    // Let's re-calculate freshnessScore using the formula:
    // Freshness Score = Visual Condition * 40% + Storage Conditions * 25% + Shelf Life * 20% + Product Age * 15%
    // Let's preserve visual condition and product age from original, but adapt storage condition based on new temp/humidity!
    const tempOptimal = 4.0;
    const humOptimal = 70.0;
    const tempScore = Math.max(0, 100 - Math.abs(temperature - tempOptimal) * 10);
    const humScore = Math.max(0, 100 - Math.abs(humidity - humOptimal) * 3);
    const newStorageCondition = Math.round(tempScore * 0.6 + humScore * 0.4);

    const visualCondition = originalItem.visualCondition || 85;
    const productAge = originalItem.productAge || 75;
    const shelfLifeScore = Math.min(100, Math.round(shelfLifeRemainingDays * 5));

    const freshnessScore = Math.round(
      visualCondition * 0.40 +
      newStorageCondition * 0.25 +
      shelfLifeScore * 0.20 +
      productAge * 0.15
    );

    let status = "Fresh";
    if (freshnessScore < 50) status = "Spoiled";
    else if (freshnessScore < 65) status = "Near Spoilage";
    else if (freshnessScore < 80) status = "Warning";

    const updateObj = {
      name,
      category,
      batchId,
      quantity,
      expiryDate,
      temperature,
      humidity,
      shelfLifeRemainingDays,
      freshnessScore,
      status
    };

    try {
      await API.updateFood(currentEditingId, updateObj);
      closeEditModal();
      await refreshInventory();
      alert(`Successfully updated food record: ${name}`);
    } catch (err) {
      alert(`Error updating food: ${err.message}`);
    }
  });
}

// Delete Record handler
window.deleteFoodRecord = async (id, name) => {
  if (confirm(`Are you sure you want to delete the food batch record: "${name}"? This action cannot be undone.`)) {
    try {
      await API.deleteFood(id);
      await refreshInventory();
      
      // Post an alert/notification to log delete action
      const alerts = MockStore.getAlerts();
      alerts.unshift({
        id: "a_del_" + Date.now().toString().slice(-4),
        type: "Inventory Alert",
        level: "Information",
        title: "Food batch deleted",
        target: `${name} (Batch deleted)`,
        details: `The record was deleted by a workspace operator.`,
        timestamp: "Just now",
        read: false
      });
      MockStore.saveAlerts(alerts);
      
    } catch (err) {
      alert(`Error deleting record: ${err.message}`);
    }
  }
};
