(function () {
  const tbody = document.getElementById("tbody");
  const status = document.getElementById("status");
  const table = document.querySelector(".payments-table");

  function setStatus(text, isError) {
    status.textContent = text;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function formatAmount(n) {
    if (typeof n !== "number" || Number.isNaN(n)) {
      return "—";
    }
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function formatDate(d) {
    if (!d) return "—";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
  }

  function renderRows(payments) {
    tbody.replaceChildren();
    const frag = document.createDocumentFragment();
    for (const p of payments) {
      const tr = document.createElement("tr");
      const studentName = p.student?.name ?? "—";
      const courseName = p.course?.courseName ?? "—";
      tr.innerHTML = `
        <td>${escapeHtml(studentName)}</td>
        <td>${escapeHtml(courseName)}</td>
        <td>${escapeHtml(formatAmount(p.amount))}</td>
        <td>${escapeHtml(formatDate(p.paidAt))}</td>
      `;
      frag.appendChild(tr);
    }
    tbody.appendChild(frag);
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  async function load() {
    setStatus("Loading…", false);
    table.classList.remove("is-hidden");

    try {
      const res = await fetch("/api/payments", { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.href = "/login.html";
        return;
      }
      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data?.error === "string" ? data.error : "Could not load payments.";
        setStatus(msg, true);
        table.classList.add("is-hidden");
        return;
      }

      if (!Array.isArray(data)) {
        setStatus("Unexpected response.", true);
        table.classList.add("is-hidden");
        return;
      }

      if (data.length === 0) {
        setStatus("No payments yet.");
        renderRows([]);
        return;
      }

      setStatus(`${data.length} payment${data.length === 1 ? "" : "s"}.`);
      renderRows(data);
    } catch {
      setStatus("Network error. Is the server running?", true);
      table.classList.add("is-hidden");
    }
  }

  load();
})();
