// FreshGuard Dashboard Controller

document.addEventListener("DOMContentLoaded", async () => {
  const user = MockStore.getCurrentUser();
  if (!user) return;

  // Set welcome greeting
  const titleEl = document.getElementById("welcome-title");
  if (titleEl) {
    const hours = new Date().getHours();
    let salutation = "Good Morning";
    if (hours >= 12 && hours < 17) salutation = "Good Afternoon";
    if (hours >= 17) salutation = "Good Evening";
    titleEl.textContent = `${salutation}, ${user.name}`;
  }

  // Load stats and populate
  await loadDashboardStats();
  
  // Render charts
  renderDashboardCharts();

  // Populate activity log
  populateActivityLog();
});

async function loadDashboardStats() {
  const foods = await API.getFoods();
  
  const total = foods.length;
  const fresh = foods.filter(f => f.status === "Fresh").length;
  const warning = foods.filter(f => f.status === "Warning").length;
  const nearSpoilage = foods.filter(f => f.status === "Near Spoilage").length;
  const spoiled = foods.filter(f => f.status === "Spoiled").length;

  // Calculate averages
  const avgFreshness = total > 0 
    ? Math.round(foods.reduce((sum, f) => sum + f.freshnessScore, 0) / total) 
    : 0;
  
  const avgShelfLife = total > 0 
    ? (foods.reduce((sum, f) => sum + f.shelfLifeRemainingDays, 0) / total).toFixed(1)
    : 0;

  // Populate HTML elements
  document.getElementById("stat-total-items").textContent = total;
  document.getElementById("stat-fresh-items").textContent = fresh;
  document.getElementById("stat-warning-items").textContent = nearSpoilage + warning;
  document.getElementById("stat-spoiled-items").textContent = spoiled;
  document.getElementById("stat-avg-freshness").textContent = `${avgFreshness}%`;
  document.getElementById("stat-avg-shelf-life").textContent = `${avgShelfLife}d`;
}

function renderDashboardCharts() {
  const isDark = document.body.getAttribute("data-theme") === "dark";
  const gridColor = isDark ? "#374151" : "#e2e8f0";
  const textColor = isDark ? "#9ca3af" : "#64748b";

  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;

  // 1. Freshness Score Trend (Line)
  const ctxTrend = document.getElementById("chart-freshness-trend").getContext("2d");
  new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Avg Freshness Score (%)',
        data: [89, 87, 86, 91, 90, 88, 91],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 60, max: 100 }
      }
    }
  });

  // 2. Food Quality Distribution (Doughnut)
  const ctxQual = document.getElementById("chart-quality-dist").getContext("2d");
  new Chart(ctxQual, {
    type: 'doughnut',
    data: {
      labels: ['Fresh', 'Warning', 'Near Spoilage', 'Spoiled'],
      datasets: [{
        data: [60, 20, 12, 8],
        backgroundColor: ['#10b981', '#eab308', '#f97316', '#ef4444'],
        borderWidth: isDark ? 2 : 1,
        borderColor: isDark ? '#1f2937' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12 } }
      }
    }
  });

  // 3. Spoilage Risk (Bar)
  const ctxRisk = document.getElementById("chart-spoilage-risk").getContext("2d");
  new Chart(ctxRisk, {
    type: 'bar',
    data: {
      labels: ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Seafood', 'Bakery'],
      datasets: [{
        label: 'Avg Spoilage Prob (%)',
        data: [15, 12, 28, 65, 45, 35],
        backgroundColor: ['#10b981', '#10b981', '#eab308', '#ef4444', '#f97316', '#eab308'],
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { max: 100 }
      }
    }
  });

  // 4. Shelf-Life Distribution (Horizontal Bar)
  const ctxShelf = document.getElementById("chart-shelf-life-dist").getContext("2d");
  new Chart(ctxShelf, {
    type: 'bar',
    indexAxis: 'y',
    data: {
      labels: ['0-2 Days', '3-5 Days', '6-10 Days', '11+ Days'],
      datasets: [{
        label: 'Batches Count',
        data: [4, 6, 8, 12],
        backgroundColor: ['#ef4444', '#f97316', '#eab308', '#10b981'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });

  // 5. Storage Temperature Log (Line)
  const ctxTemp = document.getElementById("chart-storage-temp").getContext("2d");
  new Chart(ctxTemp, {
    type: 'line',
    data: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      datasets: [
        {
          label: 'Cold Storage A',
          data: [3.8, 3.9, 4.2, 4.5, 4.1, 3.9],
          borderColor: '#10b981',
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Cold Storage B',
          data: [4.1, 4.3, 4.9, 8.2, 4.6, 4.2],
          borderColor: '#ef4444',
          tension: 0.3,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
    }
  });

  // 6. Storage Humidity Log (Line)
  const ctxHum = document.getElementById("chart-storage-humidity").getContext("2d");
  new Chart(ctxHum, {
    type: 'line',
    data: {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      datasets: [
        {
          label: 'Cold Storage A (%)',
          data: [85, 86, 85, 87, 85, 84],
          borderColor: '#6366f1',
          tension: 0.3,
          borderWidth: 2
        },
        {
          label: 'Shelf C2 (%)',
          data: [65, 68, 72, 78, 70, 68],
          borderColor: '#eab308',
          tension: 0.3,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
    }
  });
}

function populateActivityLog() {
  const container = document.getElementById("dashboard-activity-list");
  if (!container) return;

  const alerts = MockStore.getAlerts() || [];
  
  // Choose up to 4 significant alerts to show as activities
  const displayAlerts = alerts.slice(0, 4);

  if (displayAlerts.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No recent activities.</div>`;
    return;
  }

  container.innerHTML = displayAlerts.map(alert => {
    let dotColor = "var(--primary)";
    if (alert.level === "Critical") dotColor = "var(--spoiled)";
    else if (alert.level === "Warning") dotColor = "var(--warning)";

    return `
      <div class="activity-item">
        <span class="activity-dot" style="background-color: ${dotColor};"></span>
        <div class="activity-text-wrapper">
          <div class="activity-desc"><strong>${alert.target}</strong>: ${alert.title}</div>
          <div class="activity-time">${alert.timestamp}</div>
        </div>
      </div>
    `;
  }).join("");

  // Storage diagnostics panel
  const diagContainer = document.getElementById("dashboard-storage-diagnostics");
  if (!diagContainer) return;

  const warnings = alerts.filter(a => a.type === "Storage Alert");
  if (warnings.length === 0) {
    diagContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; color: var(--primary); font-size: 0.85rem;">
        <i class="fa-solid fa-circle-check" style="font-size: 1.25rem;"></i>
        <span>All environmental parameters are in optimal range.</span>
      </div>
    `;
    return;
  }

  diagContainer.innerHTML = warnings.slice(0, 2).map(w => {
    const levelClass = w.level.toLowerCase();
    const borderCol = w.level === "Critical" ? "var(--spoiled)" : "var(--warning)";
    return `
      <div style="padding: 8px 12px; border-left: 3px solid ${borderCol}; background-color: var(--bg-input); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: 0.8rem;">
        <span style="font-weight: 700; color: ${borderCol}; text-transform: uppercase; font-size: 0.68rem; display: block;">${w.level}</span>
        <span style="color: var(--text-main); font-weight: 500;">${w.title} - ${w.target}</span>
      </div>
    `;
  }).join("");
}
