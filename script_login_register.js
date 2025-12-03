// register form
function toggleForm(type) {
  // reset semua input
  document.querySelectorAll("input").forEach(inp => {
    if (inp.type !== "radio") inp.value = "";
    if (inp.type === "radio") inp.checked = false;
  });

  // sembunyikan kedua form
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("registerForm").classList.add("hidden");

  // tampilkan form sesuai tipe
  if (type === "login") {
    document.getElementById("loginForm").classList.remove("hidden");
    document.getElementById("loginEmail").focus();
  } else {
    document.getElementById("registerForm").classList.remove("hidden");
    document.getElementById("regUsername").focus();
  }
}

// message notif 
function showMessage(msg, isError = false) {
  const box = document.getElementById("messageBox");

  box.style.display = "none";
  void box.offsetWidth; 
  box.style.display = "block";

  box.innerHTML = `${isError ? "⚠️" : "✅"} ${msg}`;
  box.className = "message " + (isError ? "error" : "success");
  box.classList.add("show");

  requestAnimationFrame(() => box.classList.add("show"));

  setTimeout(() => {
    box.classList.remove("show");
    setTimeout(() => (box.style.display = "none"), 400);
  }, 3000);
}

// handle login
function handleLogin() {
  const identifier = document.getElementById("loginEmail").value; // accepts username or email
  const password = document.getElementById("loginPassword").value;

  if (identifier === "" || password === "") {
    showMessage("Isi semua field!", true);
    return;
  }

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `identifier=${encodeURIComponent(identifier)}&password=${encodeURIComponent(password)}`
  })
    .then(res => res.json().catch(() => null))
    .then(data => {
      if (data && data.message && data.message.includes("Login berhasil")) {
        // clear previous session and store new session
        try { localStorage.removeItem('username'); } catch (e) {}
        try { localStorage.removeItem('userid'); } catch (e) {}
        if (data.username) localStorage.setItem('username', data.username);
        if (data.id) localStorage.setItem('userid', data.id);
        showMessage("Login berhasil! Redirecting...");
        setTimeout(() => {
          if (data.role === 'admin') window.location.href = '/admin';
          else window.location.href = '/user';
        }, 1000);
      } else {
        if (data && typeof data.message === 'string') {
          const msg = data.message.includes('dinonaktifkan')
            ? 'Akun Anda dinonaktifkan, Silakan hubungi admin'
            : data.message;
          showMessage(msg, true);
        } else {
          showMessage("Email atau password salah!", true);
        }
      }
    })
    .catch(() => showMessage("Server error!", true));
}

// handle register
function handleRegister() {
  const fullName = document.getElementById("regFullName").value;
  const nis = document.getElementById("regNIS").value;
  const username = document.getElementById("regUsername").value;
  const gender = document.querySelector("input[name='gender']:checked");
  const phone = document.getElementById("regPhone").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const confirmPassword = document.getElementById("regConfirmPassword").value;

  // validasi dasar
  if (!fullName || !nis || !username || !gender || !phone || !email || !password || !confirmPassword) {
    showMessage("Isi semua field!", true);
    return;
  }

  if (!/^\d{10}$/.test(nis)) {
    showMessage("NIS harus 10 digit angka!", true);
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Password tidak sama!", true);
    return;
  }

  if (!/^[0-9]+$/.test(phone)) {
    showMessage("Nomor telepon harus angka!", true);
    return;
  }

  // kirim data ke server
  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `fullName=${encodeURIComponent(fullName)}&nis=${encodeURIComponent(nis)}&username=${encodeURIComponent(username)}&gender=${encodeURIComponent(gender.value)}&phone=${encodeURIComponent(phone)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&confirmPassword=${encodeURIComponent(confirmPassword)}`
  })
    .then(res => res.text())
    .then(data => {
      if (data.includes("Registrasi berhasil")) {
        showMessage("Register berhasil! Silakan login...");
        toggleForm("login");
      } else if (data.includes("NIS sudah terdaftar")) {
        showMessage("NIS sudah terdaftar!", true);
      } else if (data.includes("Username atau Email sudah terdaftar")) {
        showMessage("Username atau Email sudah terdaftar!", true);
      } else if (data.includes("Konfirmasi password tidak cocok")) {
        showMessage("Password tidak cocok!", true);
      } else {
        showMessage("Gagal register!", true);
      }
    })
    .catch(() => showMessage("Server error!", true));
}

// cek password match
function checkPasswordMatch() {
  const pw = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirmPassword").value;
  const msg = document.getElementById("passwordMatchMsg");

  if (confirm !== "" && pw !== confirm) {
    msg.style.display = "block";
  } else {
    msg.style.display = "none";
  }

  checkFormValidity();
}

// cek input no telp
function checkPhoneInput() {
  const phone = document.getElementById("regPhone").value;
  const error = document.getElementById("phoneError");

  if (phone !== "" && !/^[0-9]+$/.test(phone)) {
    error.style.display = "block";
  } else {
    error.style.display = "none";
  }

  checkFormValidity();
}

// cek input NIS (harus 10 digit)
function checkNISInput() {
  const nis = document.getElementById("regNIS").value;
  const error = document.getElementById("nisError");

  if (nis !== "" && !/^\d{10}$/.test(nis)) {
    error.style.display = "block";
  } else {
    error.style.display = "none";
  }

  checkFormValidity();
}

// cek semua field agar tombol aktif hanya jika lengkap & valid
function checkFormValidity() {
  const fullName = document.getElementById("regFullName").value.trim();
  const nis = document.getElementById("regNIS").value.trim();
  const name = document.getElementById("regUsername").value.trim();
  const gender = document.querySelector("input[name='gender']:checked");
  const phone = document.getElementById("regPhone").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();
  const confirmPassword = document.getElementById("regConfirmPassword").value.trim();

  const nisValid = /^\d{10}$/.test(nis);
  const phoneValid = /^[0-9]+$/.test(phone);
  const passwordsMatch = password !== "" && password === confirmPassword;
  const allFilled = fullName && nis && name && gender && phone && email && password && confirmPassword;

  const registerBtn = document.getElementById("registerBtn");
  const valid = allFilled && nisValid && phoneValid && passwordsMatch;

  registerBtn.disabled = !valid;

  // ubah tampilan warna
  if (valid) {
    registerBtn.classList.add("enabled");
  } else {
    registerBtn.classList.remove("enabled");
  }
}

function handleEnterKey(e) {
  if (e.key === "Enter") {
    e.preventDefault();

    // deteksi form aktif
    const isLoginVisible = !document.getElementById("loginForm").classList.contains("hidden");
    const isRegisterVisible = !document.getElementById("registerForm").classList.contains("hidden");

    if (isLoginVisible) handleLogin();
    if (isRegisterVisible) handleRegister();
  }
}

document.addEventListener("keydown", handleEnterKey);

// inisialisasi
window.onload = () => {
  document.getElementById("loginEmail").focus();

  // cek validitas setiap kali user isi input
  ["regFullName", "regNIS", "regUsername", "regPhone", "regEmail", "regPassword", "regConfirmPassword"].forEach(id => {
    document.getElementById(id).addEventListener("input", checkFormValidity);
  });

  document.querySelectorAll("input[name='gender']").forEach(radio => {
    radio.addEventListener("change", checkFormValidity);
  });

  document.getElementById("regPassword").addEventListener("input", checkPasswordMatch);
  document.getElementById("regConfirmPassword").addEventListener("input", checkPasswordMatch);
  document.getElementById("regPhone").addEventListener("input", checkPhoneInput);
  document.getElementById("regNIS").addEventListener("input", checkNISInput);
};
