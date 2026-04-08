import "./style.css";
import { supabase } from "./supabase";

const product = {
  id: 1,
  name: "MONSTA X Unfold 美國通路代購",
  image: "public/MONSTA_X_US_Album_-_Unfold_Cover.webp",
  description: "請先選擇版本與通路",
};

const pricingTable = [
  { version: "Digipack Ver. 個人封隨機出貨", spec: "Barnes & Noble", price: 810 },
  { version: "Heartbreak", spec: "Barnes & Noble", price: 1200 },
  { version: "Thirst", spec: "Barnes & Noble", price: 1200 },
  { version: "Alive", spec: "Barnes & Noble", price: 1200 },
  { version: "Heal", spec: "Barnes & Noble", price: 1200 },

  { version: "Digipack Ver. 個人封隨機出貨", spec: "POP-UP", price: 950 },
  { version: "Heartbreak", spec: "POP-UP", price: 1400 },
  { version: "Thirst", spec: "POP-UP", price: 1400 },
  { version: "Alive", spec: "POP-UP", price: 1400 },
  { version: "Heal", spec: "POP-UP", price: 1400 },

  { version: "Digipack Ver. 個人封隨機出貨", spec: "Target", price: 810 },
  { version: "Heartbreak", spec: "Target", price: 1230 },
  { version: "Thirst", spec: "Target", price: 1230 },
  { version: "Alive", spec: "Target", price: 1230 },
  { version: "Heal", spec: "Target", price: 1230 },

  { version: "Digipack Ver. 個人封隨機出貨", spec: "Walmart", price: 810 },
  { version: "Heartbreak", spec: "Walmart", price: 1230 },
  { version: "Thirst", spec: "Walmart", price: 1230 },
  { version: "Alive", spec: "Walmart", price: 1230 },
  { version: "Heal", spec: "Walmart", price: 1230 },

  { version: "Digipack Ver. 個人封隨機出貨", spec: "hello82", price: 810 },
  { version: "Heartbreak", spec: "hello82", price: 1400 },
  { version: "Thirst", spec: "hello82", price: 1400 },
  { version: "Alive", spec: "hello82", price: 1400 },
  { version: "Heal", spec: "hello82", price: 1400 },

  { version: "Heartbreak", spec: "簽專", price: 1450 },
  { version: "Thirst", spec: "簽專", price: 1450 },
  { version: "Alive", spec: "簽專", price: 1450 },
  { version: "Heal", spec: "簽專", price: 1450 },
];

let cart = [];
let ordersCache = [];
let selectedVersion = "";
let selectedSpec = "";
let quantity = 1;

function getPage() {
  if (window.location.hash === "#/cart") return "cart";
  if (window.location.hash === "#/admin") return "admin";
  if (window.location.hash === "#/success") return "success";
  return "product";
}

function currency(n) {
  return `NT$${n}`;
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function cartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getVersions() {
  return [...new Set(pricingTable.map((item) => item.version))];
}

function getSpecsByVersion(version) {
  return pricingTable
    .filter((item) => item.version === version)
    .map((item) => item.spec);
}

function getPrice(version, spec) {
  const found = pricingTable.find(
    (item) => item.version === version && item.spec === spec
  );
  return found ? found.price : 0;
}

function addToCart() {
  if (!selectedVersion || !selectedSpec) {
    alert("請先選擇版本與通路");
    return;
  }

  const matchedPrice = getPrice(selectedVersion, selectedSpec);

  if (!matchedPrice) {
    alert("找不到這個版本與通路的價格");
    return;
  }

  const cartKey = `${selectedVersion}-${selectedSpec}`;
  const found = cart.find((item) => item.cartKey === cartKey);

  if (found) {
    found.quantity += quantity;
  } else {
    cart.push({
      cartKey,
      name: product.name,
      version: selectedVersion,
      spec: selectedSpec,
      quantity,
      price: matchedPrice,
    });
  }

  quantity = 1;
  alert("已加入購物車");
  render();
}

function updateCartQuantity(cartKey, nextQuantity) {
  if (nextQuantity <= 0) {
    cart = cart.filter((item) => item.cartKey !== cartKey);
  } else {
    cart = cart.map((item) =>
      item.cartKey === cartKey ? { ...item, quantity: nextQuantity } : item
    );
  }
  render();
}

function removeCartItem(cartKey) {
  cart = cart.filter((item) => item.cartKey !== cartKey);
  render();
}

async function submitOrder(e) {
  e.preventDefault();

  const form = new FormData(e.target);
  const socialName = form.get("socialName")?.trim();
  const igAccount = form.get("igAccount")?.trim();
  const email = form.get("email")?.trim();
  const transferTime = form.get("transferTime")?.trim();
  const accountLast5 = form.get("accountLast5")?.trim();

  if (!socialName || !igAccount || !email || !transferTime || !accountLast5 || cart.length === 0) {
    alert("請填完所有必填欄位");
    return;
  }

  const totalAmount = cartSubtotal();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        order_code: `GO-${Date.now()}`,
        social_name: socialName,
        email,
        social_account: igAccount,
        transfer_time: `${transferTime} / 末5碼:${accountLast5}`,
        status: "待確認",
        payment_status: "已填匯款",
        shipping_status: "未出貨",
        total_amount: totalAmount,
      },
    ])
    .select()
    .single();

  if (orderError) {
    alert(`送出訂單失敗: ${orderError.message}`);
    return;
  }

  const itemsPayload = cart.map((item) => ({
    order_id: order.id,
    product_name: item.name,
    version: item.version,
    spec: item.spec,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  const { error: itemError } = await supabase.from("order_items").insert(itemsPayload);

  if (itemError) {
    alert(`訂單明細寫入失敗: ${itemError.message}`);
    return;
  }

  cart = [];
  window.location.hash = "#/success";
  render();
}

async function loginAdmin(e) {
  e.preventDefault();
  const form = new FormData(e.target);
  const email = form.get("email");
  const password = form.get("password");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert(`登入失敗: ${error.message}`);
    return;
  }

  await loadOrders();
  render();
}

async function logoutAdmin() {
  await supabase.auth.signOut();
  ordersCache = [];
  window.location.hash = "#/";
  render();
}

async function isAdmin() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return false;

  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", session.user.id)
    .maybeSingle();

  return !error && !!data;
}

async function loadOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_code,
      created_at,
      social_name,
      email,
      social_account,
      transfer_time,
      status,
      payment_status,
      shipping_status,
      total_amount,
      order_items (
        id,
        product_name,
        version,
        spec,
        quantity,
        unit_price,
        subtotal
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    alert(`讀取訂單失敗: ${error.message}`);
    return;
  }

  ordersCache = data || [];
}

async function updateOrderField(id, field, value) {
  const { error } = await supabase.from("orders").update({ [field]: value }).eq("id", id);

  if (error) {
    alert(`更新失敗: ${error.message}`);
    return;
  }

  await loadOrders();
  render();
}

function exportOrdersToCSV(orders) {
  const rows = [[
    "訂單編號",
    "建立時間",
    "社群中暱稱",
    "Email",
    "IG帳號",
    "匯款時間與帳號末5碼",
    "訂單狀態",
    "付款狀態",
    "出貨狀態",
    "商品名稱",
    "版本",
    "通路",
    "數量",
    "單價",
    "小計",
    "訂單總額"
  ]];

  orders.forEach((order) => {
    order.order_items.forEach((item) => {
      rows.push([
        order.order_code,
        order.created_at,
        order.social_name,
        order.email,
        order.social_account,
        order.transfer_time,
        order.status,
        order.payment_status,
        order.shipping_status,
        item.product_name,
        item.version,
        item.spec,
        item.quantity,
        item.unit_price,
        item.subtotal,
        order.total_amount
      ]);
    });
  });

  const csv = rows
    .map((row) =>
      row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function render() {
  const app = document.querySelector("#app");
  const page = getPage();
  const admin = await isAdmin();

  if (page === "product") {
    const currentPrice = getPrice(selectedVersion, selectedSpec);

    app.innerHTML = `
      <div class="wrap">
        <h1>MONSTA X US Album Unfold 代購</h1>
        <p>正式資料庫版</p>

        <div class="nav">
          <button id="goProduct">商品頁</button>
          <button id="goCart">購物車 (${cartCount()})</button>
        </div>

        <div class="card">
          <img src="${product.image}" alt="${product.name}" class="hero-image" />
          <h2>${product.name}</h2>
          <p>${product.description}</p>
          <p class="price">${currentPrice ? currency(currentPrice) : "請先選擇版本與通路"}</p>

          <label>版本</label>
          <select id="versionSelect">
            <option value="">請選擇版本</option>
            ${getVersions()
              .map(
                (v) =>
                  `<option value="${v}" ${selectedVersion === v ? "selected" : ""}>${v}</option>`
              )
              .join("")}
          </select>

          <label>通路</label>
          <select id="specSelect">
            <option value="">請選擇通路</option>
            ${getSpecsByVersion(selectedVersion)
              .map(
                (s) =>
                  `<option value="${s}" ${selectedSpec === s ? "selected" : ""}>${s}</option>`
              )
              .join("")}
          </select>

          <label>數量</label>
          <div class="qty-row">
            <button id="minusQty" type="button">-</button>
            <span>${quantity}</span>
            <button id="plusQty" type="button">+</button>
          </div>

          <p>目前小計：${currency((currentPrice || 0) * quantity)}</p>

          <button id="addCart" type="button">加入購物車</button>
        </div>
      </div>
    `;

    document.querySelector("#goProduct").onclick = () => {
      window.location.hash = "#/";
    };

    document.querySelector("#goCart").onclick = () => {
      window.location.hash = "#/cart";
    };

    document.querySelector("#versionSelect").onchange = (e) => {
      selectedVersion = e.target.value;
      selectedSpec = "";
      render();
    };

    document.querySelector("#specSelect").onchange = (e) => {
      selectedSpec = e.target.value;
      render();
    };

    document.querySelector("#minusQty").onclick = () => {
      quantity = Math.max(1, quantity - 1);
      render();
    };

    document.querySelector("#plusQty").onclick = () => {
      quantity += 1;
      render();
    };

    document.querySelector("#addCart").onclick = addToCart;
    return;
  }

  if (page === "cart") {
    app.innerHTML = `
      <div class="wrap">
        <h1>購物車 / 結帳</h1>
        <div class="nav">
          <button id="backProduct">回商品頁</button>
        </div>

        <div class="grid">
          <div class="card">
            <h2>購物車內容</h2>
            ${
              cart.length === 0
                ? "<p>購物車目前是空的</p>"
                : cart.map(item => `
                  <div class="cart-item">
                    <strong>${item.name}</strong>
                    <div>版本：${item.version}</div>
                    <div>通路：${item.spec}</div>
                    <div>單價：${currency(item.price)}</div>

                    <div class="qty-row">
                      <button type="button" data-minus="${item.cartKey}">-</button>
                      <span>${item.quantity}</span>
                      <button type="button" data-plus="${item.cartKey}">+</button>
                    </div>

                    <div>小計：${currency(item.price * item.quantity)}</div>
                    <button type="button" class="remove-btn" data-remove="${item.cartKey}">刪除</button>
                  </div>
                `).join("")
            }
          </div>

          <div class="card">
            <h2>訂單資料</h2>
            <p class="notice">請先匯款再送出訂單</p>
            <p>總金額：${currency(cartSubtotal())}</p>

            <form id="checkoutForm">
              <input name="socialName" placeholder="社群中暱稱" required />
              <input name="igAccount" placeholder="IG帳號：例如@monsta" required />
              <input name="email" type="email" placeholder="Email" required />
              <input name="transferTime" placeholder="匯款時間" required />
              <input name="accountLast5" placeholder="匯款帳號末5碼" maxlength="5" required />
              <button type="submit">送出訂單</button>
            </form>
          </div>
        </div>
      </div>
    `;

    document.querySelector("#backProduct").onclick = () => {
      window.location.hash = "#/";
    };

    document.querySelectorAll("[data-minus]").forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.minus;
        const item = cart.find((i) => i.cartKey === key);
        updateCartQuantity(key, (item?.quantity || 1) - 1);
      };
    });

    document.querySelectorAll("[data-plus]").forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.plus;
        const item = cart.find((i) => i.cartKey === key);
        updateCartQuantity(key, (item?.quantity || 1) + 1);
      };
    });

    document.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.onclick = () => removeCartItem(btn.dataset.remove);
    });

    document.querySelector("#checkoutForm").onsubmit = submitOrder;
    return;
  }

  if (page === "success") {
    app.innerHTML = `
      <div class="wrap narrow">
        <div class="card">
          <h1>收到訂單！</h1>
          <p>請至社群內查看對帳表</p>
          <button id="backHome">回商品頁</button>
        </div>
      </div>
    `;

    document.querySelector("#backHome").onclick = () => {
      window.location.hash = "#/";
    };
    return;
  }

  if (!admin) {
    app.innerHTML = `
      <div class="wrap narrow">
        <div class="card">
          <h1>Admin Login</h1>
          <form id="adminLoginForm">
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">登入</button>
          </form>
        </div>
      </div>
    `;

    document.querySelector("#adminLoginForm").onsubmit = loginAdmin;
    return;
  }

  await loadOrders();

  app.innerHTML = `
    <div class="wrap">
      <div class="topbar">
        <h1>訂單管理後台</h1>
        <div class="actions">
          <button id="exportCsv">匯出 CSV</button>
          <button id="logoutBtn">登出</button>
        </div>
      </div>

      ${ordersCache.map(order => `
        <div class="card order-card">
          <h2>${order.order_code}</h2>
          <p>建立時間：${order.created_at}</p>
          <p>社群中暱稱：${order.social_name}</p>
          <p>Email：${order.email}</p>
          <p>IG帳號：${order.social_account}</p>
          <p>匯款資訊：${order.transfer_time}</p>
          <p>總額：${currency(order.total_amount)}</p>

          <div class="select-grid">
            <select data-order="${order.id}" data-field="status">
              ${["待確認","已確認","已完成"].map(v => `<option value="${v}" ${order.status === v ? "selected" : ""}>${v}</option>`).join("")}
            </select>

            <select data-order="${order.id}" data-field="payment_status">
              ${["已填匯款","已對帳"].map(v => `<option value="${v}" ${order.payment_status === v ? "selected" : ""}>${v}</option>`).join("")}
            </select>

            <select data-order="${order.id}" data-field="shipping_status">
              ${["未出貨","備貨中","已出貨"].map(v => `<option value="${v}" ${order.shipping_status === v ? "selected" : ""}>${v}</option>`).join("")}
            </select>
          </div>

          <div class="items">
            ${order.order_items.map(item => `
              <div class="item-box">
                <div>${item.product_name}</div>
                <div>版本：${item.version}</div>
                <div>通路：${item.spec}</div>
                <div>數量：${item.quantity}</div>
                <div>單價：${currency(item.unit_price)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;

  document.querySelector("#logoutBtn").onclick = logoutAdmin;
  document.querySelector("#exportCsv").onclick = () => exportOrdersToCSV(ordersCache);

  document.querySelectorAll("select[data-order]").forEach((select) => {
    select.onchange = () => updateOrderField(select.dataset.order, select.dataset.field, select.value);
  });
}

window.addEventListener("hashchange", render);
render();