(function () {
  const form = document.getElementById("teacher-login-form");
  const statusEl = document.getElementById("login-status");

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", kind === "error");
    statusEl.classList.toggle("is-success", kind === "success");
  }

  async function checkAlreadyLoggedIn() {
    try {
      const res = await fetch("/api/teacher/me", { credentials: "same-origin" });
      if (res.ok) {
        window.location.href = "/";
      }
    } catch {
      // Ignore connectivity checks here and let user attempt login.
    }
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");

    const username = form.username?.value?.trim() ?? "";
    const password = form.password?.value ?? "";

    if (!username || !password) {
      setStatus("Username and password are required.", "error");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setStatus("Signing you in...");

    try {
      const res = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Login failed.";
        setStatus(msg, "error");
        return;
      }
      setStatus("Login successful. Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "/";
      }, 400);
    } catch {
      setStatus("Network error. Is the server running?", "error");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  checkAlreadyLoggedIn();
})();
