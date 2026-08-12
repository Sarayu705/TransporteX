"use strict";

/* ---------------------------------- */
/* Mobile navigation                   */
/* ---------------------------------- */
const navbar = document.querySelector("[data-navbar]");
const navTogglers = document.querySelectorAll("[data-nav-toggler]");
const overlay = document.querySelector("[data-overlay]");

const toggleNav = () => {
  navbar.classList.toggle("active");
  overlay.classList.toggle("active");
  document.body.style.overflow = navbar.classList.contains("active") ? "hidden" : "";
};

navTogglers.forEach((btn) => btn.addEventListener("click", toggleNav));

document.querySelectorAll("[data-nav-link]").forEach((link) => {
  link.addEventListener("click", () => {
    if (navbar.classList.contains("active")) toggleNav();
  });
});

/* ---------------------------------- */
/* Header shadow + back-to-top button  */
/* ---------------------------------- */
const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

window.addEventListener("scroll", () => {
  const scrolled = window.scrollY > 80;
  header.classList.toggle("scrolled", scrolled);
  backTopBtn.classList.toggle("active", window.scrollY > 400);
});

/* ---------------------------------- */
/* Helpers                             */
/* ---------------------------------- */
function setMsg(el, text, state) {
  el.textContent = text;
  if (state) el.setAttribute("data-state", state);
  else el.removeAttribute("data-state");
}

function setButtonLoading(btn, isLoading, loadingText) {
  if (isLoading) {
    btn.dataset.originalText = btn.dataset.originalText || btn.textContent;
    btn.textContent = loadingText || "Sending…";
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
  }
}

/* ---------------------------------- */
/* Shipment tracking widget            */
/* ---------------------------------- */
const trackForm = document.getElementById("trackForm");
const trackingInput = document.getElementById("trackingInput");
const manifestId = document.getElementById("manifestId");
const manifestMsg = document.getElementById("manifestMsg");
const manifestResult = document.getElementById("manifestResult");
const manifestTimeline = document.getElementById("manifestTimeline");

document.querySelectorAll(".manifest-sample").forEach((btn) => {
  btn.addEventListener("click", () => {
    trackingInput.value = btn.dataset.sample;
    trackForm.requestSubmit();
  });
});

async function handleTrack(trackingId) {
  setMsg(manifestMsg, "Looking up shipment…");
  manifestResult.hidden = true;

  try {
    const data = await TransportexAPI.trackShipment(trackingId);

    manifestId.textContent = data.trackingId;
    document.getElementById("resultRoute").textContent = `${data.origin} → ${data.destination}`;
    document.getElementById("resultService").textContent = data.serviceType;
    document.getElementById("resultStatus").textContent = data.status;
    document.getElementById("resultEta").textContent = data.eta || "—";

    manifestTimeline.innerHTML = "";
    data.events.forEach((event) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="timeline-status">${event.status} — ${event.location}</span>
        <span class="timeline-meta">${event.occurred_at}${event.note ? " · " + event.note : ""}</span>
      `;
      manifestTimeline.appendChild(li);
    });

    manifestResult.hidden = false;
    setMsg(manifestMsg, "Shipment found.", "ok");
  } catch (err) {
    setMsg(
      manifestMsg,
      err.message.includes("fetch") || err.message.includes("Failed")
        ? "Couldn't reach the tracking service. Is the backend running?"
        : err.message,
      "error"
    );
  }
}

if (trackForm) {
  trackForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = trackingInput.value.trim();
    if (!id) {
      setMsg(manifestMsg, "Enter a tracking ID first.", "error");
      return;
    }
    handleTrack(id);
  });

  // Support links like index.html?track=TPX-48213-IN#track (used by the
  // "My shipments" list) that should track a shipment automatically.
  const preselected = new URLSearchParams(window.location.search).get("track");
  if (preselected) {
    trackingInput.value = preselected;
    handleTrack(preselected);
  }
}

/* ---------------------------------- */
/* Quote form                          */
/* ---------------------------------- */
const quoteForm = document.getElementById("quoteForm");
const quoteMsg = document.getElementById("quoteMsg");

if (quoteForm) {
  quoteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = quoteForm.querySelector(".form-submit");
    const payload = {
      name: quoteForm.name.value.trim(),
      email: quoteForm.email.value.trim(),
      phone: quoteForm.phone.value.trim(),
      serviceType: quoteForm.serviceType.value,
      origin: quoteForm.origin.value.trim(),
      destination: quoteForm.destination.value.trim(),
      cargoDetails: quoteForm.cargoDetails.value.trim(),
    };

    setButtonLoading(submitBtn, true, "Sending…");
    setMsg(quoteMsg, "");

    try {
      const res = await TransportexAPI.submitQuote(payload);
      setMsg(quoteMsg, res.message, "ok");
      quoteForm.reset();
    } catch (err) {
      setMsg(quoteMsg, err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ---------------------------------- */
/* Contact form                        */
/* ---------------------------------- */
const contactForm = document.getElementById("contactForm");
const contactMsg = document.getElementById("contactMsg");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector(".form-submit");
    const payload = {
      name: contactForm.name.value.trim(),
      email: contactForm.email.value.trim(),
      subject: contactForm.subject.value.trim(),
      message: contactForm.message.value.trim(),
    };

    setButtonLoading(submitBtn, true, "Sending…");
    setMsg(contactMsg, "");

    try {
      const res = await TransportexAPI.submitContact(payload);
      setMsg(contactMsg, res.message, "ok");
      contactForm.reset();
    } catch (err) {
      setMsg(contactMsg, err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ---------------------------------- */
/* Newsletter form                     */
/* ---------------------------------- */
const newsletterForm = document.getElementById("newsletterForm");
const newsletterMsg = document.getElementById("newsletterMsg");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = newsletterForm.querySelector(".newsletter-btn");
    const email = document.getElementById("newsletterEmail").value.trim();

    setButtonLoading(submitBtn, true, "Subscribing…");
    setMsg(newsletterMsg, "");

    try {
      const res = await TransportexAPI.subscribeNewsletter(email);
      setMsg(newsletterMsg, res.message, "ok");
      newsletterForm.reset();
    } catch (err) {
      setMsg(newsletterMsg, err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ---------------------------------- */
/* Shipment request page              */
/* ---------------------------------- */
const shipmentForm = document.getElementById("shipmentForm");
const shipmentMsg = document.getElementById("shipmentMsg");
const shipmentResult = document.getElementById("shipmentResult");
const shipmentLoginBanner = document.getElementById("shipmentLoginBanner");

if (shipmentLoginBanner) {
  const session = getSession();
  if (!session) {
    shipmentLoginBanner.hidden = false;
    shipmentLoginBanner.setAttribute("data-state", "error");
    shipmentLoginBanner.innerHTML = `You're not logged in — this shipment won't be saved to an account.
      <a href="./login.html" class="btn-link" style="margin-left:6px;">Log in</a> to track everything you book.`;
  } else {
    shipmentLoginBanner.hidden = false;
    shipmentLoginBanner.setAttribute("data-state", "ok");
    shipmentLoginBanner.textContent = `Booking as ${session.user.username} — this will show up in "My shipments" below.`;
  }
}

if (shipmentForm) {
  shipmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = shipmentForm.querySelector(".form-submit");
    const token = getSession()?.token;

    const payload = {
      origin: shipmentForm.origin.value.trim(),
      destination: shipmentForm.destination.value.trim(),
      serviceType: shipmentForm.serviceType.value,
      weightKg: shipmentForm.weightKg.value ? Number(shipmentForm.weightKg.value) : null,
      eta: shipmentForm.eta.value || null,
    };

    setButtonLoading(submitBtn, true, "Creating…");
    setMsg(shipmentMsg, "");

    try {
      const res = await TransportexAPI.requestShipment(payload, token);
      setMsg(shipmentMsg, res.message, "ok");
      shipmentForm.reset();
      shipmentResult.value = res.shipment?.trackingId || "";
      loadMyShipments();
    } catch (err) {
      setMsg(shipmentMsg, err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ---------------------------------- */
/* My shipments (logged-in user)       */
/* ---------------------------------- */
const myShipmentsList = document.getElementById("myShipmentsList");
const myShipmentsMsg = document.getElementById("myShipmentsMsg");

async function loadMyShipments() {
  if (!myShipmentsList) return;

  const token = getSession()?.token;
  if (!token) {
    setMsg(myShipmentsMsg, "Log in to see the shipments linked to your account.", "error");
    myShipmentsList.innerHTML = `<a href="./login.html" class="btn btn-dark" style="justify-self:start;">Log in</a>`;
    return;
  }

  setMsg(myShipmentsMsg, "Loading your shipments…");
  myShipmentsList.innerHTML = "";

  try {
    const shipments = await TransportexAPI.getMyShipments(token);

    if (!shipments.length) {
      setMsg(myShipmentsMsg, "No shipments booked yet — create one above.", "ok");
      return;
    }

    setMsg(myShipmentsMsg, "");
    shipments.forEach((s) => {
      const card = document.createElement("div");
      card.className = "my-shipment-card";
      card.innerHTML = `
        <div>
          <div class="ms-id">${s.trackingId}</div>
          <div class="ms-route">${s.origin} → ${s.destination}</div>
          <div class="ms-meta">${s.serviceType}${s.eta ? " · ETA " + s.eta : ""}</div>
        </div>
        <span class="ms-status">${s.status}</span>
        <a class="btn-link" href="./index.html?track=${encodeURIComponent(s.trackingId)}#track">
          <span>Track</span><ion-icon name="chevron-forward"></ion-icon>
        </a>
      `;
      myShipmentsList.appendChild(card);
    });
  } catch (err) {
    setMsg(myShipmentsMsg, err.message, "error");
  }
}

loadMyShipments();


const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const registerForm = document.getElementById("registerForm");
const registerMsg = document.getElementById("registerMsg");
const alreadyLoggedInPanel = document.getElementById("alreadyLoggedIn");

function finishAuth(authData, successText) {
  saveSession(authData.token, authData.user);
  setMsg(loginMsg, successText, "ok");
  loginForm.reset();
  registerForm?.reset();

  if (authData.user?.role === "admin") {
    window.location.href = "./admin.html";
  } else {
    window.location.href = "./shipment.html";
  }
}

// If this tab already has a session, don't show the login/register forms —
// show who's logged in instead, with a way to switch accounts.
if (loginForm && alreadyLoggedInPanel) {
  const existing = getSession();
  if (existing) {
    loginForm.hidden = true;
    registerForm && (registerForm.hidden = true);
    const accountHref = existing.user.role === "admin" ? "./admin.html" : "./shipment.html";
    alreadyLoggedInPanel.hidden = false;
    alreadyLoggedInPanel.innerHTML = `
      <p class="section-text">
        You're already signed in as <strong>${existing.user.username}</strong> (${existing.user.role}) in this tab.
      </p>
      <div class="hero-actions">
        <a href="${accountHref}" class="btn btn-accent">Go to my account</a>
        <button type="button" id="switchAccountBtn" class="btn btn-ghost">Log in as someone else</button>
      </div>
    `;
    document.getElementById("switchAccountBtn")?.addEventListener("click", () => {
      clearSession();
      alreadyLoggedInPanel.hidden = true;
      loginForm.hidden = false;
      registerForm && (registerForm.hidden = false);
    });
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = loginForm.querySelector(".form-submit");
    const payload = {
      username: loginForm.username.value.trim(),
      password: loginForm.password.value,
    };

    setButtonLoading(submitBtn, true, "Signing in…");
    setMsg(loginMsg, "");

    try {
      const res = await TransportexAPI.login(payload);
      finishAuth(res, "Logged in successfully.");
    } catch (err) {
      setMsg(loginMsg, err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = registerForm.querySelector(".form-submit");
    const payload = {
      username: registerForm.username.value.trim(),
      email: registerForm.email.value.trim(),
      password: registerForm.password.value,
    };

    setButtonLoading(submitBtn, true, "Creating account…");
    setMsg(registerMsg, "");

    try {
      const res = await TransportexAPI.register(payload);
      setMsg(registerMsg, "Account created. You can now sign in.", "ok");
      registerForm.reset();
      loginForm.username.value = payload.username;
    } catch (err) {
      setMsg(registerMsg, err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

/* ---------------------------------- */
/* Admin dashboard                    */
/* ---------------------------------- */
const adminLoad = document.getElementById("adminLoad");
const adminTokenInput = document.getElementById("adminToken");
const adminMsg = document.getElementById("adminMsg");
const adminSections = document.getElementById("adminSections");
const quotesTable = document.getElementById("quotesTable");
const contactsTable = document.getElementById("contactsTable");
const usersTable = document.getElementById("usersTable");
const shipmentsTable = document.getElementById("shipmentsTable");
const adminLoginForm = document.getElementById("adminLoginForm");
const shipmentStatusForm = document.getElementById("shipmentStatusForm");
const statusMsg = document.getElementById("statusMsg");

function renderTable(table, columns, rows, onRowClick) {
  table.innerHTML = "";
  const head = document.createElement("thead");
  const headerRow = document.createElement("tr");
  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column.label;
    headerRow.appendChild(th);
  });
  head.appendChild(headerRow);
  table.appendChild(head);

  const body = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    columns.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = row[column.key] ?? "—";
      tr.appendChild(td);
    });
    if (onRowClick) {
      tr.classList.add("admin-row-clickable");
      tr.addEventListener("click", () => onRowClick(row));
    }
    body.appendChild(tr);
  });
  table.appendChild(body);
}

async function loadAdminData(token) {
  if (!token) {
    setMsg(adminMsg, "Please log in as admin first.", "error");
    return;
  }

  setMsg(adminMsg, "Loading admin data…");
  adminSections.hidden = true;

  try {
    const [quotes, contacts, shipments] = await Promise.all([
      TransportexAPI.loadAdminData("requests", token),
      TransportexAPI.loadAdminData("contacts", token),
      TransportexAPI.loadAdminData("shipments", token),
    ]);

    renderTable(
      quotesTable,
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "serviceType", label: "Service" },
        { key: "origin", label: "Origin" },
        { key: "destination", label: "Destination" },
        { key: "cargoDetails", label: "Cargo details" },
        { key: "createdAt", label: "Created at" },
      ],
      quotes
    );

    renderTable(
      contactsTable,
      [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "subject", label: "Subject" },
        { key: "message", label: "Message" },
        { key: "createdAt", label: "Created at" },
      ],
      contacts
    );

    renderTable(
      usersTable,
      [
        { key: "id", label: "ID" },
        { key: "username", label: "Username" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "createdAt", label: "Created at" },
      ],
      await TransportexAPI.loadAdminData("users", token)
    );

    renderTable(
      shipmentsTable,
      [
        { key: "id", label: "ID" },
        { key: "trackingId", label: "Tracking ID" },
        { key: "origin", label: "Origin" },
        { key: "destination", label: "Destination" },
        { key: "serviceType", label: "Service" },
        { key: "status", label: "Status" },
        { key: "eta", label: "ETA" },
        { key: "weightKg", label: "Weight (kg)" },
        { key: "createdAt", label: "Created at" },
      ],
      shipments,
      (row) => {
        // Click a shipment row to load its tracking ID into the status form.
        shipmentStatusForm.trackingId.value = row.trackingId;
        shipmentStatusForm.trackingId.scrollIntoView({ behavior: "smooth", block: "center" });
        shipmentStatusForm.trackingId.focus();
      }
    );

    adminSections.hidden = false;
    setMsg(adminMsg, "Admin data loaded.", "ok");
  } catch (err) {
    setMsg(adminMsg, err.message, "error");
  }
}

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = adminLoginForm.querySelector(".form-submit");
    const payload = {
      username: adminLoginForm.username.value.trim(),
      password: adminLoginForm.password.value,
    };

    setButtonLoading(submitBtn, true, "Logging in…");
    setMsg(adminMsg, "");

    try {
      const res = await TransportexAPI.login(payload);
      if (res.user?.role !== "admin") {
        throw new Error("This account is not an admin account.");
      }

      saveSession(res.token, res.user);
      showAdminLoggedInState(res.user);
      adminTokenInput.value = res.token;
      await loadAdminData(res.token);
    } catch (err) {
      setMsg(adminMsg, err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

if (shipmentStatusForm) {
  shipmentStatusForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = shipmentStatusForm.querySelector(".form-submit");
    const token = (adminTokenInput.value || getSession()?.token || "").trim();

    const payload = {
      trackingId: shipmentStatusForm.trackingId.value.trim(),
      status: shipmentStatusForm.status.value,
      location: shipmentStatusForm.location.value.trim(),
      note: shipmentStatusForm.note.value.trim(),
      eta: shipmentStatusForm.eta.value.trim(),
    };

    if (!payload.trackingId) {
      setMsg(statusMsg, "Please enter a tracking ID.", "error");
      return;
    }

    setButtonLoading(submitBtn, true, "Saving…");
    setMsg(statusMsg, "");

    try {
      const res = await TransportexAPI.updateShipmentStatus(payload, token);
      setMsg(statusMsg, res.message, "ok");
      shipmentStatusForm.reset();
      if (token) {
        await loadAdminData(token);
      }
    } catch (err) {
      setMsg(statusMsg, err.message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

if (adminLoad) {
  adminLoad.addEventListener("click", async () => {
    const token = (adminTokenInput.value || getSession()?.token || "").trim();
    if (!token) {
      setMsg(adminMsg, "Please log in as admin first.", "error");
      return;
    }

    await loadAdminData(token);
  });
}

// If this tab already holds an admin session, skip the login form
// entirely and load the dashboard straight away.
const adminLoggedInPanel = document.getElementById("adminLoggedIn");

function showAdminLoggedInState(user) {
  if (!adminLoggedInPanel) return;
  adminLoginForm && (adminLoginForm.hidden = true);
  adminLoggedInPanel.hidden = false;
  adminLoggedInPanel.innerHTML = `
    <p class="form-msg" data-state="ok" style="margin:0;">
      Logged in as <strong>${user.username}</strong> (admin).
      <button type="button" id="adminLogoutBtn" class="btn-link" style="margin-left:8px;">Log out</button>
    </p>
  `;
  document.getElementById("adminLogoutBtn")?.addEventListener("click", () => {
    clearSession();
    window.location.reload();
  });
}

if (adminLoad) {
  const existing = getSession();
  if (existing && existing.user.role === "admin") {
    adminTokenInput.value = existing.token;
    showAdminLoggedInState(existing.user);
    loadAdminData(existing.token);
  } else if (existing) {
    setMsg(adminMsg, `Signed in as "${existing.user.username}" (${existing.user.role}) in this tab — that account doesn't have admin access.`, "error");
  }
}
