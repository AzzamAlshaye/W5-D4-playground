// register.js
const apiUrl = "https://68243c9365ba0580339965d9.mockapi.io";
const usernameInput = document.getElementById("su-username");
const passwordInput = document.getElementById("su-password");
const confirmInput = document.getElementById("confirmPassword");
const submitBtn = document.getElementById("su-submit");

submitBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;

  // ─── Basic validation ────────────────────
  if (username.length < 5) {
    return alert("Username must be at least 5 characters.");
  }
  if (password.length < 4) {
    return alert("Password must be at least 4 characters.");
  }
  if (password !== confirm) {
    return alert("Passwords do not match.");
  }

  // ─── 1) Check for existing user ───────────────────────────
  let userExists = false;
  try {
    const res = await fetch(
      `${apiUrl}/login?username=${encodeURIComponent(username)}`
    );

    if (res.ok) {
      const matches = await res.json();
      if (matches.length > 0) {
        userExists = true;
        alert("Username already exists. Please choose another.");
      }
    } else if (res.status !== 404) {
      // only treat non-404 as a real error
      throw new Error(`Status ${res.status} when checking user`);
    }
    // 404 → assume “no user” and fall through
  } catch (err) {
    console.error("Error during existence check:", err);
    // you could alert here if you want—but we’ll assume “no user” and try create
  }

  if (userExists) return;

  // ─── 2) Create new user ────────────────────────────────
  try {
    const createRes = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ username, password }),
    });
    if (!createRes.ok) {
      throw new Error(`Registration failed (status ${createRes.status})`);
    }
    const created = await createRes.json();
    console.log("✅ Created user:", created);
    alert("Account created! Redirecting to login…");
    window.location.href = "./login.html";
  } catch (err) {
    console.error("Error creating user:", err);
    alert("An error occurred. See console for details.");
  }
});
