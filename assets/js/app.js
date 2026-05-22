let app;
let cart = [];
let lastAppSync = localStorage.getItem("johnvisionseg_app_pro_updated_at") || "";

const grid = document.getElementById("productsGrid");
const search = document.getElementById("searchInput");
const filter = document.getElementById("categoryFilter");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

function applySettings() {
  document.querySelectorAll("[data-setting]").forEach((el) => {
    const key = el.getAttribute("data-setting");
    if (app.settings[key]) el.textContent = app.settings[key];
  });
  document.getElementById("whatsappFloat").href = app.settings.whatsappLink;
  renderMaintenanceMode();
  renderPaymentOptions();
}

function renderMaintenanceMode() {
  const screen = document.getElementById("maintenanceScreen");
  const content = document.getElementById("storeContent");
  if (!screen || !content || !app?.settings) return;
  const active = Boolean(app.settings.maintenanceMode);
  screen.hidden = !active;
  content.hidden = active;
  document.body.classList.toggle("maintenance-active", active);
  const title = document.getElementById("maintenanceTitle");
  const message = document.getElementById("maintenanceMessage");
  const whatsapp = document.getElementById("maintenanceWhatsapp");
  if (title) title.textContent = app.settings.maintenanceTitle || "Loja em manutencao";
  if (message) message.textContent = app.settings.maintenanceMessage || "Estamos ajustando a vitrine. Volte em breve.";
  if (whatsapp) whatsapp.href = app.settings.whatsappLink || "#";
}

function renderServices() {
  const target = document.getElementById("servicesGrid");
  if (!target) return;
  target.innerHTML = app.services.map((service) => `
    <article class="card">
      <h3>${escapeHtml(service.title)}</h3>
      <p>${escapeHtml(service.desc)}</p>
      <span class="meta">Atendimento especializado</span>
    </article>
  `).join("");
}

function renderPortfolio() {
  const target = document.getElementById("portfolioGrid");
  if (!target) return;
  target.innerHTML = app.portfolio.map((item) => `
    <article class="card">
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.category)}</p>
      <span class="meta">Projeto entregue</span>
    </article>
  `).join("");
}

function renderTestimonials() {
  const target = document.getElementById("testimonialsGrid");
  if (!target) return;
  target.innerHTML = app.testimonials.map((testimonial) => `
    <article class="card">
      <h3>${escapeHtml(testimonial.name)}</h3>
      <p aria-label="Avaliação 5 de 5">★★★★★</p>
      <p>${escapeHtml(testimonial.text)}</p>
    </article>
  `).join("");
}

function renderCategories() {
  const categories = [...new Set(app.products.map((product) => product.category).filter(Boolean))];
  filter.innerHTML = '<option value="">Todas as categorias</option>' + categories.map((category) => `<option>${escapeHtml(category)}</option>`).join("");
}

function renderProducts() {
  const query = search.value.toLowerCase().trim();
  const category = filter.value;
  const products = app.products.filter((product) => {
    const content = `${product.name} ${product.desc} ${product.category}`.toLowerCase();
    return (!category || product.category === category) && (!query || content.includes(query));
  });

  grid.innerHTML = products.length ? products.map((product) => `
    <article class="product-card">
      ${renderProductMedia(product)}
      <div class="product-topline">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <span class="stock ${product.stock <= 0 ? "out" : product.stock <= product.minStock ? "low" : ""}">
          ${product.stock <= 0 ? "Esgotado" : "Pronta entrega"}
        </span>
      </div>
      <div class="product-badges">
        <span>Compra assistida</span>
        <span>Suporte tecnico</span>
      </div>
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(product.desc)}</p>
      ${renderProductSpecs(product)}
      <div class="product-sale-panel">
        <div>
          <span class="price-label">Valor de venda</span>
          <div class="price">${brl(product.price)}</div>
        </div>
        <span class="stock-count">${product.stock <= 0 ? "Sem estoque" : `${product.stock} un.`}</span>
      </div>
      <div class="product-actions">
        <button class="btn primary sale-button" ${product.stock <= 0 ? "disabled" : ""} onclick="buyNow(${Number(product.id)})">Comprar agora</button>
        <button class="btn secondary cart-mini-button" ${product.stock <= 0 ? "disabled" : ""} onclick="addToCart(${Number(product.id)})">Adicionar</button>
        ${renderMercadoLivreButton(product)}
      </div>
    </article>
  `).join("") : '<div class="empty-state">Nenhum produto encontrado para essa busca.</div>';
}

function renderProductMedia(product) {
  const images = getProductImages(product);
  return `
    <div class="product-gallery" data-product-gallery="${Number(product.id)}">
      <div class="product-img has-photo">
        <img src="${escapeHtml(images[0])}" alt="${escapeHtml(product.name)}" loading="lazy" data-product-main="${Number(product.id)}">
        <span class="image-hover-preview" aria-hidden="true">
          <img src="${escapeHtml(images[0])}" alt="" data-product-preview="${Number(product.id)}">
        </span>
      </div>
      ${images.length > 1 ? `
        <div class="product-thumbs" aria-label="Imagens do produto">
          ${images.map((image, index) => `
            <button class="${index === 0 ? "active" : ""}" type="button" onclick="changeProductImage(${Number(product.id)}, ${index})" aria-label="Ver imagem ${index + 1}">
              <img src="${escapeHtml(image)}" alt="">
            </button>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

function getProductImages(product) {
  const images = Array.isArray(product.images) ? product.images : [];
  const all = [...images, product.imageUrl].map((item) => String(item || "").trim()).filter(Boolean);
  const unique = [...new Set(all)].slice(0, 3);
  return unique.length ? unique : [getProductFallbackImage(product)];
}

function changeProductImage(productId, imageIndex) {
  const product = app.products.find((item) => Number(item.id) === Number(productId));
  if (!product) return;
  const images = getProductImages(product);
  const image = images[imageIndex];
  if (!image) return;
  const main = document.querySelector(`[data-product-main="${Number(productId)}"]`);
  if (main) main.src = image;
  const preview = document.querySelector(`[data-product-preview="${Number(productId)}"]`);
  if (preview) preview.src = image;
  document.querySelectorAll(`[data-product-gallery="${Number(productId)}"] .product-thumbs button`).forEach((button, index) => {
    button.classList.toggle("active", index === imageIndex);
  });
}

function getProductFallbackImage(product) {
  const text = removeAccents(`${product.category || ""} ${product.name || ""}`).toLowerCase();
  if (text.includes("ptz")) return "assets/images/product-ptz.svg";
  if (text.includes("kit cftv") || text.includes("cftv")) return "assets/images/product-kit-cftv.svg";
  if (text.includes("dvr") || text.includes("gravador")) return "assets/images/product-dvr.svg";
  if (text.includes("alarme")) return "assets/images/product-alarm.svg";
  if (text.includes("cerca")) return "assets/images/product-fence.svg";
  if (text.includes("acesso") || text.includes("porteiro")) return "assets/images/product-access.svg";
  return "assets/images/product-camera.svg";
}

function removeAccents(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function renderProductSpecs(product) {
  const specs = Array.isArray(product.specs) ? product.specs.filter(Boolean) : [];
  if (!specs.length) return "";
  return `<ul class="product-specs">${specs.slice(0, 4).map((spec) => `<li>${escapeHtml(spec)}</li>`).join("")}</ul>`;
}

function renderMercadoLivreButton(product) {
  if (!product.mercadoLivreUrl) return "";
  return `<a class="btn ml-btn" href="${escapeHtml(withMercadoLivreAffiliate(product.mercadoLivreUrl))}" target="_blank" rel="noopener">Ver no Mercado Livre</a>`;
}

function withMercadoLivreAffiliate(url) {
  const tag = window.JOHNVISIONSEG_MERCADO_LIVRE?.affiliateTag;
  if (!tag) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("matt_tool", tag);
    return parsed.toString();
  } catch (error) {
    return url;
  }
}

function addToCart(id) {
  const product = app.products.find((item) => item.id === id);
  if (!product || product.stock <= 0) return;
  const item = cart.find((cartItem) => cartItem.id === id);
  if (item) {
    if (item.qty < product.stock) item.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  renderCart();
  openCart();
}

function buyNow(id) {
  const product = app.products.find((item) => item.id === id);
  if (!product || product.stock <= 0) return;
  const message = [
    "Ola! Vi este produto na loja online John@VisionSeg e quero comprar.",
    "",
    `Produto: ${product.name}`,
    `Categoria: ${product.category}`,
    `Valor: ${brl(product.price)}`,
    `Estoque informado: ${product.stock || 0} un.`,
    "",
    "Pode confirmar disponibilidade, formas de pagamento, entrega/retirada e se esse modelo atende meu ambiente?"
  ].join("\n");
  window.open(buildWhatsAppUrl(message), "_blank", "noopener");
}

function buildWhatsAppUrl(message) {
  const base = app.settings.whatsappLink || "";
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}text=${encodeURIComponent(message)}`;
}

function renderCart() {
  document.getElementById("cartCount").textContent = cart.reduce((total, item) => total + item.qty, 0);
  document.getElementById("cartItems").innerHTML = cart.length ? cart.map((item) => `
    <div class="cart-line">
      <div>
        <strong>${escapeHtml(item.name)}</strong><br>
        ${item.qty} x ${brl(item.price)}
      </div>
      <div class="qty-actions">
        <button type="button" onclick="changeQty(${Number(item.id)}, -1)" aria-label="Diminuir quantidade">-</button>
        <button type="button" onclick="changeQty(${Number(item.id)}, 1)" aria-label="Aumentar quantidade">+</button>
      </div>
    </div>
  `).join("") : '<p class="empty-state">Carrinho vazio.</p>';
  document.getElementById("cartTotal").textContent = brl(cart.reduce((total, item) => total + item.price * item.qty, 0));
  renderPaymentOptions();
}

function getCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.qty, 0);
}

function renderPaymentOptions() {
  const pixBtn = document.getElementById("copyPixBtn");
  const linkBtn = document.getElementById("paymentLinkBtn");
  const info = document.getElementById("paymentInfo");
  if (!pixBtn || !linkBtn || !info || !app?.settings) return;

  const hasPix = Boolean(String(app.settings.pixKey || "").trim());
  const hasLink = Boolean(String(app.settings.paymentLink || "").trim());
  pixBtn.disabled = !hasPix;
  linkBtn.disabled = !hasLink || !cart.length;
  pixBtn.textContent = hasPix ? "Copiar chave Pix" : "Pix nao configurado";
  linkBtn.textContent = hasLink ? "Pagar com cartao/link" : "Link nao configurado";

  const details = [];
  if (hasPix) details.push(`Pix: ${app.settings.pixName || app.settings.companyName || "John@VisionSeg"}`);
  if (hasLink) details.push("Cartao/link de pagamento disponivel");
  if (!cart.length) details.push("Adicione produtos ao carrinho para pagar");
  info.textContent = details.length ? details.join(" | ") : "Configure Pix ou link de pagamento no painel.";
}

async function copyPixKey() {
  const key = String(app.settings.pixKey || "").trim();
  if (!key) return alert("Chave Pix nao configurada no painel.");
  const text = [
    key,
    "",
    `Recebedor: ${app.settings.pixName || app.settings.companyName || "John@VisionSeg"}`,
    `Valor do pedido: ${brl(getCartTotal())}`,
    app.settings.paymentInstructions || ""
  ].filter(Boolean).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    alert("Chave Pix copiada. Depois do pagamento, envie o comprovante pelo WhatsApp.");
  } catch {
    window.prompt("Copie a chave Pix:", key);
  }
}

function openPaymentLink() {
  const link = String(app.settings.paymentLink || "").trim();
  if (!link) return alert("Link de pagamento nao configurado no painel.");
  if (!cart.length) return alert("Adicione produtos ao carrinho antes de pagar.");
  window.open(addPaymentLinkParams(link), "_blank", "noopener");
}

function addPaymentLinkParams(link) {
  try {
    const url = new URL(link);
    url.searchParams.set("amount", String(getCartTotal().toFixed(2)));
    url.searchParams.set("reference", `JV-${Date.now()}`);
    return url.toString();
  } catch {
    return link;
  }
}

function changeQty(id, delta) {
  const item = cart.find((cartItem) => cartItem.id === id);
  const product = app.products.find((productItem) => productItem.id === id);
  if (!item || !product) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((cartItem) => cartItem.id !== id);
  if (item.qty > product.stock) item.qty = product.stock;
  renderCart();
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartOverlay.hidden = false;
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
}

async function checkout() {
  if (!cart.length) return alert("Carrinho vazio.");
  const name = document.getElementById("customerName").value.trim() || "Cliente";
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const order = { id: Date.now(), date: new Date().toLocaleString("pt-BR"), name, phone, address, total, status: "Novo", items: cart };
  app.orders.unshift(order);
  app.customers.unshift({ name, phone, address, date: order.date, type: "Compra" });
  cart.forEach((item) => {
    const product = app.products.find((productItem) => productItem.id === item.id);
    if (product) product.stock = Math.max(0, product.stock - item.qty);
  });
  saveApp(app);
  const message = [
    "Ola! Quero fechar este pedido na John@VisionSeg.",
    "",
    `Cliente: ${name}`,
    `Telefone: ${phone}`,
    `Endereco/Obs: ${address}`,
    "",
    "Itens:",
    ...cart.map((item) => `- ${item.qty}x ${item.name} = ${brl(item.price * item.qty)}`),
    "",
    `Total: ${brl(total)}`,
    app.settings.pixKey ? `Pix: ${app.settings.pixKey}` : "",
    app.settings.paymentLink ? `Link de pagamento: ${app.settings.paymentLink}` : "",
    app.settings.paymentInstructions ? `Instrucao: ${app.settings.paymentInstructions}` : "",
    "",
    "Pode confirmar disponibilidade, pagamento e entrega?"
  ].filter((line) => line !== "").join("\n");
  cart = [];
  renderCart();
  renderProducts();
  closeCart();
  window.open(buildWhatsAppUrl(message), "_blank", "noopener");
  alert("Pedido salvo e enviado para o WhatsApp.");
}

function bindEvents() {
  document.getElementById("cartBtn").onclick = openCart;
  const heroCartBtn = document.getElementById("heroCartBtn");
  if (heroCartBtn) heroCartBtn.onclick = openCart;
  document.getElementById("closeCart").onclick = closeCart;
  cartOverlay.onclick = closeCart;
  search.oninput = renderProducts;
  filter.onchange = renderProducts;
  document.getElementById("checkoutBtn").onclick = checkout;
  document.getElementById("copyPixBtn").onclick = copyPixKey;
  document.getElementById("paymentLinkBtn").onclick = openPaymentLink;
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCart();
  });
  document.getElementById("quoteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target).entries());
    data.id = Date.now();
    data.date = new Date().toLocaleString("pt-BR");
    data.status = "Novo";
    app.quotes.unshift(data);
    app.customers.unshift({ name: data.name, phone: data.phone, address: "", date: data.date, type: "Orcamento" });
    saveApp(app);
    const quoteMessage = [
      "Ola! Preciso de uma indicacao de produto de seguranca.",
      "",
      `Nome: ${data.name}`,
      `Telefone: ${data.phone}`,
      `Interesse: ${data.service}`,
      `Mensagem: ${data.message || "Nao informado"}`
    ].join("\n");
    window.open(buildWhatsAppUrl(quoteMessage), "_blank", "noopener");
    alert("Solicitacao salva e enviada para o WhatsApp.");
    event.target.reset();
  });
}

function renderAll() {
  applySettings();
  renderServices();
  renderPortfolio();
  renderTestimonials();
  renderCategories();
  renderProducts();
  renderCart();
}

function reloadStorefrontFromLocal() {
  try {
    const saved = localStorage.getItem("johnvisionseg_app_pro");
    if (!saved) return;
    app = normalizeTextEncoding(mergeAppData(JSON.parse(saved)));
    renderMaintenanceMode();
    renderCategories();
    renderProducts();
    renderPaymentOptions();
  } catch (error) {
    console.warn("Nao foi possivel atualizar vitrine:", error);
  }
}

function bindDataSync() {
  window.addEventListener("storage", (event) => {
    if (event.key !== "johnvisionseg_app_pro_updated_at") return;
    if (event.newValue === lastAppSync) return;
    lastAppSync = event.newValue || "";
    reloadStorefrontFromLocal();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    const currentSync = localStorage.getItem("johnvisionseg_app_pro_updated_at") || "";
    if (currentSync && currentSync !== lastAppSync) {
      lastAppSync = currentSync;
      reloadStorefrontFromLocal();
    }
  });
}

async function boot() {
  app = await loadAppData();
  app = normalizeTextEncoding(app);
  bindEvents();
  bindDataSync();
  renderAll();
}

boot();

function normalizeTextEncoding(value) {
  if (typeof value === "string") return fixMojibake(value);
  if (Array.isArray(value)) return value.map(normalizeTextEncoding);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeTextEncoding(item)]));
}

function fixMojibake(value) {
  if (!/[ÃÂâ]/.test(value)) return value;
  try {
    return decodeURIComponent(escape(value));
  } catch (error) {
    return value;
  }
}
