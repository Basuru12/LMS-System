(function () {
  const trigger = document.getElementById("user-menu-trigger");
  const dropdown = document.getElementById("user-menu-dropdown");
  const statusEl = document.getElementById("dashboard-status");
  const tbody = document.getElementById("dashboard-enrollments-tbody");
  const enrollmentsMetric = document.getElementById("metric-enrollments");
  const coursesMetric = document.getElementById("metric-courses");
  const earningsMetric = document.getElementById("metric-earnings");

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", kind === "error");
  }

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

  function formatMoney(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.getDate()} ${d.toLocaleString("en-GB", { month: "short" })}, ${d.getFullYear()}`;
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
    const s = String(seed || "");
    for (let i = 0; i < s.length; i += 1) {
      h = (h * 31 + s.charCodeAt(i)) >>> 0;
    }
    return h % 360;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderMetrics(summary) {
    if (enrollmentsMetric) enrollmentsMetric.textContent = String(summary.totalEnrollments ?? 0);
    if (coursesMetric) coursesMetric.textContent = String(summary.totalCourses ?? 0);
    if (earningsMetric) earningsMetric.textContent = formatMoney(summary.totalEarnings ?? 0);
  }

  function renderRows(rows) {
    if (!tbody) return;
    tbody.innerHTML = "";
    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="dashboard-empty">No enrollments yet.</td></tr>';
      return;
    }

    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      const hue = avatarHue(row.studentId || row.studentName || index);
      tr.innerHTML = `
        <td class="col-num">${index + 1}</td>
        <td class="cell-student">
          <div class="dashboard-student-cell">
            <span class="dashboard-student-avatar" style="background: linear-gradient(135deg, hsl(${hue}, 55%, 52%) 0%, hsl(${(hue + 40) % 360}, 60%, 48%) 100%)">${escapeHtml(initials(row.studentName))}</span>
            <span>${escapeHtml(row.studentName || "")}</span>
          </div>
        </td>
        <td class="cell-course">${escapeHtml(row.courseTitle || "")}</td>
        <td class="cell-date">${escapeHtml(formatDate(row.enrolledAt))}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  async function loadDashboard() {
    setStatus("Loading...");
    try {
      const res = await fetch("/api/instructor-dashboard");
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      renderMetrics(data?.summary ?? {});
      renderRows(data?.latestEnrollments ?? []);
      setStatus("");
    } catch {
      renderMetrics({ totalEnrollments: 0, totalCourses: 0, totalEarnings: 0 });
      renderRows([]);
      setStatus("Could not load instructor dashboard data.", "error");
    }
  }

  loadDashboard();
})();
