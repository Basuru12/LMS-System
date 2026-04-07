(function () {
  const trigger = document.getElementById("user-menu-trigger");
  const dropdown = document.getElementById("user-menu-dropdown");
  const tbody = document.getElementById("enrollments-tbody");
  const statusEl = document.getElementById("enrollments-status");
  const greetingEl = document.querySelector(".dash-user-greeting");
  const logoutLink = dropdown?.querySelector('a[role="menuitem"]:last-child') ?? null;

  function closeUserMenu() {
    if (!dropdown || !trigger) return;
    dropdown.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function toggleUserMenu() {
    if (!dropdown || !trigger) return;
    const open = dropdown.hidden;
    dropdown.hidden = !open;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  if (trigger && dropdown) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleUserMenu();
    });
    document.addEventListener("click", () => closeUserMenu());
    dropdown.addEventListener("click", (e) => e.stopPropagation());
  }

  function initials(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function avatarHue(seed) {
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return h % 360;
  }

  function formatEnrollDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const day = d.getDate();
    const mon = d.toLocaleString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${mon}, ${year}`;
  }

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", kind === "error");
  }

  function renderRows(rows) {
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!rows.length) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        '<td colspan="4" class="enrollments-empty">No students enrolled yet.</td>';
      tbody.appendChild(tr);
      return;
    }
    rows.forEach((row, i) => {
      const tr = document.createElement("tr");
      const hue = avatarHue(row.studentId || row.studentName || String(i));
      const ini = initials(row.studentName);
      tr.innerHTML = `
        <td class="col-num">${i + 1}</td>
        <td class="cell-student">
          <div class="student-cell">
            <span class="student-avatar" style="background: linear-gradient(135deg, hsl(${hue}, 55%, 52%) 0%, hsl(${(hue + 40) % 360}, 60%, 48%) 100%)">${ini}</span>
            <span>${escapeHtml(row.studentName)}</span>
          </div>
        </td>
        <td class="cell-course">${escapeHtml(row.courseTitle)}</td>
        <td class="cell-date">${escapeHtml(formatEnrollDate(row.enrolledAt))}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function loadCurrentTeacher() {
    try {
      const res = await fetch("/api/teacher/me", { credentials: "same-origin" });
      if (!res.ok) {
        window.location.href = "/login.html";
        return null;
      }
      const data = await res.json();
      if (greetingEl && data?.teacher?.name) {
        greetingEl.textContent = `Hi ${data.teacher.name}`;
      }
      return data?.teacher ?? null;
    } catch {
      window.location.href = "/login.html";
      return null;
    }
  }

  async function load() {
    setStatus("Loading…");
    try {
      const res = await fetch("/api/enrollments", { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.href = "/login.html";
        return;
      }
      if (!res.ok) throw new Error("Request failed");
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error("Invalid response");
      setStatus("");
      renderRows(rows);
    } catch {
      setStatus("Could not load enrollments.", "error");
      if (tbody) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="enrollments-empty">Unable to load enrollment data.</td></tr>';
      }
    }
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await fetch("/api/teacher/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      } finally {
        window.location.href = "/login.html";
      }
    });
  }

  (async function init() {
    const teacher = await loadCurrentTeacher();
    if (!teacher) return;
    load();
  })();
})();
