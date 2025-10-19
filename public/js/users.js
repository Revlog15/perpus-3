import { API_BASE } from "./api.js";

// Load all users
export async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    const users = await response.json();
    renderUsersTable(users);
  } catch (error) {
    console.error("Error loading users:", error);
    showError("Gagal memuat data user");
  }
}

// Render users table
function renderUsersTable(users) {
  const tbody = document.getElementById("usersTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  users.forEach((user) => {
    if (user.role?.toLowerCase() === "admin") return; // Skip admin users

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.telepon || ""}</td>
            <td>
                <span class="badge bg-${
                  user.status === "active" ? "success" : "danger"
                }">
                    ${user.status === "active" ? "Aktif" : "Tidak Aktif"}
                </span>
            </td>
            <td>${calculateActiveLoanCount(user.id)}</td>
            <td>${user.createdAt || "-"}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary" onclick="editUser('${
                      user.id
                    }')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-warning" onclick="resetUserPassword('${
                      user.id
                    }')">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteUser('${
                      user.id
                    }')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

// Calculate active loans for a user
function calculateActiveLoanCount(userId) {
  try {
    const loans = JSON.parse(localStorage.getItem("loans") || "[]");
    return loans.filter(
      (loan) => loan.idUser === userId && loan.status === "aktif"
    ).length;
  } catch (error) {
    console.error("Error calculating active loans:", error);
    return 0;
  }
}

// Add new user
export async function addUser(userData) {
  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add user");
    }

    const result = await response.json();
    await loadUsers(); // Reload users table
    return result;
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
}

// Update existing user
export async function updateUser(userId, userData) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update user");
    }

    const result = await response.json();
    await loadUsers(); // Reload users table
    return result;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// Reset user password
export async function resetUserPassword(userId, newPassword) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to reset password");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}

// Delete user
export async function deleteUser(userId) {
  try {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete user");
    }

    const result = await response.json();
    await loadUsers(); // Reload users table
    return result;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

// Show error message
function showError(message) {
  const userSection = document.getElementById("users-section");
  if (!userSection) return;

  const alert = document.createElement("div");
  alert.className = "alert alert-danger alert-dismissible fade show";
  alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

  const existingAlert = userSection.querySelector(".alert");
  if (existingAlert) {
    existingAlert.remove();
  }

  userSection.insertBefore(alert, userSection.firstChild);
}
