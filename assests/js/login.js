// login.js
const apiUrl = "https://68243c9365ba0580339965d9.mockapi.io";
const usernameInput = document.getElementById("li-username");
const passwordInput = document.getElementById("li-password");
const submitButton = document.getElementById("li-submit");

submitButton.addEventListener("click", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    return alert("Please enter both username and password.");
  }

  try {
    // 1️⃣ Fetch user by username
    const url = `${apiUrl}/login?username=${encodeURIComponent(username)}`;
    console.log("🔍 GET", url);
    const res = await fetch(url);

    console.log("→ status:", res.status);
    if (!res.ok) {
      throw new Error(`Server error (${res.status})`);
    }

    const users = await res.json();
    console.log("→ users array:", users);

    // 2️⃣ Does the user exist?
    if (users.length === 0) {
      return alert("User not found. Please sign up first.");
    }

    const userRecord = users[0];

    // 3️⃣ Check password
    if (userRecord.password !== password) {
      return alert("Incorrect password.");
    }

    // 4️⃣ Success!
    // Save username to localStorage:
    localStorage.setItem("username", username);
    localStorage.setItem("userId", userRecord.id);

    alert("Login successful!");
    window.location.href = "./index.html";
  } catch (err) {
    console.error("Login error:", err);
    alert("An error occurred. Check console for details.");
  }
});
