// FreshGuard Authentication Module

const Auth = {
  // Check if user is logged in
  checkAuth: () => {
    const user = MockStore.getCurrentUser();
    const currentPath = window.location.pathname.split("/").pop();
    
    const publicPages = ["login.html", "register.html"];
    const isPublic = publicPages.includes(currentPath);

    if (!user && !isPublic) {
      // Redirect to login if accessing protected page while unauthenticated
      window.location.href = "login.html";
    } else if (user && isPublic) {
      // Redirect to dashboard if logged-in user tries to visit login/register
      window.location.href = "dashboard.html";
    }
    return user;
  },

  // Log in user
  login: async (email, password) => {
    try {
      const response = await API.loginUser(email, password);
      if (response.success) {
        window.location.href = "dashboard.html";
      }
    } catch (error) {
      throw error;
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await API.registerUser(userData);
      if (response.success) {
        // Automatically log in after registration
        localStorage.setItem("fg_currentUser", JSON.stringify(response.user));
        window.location.href = "dashboard.html";
      }
    } catch (error) {
      throw error;
    }
  },

  // Log out user
  logout: () => {
    localStorage.removeItem("fg_currentUser");
    window.location.href = "login.html";
  },

  // Update profile
  updateProfile: (updatedData) => {
    const currentUser = MockStore.getCurrentUser();
    if (!currentUser) return false;

    const users = MockStore.getUsers();
    const index = users.findIndex(u => u.id === currentUser.id);

    if (index !== -1) {
      const updatedUser = { ...users[index], ...updatedData };
      users[index] = updatedUser;
      
      MockStore.saveUsers(users);
      localStorage.setItem("fg_currentUser", JSON.stringify(updatedUser));
      return true;
    }
    return false;
  },

  // Change password simulation
  changePassword: (oldPassword, newPassword) => {
    // Just a placeholder since passwords are simulated
    return true;
  }
};

// Check authentication status instantly on script run
Auth.checkAuth();
