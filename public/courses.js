(function () {
  const PAGE_SIZE = 12;
  const PLACEHOLDER_RATING = "4.5";
  const PLACEHOLDER_REVIEWS = "122";

  const grid = document.getElementById("course-list-grid");
  const statusEl = document.getElementById("course-list-status");
  const loadMoreBtn = document.getElementById("course-list-load-more");
  const searchForm = document.getElementById("course-list-search-form");
  const searchInput = document.getElementById("course-list-search-input");
  const newsletterForm = document.getElementById("newsletter-form");

  let allCourses = [];
  let filteredCourses = [];
  let visibleCount = PAGE_SIZE;

  function courseId(course) {
    const id = course._id;
    if (id && typeof id === "object" && id.toString) return String(id);
    return String(id ?? "course");
  }

  function thumbSrc(course) {
    const raw = course.thumbnailUrl;
    if (typeof raw === "string") {
      const u = raw.trim();
      if (
        u.startsWith("https://") ||
        u.startsWith("http://") ||
        u.startsWith("data:image/")
      ) {
        return u;
      }
    }
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
    if (!statusEl) return;
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
    visibleCount = PAGE_SIZE;
    render();
  }

  function render() {
    if (!grid) return;

    const slice = filteredCourses.slice(0, visibleCount);
    const hasMore = filteredCourses.length > visibleCount;

    grid.replaceChildren();
    const frag = document.createDocumentFragment();

    for (const course of slice) {
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
          <div class="course-card-rating-row">
            <span class="rating-value">${escapeHtml(PLACEHOLDER_RATING)}</span>
            <span class="stars" aria-hidden="true">★★★★★</span>
            <span class="review-count">(${escapeHtml(PLACEHOLDER_REVIEWS)})</span>
          </div>
          <p class="course-card-price">${escapeHtml(formatPrice(course.fee))}</p>
        </div>
      `;
      frag.appendChild(link);
    }

    grid.appendChild(frag);

    if (loadMoreBtn) {
      loadMoreBtn.hidden = !hasMore;
    }

    if (filteredCourses.length === 0 && allCourses.length > 0) {
      setStatus("No courses match your search.");
    } else if (allCourses.length === 0) {
      setStatus("No courses yet.");
    } else if (hasMore) {
      setStatus(
        `Showing ${slice.length} of ${filteredCourses.length} course${
          filteredCourses.length === 1 ? "" : "s"
        }.`
      );
    } else {
      const n = filteredCourses.length;
      setStatus(`${n} course${n === 1 ? "" : "s"}.`);
    }
  }

  async function load() {
    setStatus("Loading courses…", false);
    if (loadMoreBtn) loadMoreBtn.hidden = true;
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data?.error === "string" ? data.error : "Could not load courses.";
        setStatus(msg, true);
        grid.replaceChildren();
        return;
      }

      if (!Array.isArray(data)) {
        setStatus("Unexpected response.", true);
        grid.replaceChildren();
        return;
      }

      allCourses = data;
      applyFilter(searchInput?.value || "");
    } catch {
      setStatus("Network error. Is the server running?", true);
      grid.replaceChildren();
    }
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      render();
    });
  }

  if (searchForm && searchInput) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFilter(searchInput.value);
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
