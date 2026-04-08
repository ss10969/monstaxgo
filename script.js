const product = {
  id: 1,
  brand: "Peripera",
  name: "單色腮紅代購頁",
  price: 149,
  image:
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
  description:
    "可先選版本與規格，再選擇數量加入購物車。這個頁面更接近真實代購商店的購物流程。",
  versions: ["文字腮紅", "刻字微笑腮紅", "小熊聯名腮紅", "年糕果凍款"],
  specs: ["28 Romantic Rose", "29 Dusty Mauve", "30 Soft Pink", "31 Beige", "34 Mango"],
};

const hiddenAdminPath = "#/manage-8xk2q9-orders";
const demoAdminEmail = "admin@store.local";
const demoAdminPassword = "angie-admin-demo";

const sampleOrders = [
  {
    id: "GO-20260407-001",
    createdAt: "2026-04-07 19:45",
    socialName: "Angie GO",
    email: "demo1@email.com",
    socialAccount: "@angiego",
    transferTime: "4/7 19:30",
    status: "待確認",
    paymentStatus: "已填匯款",
    shippingStatus: "未出貨",
    total: 298,
    items: [
      { name: "單色腮紅代購頁", version: "文字腮紅", spec: "29 Dusty Mauve", quantity: 2, price: 149 },
    ],
  },
  {
    id: "GO-20260407-002",
    createdAt: "2026-04-07 20:10",
    socialName: "Mango Group",
    email: "demo2@email.com",
    socialAccount: "line:mangogo",
    transferTime: "4/7 20:01",
    status: "已確認",
    paymentStatus: "已對帳",
    shippingStatus: "備貨中",
    total: 447,
    items: [
      { name: "單色腮紅代購頁", version: "小熊聯名腮紅", spec: "34 Mango", quantity: 3, price: 149 },
    ],
  },
];

const statusClassMap = {
  待確認: "status-amber",
  已確認: "status-emerald",
  已完成: "status-sky",
  已填匯款: "status-violet",
  已對帳: "status-emerald",
  未出貨: "status-rose",
  備貨中: "status-orange",
  已出貨: "status-sky",
};

const state = {
  selectedVersion: "",
  selectedSpec: "",
  quantity: 1,
  cart: loadJSON("go_cart", []),
  checkout: { socialName: "", email: "", socialAccount: "", transferTime: "" },
  submitted: false,
  submittedOrders: loadJSON("go_orders", sampleOrders),
  adminAuthorized: false,
  adminLogin: { email: "", password: "" },
  adminError: "",
  adminSearch: "",
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem("go_cart", JSON.stringify(state.cart));
  localStorage.setItem("go_orders", JSON.stringify(state.submittedOrders));
}

function getPageFromHash() {
  if (window.location.hash === "#/cart") return "cart";
  if (window.location.hash === hiddenAdminPath) return "admin";
  return "product";
}

function getCartSubtotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
  return state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function getFilteredOrders() {
  const keyword = state.adminSearch.trim().toLowerCase();
  if (!keyword) return state.submittedOrders;

  return state.submittedOrders.filter((order) => {
    const combined = [
      order.id,
      order.socialName,
      order.email,
      order.socialAccount,
      order.transferTime,
      order.status,
      order.paymentStatus,
      order.shippingStatus,
      ...order.items.map((item) => `${item.name} ${item.version} ${item.spec}`),
    ]
      .join(" ")
      .toLowerCase();
    return combined.includes(keyword);
  });
}

function getAdminStats() {
  return {
    totalOrders: state.submittedOrders.length,
    totalAmount: state.submittedOrders.reduce((sum, order) => sum + order.total, 0),
    pendingCount: state.submittedOrders.filter((order) => order.status === "待確認").length,
    shippedCount: state.submittedOrders.filter((order) => order.shippingStatus === "已出貨").length,
  };
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setHash(hash) {
  window.location.hash = hash;
}

function addToCart() {
  if (!state.selectedVersion || !state.selectedSpec || state.quantity < 1) return;
  const cartKey = `${state.selectedVersion}-${state.selectedSpec}`;
  const existing = state.cart.find((item) => item.cartKey === cartKey);

  if (existing) {
    state.cart = state.cart.map((item) =>
      item.cartKey === cartKey ? { ...item, quantity: item.quantity + state.quantity } : item
    );
  } else {
    state.cart.push({
      cartKey,
      productId: product.id,
      name: product.name,
      version: state.selectedVersion,
      spec: state.selectedSpec,
      quantity: state.quantity,
      price: product.price,
    });
  }

  state.quantity = 1;
  saveState();
  setHash("#/cart");
  render();
}

function updateCartQuantity(cartKey, nextQuantity) {
  if (nextQuantity <= 0) {
    state.cart = state.cart.filter((item) => item.cartKey !== cartKey);
  } else {
    state.cart = state.cart.map((item) =>
      item.cartKey === cartKey ? { ...item, quantity: nextQuantity } : item
    );
  }
  saveState();
  render();
}

function removeCartItem(cartKey) {
  state.cart = state.cart.filter((item) => item.cartKey !== cartKey);
  saveState();
  render();
}

function canSubmit() {
  return (
    state.cart.length > 0 &&
    state.checkout.socialName.trim() &&
    state.checkout.email.trim() &&
    state.checkout.socialAccount.trim() &&
    state.checkout.transferTime.trim()
  );
}

function submitOrder() {
  if (!canSubmit()) return;

  const newOrder = {
    id: `GO-${Date.now()}`,
    createdAt: new Date().toLocaleString(),
    socialName: state.checkout.socialName,
    email: state.checkout.email,
    socialAccount: state.checkout.socialAccount,
    transferTime: state.checkout.transferTime,
    status: "待確認",
    paymentStatus: "已填匯款",
    shippingStatus: "未出貨",
    total: getCartSubtotal(),
    items: state.cart.map((item) => ({
      name: item.name,
      version: item.version,
      spec: item.spec,
      quantity: item.quantity,
      price: item.price,
    })),
  };

  state.submittedOrders.unshift(newOrder);
  state.submitted = true;
  state.cart = [];
  state.checkout = { socialName: "", email: "", socialAccount: "", transferTime: "" };
  saveState();
  render();
}

function loginAdmin() {
  if (state.adminLogin.email === demoAdminEmail && state.adminLogin.password === demoAdminPassword) {
    state.adminAuthorized = true;
    state.adminError = "";
  } else {
    state.adminError = "帳號或密碼錯誤";
  }
  render();
}

function logoutAdmin() {
  state.adminAuthorized = false;
  state.adminLogin = { email: "", password: "" };
  state.adminError = "";
  setHash("#/");
  render();
}

function updateOrderField(id, field, value) {
  state.submittedOrders = state.submittedOrders.map((order) =>
    order.id === id ? { ...order, [field]: value } : order
  );
  saveState();
  render();
}

function topbar(page) {
  return `
    <div class="topbar card">
      <div>
        <div class="badges">
          <span class="badge badge-primary">代購商店</span>
          <span class="badge">免註冊下單</span>
        </div>
        <h1 class="title">專輯 / 美妝代購網站原型</h1>
        <p class="subtitle">商品頁可以選版本、規格、數量並加入購物車，購物車頁可查看總金額並填寫完整訂單資料。</p>
      </div>
      <div class="nav-buttons">
        <button class="btn ${page === "product" ? "btn-primary" : ""}" data-nav="#/">商品頁</button>
        <button class="btn ${page === "cart" ? "btn-primary" : ""}" data-nav="#/cart">購物車 (${getCartCount()})</button>
      </div>
    </div>
  `;
}

function productPage() {
  return `
    <div class="grid-2">
      <div class="card image-wrap"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></div>
      <div class="card content-card stack">
        <div>
          <div class="badges">
            <span class="badge badge-soft">商城</span>
            <span class="muted">${escapeHtml(product.brand)}</span>
          </div>
          <h2>${escapeHtml(product.name)}</h2>
          <p class="subtitle" style="margin-top:12px;">${escapeHtml(product.description)}</p>
        </div>

        <div class="price-box">
          <div class="muted">單件價格</div>
          <div class="price-big">NT$${product.price}</div>
        </div>

        <div>
          <div class="field">
            <label class="label">版本</label>
            <select id="versionSelect" class="select">
              <option value="">請選擇版本</option>
              ${product.versions.map((v) => `<option value="${escapeHtml(v)}" ${state.selectedVersion === v ? "selected" : ""}>${escapeHtml(v)}</option>`).join("")}
            </select>
          </div>

          <div class="field">
            <label class="label">規格</label>
            <select id="specSelect" class="select">
              <option value="">請選擇規格</option>
              ${product.specs.map((s) => `<option value="${escapeHtml(s)}" ${state.selectedSpec === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
            </select>
          </div>

          <div class="field">
            <label class="label">數量</label>
            <div class="qty-box">
              <button class="btn btn-small btn-icon" id="qtyMinus">－</button>
              <div class="qty-value">${state.quantity}</div>
              <button class="btn btn-small btn-icon" id="qtyPlus">＋</button>
            </div>
          </div>
        </div>

        <div class="selection-box">
          <div class="row muted"><span>目前選擇</span><span>${getCartCount()} 件在購物車</span></div>
          <div style="margin-top:10px;line-height:1.8;font-size:14px;">
            <div>版本：${escapeHtml(state.selectedVersion || "尚未選擇")}</div>
            <div>規格：${escapeHtml(state.selectedSpec || "尚未選擇")}</div>
            <div>數量：${state.quantity}</div>
          </div>
          <div style="margin-top:14px;font-size:22px;font-weight:800;">小計：NT$${product.price * state.quantity}</div>
        </div>

        <button class="btn btn-accent" id="addToCartBtn" style="height:52px;">加入購物車</button>
      </div>
    </div>
  `;
}

function cartPage() {
  const cartSubtotal = getCartSubtotal();
  const cartCount = getCartCount();

  return `
    <div class="grid-2">
      <div>
        <div class="card side-card">
          <h2 style="margin-bottom:18px;">購物車內容</h2>
          ${state.cart.length === 0 ? `
            <div class="cart-empty">目前購物車是空的，先回商品頁選擇版本與規格吧。</div>
          ` : state.cart.map((item) => `
            <div class="cart-item">
              <div class="row" style="align-items:flex-start; flex-wrap:wrap; gap:20px;">
                <div style="line-height:1.8;">
                  <div style="font-size:20px;font-weight:700;">${escapeHtml(item.name)}</div>
                  <div class="muted">版本：${escapeHtml(item.version)}</div>
                  <div class="muted">規格：${escapeHtml(item.spec)}</div>
                  <div class="muted">單價：NT$${item.price}</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;align-items:flex-end;">
                  <div class="qty-box">
                    <button class="btn btn-small btn-icon" data-qty-down="${escapeHtml(item.cartKey)}">－</button>
                    <div class="qty-value">${item.quantity}</div>
                    <button class="btn btn-small btn-icon" data-qty-up="${escapeHtml(item.cartKey)}">＋</button>
                  </div>
                  <div style="font-size:24px;font-weight:800;">NT$${item.price * item.quantity}</div>
                  <button class="btn btn-ghost btn-small" data-remove="${escapeHtml(item.cartKey)}">刪除</button>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="side-col">
        <div class="card side-card">
          <h2 style="margin-bottom:18px;">訂單資料</h2>

          <div class="summary-box">
            <div class="row muted"><span>商品件數</span><span>${cartCount}</span></div>
            <hr class="sep">
            <div class="row" style="font-size:22px;font-weight:800;"><span>總金額</span><span>NT$${cartSubtotal}</span></div>
          </div>

          <div class="field" style="margin-top:18px;">
            <label class="label">社群名稱</label>
            <input class="input" id="socialName" value="${escapeHtml(state.checkout.socialName)}" placeholder="例如：Angie GO">
          </div>

          <div class="field">
            <label class="label">Email</label>
            <input class="input" id="email" type="email" value="${escapeHtml(state.checkout.email)}" placeholder="your@email.com">
          </div>

          <div class="field">
            <label class="label">社群軟體帳號</label>
            <input class="input" id="socialAccount" value="${escapeHtml(state.checkout.socialAccount)}" placeholder="例如：IG / X / LINE 帳號">
          </div>

          <div class="field">
            <label class="label">匯款時間</label>
            <input class="input" id="transferTime" value="${escapeHtml(state.checkout.transferTime)}" placeholder="例如：4/7 19:30">
          </div>

          <button class="btn btn-accent" id="submitOrderBtn" style="width:100%;height:52px;" ${canSubmit() ? "" : "disabled"}>送出訂單</button>

          ${!canSubmit() ? `<p class="small-note" style="margin-top:12px;">需填完社群名稱、email、社群軟體帳號、匯款時間，且購物車內要有商品，才能送出。</p>` : ""}
          ${state.submitted ? `<div class="success-box" style="margin-top:14px;">已成功送出訂單。之後可以再接資料庫或表單 API，真正儲存訂單。</div>` : ""}
        </div>
      </div>
    </div>
  `;
}

function loginPage() {
  return `
    <div class="admin-shell">
      <div class="card login-card">
        <h2 style="margin-bottom:18px;">Admin Access</h2>
        <div class="summary-box" style="margin-bottom:16px;">這個頁面沒有任何前台入口，只有直接進入隱藏路徑的人才看得到。</div>

        <div class="field">
          <label class="label">Email</label>
          <input class="input" id="adminEmail" value="${escapeHtml(state.adminLogin.email)}" placeholder="admin email">
        </div>

        <div class="field">
          <label class="label">Password</label>
          <input class="input" id="adminPassword" type="password" value="${escapeHtml(state.adminLogin.password)}" placeholder="password">
        </div>

        ${state.adminError ? `<p style="color:#be123c;font-size:14px;margin-bottom:12px;">${escapeHtml(state.adminError)}</p>` : ""}
        <button class="btn btn-primary" id="adminLoginBtn" style="width:100%;height:48px;">登入後台</button>

        <div class="hidden-note" style="margin-top:14px;">
          Demo hidden path：${escapeHtml(hiddenAdminPath)}<br>
          Demo login：${escapeHtml(demoAdminEmail)}<br>
          Demo password：${escapeHtml(demoAdminPassword)}
        </div>
      </div>
    </div>
  `;
}

function adminPage() {
  const stats = getAdminStats();
  const orders = getFilteredOrders();

  return `
    <div class="admin-shell">
      <div class="topbar card">
        <div>
          <div class="badges">
            <span class="badge badge-primary">Admin</span>
            <span class="badge">隱藏後台</span>
          </div>
          <h2 class="title" style="font-size:32px;">訂單管理後台</h2>
          <p class="subtitle">這裡只存在於隱藏路徑，前台沒有任何按鈕、導覽或提示會帶顧客進來。</p>
        </div>
        <button class="btn" id="logoutAdminBtn">登出</button>
      </div>

      <div class="stats">
        ${statCard("總訂單數", stats.totalOrders)}
        ${statCard("總金額", `NT$${stats.totalAmount}`)}
        ${statCard("待確認", stats.pendingCount)}
        ${statCard("已出貨", stats.shippedCount)}
      </div>

      <div class="card admin-toolbar">
        <div class="search-input-wrap">
          <input class="input" id="adminSearch" value="${escapeHtml(state.adminSearch)}" placeholder="搜尋訂單編號、社群名稱、規格、email">
        </div>
      </div>

      ${orders.map((order) => `
        <div class="card order-card">
          <div class="row" style="align-items:flex-start; flex-wrap:wrap; gap:18px; margin-bottom:18px;">
            <div style="line-height:1.9;">
              <div class="status-row">
                <strong style="font-size:22px;">${escapeHtml(order.id)}</strong>
                <span class="status ${statusClassMap[order.status] || "status-amber"}">${escapeHtml(order.status)}</span>
                <span class="status ${statusClassMap[order.paymentStatus] || "status-violet"}">${escapeHtml(order.paymentStatus)}</span>
                <span class="status ${statusClassMap[order.shippingStatus] || "status-rose"}">${escapeHtml(order.shippingStatus)}</span>
              </div>
              <div class="muted">建立時間：${escapeHtml(order.createdAt)}</div>
              <div class="muted">社群名稱：${escapeHtml(order.socialName)}</div>
              <div class="muted">Email：${escapeHtml(order.email)}</div>
              <div class="muted">社群帳號：${escapeHtml(order.socialAccount)}</div>
              <div class="muted">匯款時間：${escapeHtml(order.transferTime)}</div>
            </div>
            <div>
              <div class="muted" style="text-align:right;">訂單總額</div>
              <div class="order-total">NT$${order.total}</div>
            </div>
          </div>

          <div class="order-grid">
            <div>
              ${order.items.map((item) => `
                <div class="item-box">
                  <div style="font-weight:700;">${escapeHtml(item.name)}</div>
                  <div class="muted">版本：${escapeHtml(item.version)}</div>
                  <div class="muted">規格：${escapeHtml(item.spec)}</div>
                  <div class="muted">數量：${item.quantity}</div>
                  <div class="muted">單價：NT$${item.price}</div>
                </div>
              `).join("")}
            </div>

            <div>
              <div class="field">
                <label class="label">訂單狀態</label>
                <select class="select" data-order-status="${escapeHtml(order.id)}">
                  ${["待確認", "已確認", "已完成"].map((v) => `<option value="${v}" ${order.status === v ? "selected" : ""}>${v}</option>`).join("")}
                </select>
              </div>

              <div class="field">
                <label class="label">付款狀態</label>
                <select class="select" data-payment-status="${escapeHtml(order.id)}">
                  ${["已填匯款", "已對帳"].map((v) => `<option value="${v}" ${order.paymentStatus === v ? "selected" : ""}>${v}</option>`).join("")}
                </select>
              </div>

              <div class="field">
                <label class="label">出貨狀態</label>
                <select class="select" data-shipping-status="${escapeHtml(order.id)}">
                  ${["未出貨", "備貨中", "已出貨"].map((v) => `<option value="${v}" ${order.shippingStatus === v ? "selected" : ""}>${v}</option>`).join("")}
                </select>
              </div>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function statCard(title, value) {
  return `
    <div class="card stat-card">
      <div class="stat-title">${escapeHtml(title)}</div>
      <div class="stat-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function render() {
  const app = document.getElementById("app");
  const page = getPageFromHash();
  state.submitted = page === "cart" ? state.submitted : false;

  if (page === "admin") {
    app.innerHTML = `<div class="container">${state.adminAuthorized ? adminPage() : loginPage()}</div>`;
  } else {
    app.innerHTML = `
      <div class="container">
        ${topbar(page)}
        ${page === "product" ? productPage() : cartPage()}
      </div>
    `;
  }

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => setHash(btn.dataset.nav));
  });

  const versionSelect = document.getElementById("versionSelect");
  if (versionSelect) {
    versionSelect.addEventListener("change", (e) => {
      state.selectedVersion = e.target.value;
      render();
    });
  }

  const specSelect = document.getElementById("specSelect");
  if (specSelect) {
    specSelect.addEventListener("change", (e) => {
      state.selectedSpec = e.target.value;
      render();
    });
  }

  const qtyMinus = document.getElementById("qtyMinus");
  if (qtyMinus) qtyMinus.addEventListener("click", () => { state.quantity = Math.max(1, state.quantity - 1); render(); });

  const qtyPlus = document.getElementById("qtyPlus");
  if (qtyPlus) qtyPlus.addEventListener("click", () => { state.quantity += 1; render(); });

  const addToCartBtn = document.getElementById("addToCartBtn");
  if (addToCartBtn) addToCartBtn.addEventListener("click", addToCart);

  document.querySelectorAll("[data-qty-down]").forEach((btn) => {
    btn.addEventListener("click", () => updateCartQuantity(btn.dataset.qtyDown, (state.cart.find(i => i.cartKey === btn.dataset.qtyDown)?.quantity || 1) - 1));
  });
  document.querySelectorAll("[data-qty-up]").forEach((btn) => {
    btn.addEventListener("click", () => updateCartQuantity(btn.dataset.qtyUp, (state.cart.find(i => i.cartKey === btn.dataset.qtyUp)?.quantity || 0) + 1));
  });
  document.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeCartItem(btn.dataset.remove));
  });

  ["socialName", "email", "socialAccount", "transferTime"].forEach((key) => {
    const input = document.getElementById(key);
    if (input) {
      input.addEventListener("input", (e) => {
        state.checkout[key] = e.target.value;
        render();
      });
    }
  });

  const submitOrderBtn = document.getElementById("submitOrderBtn");
  if (submitOrderBtn) submitOrderBtn.addEventListener("click", submitOrder);

  const adminEmail = document.getElementById("adminEmail");
  if (adminEmail) {
    adminEmail.addEventListener("input", (e) => {
      state.adminLogin.email = e.target.value;
    });
  }

  const adminPassword = document.getElementById("adminPassword");
  if (adminPassword) {
    adminPassword.addEventListener("input", (e) => {
      state.adminLogin.password = e.target.value;
    });
  }

  const adminLoginBtn = document.getElementById("adminLoginBtn");
  if (adminLoginBtn) adminLoginBtn.addEventListener("click", loginAdmin);

  const logoutAdminBtn = document.getElementById("logoutAdminBtn");
  if (logoutAdminBtn) logoutAdminBtn.addEventListener("click", logoutAdmin);

  const adminSearch = document.getElementById("adminSearch");
  if (adminSearch) {
    adminSearch.addEventListener("input", (e) => {
      state.adminSearch = e.target.value;
      render();
    });
  }

  document.querySelectorAll("[data-order-status]").forEach((select) => {
    select.addEventListener("change", (e) => updateOrderField(select.dataset.orderStatus, "status", e.target.value));
  });
  document.querySelectorAll("[data-payment-status]").forEach((select) => {
    select.addEventListener("change", (e) => updateOrderField(select.dataset.paymentStatus, "paymentStatus", e.target.value));
  });
  document.querySelectorAll("[data-shipping-status]").forEach((select) => {
    select.addEventListener("change", (e) => updateOrderField(select.dataset.shippingStatus, "shippingStatus", e.target.value));
  });
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash) setHash("#/");
  render();
});
