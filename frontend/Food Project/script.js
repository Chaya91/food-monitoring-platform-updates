const foodData = {
  Apple: {
    status: "Fresh",
    score: 96,
    shelfLife: "5 Days",
    recommendation: "Store in Refrigerator",
    description: "The apple appears crisp, vibrant, and suitable for long-term storage.",
  },
  Banana: {
    status: "Near Spoilage",
    score: 62,
    shelfLife: "2 Days",
    recommendation: "Consume within 24 Hours",
    description: "The banana is softening and should be eaten soon.",
  },
  Tomato: {
    status: "Fresh",
    score: 90,
    shelfLife: "4 Days",
    recommendation: "Keep at Room Temperature",
    description: "The tomato looks firm, colorful, and fresh.",
  },
  Orange: {
    status: "Fresh",
    score: 91,
    shelfLife: "6 Days",
    recommendation: "Store in a Cool Place",
    description: "The orange feels firm and is still in good condition.",
  },
  Mango: {
    status: "Fresh",
    score: 87,
    shelfLife: "3 Days",
    recommendation: "Ripen at Room Temperature",
    description: "The mango is ripe but still safe to keep briefly.",
  },
  Bread: {
    status: "Spoiled",
    score: 18,
    shelfLife: "0 Days",
    recommendation: "Discard Immediately",
    description: "The bread shows clear signs of spoilage and should not be consumed.",
  },
  Milk: {
    status: "Fresh",
    score: 88,
    shelfLife: "3 Days",
    recommendation: "Refrigerate Below 4°C",
    description: "The milk appears well-preserved and should remain refrigerated.",
  },
  Egg: {
    status: "Fresh",
    score: 80,
    shelfLife: "7 Days",
    recommendation: "Keep Refrigerated",
    description: "The egg looks stable and safe for short-term storage.",
  },
};

const themeToggle = document.getElementById("themeToggle");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const previewHint = document.getElementById("previewHint");
const foodSelect = document.getElementById("foodSelect");
const selectionPreview = document.getElementById("selectionPreview");
const checkButton = document.getElementById("checkButton");
const resultContent = document.getElementById("resultContent");
const historySearch = document.getElementById("historySearch");
const historyTableBody = document.getElementById("historyTableBody");
const filterGroup = document.getElementById("filterGroup");
const deleteSelectedButton = document.getElementById("deleteSelected");
const clearHistoryButton = document.getElementById("clearHistory");

const STORAGE_KEY = "foodFreshnessHistory";
const THEME_KEY = "foodFreshnessTheme";

let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let activeFilter = "All";
let searchTerm = "";

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
}

function updateSelectionPreview() {
  const food = foodData[foodSelect.value];
  selectionPreview.innerHTML = `
    <strong>${foodSelect.value}</strong>
    <p><strong>Status:</strong> ${food.status}</p>
    <p><strong>Score:</strong> ${food.score}%</p>
    <p><strong>Shelf Life:</strong> ${food.shelfLife}</p>
    <p><strong>Recommendation:</strong> ${food.recommendation}</p>
  `;
}

function renderResult(foodName) {
  const food = foodData[foodName];
  const statusClass = food.status === "Fresh" ? "fresh" : food.status === "Near Spoilage" ? "near" : "spoiled";
  const badgeClass = food.status === "Fresh" ? "badge-fresh" : food.status === "Near Spoilage" ? "badge-near" : "badge-spoiled";

  const previewSrc = imagePreview.src || "images/food-hero.svg";

  resultContent.innerHTML = `
    <div class="result-header">
      <h3>${foodName}</h3>
      <span class="result-badge ${badgeClass}">${food.status}</span>
    </div>
    <div class="result-image">
      <img src="${previewSrc}" alt="${foodName} preview" />
    </div>
    <div class="result-body">
      <p><strong>Food:</strong> ${foodName}</p>
      <p><strong>Status:</strong> ${food.status}</p>
      <p><strong>Freshness Score:</strong> ${food.score}%</p>
      <p><strong>Shelf Life:</strong> ${food.shelfLife}</p>
      <p><strong>Recommendation:</strong> ${food.recommendation}</p>
      <p>${food.description}</p>
    </div>
    <div class="progress-block">
      <strong>Freshness Score</strong>
      <div class="progress-track">
        <div id="progressFill" class="progress-fill ${statusClass}"></div>
      </div>
      <p>${food.score}%</p>
    </div>
  `;

  requestAnimationFrame(() => {
    const progressFill = document.getElementById("progressFill");
    progressFill.style.width = `${food.score}%`;
  });
}

function saveHistory(item) {
  history.unshift(item);
  if (history.length > 20) {
    history = history.slice(0, 20);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistory();
  updateStats();
}

function renderHistory() {
  const filtered = history.filter((entry) => {
    const matchesFilter = activeFilter === "All" || entry.status === activeFilter;
    const matchesSearch = entry.foodName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!filtered.length) {
    historyTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; color: var(--muted);">No history yet.</td>
      </tr>
    `;
    return;
  }

  historyTableBody.innerHTML = filtered
    .map(
      (entry) => `
        <tr>
          <td>${entry.foodName}</td>
          <td>${entry.status}</td>
          <td>${entry.score}%</td>
          <td>${entry.dateTime}</td>
          <td><button class="delete-btn" data-id="${entry.id}" type="button">Delete</button></td>
        </tr>
      `
    )
    .join("");
}

function updateStats() {
  const total = history.length;
  const fresh = history.filter((item) => item.status === "Fresh").length;
  const spoiled = history.filter((item) => item.status === "Spoiled").length;
  const average = total
    ? Math.round(history.reduce((acc, item) => acc + item.score, 0) / total)
    : 0;

  document.getElementById("totalChecks").textContent = total;
  document.getElementById("freshFoods").textContent = fresh;
  document.getElementById("spoiledFoods").textContent = spoiled;
  document.getElementById("averageScore").textContent = `${average}%`;
}

foodSelect.addEventListener("change", updateSelectionPreview);

imageInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.src = reader.result;
    imagePreview.style.display = "block";
    previewHint.style.display = "none";
  };
  reader.readAsDataURL(file);
});

checkButton.addEventListener("click", () => {
  const selectedFood = foodSelect.value;
  const food = foodData[selectedFood];

  renderResult(selectedFood);

  saveHistory({
    id: Date.now(),
    foodName: selectedFood,
    status: food.status,
    score: food.score,
    dateTime: new Date().toLocaleString(),
  });
});

historySearch.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderHistory();
});

filterGroup.addEventListener("click", (event) => {
  const button = event.target.closest(".filter-btn");
  if (!button) return;

  document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");
  activeFilter = button.dataset.filter;
  renderHistory();
});

deleteSelectedButton.addEventListener("click", () => {
  if (!history.length) return;
  const lastEntry = history[0];
  history = history.filter((item) => item.id !== lastEntry.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistory();
  updateStats();
});

clearHistoryButton.addEventListener("click", () => {
  history = [];
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
  updateStats();
});

historyTableBody.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-btn");
  if (!button) return;
  const id = Number(button.dataset.id);
  history = history.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistory();
  updateStats();
});

themeToggle.addEventListener("click", () => {
  const currentTheme = document.body.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
});

loadTheme();
updateSelectionPreview();
renderHistory();
updateStats();
