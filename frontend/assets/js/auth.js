"use strict";

/**
 * Session storage for logged-in accounts.
 *
 * Deliberately uses sessionStorage (not localStorage): sessionStorage is
 * scoped per browser tab, so opening two tabs lets two different people be
 * logged into two different accounts (e.g. one admin tab, one customer
 * tab) without one login stomping the other. A session persists across
 * page navigation and reloads within that same tab, and clears when the
 * tab is closed.
 */
const SESSION_TOKEN_KEY = "transportex_auth_token";
const SESSION_USER_KEY = "transportex_user";

function getSession() {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem(SESSION_USER_KEY) || "null");
  } catch (_) {
    user = null;
  }
  return token && user ? { token, user } : null;
}

function saveSession(token, user) {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  renderAccountStatus();
}

function clearSession() {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
  renderAccountStatus();
}

// Renders the "who's logged in" pill into any element with
// id="accountStatus" (the header on every page has one). Safe to call on
// pages that don't have that element.
function renderAccountStatus() {
  const mount = document.getElementById("accountStatus");
  if (!mount) return;

  const session = getSession();

  if (!session) {
    mount.innerHTML = `<a href="./login.html" class="btn btn-ghost header-cta">Log in</a>`;
    return;
  }

  const { user } = session;
  const accountHref = user.role === "admin" ? "./admin.html" : "./shipment.html";

  mount.innerHTML = `
    <a href="${accountHref}" class="account-pill" title="Go to your account">
      <span class="account-avatar">${user.username.slice(0, 1).toUpperCase()}</span>
      <span class="account-info">
        <span class="account-name">${user.username}</span>
        <span class="account-role">${user.role}</span>
      </span>
    </a>
    <button type="button" id="logoutBtn" class="account-logout" aria-label="Log out">
      <ion-icon name="log-out-outline"></ion-icon>
    </button>
  `;

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    clearSession();
    window.location.href = "./index.html";
  });
}

document.addEventListener("DOMContentLoaded", renderAccountStatus);
