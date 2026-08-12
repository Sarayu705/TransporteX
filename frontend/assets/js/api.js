/**
 * Transportex API client.
 *
 * Points at the Node/Express backend included in this project (see
 * /backend). Change API_BASE_URL if you deploy the backend somewhere
 * other than http://localhost:4000.
 */
const API_BASE_URL = window.TRANSPORTEX_API_BASE_URL || "http://localhost:4000/api";

async function apiRequest(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  Object.keys(headers).forEach((key) => {
    if (headers[key] == null) {
      delete headers[key];
    }
  });

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // no JSON body
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;

    // A 401 on anything other than the login/register endpoints means the
    // session token is missing/expired/invalid — clear it and send the
    // person back to log in rather than leaving a "looks logged in but
    // every request silently fails" state.
    if (res.status === 401 && !path.startsWith("/auth/")) {
      if (typeof clearSession === "function") clearSession();
      if (!window.location.pathname.endsWith("login.html")) {
        window.location.href = "./login.html";
      }
    }

    throw new Error(message);
  }

  return data;
}

const TransportexAPI = {
  trackShipment(trackingId) {
    return apiRequest(`/track/${encodeURIComponent(trackingId)}`);
  },
  submitContact(payload) {
    return apiRequest(`/contact`, { method: "POST", body: JSON.stringify(payload) });
  },
  submitQuote(payload) {
    return apiRequest(`/quote`, { method: "POST", body: JSON.stringify(payload) });
  },
  subscribeNewsletter(email) {
    return apiRequest(`/newsletter`, { method: "POST", body: JSON.stringify({ email }) });
  },
  register(payload) {
    return apiRequest(`/auth/register`, { method: "POST", body: JSON.stringify(payload) });
  },
  login(payload) {
    return apiRequest(`/auth/login`, { method: "POST", body: JSON.stringify(payload) });
  },
  requestShipment(payload, token) {
    return apiRequest(`/shipments`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
      body: JSON.stringify(payload),
    });
  },
  getMyShipments(token) {
    return apiRequest(`/shipments/mine`, {
      method: "GET",
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    });
  },
  loadAdminData(endpoint, token) {
    return apiRequest(`/admin/${endpoint}`, {
      method: "GET",
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    });
  },
  updateShipmentStatus(payload, token) {
    return apiRequest(`/admin/shipments/${encodeURIComponent(payload.trackingId)}/status`, {
      method: "POST",
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
      body: JSON.stringify(payload),
    });
  },
};
