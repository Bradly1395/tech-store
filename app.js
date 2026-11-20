const PRODUCTS = [
  { id: "air-14", name: "Aero 14 Laptop", cat: "computing", spec: "14\" display · 16GB · 512GB SSD", price: 1199, img: "images/laptop.jpg", tag: "Bestseller" },
  { id: "hush-pro", name: "Hush Pro Headphones", cat: "audio", spec: "Noise cancelling · 40h battery", price: 279, was: 329, img: "images/headphones.jpg", tag: "Sale" },
  { id: "pixel-s", name: "Slate S Phone", cat: "mobile", spec: "6.1\" OLED · Triple camera · 256GB", price: 849, img: "images/phone.jpg", tag: "New" },
  { id: "pulse-2", name: "Pulse 2 Watch", cat: "mobile", spec: "Heart rate · GPS · 7-day battery", price: 249, img: "images/watch.jpg" },
  { id: "pod-mini", name: "Pod Mini Earbuds", cat: "audio", spec: "Wireless charging · IPX4", price: 129, img: "images/earbuds.jpg" },
  { id: "key-75", name: "Type 75 Keyboard", cat: "computing", spec: "Hot-swap · Tactile switches · USB-C", price: 159, img: "images/keyboard.jpg", tag: "Staff pick" },
];

const FREE_SHIP = 99;
const SHIP_COST = 9;
const CAT_LABEL = { computing: "Computing", mobile: "Mobile", audio: "Audio" };
const fmt = (n) => "$" + n.toLocaleString("en-US");
const $ = (s) => document.querySelector(s);

const state = {
  cat: "all",
  sort: "featured",
  cart: JSON.parse(localStorage.getItem("nw-cart") || "{}"),
};

/* ---------- Products ---------- */
function renderProducts() {
  let list = PRODUCTS.filter((p) => state.cat === "all" || p.cat === state.cat);
  if (state.sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);

  $("#result-count").textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  $("#product-grid").innerHTML = list
    .map(
      (p, i) => `
    <li class="card" style="animation-delay:${i * 60}ms">
      <div class="card-media">
        <img src="${p.img}" alt="${p.name}" loading="lazy" width="1024" height="1024" />
        ${p.tag ? `<span class="tag ${p.was ? "sale" : ""}">${p.tag}</span>` : ""}
      </div>
      <div class="card-body">
        <span class="card-cat">${CAT_LABEL[p.cat]}</span>
        <h3>${p.name}</h3>
        <p class="card-spec">${p.spec}</p>
        <div class="card-foot">
          <span class="price">${fmt(p.price)}${p.was ? `<s>${fmt(p.was)}</s>` : ""}</span>
          <button class="add-btn" id="add-${p.id}" data-id="${p.id}" aria-label="Add ${p.name} to cart">
            <span>Add</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
      </div>
    </li>`
    )
    .join("");
}

$("#category-chips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.cat = chip.dataset.cat;
  document.querySelectorAll(".chip").forEach((c) => {
    const on = c === chip;
    c.classList.toggle("is-active", on);
    c.setAttribute("aria-selected", on);
  });
  renderProducts();
});

$("#sort-select").addEventListener("change", (e) => {
  state.sort = e.target.value;
  renderProducts();
});

$("#product-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (!btn) return;
  addToCart(btn.dataset.id);
  const label = btn.querySelector("span");
  btn.classList.add("added");
  label.textContent = "Added";
  setTimeout(() => {
    btn.classList.remove("added");
    label.textContent = "Add";
  }, 1200);
});

/* ---------- Cart ---------- */
function saveCart() {
  localStorage.setItem("nw-cart", JSON.stringify(state.cart));
}

function addToCart(id) {
  state.cart[id] = (state.cart[id] || 0) + 1;
  saveCart();
  renderCart();
  const count = $("#cart-count");
  count.classList.remove("bump");
  void count.offsetWidth;
  count.classList.add("bump");
  toast(`${PRODUCTS.find((p) => p.id === id).name} added to cart`);
}

function setQty(id, qty) {
  if (qty <= 0) delete state.cart[id];
  else state.cart[id] = qty;
  saveCart();
  renderCart();
}

function renderCart() {
  const entries = Object.entries(state.cart);
  const items = entries.map(([id, qty]) => ({ ...PRODUCTS.find((p) => p.id === id), qty })).filter((i) => i.id);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  $("#cart-count").textContent = count;
  $("#cart-drawer").classList.toggle("empty", count === 0);
  $("#cart-subtotal").textContent = fmt(subtotal);
  $("#cart-shipping").textContent = subtotal >= FREE_SHIP ? "Free" : fmt(SHIP_COST);

  const remaining = Math.max(0, FREE_SHIP - subtotal);
  $("#ship-text").textContent = remaining ? `Add ${fmt(remaining)} more for free shipping` : "You've unlocked free shipping";
  $("#ship-meter").classList.toggle("done", !remaining);
  $("#ship-bar").style.width = Math.min(100, (subtotal / FREE_SHIP) * 100) + "%";

  $("#cart-items").innerHTML = items
    .map(
      (i) => `
    <li class="cart-item">
      <img src="${i.img}" alt="" />
      <div>
        <h3>${i.name}</h3>
        <p class="muted">${fmt(i.price)}</p>
        <div class="qty">
          <button data-act="dec" data-id="${i.id}" id="dec-${i.id}" aria-label="Decrease quantity">−</button>
          <span>${i.qty}</span>
          <button data-act="inc" data-id="${i.id}" id="inc-${i.id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="item-right">
        <strong>${fmt(i.price * i.qty)}</strong>
        <button class="remove-btn" data-act="rm" data-id="${i.id}" id="rm-${i.id}">Remove</button>
      </div>
    </li>`
    )
    .join("");
}

$("#cart-items").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const { id, act } = btn.dataset;
  const q = state.cart[id] || 0;
  if (act === "inc") setQty(id, q + 1);
  if (act === "dec") setQty(id, q - 1);
  if (act === "rm") setQty(id, 0);
});

const drawer = $("#cart-drawer");
const overlay = $("#cart-overlay");

function openCart() {
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("is-open"));
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  $("#cart-close-btn").focus();
}

function closeCart() {
  overlay.classList.remove("is-open");
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setTimeout(() => (overlay.hidden = true), 300);
}

$("#cart-open-btn").addEventListener("click", openCart);
$("#cart-close-btn").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => e.key === "Escape" && drawer.classList.contains("is-open") && closeCart());
$("#cart-browse-btn").addEventListener("click", () => {
  closeCart();
  $("#shop").scrollIntoView({ behavior: "smooth" });
});

$("#checkout-btn").addEventListener("click", () => {
  state.cart = {};
  saveCart();
  renderCart();
  closeCart();
  toast("Order placed — thank you! (demo)");
});

/* ---------- Misc ---------- */
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

$("#newsletter-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = $("#newsletter-email");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
  input.classList.toggle("invalid", !ok);
  if (!ok) return toast("Please enter a valid email");
  input.value = "";
  toast("You're subscribed. Welcome aboard!");
});

const header = $("#site-header");
window.addEventListener("scroll", () => header.classList.toggle("is-scrolled", window.scrollY > 8), { passive: true });

renderProducts();
renderCart();
