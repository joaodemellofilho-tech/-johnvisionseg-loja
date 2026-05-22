/* Customer account area: login, password, profile and order history. */

const CUSTOMERS_KEY = "jv_customers_v2";
const SESSION_KEY = "jv_customer_session";

let currentCustomer = null;

function hashPassword(password) {
  let hash = 2166136261;
  const value = `johnvisionseg:${password || ""}`;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function getCustomers() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCustomers(customers) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

function publicCustomer(customer) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone || ""
  };
}

function avatarLetter(name) {
  return String(name || "?").trim().charAt(0).toUpperCase() || "?";
}

function persistSession(customer) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: customer.id, email: customer.email }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function restoreCustomerSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    const local = getCustomers().find((customer) => customer.id === session.id && customer.email === session.email);
    if (local) {
      currentCustomer = publicCustomer(local);
      updateAuthUI();
      return;
    }

    const auth = await getOptionalFirebaseAuth();
    if (auth?.currentUser && auth.currentUser.email === session.email) {
      currentCustomer = {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || session.email.split("@")[0],
        email: auth.currentUser.email,
        phone: ""
      };
      updateAuthUI();
    }
  } catch {
    clearSession();
  }
}

async function getOptionalFirebaseAuth() {
  if (typeof getFirebaseAuth !== "function") return null;
  try {
    return await getFirebaseAuth();
  } catch {
    return null;
  }
}

function updateAuthUI() {
  const btn = document.getElementById("authBtn");
  const label = document.getElementById("authBtnLabel");
  const mobileLink = document.getElementById("mobileAuthLink");

  if (currentCustomer) {
    if (label) label.textContent = currentCustomer.name.split(" ")[0] || "Conta";
    if (btn) {
      btn.title = "Minha conta";
      btn.onclick = openCustomerDrawer;
    }
    if (mobileLink) {
      mobileLink.textContent = "Minha conta";
      mobileLink.onclick = (event) => {
        event.preventDefault();
        openCustomerDrawer();
      };
    }

    const cartName = document.getElementById("customerName");
    const cartPhone = document.getElementById("customerPhone");
    if (cartName && !cartName.value) cartName.value = currentCustomer.name;
    if (cartPhone && !cartPhone.value) cartPhone.value = currentCustomer.phone;
    return;
  }

  if (label) label.textContent = "Entrar";
  if (btn) {
    btn.title = "Entrar / Criar conta";
    btn.onclick = openAuthModal;
  }
  if (mobileLink) {
    mobileLink.textContent = "Entrar";
    mobileLink.onclick = (event) => {
      event.preventDefault();
      openAuthModal();
    };
  }
}

function showAuthError(formId, message) {
  const element = document.getElementById(`${formId}Error`);
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
}

function clearAuthErrors() {
  ["loginError", "registerError"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.hidden = true;
      element.textContent = "";
    }
  });
}

function setSubmitLoading(buttonId, loading) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  button.disabled = loading;
  button.textContent = loading ? "Aguarde..." : (buttonId === "loginSubmitBtn" ? "Acessar conta" : "Criar minha conta");
}

function openAuthModal() {
  if (currentCustomer) {
    openCustomerDrawer();
    return;
  }
  const modal = document.getElementById("authModal");
  const overlay = document.getElementById("authOverlay");
  if (!modal) return;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  if (overlay) overlay.hidden = false;
  clearAuthErrors();
  setTimeout(() => document.getElementById("loginEmail")?.focus(), 80);
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  const modal = document.getElementById("authModal");
  const overlay = document.getElementById("authOverlay");
  if (modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = "";
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabLoginBtn = document.getElementById("tabLoginBtn");
  const tabRegisterBtn = document.getElementById("tabRegisterBtn");
  clearAuthErrors();

  const isLogin = tab === "login";
  if (loginForm) loginForm.style.display = isLogin ? "" : "none";
  if (registerForm) registerForm.style.display = isLogin ? "none" : "";
  tabLoginBtn?.classList.toggle("active", isLogin);
  tabRegisterBtn?.classList.toggle("active", !isLogin);
  tabLoginBtn?.setAttribute("aria-selected", String(isLogin));
  tabRegisterBtn?.setAttribute("aria-selected", String(!isLogin));
  setTimeout(() => document.getElementById(isLogin ? "loginEmail" : "regName")?.focus(), 50);
}

function toggleAuthPassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  if (button) button.textContent = show ? "Ocultar" : "Ver";
}

async function handleRegister(event) {
  event.preventDefault();
  clearAuthErrors();

  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!name) return showAuthError("register", "Informe seu nome completo.");
  if (!email || !email.includes("@")) return showAuthError("register", "Informe um e-mail valido.");
  if (password.length < 6) return showAuthError("register", "A senha deve ter pelo menos 6 caracteres.");

  setSubmitLoading("registerSubmitBtn", true);
  try {
    const auth = await getOptionalFirebaseAuth();
    let customer;

    if (auth) {
      const credential = await auth.createUserWithEmailAndPassword(email, password);
      if (credential.user.updateProfile) await credential.user.updateProfile({ displayName: name });
      customer = { id: credential.user.uid, name, email, phone, createdAt: new Date().toISOString(), provider: "firebase" };
      await saveCustomerProfileCloud(customer);
    } else {
      const customers = getCustomers();
      if (customers.some((item) => item.email === email)) {
        showAuthError("register", "Ja existe uma conta com este e-mail.");
        return;
      }
      customer = { id: String(Date.now()), name, email, phone, passwordHash: hashPassword(password), createdAt: new Date().toISOString(), provider: "local" };
      customers.unshift(customer);
      saveCustomers(customers);
    }

    currentCustomer = publicCustomer(customer);
    persistSession(currentCustomer);
    registerCustomerLead(currentCustomer);
    closeAuthModal();
    updateAuthUI();
    showWelcomeToast(`Conta criada! Bem-vindo(a), ${currentCustomer.name.split(" ")[0]}.`);
  } catch (error) {
    showAuthError("register", getFriendlyAuthError(error));
  } finally {
    setSubmitLoading("registerSubmitBtn", false);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  clearAuthErrors();

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  if (!email || !email.includes("@")) return showAuthError("login", "Informe um e-mail valido.");
  if (!password) return showAuthError("login", "Informe sua senha.");

  setSubmitLoading("loginSubmitBtn", true);
  try {
    const auth = await getOptionalFirebaseAuth();
    let customer;

    if (auth) {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      customer = await loadCustomerProfileCloud(credential.user);
    } else {
      const found = getCustomers().find((item) => item.email === email && item.passwordHash === hashPassword(password));
      if (!found) {
        showAuthError("login", "E-mail ou senha incorretos.");
        return;
      }
      customer = found;
    }

    currentCustomer = publicCustomer(customer);
    persistSession(currentCustomer);
    closeAuthModal();
    updateAuthUI();
    showWelcomeToast(`Bem-vindo(a), ${currentCustomer.name.split(" ")[0]}.`);
  } catch (error) {
    showAuthError("login", getFriendlyAuthError(error));
  } finally {
    setSubmitLoading("loginSubmitBtn", false);
  }
}

async function saveCustomerProfileCloud(customer) {
  if (!window.firebase?.firestore) return;
  try {
    await firebase.firestore().collection("customers").doc(customer.id).set({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch {
    // Local UI can still work even if profile sync fails.
  }
}

async function loadCustomerProfileCloud(user) {
  const fallback = {
    id: user.uid,
    name: user.displayName || user.email.split("@")[0],
    email: user.email,
    phone: ""
  };
  if (!window.firebase?.firestore) return fallback;
  try {
    const snap = await firebase.firestore().collection("customers").doc(user.uid).get();
    return snap.exists ? { ...fallback, ...snap.data(), id: user.uid, email: user.email } : fallback;
  } catch {
    return fallback;
  }
}

function getFriendlyAuthError(error) {
  const code = error?.code || "";
  if (code.includes("email-already-in-use")) return "Ja existe uma conta com este e-mail.";
  if (code.includes("invalid-email")) return "Informe um e-mail valido.";
  if (code.includes("weak-password")) return "A senha deve ter pelo menos 6 caracteres.";
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) return "E-mail ou senha incorretos.";
  return error?.message || "Nao foi possivel concluir. Tente novamente.";
}

function registerCustomerLead(customer) {
  if (typeof app === "undefined" || !app?.customers) return;
  const exists = app.customers.some((item) => item.phone === customer.phone && item.name === customer.name);
  if (!exists) {
    app.customers.unshift({
      name: customer.name,
      phone: customer.phone,
      address: "",
      date: new Date().toLocaleString("pt-BR"),
      type: "Cadastro"
    });
    if (typeof saveApp === "function") saveApp(app);
  }
}

function openCustomerDrawer() {
  if (!currentCustomer) {
    openAuthModal();
    return;
  }
  const drawer = document.getElementById("customerDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (!drawer) return;

  document.getElementById("customerAvatar").textContent = avatarLetter(currentCustomer.name);
  document.getElementById("customerDisplayName").textContent = currentCustomer.name;
  document.getElementById("customerDisplayEmail").textContent = currentCustomer.email;
  document.getElementById("profileName").value = currentCustomer.name;
  document.getElementById("profilePhone").value = currentCustomer.phone || "";
  renderCustomerOrders();

  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  if (overlay) overlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCustomerDrawer() {
  const drawer = document.getElementById("customerDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (drawer) {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }
  if (overlay) overlay.hidden = true;
  document.body.style.overflow = "";
}

function renderCustomerOrders() {
  const list = document.getElementById("customerOrdersList");
  if (!list || !currentCustomer) return;
  const allOrders = (typeof app !== "undefined" && app?.orders) ? app.orders : [];
  const phone = String(currentCustomer.phone || "").replace(/\D/g, "");
  const myOrders = allOrders.filter((order) => {
    const orderPhone = String(order.phone || "").replace(/\D/g, "");
    return (phone && orderPhone === phone) || String(order.name || "").toLowerCase().includes(currentCustomer.name.split(" ")[0].toLowerCase());
  });

  if (!myOrders.length) {
    list.innerHTML = '<p class="empty-state">Nenhum pedido registrado ainda.</p>';
    return;
  }

  list.innerHTML = myOrders.slice(0, 8).map((order) => `
    <div class="customer-order-card">
      <div class="customer-order-header">
        <span class="customer-order-id">Pedido #${String(order.id).slice(-6)}</span>
        <span class="customer-order-status status-${escapeHtml(String(order.status || "Novo").toLowerCase().replace(/\s/g, "-"))}">${escapeHtml(order.status || "Novo")}</span>
      </div>
      <div class="customer-order-items">
        ${(order.items || []).slice(0, 3).map((item) => `<span>${Number(item.qty || 1)}x ${escapeHtml(item.name)}</span>`).join("")}
      </div>
      <div class="customer-order-meta">
        <strong>${typeof brl === "function" ? brl(order.total) : `R$ ${Number(order.total || 0).toFixed(2)}`}</strong>
        <small>${escapeHtml(order.date || "")}</small>
      </div>
    </div>
  `).join("");
}

async function saveProfile() {
  if (!currentCustomer) return;
  const name = document.getElementById("profileName").value.trim();
  const phone = document.getElementById("profilePhone").value.trim();
  if (!name) return alert("Informe seu nome.");

  const customers = getCustomers();
  const index = customers.findIndex((customer) => customer.id === currentCustomer.id);
  if (index >= 0) {
    customers[index].name = name;
    customers[index].phone = phone;
    saveCustomers(customers);
  }

  currentCustomer.name = name;
  currentCustomer.phone = phone;
  persistSession(currentCustomer);
  await saveCustomerProfileCloud(currentCustomer);
  updateAuthUI();
  openCustomerDrawer();
  showWelcomeToast("Dados salvos com sucesso.");
}

async function customerLogout() {
  const auth = await getOptionalFirebaseAuth();
  if (auth?.currentUser) await auth.signOut().catch(() => {});
  currentCustomer = null;
  clearSession();
  closeCustomerDrawer();
  updateAuthUI();
  showWelcomeToast("Voce saiu da conta.");
}

function showWelcomeToast(message) {
  const existing = document.getElementById("authToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "authToast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  toast.style.cssText = `
    position:fixed;left:50%;bottom:90px;transform:translateX(-50%) translateY(12px);
    max-width:90vw;background:#07111f;color:#fff;border:1px solid #cfe0ef;border-radius:8px;
    padding:12px 16px;font-weight:800;z-index:9999;box-shadow:0 18px 42px rgba(7,17,31,.22);
    opacity:0;transition:opacity .2s ease,transform .2s ease;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(12px)";
    setTimeout(() => toast.remove(), 240);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("authBtn")?.addEventListener("click", openAuthModal);
  document.getElementById("authOverlay")?.addEventListener("click", closeAuthModal);
  document.getElementById("closeAuthModal")?.addEventListener("click", closeAuthModal);
  document.getElementById("closeCustomerDrawer")?.addEventListener("click", closeCustomerDrawer);
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document.getElementById("registerForm")?.addEventListener("submit", handleRegister);

  const cartOverlay = document.getElementById("cartOverlay");
  if (cartOverlay) {
    cartOverlay.addEventListener("click", () => {
      const drawer = document.getElementById("customerDrawer");
      if (drawer?.classList.contains("open")) closeCustomerDrawer();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (document.getElementById("authModal")?.classList.contains("open")) closeAuthModal();
    if (document.getElementById("customerDrawer")?.classList.contains("open")) closeCustomerDrawer();
  });

  restoreCustomerSession();
  updateAuthUI();
});
