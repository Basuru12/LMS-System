(function () {
  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function initials(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return "T";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async function loadTeacherSession() {
    try {
      const res = await fetch("/api/teacher/me", { credentials: "same-origin" });
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      const teacher = data?.teacher;
      if (!teacher || typeof teacher !== "object") return null;
      const id = teacher.id ?? teacher._id ?? "";
      const name = teacher.name ?? "";
      const image = teacher.profileImage ?? teacher.avatar ?? teacher.image ?? "";
      if (!id || !name) return null;
      return { id: String(id), name: String(name), image: String(image || "") };
    } catch {
      return null;
    }
  }

  function setHidden(id, hidden) {
    const element = document.getElementById(id);
    if (element) element.hidden = hidden;
  }

  function isVisible(id) {
    const element = document.getElementById(id);
    return Boolean(element && !element.hidden);
  }

  async function initAuthNav() {
    const teacher = await loadTeacherSession();
    const isLoggedIn = Boolean(teacher);

    setHidden("add-courses-link", !isLoggedIn);
    setHidden("course-list-link", !isLoggedIn);
    setHidden("payments-link", !isLoggedIn);
    setHidden("login-link", isLoggedIn);

    // Show separators only when both neighboring links are visible.
    setHidden("nav-sep-1", !(isVisible("add-courses-link") && isVisible("login-link")));
    setHidden(
      "nav-sep-2",
      !(
        isVisible("course-list-link") &&
        (isVisible("login-link") || isVisible("add-courses-link"))
      )
    );
    setHidden("nav-sep-3", !(isVisible("course-list-link") && isVisible("payments-link")));

    const accountCta = document.getElementById("account-cta");
    if (!accountCta || !teacher) return;

    const safeName = escapeHtml(teacher.name);
    const safeImage = escapeAttr(teacher.image);
    const avatarMarkup = safeImage
      ? `<img class="teacher-avatar" src="${safeImage}" alt="${safeName}" />`
      : `<span class="teacher-avatar" aria-hidden="true">${escapeHtml(initials(teacher.name))}</span>`;

    accountCta.classList.remove("btn-primary");
    accountCta.classList.add("teacher-profile-chip");
    accountCta.href = "/dashboard.html";
    accountCta.setAttribute("aria-label", `${teacher.name} profile`);
    accountCta.innerHTML = `${avatarMarkup}<span>${safeName}</span>`;
  }

  window.initAuthNav = initAuthNav;
  initAuthNav();
})();
