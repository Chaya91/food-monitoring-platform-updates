// FreshGuard Storage Sensors Controller

const STORAGE_ZONES = {
  "Cold Storage A": {
    temp: 3.8,
    tempStatus: "Optimal",
    humidity: 85,
    humidityStatus: "Optimal",
    air: "Optimal",
    airStatus: "Optimal",
    light: "None",
    lightStatus: "Optimal",
    tempHistory: [3.8, 3.9, 4.0, 4.2, 3.9, 3.8],
    humidityHistory: [85, 86, 85, 84, 85, 85],
    recs: [
      { type: "fresh", icon: "fa-circle-check", title: "Optimal Temperature", desc: "Ambient temperature is within the standard 2.0°C - 5.0°C fresh-preservation bracket." },
      { type: "fresh", icon: "fa-circle-check", title: "Humidity Stable", desc: "Relative moisture is optimal at 85% to maintain fruit and cheese crispness." }
    ]
  },
  "Cold Storage B": {
    temp: 8.2,
    tempStatus: "Critical",
    humidity: 60,
    humidityStatus: "Warning",
    air: "Good",
    airStatus: "Optimal",
    light: "None",
    lightStatus: "Optimal",
    tempHistory: [4.1, 4.5, 5.2, 7.8, 8.2, 8.1],
    humidityHistory: [62, 60, 61, 60, 60, 60],
    recs: [
      { type: "spoiled", icon: "fa-triangle-exclamation", title: "CRITICAL: Temperature Exceeded", desc: "Storage zone recorded a spike of 8.2°C. Lower thermostat control immediately to prevent rapid dairy spoilage." },
      { type: "warning", icon: "fa-circle-exclamation", title: "WARNING: Low Humidity", desc: "Humidity is low (60%) for optimal freshness. Condensation risk is low but items may dry out." }
    ]
  },
  "Freezer Zone A": {
    temp: -18.2,
    tempStatus: "Optimal",
    humidity: 45,
    humidityStatus: "Optimal",
    air: "Low",
    airStatus: "Optimal",
    light: "None",
    lightStatus: "Optimal",
    tempHistory: [-18.0, -18.2, -18.1, -17.9, -18.2, -18.3],
    humidityHistory: [45, 46, 45, 44, 45, 45],
    recs: [
      { type: "fresh", icon: "fa-circle-check", title: "Deep Freeze Optimal", desc: "Freezer zone holds a stable -18.2°C environment. Fully prevents bacterial development." },
      { type: "fresh", icon: "fa-circle-check", title: "Optimal Moisture Flow", desc: "Dry climate blocks freezer burns and packaging frosting." }
    ]
  },
  "Shelf B1": {
    temp: 18.2,
    tempStatus: "Optimal",
    humidity: 62,
    humidityStatus: "Optimal",
    air: "High",
    airStatus: "Optimal",
    light: "Medium",
    lightStatus: "Optimal",
    tempHistory: [18.0, 18.2, 18.5, 18.3, 18.2, 18.1],
    humidityHistory: [62, 63, 62, 61, 62, 62],
    recs: [
      { type: "fresh", icon: "fa-circle-check", title: "Dry Shelf Environment", desc: "Ambient temperature holds stable. Fits tropical fruits and bakery." },
      { type: "fresh", icon: "fa-circle-info", title: "Light Exposure check", desc: "Medium ambient light logs detected. Keep sensitive products wrapped." }
    ]
  },
  "Shelf C2": {
    temp: 14.5,
    tempStatus: "Optimal",
    humidity: 78,
    humidityStatus: "Warning",
    air: "Good",
    airStatus: "Optimal",
    light: "Low",
    lightStatus: "Optimal",
    tempHistory: [14.0, 14.2, 14.5, 14.6, 14.5, 14.4],
    humidityHistory: [65, 70, 75, 78, 77, 76],
    recs: [
      { type: "warning", icon: "fa-circle-exclamation", title: "WARNING: High Humidity", desc: "Relative humidity hit 78% (optimal 65-70%). Condensation risk on tomatoes. Increase ventilation air flow." }
    ]
  }
};

let tempChartInstance = null;
let humChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  const zoneSelector = document.getElementById("storage-zone-selector");
  const detailBtn = document.getElementById("view-zone-details-btn");

  if (zoneSelector) {
    zoneSelector.addEventListener("change", (e) => {
      loadZoneData(e.target.value);
    });

    // Initial load
    loadZoneData(zoneSelector.value);
  }

  if (detailBtn && zoneSelector) {
    detailBtn.addEventListener("click", () => {
      window.location.href = `storage-details.html?zone=${encodeURIComponent(zoneSelector.value)}`;
    });
  }
});

async function loadZoneData(zoneName) {
  const zone = STORAGE_ZONES[zoneName] || STORAGE_ZONES["Cold Storage A"];
  const foods = await API.getFoods();
  
  // Filter active batches in this storage location
  const zoneFoods = foods.filter(f => f.storageLocation === zoneName);

  // Update Status Cards
  document.getElementById("sens-val-temp").textContent = `${zone.temp}°C`;
  document.getElementById("sens-val-humidity").textContent = `${zone.humidity}%`;
  document.getElementById("sens-val-air").textContent = zone.air;
  document.getElementById("sens-val-light").textContent = zone.light;
  document.getElementById("sens-val-batches").textContent = `${zoneFoods.length} Batches`;

  // Status Classes
  setStatusStyle("sens-status-temp", zone.tempStatus);
  setStatusStyle("sens-status-humidity", zone.humidityStatus);
  setStatusStyle("sens-status-air", zone.airStatus);
  setStatusStyle("sens-status-light", zone.lightStatus);

  // Populate Recommendations
  const recsBox = document.getElementById("storage-recs-box");
  if (recsBox) {
    if (zone.recs.length === 0) {
      recsBox.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem;">All systems optimal.</div>`;
    } else {
      recsBox.innerHTML = zone.recs.map(rec => {
        let borderCol = "var(--primary)";
        if (rec.type === "warning") borderCol = "var(--warning)";
        if (rec.type === "spoiled") borderCol = "var(--spoiled)";

        return `
          <div style="padding: 10px 12px; border-left: 4px solid ${borderCol}; background-color: var(--bg-app); border-radius: 0 var(--radius-md) var(--radius-md) 0; font-size: 0.85rem;">
            <strong style="display: block; margin-bottom: 2px; color: ${borderCol};"><i class="fa-solid ${rec.icon}"></i> ${rec.title}</strong>
            <span style="color: var(--text-muted);">${rec.desc}</span>
          </div>
        `;
      }).join("");
    }
  }

  // Populate Active Batches Table
  const tableBody = document.getElementById("zone-batches-table-body");
  if (tableBody) {
    if (zoneFoods.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">No active food batches in this storage location.</td>
        </tr>
      `;
    } else {
      tableBody.innerHTML = zoneFoods.map(food => {
        let statusClass = "fresh";
        if (food.status === "Warning") statusClass = "warning";
        else if (food.status === "Near Spoilage") statusClass = "near-spoilage";
        else if (food.status === "Spoiled") statusClass = "spoiled";

        return `
          <tr style="cursor: pointer;" onclick="window.location.href='food-details.html?id=${food.id}'">
            <td><code>${food.batchId}</code></td>
            <td style="font-weight: 600;">${food.name}</td>
            <td style="font-weight: 700;">${food.freshnessScore}%</td>
            <td><span class="badge-status ${statusClass}">${food.status}</span></td>
          </tr>
        `;
      }).join("");
    }
  }

  // Render Storage history line charts
  renderStorageCharts(zoneName, zone);
}

function setStatusStyle(elementId, status) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = `● ${status}`;
  if (status === "Optimal") {
    el.className = "sensor-card-status text-fresh";
  } else if (status === "Warning") {
    el.className = "sensor-card-status text-warning";
  } else {
    el.className = "sensor-card-status text-spoiled";
  }
}

function renderStorageCharts(zoneName, zone) {
  const isDark = document.body.getAttribute("data-theme") === "dark";
  const gridColor = isDark ? "#374151" : "#e2e8f0";
  const textColor = isDark ? "#9ca3af" : "#64748b";

  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = gridColor;

  const timeLabels = ['-20h', '-16h', '-12h', '-8h', '-4h', 'Now'];

  // Temperature History
  if (tempChartInstance) tempChartInstance.destroy();
  const ctxTemp = document.getElementById("storage-temp-history").getContext("2d");
  
  let tempStrokeColor = "#10b981";
  if (zone.tempStatus === "Warning") tempStrokeColor = "#eab308";
  if (zone.tempStatus === "Critical") tempStrokeColor = "#ef4444";

  tempChartInstance = new Chart(ctxTemp, {
    type: 'line',
    data: {
      labels: timeLabels,
      datasets: [{
        label: `${zoneName} Temperature (°C)`,
        data: zone.tempHistory,
        borderColor: tempStrokeColor,
        backgroundColor: 'rgba(99, 102, 241, 0.01)',
        tension: 0.3,
        borderWidth: 3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });

  // Humidity History
  if (humChartInstance) humChartInstance.destroy();
  const ctxHum = document.getElementById("storage-humidity-history").getContext("2d");

  let humStrokeColor = "#6366f1";
  if (zone.humidityStatus === "Warning") humStrokeColor = "#eab308";
  if (zone.humidityStatus === "Critical") humStrokeColor = "#ef4444";

  humChartInstance = new Chart(ctxHum, {
    type: 'line',
    data: {
      labels: timeLabels,
      datasets: [{
        label: `${zoneName} Humidity (%)`,
        data: zone.humidityHistory,
        borderColor: humStrokeColor,
        backgroundColor: 'rgba(99, 102, 241, 0.01)',
        tension: 0.3,
        borderWidth: 3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 20, max: 100 }
      }
    }
  });

  // Update chart card titles
  document.getElementById("temp-chart-title").textContent = `${zoneName} Temperature Telemetry History (°C)`;
  document.getElementById("humidity-chart-title").textContent = `${zoneName} Moisture Relative Humidity Telemetry History (%)`;
}
