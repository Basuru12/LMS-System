(function () {
  const INITIAL_COUNT = 4;
  const PLACEHOLDER_RATING = "4.8";

  const grid = document.getElementById("course-grid");
  const statusEl = document.getElementById("course-status");
  const toggleBtn = document.getElementById("toggle-courses");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("course-search");
  const newsletterForm = document.getElementById("newsletter-form");

  let allCourses = [];
  let filteredCourses = [];
  let expanded = false;

  function courseId(course) {
    const id = course._id;
    if (id && typeof id === "object" && id.toString) return String(id);
    return String(id ?? "course");
  }

  function thumbSrc(course) {
    const seed = encodeURIComponent(courseId(course));
    return `https://picsum.photos/seed/${seed}/400/250`;
  }

  function formatPrice(fee) {
    if (typeof fee !== "number" || Number.isNaN(fee)) return "—";
    return `$${fee.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function setStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", Boolean(isError));
  }

  function applyFilter(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      filteredCourses = allCourses.slice();
    } else {
      filteredCourses = allCourses.filter((c) =>
        (c.courseName || "").toLowerCase().includes(q)
      );
    }
    expanded = false;
    render();
  }

  function render() {
    const list = expanded
      ? filteredCourses
      : filteredCourses.slice(0, INITIAL_COUNT);
    const hasMore = filteredCourses.length > INITIAL_COUNT;

    grid.replaceChildren();
    const frag = document.createDocumentFragment();

    for (const course of list) {
      const title = course.courseName || "Untitled course";
      const instructor = course.teacher?.name ?? "Instructor";
      const link = document.createElement("a");
      link.className = "course-card";
      link.href = `/course.html?id=${encodeURIComponent(courseId(course))}`;
      link.innerHTML = `
        <img class="course-card-thumb" src="${escapeHtml(
          thumbSrc(course)
        )}" alt="" width="400" height="250" loading="lazy" />
        <div class="course-card-body">
          <h3>${escapeHtml(title)}</h3>
          <p class="instructor">${escapeHtml(instructor)}</p>
          <div class="course-meta">
            <span class="rating">
              <span class="stars" aria-hidden="true">★★★★★</span>
              ${escapeHtml(PLACEHOLDER_RATING)}
            </span>
            <span class="price">${escapeHtml(formatPrice(course.fee))}</span>
          </div>
        </div>
      `;
      frag.appendChild(link);
    }

    grid.appendChild(frag);

    if (toggleBtn) {
      toggleBtn.hidden = !hasMore;
      toggleBtn.textContent = expanded ? "Show less" : "Show all courses";
    }

    if (filteredCourses.length === 0 && allCourses.length > 0) {
      setStatus("No courses match your search.");
    } else if (allCourses.length === 0) {
      setStatus("No courses yet.");
    } else if (!expanded && hasMore) {
      setStatus(`Showing ${list.length} of ${filteredCourses.length} courses.`);
    } else {
      const n = filteredCourses.length;
      setStatus(`${n} course${n === 1 ? "" : "s"}.`);
    }
  }

  async function load() {
    setStatus("Loading courses…", false);
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data?.error === "string" ? data.error : "Could not load courses.";
        setStatus(msg, true);
        grid.replaceChildren();
        if (toggleBtn) toggleBtn.hidden = true;
        return;
      }

      if (!Array.isArray(data)) {
        setStatus("Unexpected response.", true);
        grid.replaceChildren();
        if (toggleBtn) toggleBtn.hidden = true;
        return;
      }

      allCourses = data;
      applyFilter(searchInput?.value || "");
    } catch {
      setStatus("Network error. Is the server running?", true);
      grid.replaceChildren();
      if (toggleBtn) toggleBtn.hidden = true;
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      expanded = !expanded;
      render();
    });
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFilter(searchInput.value);
      document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
    });

    searchInput.addEventListener("input", () => {
      applyFilter(searchInput.value);
    });
  }

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      newsletterForm.reset();
    });
  }

  load();
})();
