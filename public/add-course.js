(function () {
  const trigger = document.getElementById("user-menu-trigger");
  const dropdown = document.getElementById("user-menu-dropdown");
  const form = document.getElementById("add-course-form");
  const statusEl = document.getElementById("add-course-status");
  const teacherSelect = document.getElementById("course-teacher");
  const thumbInput = document.getElementById("course-thumbnail-file");
  const thumbBtn = document.getElementById("thumb-upload-btn");
  const thumbPreview = document.getElementById("thumb-preview");
  const thumbUrlInput = document.getElementById("course-thumbnail-url");

  let thumbnailDataUrl = "";

  function setStatus(text, kind) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", kind === "error");
    statusEl.classList.toggle("is-success", kind === "success");
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

  if (thumbBtn && thumbInput) {
    thumbBtn.addEventListener("click", () => thumbInput.click());
  }

  if (thumbInput && thumbPreview) {
    thumbInput.addEventListener("change", () => {
      const file = thumbInput.files?.[0];
      thumbnailDataUrl = "";
      if (!file || !file.type.startsWith("image/")) {
        thumbPreview.hidden = true;
        thumbPreview.removeAttribute("src");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        thumbnailDataUrl = result;
        thumbPreview.src = result;
        thumbPreview.hidden = false;
      };
      reader.readAsDataURL(file);
    });
  }

  if (thumbUrlInput) {
    thumbUrlInput.addEventListener("input", () => {
      if (thumbUrlInput.value.trim()) {
        thumbnailDataUrl = "";
        if (thumbInput) thumbInput.value = "";
        if (thumbPreview) {
          thumbPreview.hidden = true;
          thumbPreview.removeAttribute("src");
        }
      }
    });
  }

  async function loadTeachers() {
    if (!teacherSelect) return;
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Could not load teachers.";
        setStatus(msg, "error");
        return;
      }
      if (!Array.isArray(data) || data.length === 0) {
        setStatus("No teachers found. Seed the database or add a teacher first.", "error");
        return;
      }
      const frag = document.createDocumentFragment();
      for (const t of data) {
        const id = t._id != null ? String(t._id) : "";
        if (!id) continue;
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = t.name || "Teacher";
        frag.appendChild(opt);
      }
      teacherSelect.appendChild(frag);
      setStatus("");
    } catch {
      setStatus("Network error loading teachers.", "error");
    }
  }

  function buildThumbnailUrl() {
    if (thumbnailDataUrl) return thumbnailDataUrl;
    const url = thumbUrlInput?.value?.trim() ?? "";
    return url;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("");

      const courseName = document.getElementById("course-title")?.value?.trim() ?? "";
      if (courseName.length < 2) {
        setStatus("Course title must be at least 2 characters.", "error");
        return;
      }

      const feeRaw = document.getElementById("course-price")?.value ?? "";
      const fee = Number(feeRaw);
      if (!Number.isFinite(fee) || fee < 0) {
        setStatus("Enter a valid non-negative price.", "error");
        return;
      }

      const teacher = teacherSelect?.value ?? "";
      if (!teacher) {
        setStatus("Select an instructor.", "error");
        return;
      }

      const structure = document.getElementById("course-headings")?.value?.trim() ?? "";
      const description = document.getElementById("course-description")?.value?.trim() ?? "";
      const thumbnailUrl = buildThumbnailUrl();

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      setStatus("Saving…");

      try {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseName,
            fee,
            teacher,
            structure,
            description,
            thumbnailUrl,
          }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = typeof data?.error === "string" ? data.error : "Could not create course.";
          setStatus(msg, "error");
          return;
        }

        setStatus("Course created successfully.", "success");
        form.reset();
        thumbnailDataUrl = "";
        if (thumbPreview) {
          thumbPreview.hidden = true;
          thumbPreview.removeAttribute("src");
        }
        if (thumbInput) thumbInput.value = "";

        setTimeout(() => {
          window.location.href = "/courses.html";
        }, 900);
      } catch {
        setStatus("Network error. Is the server running?", "error");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  loadTeachers();
})();
