// FreshGuard Global Bootstrap & Layout Injection

document.addEventListener("DOMContentLoaded", () => {
  const user = MockStore.getCurrentUser();
  if (!user) return; // auth.js will handle redirect

  injectSidebarAndNavbar(user);
  initializeTheme();
  initializeMobileSidebar();
  initializeNotifications();
  setupGlobalSearch();
});

// Sidebar links configuration with role restrictions
const NAVIGATION_LINKS = [
  { id: "nav-dashboard", label: "Dashboard", href: "dashboard.html", icon: "fa-solid fa-chart-line", roles: ["Consumer", "Retail Manager", "Warehouse Operator", "Food Quality Inspector", "Administrator"] },
  { id: "nav-inventory", label: "Inventory", href: "inventory.html", icon: "fa-solid fa-boxes-stacked", roles: ["Retail Manager", "Warehouse Operator", "Food Quality Inspector", "Administrator"], customLabel: { Consumer: "My Food" } },
  { id: "nav-inventory-consumer", label: "My Food", href: "inventory.html", icon: "fa-solid fa-apple-whole", roles: ["Consumer"] },
  { id: "nav-freshness", label: "Freshness Analysis", href: "freshness-analysis.html", icon: "fa-solid fa-camera-retro", roles: ["Consumer", "Retail Manager", "Food Quality Inspector", "Administrator"] },
  { id: "nav-shelf-life", label: "Shelf-Life Prediction", href: "shelf-life.html", icon: "fa-solid fa-hourglass-half", roles: ["Consumer", "Retail Manager", "Warehouse Operator", "Administrator"] },
  { id: "nav-storage", label: "Storage Monitoring", href: "storage.html", icon: "fa-solid fa-temperature-half", roles: ["Retail Manager", "Warehouse Operator", "Administrator"] },
  { id: "nav-alerts", label: "Alerts", href: "alerts.html", icon: "fa-solid fa-bell", roles: ["Consumer", "Retail Manager", "Warehouse Operator", "Food Quality Inspector", "Administrator"] },
  { id: "nav-reports", label: "Reports", href: "reports.html", icon: "fa-solid fa-file-invoice", roles: ["Retail Manager", "Warehouse Operator", "Food Quality Inspector", "Administrator"] },
  { id: "nav-analytics", label: "Analytics", href: "analytics.html", icon: "fa-solid fa-chart-pie", roles: ["Retail Manager", "Food Quality Inspector", "Administrator"] }
];

const ADMIN_LINKS = [
  { id: "nav-users", label: "Users", href: "users.html", icon: "fa-solid fa-users", roles: ["Administrator"] },
  { id: "nav-settings", label: "Settings", href: "settings.html", icon: "fa-solid fa-sliders", roles: ["Administrator"] }
];

function injectSidebarAndNavbar(user) {
  const currentPath = window.location.pathname.split("/").pop() || "dashboard.html";
  const sidebarContainer = document.getElementById("sidebar-container");
  const navbarContainer = document.getElementById("navbar-container");

  if (!sidebarContainer || !navbarContainer) return;

  // 1. Generate Sidebar Menu Links
  let sidebarMenuHtml = `<div class="sidebar-logo">
    <h1>FreshGuard</h1>
    <span>AI Freshness Platform</span>
  </div>
  <div class="sidebar-menu">`;

  // Core navigation section
  sidebarMenuHtml += `<div class="menu-group">
    <div class="menu-group-title">Monitoring</div>
    <ul class="menu-list">`;
  
  NAVIGATION_LINKS.forEach(link => {
    if (link.roles.includes(user.role)) {
      const activeClass = currentPath === link.href ? "active" : "";
      const label = (link.customLabel && link.customLabel[user.role]) ? link.customLabel[user.role] : link.label;
      sidebarMenuHtml += `<li class="menu-item ${activeClass}" id="${link.id}">
        <a href="${link.href}"><i class="${link.icon}"></i> <span>${label}</span></a>
      </li>`;
    }
  });
  sidebarMenuHtml += `</ul></div>`;

  // Admin section
  const visibleAdminLinks = ADMIN_LINKS.filter(link => link.roles.includes(user.role));
  if (visibleAdminLinks.length > 0) {
    sidebarMenuHtml += `<div class="menu-group">
      <div class="menu-group-title">Administration</div>
      <ul class="menu-list">`;
    visibleAdminLinks.forEach(link => {
      const activeClass = currentPath === link.href ? "active" : "";
      sidebarMenuHtml += `<li class="menu-item ${activeClass}" id="${link.id}">
        <a href="${link.href}"><i class="${link.icon}"></i> <span>${link.label}</span></a>
      </li>`;
    });
    sidebarMenuHtml += `</ul></div>`;
  }

  sidebarMenuHtml += `</div>`; // Close sidebar-menu

  // Sidebar footer (Profile and Logout)
  const profileActive = currentPath === "profile.html" ? "active" : "";
  sidebarMenuHtml += `<div class="sidebar-footer">
    <ul class="menu-list">
      <li class="menu-item ${profileActive}" id="nav-profile">
        <a href="profile.html"><i class="fa-solid fa-user-gear"></i> <span>Profile</span></a>
      </li>
      <li class="menu-item" id="nav-logout">
        <a href="#" id="logout-btn-trigger"><i class="fa-solid fa-right-from-bracket"></i> <span>Logout</span></a>
      </li>
    </ul>
  </div>`;

  sidebarContainer.innerHTML = sidebarMenuHtml;
  sidebarContainer.className = "sidebar";

  // Bind logout trigger
  document.getElementById("logout-btn-trigger").addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to log out?")) {
      Auth.logout();
    }
  });

  // 2. Generate Navbar
  let pageTitle = "Dashboard";
  const allLinks = [...NAVIGATION_LINKS, ...ADMIN_LINKS, { href: "profile.html", label: "My Profile" }];
  const matchingLink = allLinks.find(l => l.href === currentPath);
  if (matchingLink) {
    pageTitle = (matchingLink.customLabel && matchingLink.customLabel[user.role]) ? matchingLink.customLabel[user.role] : matchingLink.label;
  }

  // Create notifications dropdown placeholder within wrapper
  navbarContainer.outerHTML = `
  <header class="top-navbar">
    <div class="navbar-left">
      <button class="menu-toggle-btn" id="sidebar-toggle-trigger">
        <i class="fa-solid fa-bars"></i>
      </button>
      <h2 class="page-title">${pageTitle}</h2>
    </div>
    
    <div class="navbar-right">
      <div class="search-bar-container">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Search..." class="search-input" id="global-search-input">
      </div>
      
      <!-- Interactive Role Switcher dropdown for testing -->
      <div class="form-group-fg" style="margin-bottom: 0; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Simulate Role:</span>
        <select id="role-switcher-select" class="input-fg" style="padding: 4px 8px; width: 150px; font-size: 0.8rem; border-radius: var(--radius-sm);">
          <option value="Consumer" ${user.role === "Consumer" ? "selected" : ""}>Consumer</option>
          <option value="Retail Manager" ${user.role === "Retail Manager" ? "selected" : ""}>Retail Manager</option>
          <option value="Warehouse Operator" ${user.role === "Warehouse Operator" ? "selected" : ""}>Warehouse Operator</option>
          <option value="Food Quality Inspector" ${user.role === "Food Quality Inspector" ? "selected" : ""}>Food Quality Inspector</option>
          <option value="Administrator" ${user.role === "Administrator" ? "selected" : ""}>Administrator</option>
        </select>
      </div>

      <button class="navbar-btn" id="theme-toggle-btn">
        <i class="fa-solid fa-moon"></i>
      </button>
      
      <button class="navbar-btn" id="notifications-bell-btn">
        <i class="fa-solid fa-bell"></i>
        <span class="badge-unread" id="navbar-unread-count" style="display: none;">0</span>
      </button>
      
      <div class="nav-user-profile" onclick="window.location.href='profile.html'">
        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="Avatar" class="nav-user-img">
        <div class="nav-user-info">
          <span class="nav-user-name">${user.name}</span>
          <span class="nav-user-role">${user.role}</span>
        </div>
      </div>
    </div>
  </header>
  
  <div class="sidebar-overlay" id="sidebar-overlay-backdrop"></div>
  
  <!-- Notification Center Dropdown -->
  <div class="notification-dropdown" id="notification-dropdown-box">
    <div class="dropdown-header">
      <h4>Notifications</h4>
      <button class="mark-all-read-btn" id="mark-all-read-trigger">Mark all as read</button>
    </div>
    <div class="notification-list-mini" id="mini-notification-list">
      <!-- Items loaded dynamically -->
    </div>
    <div class="dropdown-footer">
      <a href="alerts.html">View all alerts</a>
    </div>
  </div>
  `;

  // Bind Role Switcher
  const switcher = document.getElementById("role-switcher-select");
  if (switcher) {
    switcher.addEventListener("change", (e) => {
      const newRole = e.target.value;
      user.role = newRole;
      localStorage.setItem("fg_currentUser", JSON.stringify(user));
      
      // Update role status in master user table too
      const usersList = MockStore.getUsers();
      const index = usersList.findIndex(u => u.id === user.id);
      if (index !== -1) {
        usersList[index].role = newRole;
        MockStore.saveUsers(usersList);
      }
      
      // Reload page to re-render sidebar navigation
      window.location.reload();
    });
  }
}

// Light / Dark Theme logic
function initializeTheme() {
  const settings = MockStore.getSettings() || {};
  const body = document.body;
  const themeToggleBtn = document.getElementById("theme-toggle-btn");

  const setTheme = (theme) => {
    body.setAttribute("data-theme", theme);
    if (themeToggleBtn) {
      const icon = themeToggleBtn.querySelector("i");
      if (theme === "dark") {
        icon.className = "fa-solid fa-sun";
      } else {
        icon.className = "fa-solid fa-moon";
      }
    }
    settings.theme = theme;
    MockStore.saveSettings(settings);
  };

  // Set initial theme
  setTheme(settings.theme || "light");

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = body.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      setTheme(newTheme);
    });
  }
}

// Mobile sidebar toggle overlay logic
function initializeMobileSidebar() {
  const toggleBtn = document.getElementById("sidebar-toggle-trigger");
  const sidebar = document.getElementById("sidebar-container");
  const overlay = document.getElementById("sidebar-overlay-backdrop");

  if (!toggleBtn || !sidebar || !overlay) return;

  const toggle = () => {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  };

  toggleBtn.addEventListener("click", toggle);
  overlay.addEventListener("click", toggle);
}

// Global Notification Center Bell logic
function initializeNotifications() {
  const bellBtn = document.getElementById("notifications-bell-btn");
  const dropdown = document.getElementById("notification-dropdown-box");
  const markReadBtn = document.getElementById("mark-all-read-trigger");

  if (!bellBtn || !dropdown) return;

  bellBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");
  });

  // Close dropdown on click outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
      dropdown.classList.remove("active");
    }
  });

  if (markReadBtn) {
    markReadBtn.addEventListener("click", () => {
      const alerts = MockStore.getAlerts();
      alerts.forEach(a => a.read = true);
      MockStore.saveAlerts(alerts);
      updateNotificationsUI();
    });
  }

  // Load and render initially
  updateNotificationsUI();
}

function updateNotificationsUI() {
  const alerts = MockStore.getAlerts() || [];
  const unreadCount = alerts.filter(a => !a.read).length;
  const countBadge = document.getElementById("navbar-unread-count");
  const miniList = document.getElementById("mini-notification-list");

  if (countBadge) {
    if (unreadCount > 0) {
      countBadge.textContent = unreadCount;
      countBadge.style.display = "block";
    } else {
      countBadge.style.display = "none";
    }
  }

  if (miniList) {
    // Show top 4 notifications
    const recentAlerts = alerts.slice(0, 4);
    
    if (recentAlerts.length === 0) {
      miniList.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No alerts reported.</div>`;
      return;
    }

    miniList.innerHTML = recentAlerts.map(alert => {
      const isUnread = !alert.read ? "unread" : "";
      const iconClass = alert.level === "Critical" 
        ? "fa-triangle-exclamation" 
        : alert.level === "Warning" 
          ? "fa-circle-exclamation" 
          : "fa-circle-info";
      
      const levelClass = alert.level.toLowerCase();

      return `
        <div class="notification-item-mini ${isUnread}" onclick="window.location.href='alerts.html'">
          <div class="mini-alert-icon ${levelClass}">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <div class="mini-alert-content">
            <div class="mini-alert-title">${alert.title}</div>
            <div class="mini-alert-desc">${alert.target}</div>
            <div class="mini-alert-time">${alert.timestamp}</div>
          </div>
        </div>
      `;
    }).join("");
  }
}

// Global search hooks
function setupGlobalSearch() {
  const searchInput = document.getElementById("global-search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const value = e.target.value.trim().toLowerCase();
    
    // Broadcast search value to pages that support inventory filters
    const pageHandler = window.InventoryPage || window.AlertsPage || window.UsersPage;
    if (pageHandler && typeof pageHandler.handleSearch === "function") {
      pageHandler.handleSearch(value);
    }
  });
}
