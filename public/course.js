(function () {
  const MOCK_SUBTITLE =
    "Master MERN Stack by building a Full Stack AI Text to Image SaaS App using React js, Mongodb, Node js, Express js and Stripe Payment";

  const STRUCTURE_SUMMARY =
    "22 sections · 54 lectures · 27h 25m total duration";

  const DESCRIPTION_PARAS = [
    "This course takes you from zero to a production-ready SaaS: authentication, payments, AI integrations, and deployment. You will work through real features used by modern products so you can ship with confidence.",
    "JavaScript remains the backbone of the web and full-stack tooling. By combining React on the client with Node and Express on the server—and MongoDB for data—you gain a transferable skill set for startups, agencies, and your own products.",
  ];

  const PLAY_SVG =
    '<svg class="lesson-play" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1.5"/><path fill="currentColor" d="M10 8.5v7l6-3.5-6-3.5z"/></svg>';

  const CURRICULUM = [
    {
      id: "sec-intro",
      title: "Project Introduction",
      summaryRight: "3 lectures · 35 min",
      expanded: true,
      lessons: [
        {
          title: "App Overview - Build Text-to-Image SaaS",
          duration: "10 mins",
        },
        { title: "Tech Stack and Architecture", duration: "12 mins" },
        { title: "Project Goals and Milestones", duration: "13 mins" },
      ],
    },
    {
      id: "sec-setup",
      title: "Project Setup and configuration",
      summaryRight: "4 lectures · 48 min",
      expanded: true,
      lessons: [
        { title: "Repository and Environment Setup", duration: "14 mins" },
        { title: "Environment Variables and Secrets", duration: "11 mins" },
        { title: "Linting and Git Workflow", duration: "12 mins" },
        { title: "First Run and Health Check", duration: "11 mins" },
      ],
    },
    {
      id: "sec-tailwind",
      title: "Tailwind Setup",
      summaryRight: "5 lectures · 1h 10m",
      expanded: false,
      lessons: [],
    },
    {
      id: "sec-frontend",
      title: "Frontend Project",
      summaryRight: "6 lectures · 4h 20m",
      expanded: false,
      lessons: [],
    },
    {
      id: "sec-backend",
      title: "Backend Project",
      summaryRight: "4 lectures · 3h 05m",
      expanded: false,
      lessons: [],
    },
    {
      id: "sec-payment",
      title: "Payment Integration",
      summaryRight: "3 lectures · 2h 15m",
      expanded: false,
      lessons: [],
    },
    {
      id: "sec-deploy",
      title: "Project Deployment",
      summaryRight: "2 lectures · 1h 30m",
      expanded: false,
      lessons: [],
    },
  ];

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("id");

  const pageStatus = document.getElementById("page-status");
  const courseRoot = document.getElementById("course-root");
  const titleEl = document.getElementById("course-title");
  const subtitleEl = document.getElementById("course-subtitle");
  const studentCountEl = document.getElementById("student-count");
  const instructorLink = document.getElementById("instructor-link");
  const structureSummaryEl = document.getElementById("structure-summary");
  const accordionEl = document.getElementById("accordion");
  const descriptionEl = document.getElementById("course-description");
  const priceCurrentEl = document.getElementById("price-current");
  const priceListEl = document.getElementById("price-list");
  const enrollBtn = document.getElementById("enroll-btn");
  const newsletterForm = document.getElementById("newsletter-form");

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function formatPrice(fee) {
    if (typeof fee !== "number" || Number.isNaN(fee)) {
      return "$—";
    }
    return `$${fee.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function setPageStatus(text, isError) {
    if (!pageStatus) return;
    pageStatus.textContent = text;
    pageStatus.hidden = !text;
    pageStatus.classList.toggle("is-error", Boolean(isError));
  }

  function renderDescription() {
    if (!descriptionEl) return;
    descriptionEl.innerHTML = DESCRIPTION_PARAS.map(
      (p) => `<p>${escapeHtml(p)}</p>`
    ).join("");
  }

  function renderAccordion() {
    if (!accordionEl) return;
    const frag = document.createDocumentFragment();
    for (const section of CURRICULUM) {
      const panelId = `panel-${section.id}`;
      const btnId = `acc-${section.id}`;
      const item = document.createElement("div");
      item.className = `accordion-item${section.expanded ? " is-open" : ""}`;

      const lessonsHtml =
        section.lessons.length > 0
          ? `<ul class="lesson-list">${section.lessons
              .map(
                (l) => `<li>
            ${PLAY_SVG}
            <span class="lesson-title">${escapeHtml(l.title)}</span>
            <span class="lesson-duration">${escapeHtml(l.duration)}</span>
          </li>`
              )
              .join("")}</ul>`
          : "";

      item.innerHTML = `
        <button type="button" class="accordion-trigger" id="${escapeHtml(btnId)}" aria-expanded="${section.expanded}" aria-controls="${escapeHtml(panelId)}">
          <span class="chevron" aria-hidden="true">▼</span>
          <span class="acc-title">${escapeHtml(section.title)}</span>
          <span class="acc-meta">${escapeHtml(section.summaryRight)}</span>
        </button>
        <div class="accordion-panel" id="${escapeHtml(panelId)}" role="region" aria-labelledby="${escapeHtml(btnId)}" ${section.expanded ? "" : "hidden"}>
          ${lessonsHtml}
        </div>
      `;
      frag.appendChild(item);
    }
    accordionEl.replaceChildren(frag);

    accordionEl.addEventListener("click", (e) => {
      const trigger = e.target.closest(".accordion-trigger");
      if (!trigger || !accordionEl.contains(trigger)) return;
      const item = trigger.closest(".accordion-item");
      const panel = item?.querySelector(".accordion-panel");
      if (!item || !panel) return;

      const open = trigger.getAttribute("aria-expanded") === "true";
      trigger.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
      item.classList.toggle("is-open", !open);
    });
  }

  function applyCourse(course) {
    const name = course.courseName || "Course";
    document.title = `${name} — Edemy`;
    titleEl.textContent = name;
    subtitleEl.textContent = MOCK_SUBTITLE;

    const students = Array.isArray(course.students) ? course.students.length : 0;
    studentCountEl.textContent =
      students === 1 ? "1 student" : `${students} students`;

    const teacherName = course.teacher?.name ?? "Instructor";
    instructorLink.textContent = `Course by ${teacherName}`;

    const fee = course.fee;
    priceCurrentEl.textContent = formatPrice(fee);
    if (typeof fee === "number" && !Number.isNaN(fee) && fee > 0) {
      const list = Math.round(fee * 2 * 100) / 100;
      priceListEl.textContent = formatPrice(list);
    } else {
      priceListEl.textContent = "$19.99";
    }

    enrollBtn.href = "/payments.html";
  }

  async function load() {
    renderDescription();
    renderAccordion();
    structureSummaryEl.textContent = STRUCTURE_SUMMARY;

    if (!courseId) {
      setPageStatus("Missing course. Open this page from the course catalog.", true);
      courseRoot.hidden = true;
      return;
    }

    setPageStatus("Loading course…", false);
    courseRoot.hidden = true;

    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}`);
      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data?.error === "string" ? data.error : "Could not load course.";
        setPageStatus(msg, true);
        courseRoot.hidden = true;
        return;
      }

      setPageStatus("", false);
      courseRoot.hidden = false;
      applyCourse(data);
    } catch {
      setPageStatus("Network error. Is the server running?", true);
      courseRoot.hidden = true;
    }
  }

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      newsletterForm.reset();
    });
  }

  load();
})();
