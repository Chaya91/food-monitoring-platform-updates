// FreshGuard Analytics Controller

document.addEventListener("DOMContentLoaded", async () => {
  const user = MockStore.getCurrentUser();
  if (!user) return;

  // Render Stats
  await calculateStats();

  // Render Charts
  renderAnalyticsCharts();
});

async function calculateStats() {
  const foods = await API.getFoods();
  const total = foods.length;

  if (total === 0) return;

  const fresh = foods.filter(f => f.status === "Fresh" || f.status === "Warning").length;
  const spoiled = foods.filter(f => f.status === "Spoiled").length;
  const near = foods.filter(f => f.status === "Near Spoilage").length;
  
  // Computations
  const freshRate = ((fresh / total) * 100).toFixed(1);
  const spoilRate = ((spoiled / total) * 100).toFixed(1);
  const wasteRate = (((near * 0.5 + spoiled) / total) * 100).toFixed(1);
  
  const avgLife = (foods.reduce((sum, f) => sum + f.shelfLifeRemainingDays, 0) / total).toFixed(1);

  // Set values
  document.getElementById("an-fresh-rate").textContent = `${freshRate}%`;
  document.getElementById("an-spoil-rate").textContent = `${spoilRate}%`;
  document.getElementById("an-waste-rate").textContent = `${wasteRate}%`;
  document.getElementById("an-avg-life").textContent = `${avgLife} days`;
  
  // Set compliance index based on zones
  const zones = ["Cold Storage A", "Cold Storage B", "Freezer Zone A", "Shelf B1", "Shelf C2"];
  const compliances = [94, 64, 98, 96, 82]; // matching storage details page compliance index
  const avgCompliance = Math.round(compliances.reduce((s, c) => s + c, 0) / zones.length);
  document.getElementById("an-compliance").textContent = `${avgCompliance}%`;
}

function renderAnalyticsCharts() {
  const isDark = document.body.getAttribute("data-theme") === "dark";
  const gridColor = isDark ? "#374151" : "#e2e8f0";
  const textColor = isDark ? "#9ca3af" : "#64748b";

  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;

  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

  // 1. Freshness Coefficient Trend (Line)
  const ctxFresh = document.getElementById("an-chart-fresh-trend").getContext("2d");
  new Chart(ctxFresh, {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "Avg Freshness Coeff (%)",
        data: [84, 85, 87, 86, 89, 91],
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.05)",
        tension: 0.3,
        borderWidth: 3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 70, max: 100 } }
    }
  });

  // 2. Monthly Spoilage Rate Trend (Area)
  const ctxSpoil = document.getElementById("an-chart-spoil-trend").getContext("2d");
  new Chart(ctxSpoil, {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "Spoilage Rate (%)",
        data: [4.2, 3.8, 3.1, 2.8, 2.5, 2.1],
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.3,
        borderWidth: 2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 0, max: 10 } }
    }
  });

  // 3. Category Quality Breakdown (Grouped Bar)
  const ctxCat = document.getElementById("an-chart-cat-quality").getContext("2d");
  new Chart(ctxCat, {
    type: "bar",
    data: {
      labels: ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Seafood', 'Beverages'],
      datasets: [
        {
          label: "Good Quality (%)",
          data: [92, 90, 85, 70, 75, 94],
          backgroundColor: "#10b981",
          borderRadius: 4
        },
        {
          label: "Deteriorated (%)",
          data: [8, 10, 15, 30, 25, 6],
          backgroundColor: "#f97316",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 0, max: 100, stacked: true } }
    }
  });

  // 4. Prevented Food Waste (Bar)
  const ctxWaste = document.getElementById("an-chart-waste-reduction").getContext("2d");
  new Chart(ctxWaste, {
    type: "bar",
    data: {
      labels: months,
      datasets: [{
        label: "Waste Prevented (Kg)",
        data: [120, 145, 160, 190, 210, 250],
        backgroundColor: "#6366f1",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  // 5. HACCP Storage Performance Index (Radar)
  const ctxStorage = document.getElementById("an-chart-storage-perf").getContext("2d");
  new Chart(ctxStorage, {
    type: "radar",
    data: {
      labels: ['Cold Storage A', 'Cold Storage B', 'Freezer Zone A', 'Shelf B1', 'Shelf C2'],
      datasets: [{
        label: "Compliance Factor Index",
        data: [94, 64, 98, 96, 82],
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          grid: { color: gridColor },
          angleLines: { color: gridColor },
          pointLabels: { color: textColor },
          min: 0,
          max: 100
        }
      }
    }
  });

  // 6. Shelf Life Model Accuracy (Line)
  const ctxShelf = document.getElementById("an-chart-shelf-accuracy").getContext("2d");
  new Chart(ctxShelf, {
    type: "line",
    data: {
      labels: ['Epoch 1', 'Epoch 2', 'Epoch 3', 'Epoch 4', 'Epoch 5', 'Epoch 6'],
      datasets: [
        {
          label: "Training Accuracy",
          data: [82, 85, 89, 91, 93, 95],
          borderColor: "#10b981",
          tension: 0.2,
          borderWidth: 2,
          fill: false
        },
        {
          label: "Validation Accuracy",
          data: [80, 84, 87, 88, 91, 92],
          borderColor: "#6366f1",
          tension: 0.2,
          borderWidth: 2,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { min: 50, max: 100 } }
    }
  });
}
