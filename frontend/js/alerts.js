// FreshGuard Alerts Page Controller

let alertsData = [];
let activeAlertFilters = {
  search: "",
  severity: "All"
};

document.addEventListener("DOMContentLoaded", async () => {
  const user = MockStore.getCurrentUser();
  if (!user) return;

  await loadAlerts();

  // Bind local filters
  const searchInput = document.getElementById("alert-search");
  const severityFilter = document.getElementById("filter-alert-severity");
  const markAllBtn = document.getElementById("alerts-mark-all-btn");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeAlertFilters.search = e.target.value.trim().toLowerCase();
      renderAlerts();
    });
  }

  if (severityFilter) {
    severityFilter.addEventListener("change", (e) => {
      activeAlertFilters.severity = e.target.value;
      renderAlerts();
    });
  }

  if (markAllBtn) {
    markAllBtn.addEventListener("click", () => {
      alertsData.forEach(a => a.read = true);
      saveAlertsState();
      renderAlerts();
    });
  }

  // Hook global search
  window.AlertsPage = {
    handleSearch: (value) => {
      activeAlertFilters.search = value;
      if (searchInput) searchInput.value = value;
      renderAlerts();
    }
  };
});

async function loadAlerts() {
  alertsData = await API.getAlerts();
  renderAlerts();
}

function saveAlertsState() {
  localStorage.setItem("fg_alerts", JSON.stringify(alertsData));
  
  // Call global main.js layout update to instantly sync navbar badges
  if (typeof updateNotificationsUI === "function") {
    updateNotificationsUI();
  }
}

function renderAlerts() {
  const container = document.getElementById("alerts-list-container");
  if (!container) return;

  const filtered = alertsData.filter(alert => {
    // Search target or details
    const matchesSearch = alert.target.toLowerCase().includes(activeAlertFilters.search) ||
                          alert.title.toLowerCase().includes(activeAlertFilters.search) ||
                          alert.type.toLowerCase().includes(activeAlertFilters.search);
    
    // Severity level
    const matchesSev = activeAlertFilters.severity === "All" || alert.level === activeAlertFilters.severity;

    return matchesSearch && matchesSev;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card-freshguard text-center" style="padding: 4rem 2rem; border-style: dashed;">
        <i class="fa-solid fa-bell-slash text-muted" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
        <h4>No Alerts Logged</h4>
        <p class="text-muted" style="font-size: 0.85rem; max-width: 320px; margin: 0.5rem auto 0;">Excellent! All storage systems are running in normal preservation parameters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(alert => {
    const isUnread = !alert.read ? "unread" : "";
    const levelClass = alert.level.toLowerCase();
    
    // Icon selection
    let iconClass = "fa-circle-info";
    if (alert.level === "Critical") iconClass = "fa-triangle-exclamation";
    else if (alert.level === "Warning") iconClass = "fa-circle-exclamation";

    return `
      <div class="alert-item-card ${isUnread} level-${levelClass}">
        <div class="alert-icon-big ${levelClass}">
          <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="alert-body-text">
          <div class="alert-header-row">
            <span class="alert-title-text">${alert.title}</span>
            <span class="alert-meta-tag text-${levelClass}">${alert.level}</span>
          </div>
          <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 2px;">Target: ${alert.target}</div>
          <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 6px;">${alert.details}</p>
          <span style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-regular fa-clock"></i> ${alert.timestamp}</span>
        </div>
        <div class="alert-action-btn-row">
          ${!alert.read ? `
            <button class="table-action-btn" title="Mark as read" onclick="markAlertAsRead('${alert.id}')">
              <i class="fa-solid fa-check"></i>
            </button>
          ` : `
            <button class="table-action-btn" title="Mark as unread" onclick="markAlertAsUnread('${alert.id}')">
              <i class="fa-solid fa-envelope"></i>
            </button>
          `}
          <button class="table-action-btn delete" title="Delete alert" onclick="deleteAlert('${alert.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

window.markAlertAsRead = (id) => {
  const alert = alertsData.find(a => a.id === id);
  if (alert) {
    alert.read = true;
    saveAlertsState();
    renderAlerts();
  }
};

window.markAlertAsUnread = (id) => {
  const alert = alertsData.find(a => a.id === id);
  if (alert) {
    alert.read = false;
    saveAlertsState();
    renderAlerts();
  }
};

window.deleteAlert = (id) => {
  alertsData = alertsData.filter(a => a.id !== id);
  saveAlertsState();
  renderAlerts();
};
