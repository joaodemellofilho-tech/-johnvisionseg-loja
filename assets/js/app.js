let app;
let cart = [];
const CART_STORAGE_KEY = "johnvisionseg_cart";
let lastAppSync = localStorage.getItem("johnvisionseg_app_pro_updated_at") || "";
let cardPaymentOrder = null;
let selectedPaymentMethod = "link";

const grid = document.getElementById("productsGrid");
const search = document.getElementById("searchInput");
const headerSearch = document.getElementById("headerSearchInput");
const filter = document.getElementById("categoryFilter");
const sortProducts = document.getElementById("sortProducts");
const productsCount = document.getElementById("productsCount");
const categoryStrip = document.getElementById("categoryStrip");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const checkoutPage = document.getElementById("checkoutPage");
let promoSlideIndex = 0;
let promoTimer = null;
let productHoverState = { productId: null, imageIndex: 0, hideTimer: null, anchor: null };
const welcomeMessages = {
  intro: {
    badge: "Loja online",
    title: "Ola, seja bem-vindo.",
    text: "Encontre cameras, CFTV e acessorios de seguranca com atendimento para escolher o equipamento certo."
  },
  buy: {
    badge: "Compra guiada",
    title: "Monte o carrinho e finalize no checkout.",
    text: "Adicione os produtos, informe seus dados de entrega e escolha Pix, cartao ou checkout Mercado Pago."
  },
  support: {
    badge: "Suporte tecnico",
    title: "Precisa de ajuda para escolher?",
    text: "Fale com a John@VisionSeg para definir camera, alcance, armazenamento e instalacao ideal para seu ambiente."
  }
};

function applySettings() {
  document.querySelectorAll("[data-setting]").forEach((el) => {
    const key = el.getAttribute("data-setting");
    if (app.settings[key]) el.textContent = app.settings[key];
  });
  document.getElementById("whatsappFloat").href = app.settings.whatsappLink;
  renderMaintenanceMode();
  renderPaymentOptions();
}

function renderNavigation() {
  const desktop = document.getElementById("desktopNavigation");
  const simple = document.getElementById("simpleNavigation");
  const menus = Array.isArray(app?.navigationMenus) ? app.navigationMenus.filter((menu) => menu && menu.label) : [];
  if (!menus.length) return;
  if (desktop) {
    desktop.innerHTML = menus.map((menu) => {
      const href = sanitizeMenuHref(menu.href);
      const children = Array.isArray(menu.children) ? menu.children.filter((child) => child && child.label) : [];
      if (!children.length) return `<a href="${escapeHtml(href)}">${escapeHtml(menu.label)}</a>`;
      return `
        <div class="nav-dropdown">
          <a href="${escapeHtml(href)}" class="dropdown-trigger">${escapeHtml(menu.label)} <span class="arrow" aria-hidden="true">▼</span></a>
          <div class="dropdown-menu">
            ${children.map((child) => `<a href="${escapeHtml(sanitizeMenuHref(child.href))}">${escapeHtml(child.label)}</a>`).join("")}
          </div>
        </div>
      `;
    }).join("");
  }
  if (simple) {
    simple.innerHTML = menus.map((menu) => `<a href="${escapeHtml(sanitizeMenuHref(menu.href))}">${escapeHtml(menu.label)}</a>`).join("");
  }
}

function sanitizeMenuHref(value) {
  const href = String(value || "#").trim();
  if (/^(#|\/|\.\/|\.\.\/|https?:\/\/|mailto:|tel:)/i.test(href)) return href;
  return "#";
}

function renderMaintenanceMode() {
  const screen = document.getElementById("maintenanceScreen");
  const content = document.getElementById("storeContent");
  if (!screen || !content || !app?.settings) return;
  const active = Boolean(app.settings.maintenanceMode);
  screen.hidden = !active;
  content.hidden = active;
  screen.style.display = active ? "grid" : "";
  content.style.display = active ? "none" : "";
  document.body.classList.toggle("maintenance-active", active);
  if (active) {
    closeCart();
    closeCheckoutPage();
  }
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
  if (categoryStrip) {
    categoryStrip.innerHTML = [
      '<button class="active" type="button" data-category="">Todos</button>',
      ...categories.map((category) => `<button type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
    ].join("");
  }
}

function setWelcomeTab(tab = "intro") {
  const message = welcomeMessages[tab] || welcomeMessages.intro;
  const badge = document.getElementById("welcomePanelBadge");
  const title = document.getElementById("welcomePanelTitle");
  const text = document.getElementById("welcomePanelText");
  if (badge) badge.textContent = message.badge;
  if (title) title.textContent = message.title;
  if (text) text.textContent = message.text;
  document.querySelectorAll("[data-welcome-tab]").forEach((button) => {
    const active = button.dataset.welcomeTab === tab;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });
}

function getPromoProducts() {
  return [...app.products]
    .filter((product) => isProductAvailable(product))
    .sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
    .slice(0, 5);
}

function renderPromoCarousel() {
  const track = document.getElementById("promoCarouselTrack");
  const dots = document.getElementById("promoDots");
  if (!track || !dots || !app?.products?.length) return;
  const promos = getPromoProducts();
  if (!promos.length) {
    track.innerHTML = '<div class="empty-state">Nenhuma promocao disponivel.</div>';
    dots.innerHTML = "";
    return;
  }
  if (promoSlideIndex >= promos.length) promoSlideIndex = 0;
  track.innerHTML = promos.map((product, index) => {
    const oldPrice = Number(product.price || 0) * 1.18;
    const badge = index === 0 ? "Mais vendido" : index === 1 ? "Oferta especial" : "Preco promocional";
    return `
      <article class="promo-slide ${index === promoSlideIndex ? "active" : ""}" aria-hidden="${index === promoSlideIndex ? "false" : "true"}">
        <div class="promo-copy">
          <span class="promo-badge">${escapeHtml(badge)}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.desc || "Produto selecionado para promocao da semana.")}</p>
          <div class="promo-price-row">
            <span class="promo-old-price">${brl(oldPrice)}</span>
            <strong>${brl(product.price)}</strong>
          </div>
          <div class="promo-actions">
            <button type="button" onclick="addToCart(${Number(product.id)})">Adicionar ao carrinho</button>
            <button type="button" class="ghost" onclick="focusProduct(${Number(product.id)})">Ver produto</button>
          </div>
        </div>
        <div class="promo-media">
          <img src="${escapeHtml(getProductImages(product)[0])}" alt="${escapeHtml(product.name)}" loading="lazy">
        </div>
      </article>
    `;
  }).join("");
  dots.innerHTML = promos.map((_, index) => `<button class="${index === promoSlideIndex ? "active" : ""}" type="button" aria-label="Ver promocao ${index + 1}" onclick="setPromoSlide(${index})"></button>`).join("");
}

function setPromoSlide(index) {
  const promos = getPromoProducts();
  if (!promos.length) return;
  promoSlideIndex = (Number(index) + promos.length) % promos.length;
  renderPromoCarousel();
  restartPromoAutoplay();
}

function nextPromoSlide(delta = 1) {
  setPromoSlide(promoSlideIndex + delta);
}

function restartPromoAutoplay() {
  if (promoTimer) clearInterval(promoTimer);
  promoTimer = setInterval(() => nextPromoSlide(1), 6500);
}

function renderProducts() {
  const query = search.value.toLowerCase().trim();
  const category = filter.value;
  const products = app.products.filter((product) => {
    const content = `${product.name} ${product.desc} ${product.category}`.toLowerCase();
    return (!category || product.category === category) && (!query || content.includes(query));
  });
  sortProductList(products);
  if (productsCount) {
    const total = app.products.length;
    const visible = products.length;
    productsCount.textContent = visible === total ? `${total} produtos` : `${visible} de ${total} produtos`;
  }
  if (categoryStrip) {
    categoryStrip.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.category === category);
    });
  }

  grid.innerHTML = products.length ? products.map((product) => `
    <article class="product-card ${!isProductAvailable(product) ? "is-unavailable" : ""}" data-product-id="${Number(product.id)}" tabindex="0">
      <div class="product-img has-photo">
        <img src="${escapeHtml(getProductImages(product)[0])}" alt="${escapeHtml(product.name)}" loading="lazy">
      </div>
      <div class="product-content">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-desc">${escapeHtml(product.desc || getAvailabilityLabel(product))}</p>
      </div>
      <div class="product-sale-panel">
        <div class="price">${brl(product.price)}</div>
        <button class="quick-add-button" type="button" aria-label="Adicionar ${escapeHtml(product.name)} ao carrinho" ${!isProductAvailable(product) ? "disabled" : ""} onclick="addToCart(${Number(product.id)})">+</button>
      </div>
    </article>
  `).join("") : '<div class="empty-state">Nenhum produto encontrado para essa busca.</div>';
  hideProductHover();
}

function focusProduct(id) {
  closeCart();
  const card = document.querySelector(`[data-product-id="${Number(id)}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("promo-focus");
  setTimeout(() => card.classList.remove("promo-focus"), 1600);
}

function sortProductList(products) {
  const mode = sortProducts?.value || "featured";
  products.sort((a, b) => {
    if (mode === "name") return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
    if (mode === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
    if (mode === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);
    const available = Number(isProductAvailable(b)) - Number(isProductAvailable(a));
    if (available !== 0) return available;
    return Number(b.stock || 0) - Number(a.stock || 0);
  });
}

function ensureProductHoverViewer() {
  let viewer = document.getElementById("productHoverViewer");
  if (viewer) return viewer;
  viewer = document.createElement("aside");
  viewer.id = "productHoverViewer";
  viewer.className = "product-hover-viewer";
  viewer.setAttribute("aria-live", "polite");
  viewer.hidden = true;
  viewer.addEventListener("mouseenter", cancelProductHoverClose);
  viewer.addEventListener("mouseleave", scheduleProductHoverClose);
  viewer.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-hover-nav]");
    if (nav) {
      changeHoverProductImage(Number(nav.dataset.hoverNav));
      return;
    }
    const thumb = event.target.closest("[data-hover-thumb]");
    if (thumb) {
      setHoverProductImage(Number(thumb.dataset.hoverThumb));
      return;
    }
    const addButton = event.target.closest("[data-hover-add]");
    if (addButton) {
      addToCart(Number(addButton.dataset.hoverAdd));
    }
  });
  document.body.appendChild(viewer);
  return viewer;
}

function showProductHover(productId, anchor) {
  const product = app.products.find((item) => Number(item.id) === Number(productId));
  if (!product) return;
  cancelProductHoverClose();
  const changedProduct = Number(productHoverState.productId) !== Number(productId);
  productHoverState = {
    ...productHoverState,
    productId: Number(productId),
    imageIndex: changedProduct ? 0 : productHoverState.imageIndex,
    anchor
  };
  renderProductHoverViewer(product);
  positionProductHoverViewer(anchor);
}

function renderProductHoverViewer(product) {
  const viewer = ensureProductHoverViewer();
  const images = getProductImages(product);
  const index = Math.min(productHoverState.imageIndex, images.length - 1);
  productHoverState.imageIndex = index;
  viewer.hidden = false;
  viewer.innerHTML = `
    <div class="product-hover-media">
      <button class="product-hover-nav prev" type="button" data-hover-nav="-1" aria-label="Imagem anterior">‹</button>
      <img src="${escapeHtml(images[index])}" alt="${escapeHtml(product.name)}">
      <button class="product-hover-nav next" type="button" data-hover-nav="1" aria-label="Proxima imagem">›</button>
    </div>
    ${images.length > 1 ? `
      <div class="product-hover-thumbs" aria-label="Selecionar imagem do produto">
        ${images.map((image, imageIndex) => `
          <button class="${imageIndex === index ? "active" : ""}" type="button" data-hover-thumb="${imageIndex}" aria-label="Ver imagem ${imageIndex + 1}">
            <img src="${escapeHtml(image)}" alt="">
          </button>
        `).join("")}
      </div>
    ` : ""}
    <div class="product-hover-info">
      <span>${escapeHtml(product.category || "Produto")}</span>
      <strong>${escapeHtml(product.name)}</strong>
      <p>${escapeHtml(product.desc || getAvailabilityLabel(product))}</p>
      <div>
        <b>${brl(product.price)}</b>
        <button type="button" data-hover-add="${Number(product.id)}" ${!isProductAvailable(product) ? "disabled" : ""}>Adicionar</button>
      </div>
    </div>
  `;
}

function positionProductHoverViewer(anchor) {
  const viewer = ensureProductHoverViewer();
  if (!anchor || viewer.hidden) return;
  const rect = anchor.getBoundingClientRect();
  const gap = 14;
  const headerBottom = document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0;
  const width = Math.min(430, window.innerWidth - 28);
  let left = rect.right + gap;
  if (left + width > window.innerWidth - 14) left = rect.left - width - gap;
  if (left < 14) left = Math.min(14, window.innerWidth - width - 14);
  const top = Math.max(headerBottom + 12, Math.min(rect.top, window.innerHeight - 560));
  viewer.style.width = `${width}px`;
  viewer.style.left = `${left}px`;
  viewer.style.top = `${top}px`;
}

function changeHoverProductImage(delta) {
  const product = app.products.find((item) => Number(item.id) === Number(productHoverState.productId));
  if (!product) return;
  const images = getProductImages(product);
  productHoverState.imageIndex = (productHoverState.imageIndex + delta + images.length) % images.length;
  renderProductHoverViewer(product);
  positionProductHoverViewer(productHoverState.anchor);
}

function setHoverProductImage(index) {
  const product = app.products.find((item) => Number(item.id) === Number(productHoverState.productId));
  if (!product) return;
  productHoverState.imageIndex = Number(index) || 0;
  renderProductHoverViewer(product);
  positionProductHoverViewer(productHoverState.anchor);
}

function cancelProductHoverClose() {
  if (productHoverState.hideTimer) clearTimeout(productHoverState.hideTimer);
  productHoverState.hideTimer = null;
}

function scheduleProductHoverClose() {
  cancelProductHoverClose();
  productHoverState.hideTimer = setTimeout(hideProductHover, 220);
}

function hideProductHover() {
  cancelProductHoverClose();
  const viewer = document.getElementById("productHoverViewer");
  if (viewer) viewer.hidden = true;
  productHoverState.productId = null;
  productHoverState.anchor = null;
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

function getFulfillmentMode(product) {
  return ["dropshipping", "preorder"].includes(product.fulfillment) ? product.fulfillment : "local";
}

function isDropshipProduct(product) {
  return getFulfillmentMode(product) === "dropshipping" || getFulfillmentMode(product) === "preorder";
}

function isProductAvailable(product) {
  return Number(product.stock || 0) > 0 || isDropshipProduct(product);
}

function getAvailabilityLabel(product) {
  if (getFulfillmentMode(product) === "dropshipping") return "Envio do fornecedor";
  if (getFulfillmentMode(product) === "preorder") return "Sob encomenda";
  return Number(product.stock || 0) <= 0 ? "Esgotado" : "Pronta entrega";
}

function getStockClass(product) {
  if (isDropshipProduct(product)) return "dropship";
  return product.stock <= 0 ? "out" : product.stock <= product.minStock ? "low" : "";
}

function getStockCountLabel(product) {
  if (getFulfillmentMode(product) === "dropshipping") return product.deliveryTime || "Prazo sob consulta";
  if (getFulfillmentMode(product) === "preorder") return product.deliveryTime || "Sob encomenda";
  return product.stock <= 0 ? "Sem estoque" : `${product.stock} un.`;
}

function renderDeliveryInfo(product) {
  if (!isDropshipProduct(product) && !product.deliveryTime) return "";
  const delivery = product.deliveryTime || "Prazo confirmado no atendimento";
  const text = isDropshipProduct(product)
    ? `Entrega: ${delivery}. Pedido enviado direto pelo fornecedor parceiro.`
    : `Entrega: ${delivery}.`;
  return `<div class="delivery-info">${escapeHtml(text)}</div>`;
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
  if (!product || !isProductAvailable(product)) return;
  const item = cart.find((cartItem) => cartItem.id === id);
  if (item) {
    if (isDropshipProduct(product) || item.qty < product.stock) item.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1, fulfillment: getFulfillmentMode(product), supplier: product.supplier || "", deliveryTime: product.deliveryTime || "", cost: Number(product.cost || 0), supplierUrl: product.supplierUrl || product.sourceUrl || "", supplierSku: product.supplierSku || "" });
  }
  renderCart();
  openCart();
}

function buyNow(id) {
  const product = app.products.find((item) => item.id === id);
  if (!product || !isProductAvailable(product)) return;
  const message = [
    "Ola! Vi este produto na loja online John@VisionSeg e quero comprar.",
    "",
    `Produto: ${product.name}`,
    `Categoria: ${product.category}`,
    `Valor: ${brl(product.price)}`,
    `Disponibilidade: ${getAvailabilityLabel(product)}`,
    product.deliveryTime ? `Prazo: ${product.deliveryTime}` : "",
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
        ${item.deliveryTime ? `<small>${escapeHtml(item.deliveryTime)}</small>` : ""}
      </div>
      <div class="qty-actions">
        <button type="button" onclick="changeQty(${Number(item.id)}, -1)" aria-label="Diminuir quantidade">-</button>
        <button type="button" onclick="changeQty(${Number(item.id)}, 1)" aria-label="Aumentar quantidade">+</button>
      </div>
    </div>
  `).join("") : '<p class="empty-state">Carrinho vazio.</p>';
  document.getElementById("cartTotal").textContent = brl(cart.reduce((total, item) => total + item.price * item.qty, 0));
  saveCart();
  renderPaymentOptions();
  renderCheckoutPage();
}

function getCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.qty, 0);
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    cart = Array.isArray(saved)
      ? saved.filter((item) => app.products.some((product) => Number(product.id) === Number(item.id))).map((item) => ({
        ...item,
        id: Number(item.id),
        qty: Math.max(1, Number(item.qty || 1)),
        price: Number(item.price || 0)
      }))
      : [];
  } catch {
    cart = [];
  }
}

function renderPaymentOptions() {
  const pixBtn = document.getElementById("copyPixBtn");
  const linkBtn = document.getElementById("paymentLinkBtn");
  const cardBtn = document.getElementById("cardPaymentBtn");
  const checkoutPixBtn = document.getElementById("checkoutPixBtn");
  const checkoutLinkBtn = document.getElementById("checkoutLinkBtn");
  const checkoutCardBtn = document.getElementById("checkoutCardBtn");
  const checkoutPrimaryPayBtn = document.getElementById("checkoutPrimaryPayBtn");
  const info = document.getElementById("paymentInfo");
  const checkoutInfo = document.getElementById("checkoutPaymentInfo");
  if (!pixBtn || !linkBtn || !info || !app?.settings) return;

  const hasPix = Boolean(String(app.settings.pixKey || "").trim());
  const hasCheckoutApi = Boolean(getCreateCheckoutUrl());
  const hasCardEndpoint = Boolean(getProcessCardPaymentUrl());
  const hasMercadoPagoKey = Boolean(getMercadoPagoPublicKey());
  const hasLink = Boolean(String(app.settings.paymentLink || "").trim()) || hasCheckoutApi;
  const hasCardPayment = Boolean(hasCardEndpoint && hasMercadoPagoKey);
  const cardHelp = !hasCardEndpoint
    ? "API nao publicada"
    : !hasMercadoPagoKey
      ? "Falta Public Key no painel"
      : "Mercado Livre / Mercado Pago";
  pixBtn.disabled = !hasPix;
  linkBtn.disabled = !hasLink || !cart.length;
  if (cardBtn) cardBtn.disabled = !hasCardPayment || !cart.length;
  if (checkoutPixBtn) checkoutPixBtn.disabled = !hasPix || !cart.length;
  if (checkoutLinkBtn) checkoutLinkBtn.disabled = !hasLink || !cart.length;
  if (checkoutCardBtn) checkoutCardBtn.disabled = !hasCardPayment || !cart.length;
  setPaymentCardState(pixBtn, hasPix, "Pix", hasPix ? "Copia a chave Pix" : "Configure no painel");
  setPaymentCardState(linkBtn, hasLink, "Link", hasCheckoutApi ? "API Mercado Pago" : "Checkout seguro");
  if (cardBtn) setPaymentCardState(cardBtn, hasCardPayment, "Cartao", cardHelp);
  if (checkoutPixBtn) setPaymentCardState(checkoutPixBtn, hasPix, "Pix", hasPix ? "Copia a chave Pix" : "Configure no painel");
  if (checkoutLinkBtn) setPaymentCardState(checkoutLinkBtn, hasLink, "Link", hasCheckoutApi ? "API Mercado Pago" : "Checkout seguro");
  if (checkoutCardBtn) setPaymentCardState(checkoutCardBtn, hasCardPayment, "Cartao", cardHelp);
  updatePaymentMethodSelection();

  const details = [];
  if (hasPix) details.push(`Pix: ${app.settings.pixName || app.settings.companyName || "John@VisionSeg"}`);
  if (hasCardPayment) details.push("Cartao via Mercado Livre / Mercado Pago");
  if (hasCardEndpoint && !hasMercadoPagoKey) details.push("Cartao: coloque a Public Key do Mercado Pago no painel admin");
  if (hasLink) details.push("Cartao/link de pagamento disponivel");
  if (!cart.length) details.push("Adicione produtos ao carrinho para pagar");
  info.textContent = details.length ? details.join(" | ") : "Configure Pix ou link de pagamento no painel.";
  if (checkoutInfo) checkoutInfo.textContent = info.textContent;
  if (checkoutPrimaryPayBtn) {
    checkoutPrimaryPayBtn.disabled = !cart.length || (selectedPaymentMethod === "pix" && !hasPix) || (selectedPaymentMethod === "card" && !hasCardPayment) || (selectedPaymentMethod === "link" && !hasLink);
    checkoutPrimaryPayBtn.textContent = selectedPaymentMethod === "pix"
      ? "Copiar Pix"
      : selectedPaymentMethod === "card"
        ? "Pagar com cartao"
        : "Pagar pelo Mercado Pago";
  }
}

function setPaymentCardState(button, enabled, title, subtitle) {
  button.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(subtitle)}</span>`;
  button.classList.toggle("is-unavailable", !enabled);
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method || "link";
  updatePaymentMethodSelection();
  renderPaymentOptions();
}

function updatePaymentMethodSelection() {
  document.querySelectorAll("[data-payment-method]").forEach((button) => {
    button.classList.toggle("active", button.dataset.paymentMethod === selectedPaymentMethod);
  });
}

function getSelectedPaymentLabel() {
  const labels = {
    pix: "Pix",
    card: "Cartao Mercado Livre / Mercado Pago",
    link: "Checkout Mercado Pago"
  };
  return labels[selectedPaymentMethod] || labels.link;
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
    alert("Chave Pix copiada. Depois do pagamento, guarde o comprovante.");
  } catch {
    window.prompt("Copie a chave Pix:", key);
  }
}

function openPaymentLink() {
  const backendUrl = getCreateCheckoutUrl();
  if (backendUrl) {
    createBackendCheckout(backendUrl);
    return;
  }
  const link = String(app.settings.paymentLink || "").trim();
  if (!link) return alert("Link de pagamento nao configurado no painel.");
  if (!cart.length) return alert("Adicione produtos ao carrinho antes de pagar.");
  window.open(addPaymentLinkParams(link), "_blank", "noopener");
}

function getCreateCheckoutUrl() {
  const backend = window.JOHNVISIONSEG_BACKEND || {};
  const base = String(backend.functionsBaseUrl || "").trim().replace(/\/$/, "");
  const path = String(backend.createCheckoutPath || "/createCheckout").trim();
  return base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : "";
}

function getProcessCardPaymentUrl() {
  const backend = window.JOHNVISIONSEG_BACKEND || {};
  const base = String(backend.functionsBaseUrl || "").trim().replace(/\/$/, "");
  const path = String(backend.processCardPaymentPath || "/processCardPayment").trim();
  return base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : "";
}

function getMercadoPagoPublicKey() {
  return String(app?.settings?.mercadoPagoPublicKey || window.JOHNVISIONSEG_MERCADO_PAGO?.publicKey || "").trim();
}

async function createBackendCheckout(url) {
  if (!cart.length) return alert("Adicione produtos ao carrinho antes de pagar.");
  const order = buildOrderPayload("Aguardando pagamento");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    const data = await response.json();
    if (!response.ok || !data.initPoint) throw new Error(data.error || "Falha ao criar pagamento.");
    app.orders.unshift({ ...order, status: "Aguardando pagamento", paymentProvider: "mercadopago", paymentStatus: "pending", paymentUrl: data.initPoint, mercadoPagoPreferenceId: data.preferenceId });
    app.customers.unshift({ name: order.name, phone: order.phone, address: order.address, date: order.date, type: "Compra" });
    saveApp(app);
    window.open(data.initPoint, "_blank", "noopener");
    alert("Pagamento criado. Depois da aprovacao, o painel atualiza pelo webhook.");
  } catch (error) {
    alert(`Nao foi possivel criar o pagamento automatico: ${error.message}`);
  }
}

async function openCardPayment() {
  if (!cart.length) return alert("Adicione produtos ao carrinho antes de pagar.");
  const publicKey = getMercadoPagoPublicKey();
  const url = getProcessCardPaymentUrl();
  if (!url) return alert("API de pagamento com cartao ainda nao publicada.");
  if (!publicKey) return alert("Pagamento com cartao ainda nao configurado. Abra o painel admin e salve a Public Key do Mercado Pago.");

  cardPaymentOrder = buildOrderPayload("Aguardando pagamento");
  const modal = document.getElementById("cardPaymentModal");
  const amount = document.getElementById("cardPaymentAmount");
  const status = document.getElementById("cardPaymentStatus");
  if (amount) amount.textContent = brl(cardPaymentOrder.total);
  if (status) status.textContent = "Conectando ao Mercado Pago...";
  modal?.classList.add("open");
  modal?.setAttribute("aria-hidden", "false");

  try {
    await renderCardPaymentBrick(publicKey, url, cardPaymentOrder);
  } catch (error) {
    if (status) status.textContent = `Nao foi possivel abrir o pagamento: ${error.message || error}`;
  }
}

async function renderCardPaymentBrick(publicKey, url, order) {
  if (!window.MercadoPago) throw new Error("SDK do Mercado Pago nao carregou.");
  if (window.cardPaymentBrickController) {
    await window.cardPaymentBrickController.unmount();
    window.cardPaymentBrickController = null;
  }
  const status = document.getElementById("cardPaymentStatus");
  const mp = new MercadoPago(publicKey, { locale: "pt-BR" });
  const bricksBuilder = mp.bricks();
  const maxInstallments = Number(app?.settings?.mercadoPagoMaxInstallments || window.JOHNVISIONSEG_MERCADO_PAGO?.maxInstallments || 10);
  const settings = {
    initialization: {
      amount: Number(order.total.toFixed(2))
    },
    customization: {
      paymentMethods: {
        maxInstallments: Math.max(1, Math.min(maxInstallments, 24))
      }
    },
    callbacks: {
      onReady: () => {
        if (status) status.textContent = "Informe os dados do cartao no ambiente seguro do Mercado Pago.";
      },
      onSubmit: (formData) => submitCardPayment(url, order, formData),
      onError: (error) => {
        console.warn("Mercado Pago Brick:", error);
        if (status) status.textContent = "Erro no formulario do Mercado Pago. Revise os dados e tente novamente.";
      }
    }
  };
  window.cardPaymentBrickController = await bricksBuilder.create("cardPayment", "cardPaymentBrick_container", settings);
}

function submitCardPayment(url, order, formData) {
  const status = document.getElementById("cardPaymentStatus");
  if (status) status.textContent = "Processando pagamento...";
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order,
      payment: formData,
      idempotencyKey: `jv-${order.id}-${Date.now()}`
    })
  })
    .then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Falha ao processar pagamento.");
      const approved = data.status === "approved";
      app.orders.unshift({ ...order, status: approved ? "Pago" : "Aguardando pagamento", paymentProvider: "mercadopago", paymentStatus: data.status, paymentId: data.paymentId });
      app.customers.unshift({ name: order.name, phone: order.phone, address: order.address, date: order.date, type: "Compra" });
      saveApp(app);
      if (status) status.textContent = approved ? "Pagamento aprovado." : `Pagamento ${data.status || "em analise"}.`;
      if (approved) {
        cart = [];
        renderCart();
        renderProducts();
      }
      alert(approved ? "Pagamento aprovado pelo Mercado Pago." : `Pagamento enviado: ${data.status || "em processamento"}.`);
      closeCardPayment();
    })
    .catch((error) => {
      if (status) status.textContent = error.message || "Falha ao processar pagamento.";
      return Promise.reject(error);
    });
}

async function closeCardPayment() {
  const modal = document.getElementById("cardPaymentModal");
  modal?.classList.remove("open");
  modal?.setAttribute("aria-hidden", "true");
  cardPaymentOrder = null;
  if (window.cardPaymentBrickController) {
    await window.cardPaymentBrickController.unmount();
    window.cardPaymentBrickController = null;
  }
}

function buildOrderPayload(status = "Novo") {
  if (isCheckoutVisible()) syncCartFieldsFromCheckout();
  const nameInput = isCheckoutVisible() ? document.getElementById("checkoutCustomerName") : document.getElementById("customerName");
  const phoneInput = isCheckoutVisible() ? document.getElementById("checkoutCustomerPhone") : document.getElementById("customerPhone");
  const addressInput = isCheckoutVisible() ? document.getElementById("checkoutCustomerAddress") : document.getElementById("customerAddress");
  const emailInput = document.getElementById("checkoutCustomerEmail");
  const zipInput = document.getElementById("checkoutCustomerZip");
  const cityInput = document.getElementById("checkoutCustomerCity");
  const numberInput = document.getElementById("checkoutCustomerNumber");
  const apartmentInput = document.getElementById("checkoutCustomerApartment");
  const condoInput = document.getElementById("checkoutCustomerCondo");
  const name = nameInput?.value.trim() || "Cliente";
  const phone = phoneInput?.value.trim() || "";
  const address = [
    addressInput?.value.trim() || "",
    numberInput?.value.trim() ? `Numero: ${numberInput.value.trim()}` : "",
    apartmentInput?.value.trim() ? `Apartamento: ${apartmentInput.value.trim()}` : "",
    condoInput?.value.trim() ? `Condominio: ${condoInput.value.trim()}` : "",
    zipInput?.value.trim() ? `CEP: ${zipInput.value.trim()}` : "",
    cityInput?.value.trim() || ""
  ].filter(Boolean).join(" | ");
  const email = emailInput?.value.trim() || "";
  const orderItems = cart.map((item) => {
    const product = app.products.find((productItem) => productItem.id === item.id) || {};
    return {
      ...item,
      fulfillment: getFulfillmentMode(product),
      description: product.desc || "",
      category: product.category || "",
      imageUrl: getProductImages(product)[0] || "",
      supplier: product.supplier || item.supplier || "",
      deliveryTime: product.deliveryTime || item.deliveryTime || "",
      cost: Number(product.cost || item.cost || 0),
      supplierUrl: product.supplierUrl || product.sourceUrl || item.supplierUrl || "",
      supplierSku: product.supplierSku || item.supplierSku || ""
    };
  });
  const total = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const supplierCost = orderItems.reduce((sum, item) => sum + Number(item.cost || 0) * Number(item.qty || 1), 0);
  return {
    id: Date.now(),
    date: new Date().toLocaleString("pt-BR"),
    name,
    phone,
    email,
    address,
    total,
    supplierCost,
    profit: total - supplierCost,
    status,
    paymentMethod: getSelectedPaymentLabel(),
    fulfillmentStatus: status === "Pago" ? "Comprar no fornecedor" : "Aguardando pagamento",
    items: orderItems
  };
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
  if (!isDropshipProduct(product) && item.qty > product.stock) item.qty = product.stock;
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

function openCheckoutPage() {
  if (!cart.length) return alert("Adicione produtos ao carrinho antes de abrir o checkout.");
  syncCheckoutFieldsFromCart();
  renderCheckoutPage();
  closeCart();
  if (checkoutPage) checkoutPage.hidden = false;
  document.body.classList.add("checkout-active");
  window.location.hash = "checkout";
  checkoutPage?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeCheckoutPage() {
  if (checkoutPage) checkoutPage.hidden = true;
  document.body.classList.remove("checkout-active");
  if (window.location.hash === "#checkout") history.replaceState(null, "", window.location.pathname + window.location.search);
}

function syncCheckoutFieldsFromCart() {
  const pairs = [
    ["customerName", "checkoutCustomerName"],
    ["customerPhone", "checkoutCustomerPhone"],
    ["customerAddress", "checkoutCustomerAddress"]
  ];
  pairs.forEach(([sourceId, targetId]) => {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    if (source && target && !target.value) target.value = source.value;
  });
}

function syncCartFieldsFromCheckout() {
  const pairs = [
    ["checkoutCustomerName", "customerName"],
    ["checkoutCustomerPhone", "customerPhone"],
    ["checkoutCustomerAddress", "customerAddress"]
  ];
  pairs.forEach(([sourceId, targetId]) => {
    const source = document.getElementById(sourceId);
    const target = document.getElementById(targetId);
    if (source && target) target.value = source.value;
  });
}

function isCheckoutVisible() {
  return Boolean(checkoutPage && !checkoutPage.hidden);
}

function validateCheckoutDetails() {
  if (!isCheckoutVisible()) return true;
  const name = document.getElementById("checkoutCustomerName")?.value.trim() || "";
  const phone = document.getElementById("checkoutCustomerPhone")?.value.replace(/\D/g, "") || "";
  const email = document.getElementById("checkoutCustomerEmail")?.value.trim() || "";
  const message = document.getElementById("checkoutValidation");
  const errors = [];
  if (name.length < 3) errors.push("Informe o nome completo.");
  if (phone.length < 10) errors.push("Informe um WhatsApp valido.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Confira o e-mail.");
  if (message) {
    message.textContent = errors.join(" ");
    message.classList.toggle("show", errors.length > 0);
  }
  return errors.length === 0;
}

async function lookupCheckoutCep() {
  const zipInput = document.getElementById("checkoutCustomerZip");
  const cityInput = document.getElementById("checkoutCustomerCity");
  const addressInput = document.getElementById("checkoutCustomerAddress");
  const validation = document.getElementById("checkoutValidation");
  if (!zipInput || !cityInput || !addressInput) return;

  const cep = zipInput.value.replace(/\D/g, "").slice(0, 8);
  zipInput.value = cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
  if (cep.length !== 8) return;

  try {
    if (validation) {
      validation.textContent = "Buscando endereco pelo CEP...";
      validation.classList.add("show");
    }
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (!response.ok || data.erro) throw new Error("CEP nao encontrado.");

    cityInput.value = [data.localidade, data.uf].filter(Boolean).join(" - ");
    const addressParts = [data.logradouro, data.bairro].filter(Boolean);
    if (addressParts.length) {
      const current = addressInput.value.trim();
      const autoAddress = addressParts.join(", ");
      addressInput.value = current && !current.includes(autoAddress) ? `${autoAddress} | ${current}` : autoAddress;
    }
    if (validation) {
      validation.textContent = "Endereco preenchido pelo CEP. Complete numero e complemento se necessario.";
      validation.classList.add("show");
    }
  } catch (error) {
    if (validation) {
      validation.textContent = "Nao encontramos esse CEP. Preencha o endereco manualmente.";
      validation.classList.add("show");
    }
  }
}

function runSelectedCheckoutPayment() {
  if (!validateCheckoutDetails()) return;
  if (selectedPaymentMethod === "pix") return copyPixKey();
  if (selectedPaymentMethod === "card") return openCardPayment();
  return openPaymentLink();
}

function renderCheckoutPage() {
  const itemsTarget = document.getElementById("checkoutItems");
  if (!itemsTarget) return;
  const totalQty = cart.reduce((total, item) => total + Number(item.qty || 0), 0);
  const total = getCartTotal();
  document.getElementById("checkoutItemsCount").textContent = `${totalQty} ${totalQty === 1 ? "item" : "itens"}`;
  document.getElementById("checkoutSubtotal").textContent = brl(total);
  document.getElementById("checkoutTotal").textContent = brl(total);
  itemsTarget.innerHTML = cart.length ? cart.map((item) => {
    const product = app.products.find((productItem) => Number(productItem.id) === Number(item.id)) || {};
    return `
      <div class="checkout-item">
        <img src="${escapeHtml(getProductImages(product)[0])}" alt="${escapeHtml(item.name)}">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${Number(item.qty || 1)} x ${brl(item.price)}</span>
        </div>
        <b>${brl(item.price * item.qty)}</b>
      </div>
    `;
  }).join("") : '<p class="empty-state">Seu carrinho esta vazio.</p>';
}

async function checkout() {
  if (!cart.length) return alert("Carrinho vazio.");
  const order = buildOrderPayload("Novo");
  app.orders.unshift(order);
  app.customers.unshift({ name: order.name, phone: order.phone, address: order.address, date: order.date, type: "Compra" });
  cart.forEach((item) => {
    const product = app.products.find((productItem) => productItem.id === item.id);
    if (product && !isDropshipProduct(product)) product.stock = Math.max(0, product.stock - item.qty);
  });
  saveApp(app);
  const message = [
    "Ola! Quero fechar este pedido na John@VisionSeg.",
    "",
    `Cliente: ${order.name}`,
    `Telefone: ${order.phone}`,
    `Endereco/Obs: ${order.address}`,
    "",
    "Itens:",
    ...order.items.map((item) => `- ${item.qty}x ${item.name} = ${brl(item.price * item.qty)}${item.deliveryTime ? ` | Prazo: ${item.deliveryTime}` : ""}`),
    "",
    `Total: ${brl(order.total)}`,
    `Forma de pagamento escolhida: ${order.paymentMethod || getSelectedPaymentLabel()}`,
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
  ensureCheckoutButton();
  document.getElementById("cartBtn").onclick = openCart;
  const heroCartBtn = document.getElementById("heroCartBtn");
  if (heroCartBtn) heroCartBtn.onclick = openCart;
  document.getElementById("closeCart").onclick = closeCart;
  cartOverlay.onclick = closeCart;
  if (grid) {
    grid.addEventListener("pointerover", (event) => {
      const card = event.target.closest(".product-card[data-product-id]");
      if (!card || !grid.contains(card)) return;
      showProductHover(Number(card.dataset.productId), card);
    });
    grid.addEventListener("pointerout", (event) => {
      const card = event.target.closest(".product-card[data-product-id]");
      if (!card || card.contains(event.relatedTarget)) return;
      scheduleProductHoverClose();
    });
    grid.addEventListener("focusin", (event) => {
      const card = event.target.closest(".product-card[data-product-id]");
      if (!card) return;
      showProductHover(Number(card.dataset.productId), card);
    });
    grid.addEventListener("click", (event) => {
      if (event.target.closest("button, a, input, select, textarea")) return;
      const card = event.target.closest(".product-card[data-product-id]");
      if (!card) return;
      showProductHover(Number(card.dataset.productId), card);
    });
  }
  search.oninput = () => {
    if (headerSearch && headerSearch.value !== search.value) headerSearch.value = search.value;
    renderProducts();
  };
  if (headerSearch) {
    headerSearch.oninput = () => {
      search.value = headerSearch.value;
      renderProducts();
    };
    headerSearch.form?.addEventListener("submit", (event) => {
      event.preventDefault();
      search.value = headerSearch.value;
      renderProducts();
      document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  filter.onchange = renderProducts;
  if (categoryStrip) {
    categoryStrip.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");
      if (!button) return;
      filter.value = button.dataset.category || "";
      renderProducts();
    });
  }
  if (sortProducts) sortProducts.onchange = renderProducts;
  const promoPrev = document.getElementById("promoPrev");
  const promoNext = document.getElementById("promoNext");
  if (promoPrev) promoPrev.onclick = () => nextPromoSlide(-1);
  if (promoNext) promoNext.onclick = () => nextPromoSlide(1);
  document.querySelectorAll("[data-welcome-tab]").forEach((button) => {
    button.addEventListener("click", () => setWelcomeTab(button.dataset.welcomeTab));
  });
  document.getElementById("copyPixBtn").onclick = () => { selectPaymentMethod("pix"); copyPixKey(); };
  document.getElementById("paymentLinkBtn").onclick = () => { selectPaymentMethod("link"); openPaymentLink(); };
  const cardPaymentBtn = document.getElementById("cardPaymentBtn");
  const closeCardPaymentBtn = document.getElementById("closeCardPayment");
  if (cardPaymentBtn) cardPaymentBtn.onclick = () => { selectPaymentMethod("card"); openCardPayment(); };
  if (closeCardPaymentBtn) closeCardPaymentBtn.onclick = closeCardPayment;
  const openCheckoutBtn = document.getElementById("openCheckoutBtn");
  const checkoutBackBtn = document.getElementById("checkoutBackBtn");
  const checkoutPixBtn = document.getElementById("checkoutPixBtn");
  const checkoutLinkBtn = document.getElementById("checkoutLinkBtn");
  const checkoutCardBtn = document.getElementById("checkoutCardBtn");
  const checkoutPrimaryPayBtn = document.getElementById("checkoutPrimaryPayBtn");
  const checkoutZipInput = document.getElementById("checkoutCustomerZip");
  if (openCheckoutBtn) openCheckoutBtn.onclick = openCheckoutPage;
  if (checkoutBackBtn) checkoutBackBtn.onclick = closeCheckoutPage;
  if (checkoutPixBtn) checkoutPixBtn.onclick = () => selectPaymentMethod("pix");
  if (checkoutLinkBtn) checkoutLinkBtn.onclick = () => selectPaymentMethod("link");
  if (checkoutCardBtn) checkoutCardBtn.onclick = () => selectPaymentMethod("card");
  if (checkoutPrimaryPayBtn) checkoutPrimaryPayBtn.onclick = runSelectedCheckoutPayment;
  if (checkoutZipInput) {
    checkoutZipInput.addEventListener("input", () => {
      const digits = checkoutZipInput.value.replace(/\D/g, "").slice(0, 8);
      checkoutZipInput.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
      if (digits.length === 8) lookupCheckoutCep();
    });
    checkoutZipInput.addEventListener("blur", lookupCheckoutCep);
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCart();
      closeCardPayment();
      closeCheckoutPage();
      hideProductHover();
    }
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

function ensureCheckoutButton() {
  if (document.getElementById("openCheckoutBtn")) return;
  const address = document.getElementById("customerAddress");
  if (!address) return;
  const button = document.createElement("button");
  button.className = "checkout-open-btn";
  button.id = "openCheckoutBtn";
  button.type = "button";
  button.textContent = "Ir para checkout";
  address.insertAdjacentElement("afterend", button);
}

function renderAll() {
  applySettings();
  renderNavigation();
  renderServices();
  renderPortfolio();
  renderTestimonials();
  renderCategories();
  setWelcomeTab("intro");
  renderPromoCarousel();
  renderProducts();
  renderCart();
}

function reloadStorefrontFromLocal() {
  try {
    const saved = localStorage.getItem("johnvisionseg_app_pro");
    if (!saved) return;
    app = normalizeTextEncoding(mergeAppData(JSON.parse(saved)));
    renderMaintenanceMode();
    renderNavigation();
    renderCategories();
    renderPromoCarousel();
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
  loadCart();
  bindEvents();
  bindDataSync();
  renderAll();
  restartPromoAutoplay();
  if (window.location.hash === "#checkout" && cart.length) openCheckoutPage();
  initSimulator();
  initPlanner();
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

// ════════════════════════════════════════════════════════════
// SIMULADOR DE CFTV PRO
// ════════════════════════════════════════════════════════════
let simState = {
  resolution: '4k',
  vision: 'infrared',
  ia: 'human',
  zoom: 1
};

function initSimulator() {
  const viewport = document.getElementById("cameraViewport");
  if (!viewport) return; // Exit if not on storefront

  // Update clock every second
  setInterval(updateSimClock, 1000);
  
  // Randomize stats slightly every 2 seconds
  setInterval(updateSimStats, 2000);
  
  // Initialize scene
  applySimState();
}

function updateSimClock() {
  const timestampEl = document.getElementById("hudTimestamp");
  if (timestampEl) {
    const now = new Date();
    timestampEl.textContent = now.toLocaleString("pt-BR");
  }
}

function updateSimStats() {
  const fpsEl = document.getElementById("hudFps");
  const bandwidthEl = document.getElementById("hudBandwidth");
  if (!fpsEl || !bandwidthEl) return;
  
  // Dynamic FPS
  const fpsBase = simState.resolution === '6k' ? 30 : 60;
  const fpsOffset = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
  fpsEl.textContent = `${fpsBase + fpsOffset} FPS`;
  
  // Dynamic Bandwidth
  let bandBase = 4.2;
  if (simState.resolution === '1080p') bandBase = 1.4;
  if (simState.resolution === '6k') bandBase = 6.8;
  const bandOffset = (Math.random() * 0.6) - 0.3; // -0.3 to +0.3
  bandwidthEl.textContent = `${(bandBase + bandOffset).toFixed(1)} Mbps`;
}

function setSimResolution(mode) {
  simState.resolution = mode;
  
  // Update HUD Label
  const label = document.getElementById("hudCamRes");
  if (label) {
    label.textContent = mode === '4k' ? '4K UHD' : mode === '6k' ? '6K SUPER_HD' : '1080p FHD';
    label.style.background = mode === '6k' ? '#ff2d55' : mode === '4k' ? '#ff8c00' : '#1e6fff';
  }
  
  // Update buttons active class
  document.querySelectorAll("#btnRes4k, #btnRes6k, #btnRes1080p").forEach(btn => {
    btn.classList.toggle("active", btn.id === `btnRes${mode.toUpperCase()}`);
  });
  
  applySimState();
}

function setSimVision(mode) {
  simState.vision = mode;
  
  // Update buttons active class
  document.querySelectorAll("#btnVisionInfra, #btnVisionColor, #btnVisionStrobe").forEach(btn => {
    const targetId = mode === 'infrared' ? 'btnVisionInfra' : mode === 'color' ? 'btnVisionColor' : 'btnVisionStrobe';
    btn.classList.toggle("active", btn.id === targetId);
  });
  
  applySimState();
}

function setSimIA(mode) {
  simState.ia = mode;
  
  // Update buttons active class
  document.querySelectorAll("#btnIAHuman, #btnIAVehicle, #btnIAOff").forEach(btn => {
    const suffix = mode === 'human' ? 'Human' : mode === 'vehicle' ? 'Vehicle' : 'Off';
    btn.classList.toggle("active", btn.id === `btnIA${suffix}`);
  });
  
  applySimState();
}

function setSimZoom(level) {
  simState.zoom = level;
  
  // Update buttons active class
  document.querySelectorAll("#btnZoom1, #btnZoom4, #btnZoom8").forEach(btn => {
    btn.classList.toggle("active", btn.id === `btnZoom${level}`);
  });
  
  applySimState();
}

function applySimState() {
  const feed = document.getElementById("cameraFeedBg");
  const scene = document.getElementById("simScene");
  const viewport = document.getElementById("cameraViewport");
  if (!feed || !scene || !viewport) return;
  
  // 1. Apply Resolution (nitidez / blur effect)
  if (simState.resolution === '1080p') {
    feed.style.filter = 'blur(0.8px) grayscale(0)';
  } else if (simState.resolution === '4k') {
    feed.style.filter = 'none';
  } else if (simState.resolution === '6k') {
    feed.style.filter = 'contrast(1.06)';
  }
  
  // 2. Apply Vision Mode
  feed.className = "camera-feed-bg"; // reset classes
  feed.classList.add(`mode-${simState.vision}`);
  
  // 3. Apply IA mode
  feed.classList.toggle("ia-human-active", simState.ia === 'human');
  feed.classList.toggle("ia-vehicle-active", simState.ia === 'vehicle');
  
  // 4. Apply Zoom scale
  scene.style.transform = `scale(${simState.zoom})`;
  
  // 5. Trigger Strobo / Alarm disuasion active
  const isAlarmTriggered = simState.vision === 'smart-alert' && simState.ia !== 'off';
  viewport.classList.toggle("alert-active", isAlarmTriggered);
}

// ════════════════════════════════════════════════════════════
// ASSISTENTE DE PROJETOS INTELIGENTE
// ════════════════════════════════════════════════════════════
let plannerState = {
  step: 1,
  answers: {
    step1: '',
    step1Label: '',
    step2: '',
    step2Label: '',
    step3: '',
    step3Label: '',
    step4: '',
    step4Label: ''
  },
  recommendedProducts: [],
  recommendedKitName: '',
  recommendedKitPrice: 0,
  recommendedKitDesc: '',
  recommendedKitItems: []
};

function initPlanner() {
  // Ensure we are reset
  restartPlanner();
}

function selectPlannerOption(step, value, label) {
  plannerState.answers[`step${step}`] = value;
  plannerState.answers[`step${step}Label`] = label;
  
  if (step < 4) {
    transitionToPlannerStep(step + 1);
  } else {
    calculatePlannerResults();
  }
}

function transitionToPlannerStep(nextStep) {
  // Hide current step
  const currentPanel = document.getElementById(`plannerStep${plannerState.step}`);
  if (currentPanel) currentPanel.style.display = 'none';
  
  // Update state
  plannerState.step = nextStep;
  
  // Show next step
  const nextPanel = document.getElementById(`plannerStep${nextStep}`);
  if (nextPanel) {
    nextPanel.style.display = 'block';
    nextPanel.classList.add('active');
  }
  
  // Update progress bar & step number text
  const fill = document.getElementById("plannerProgressFill");
  const numText = document.getElementById("currentStepNum");
  if (fill) fill.style.width = `${nextStep * 25}%`;
  if (numText) numText.textContent = nextStep;
}

function calculatePlannerResults() {
  const answers = plannerState.answers;
  
  let recommendation = {
    name: 'Kit Especial iCSee Pro',
    price: 1159.60,
    desc: 'O projeto ideal para cobrir todas as frentes com câmeras PTZ de movimentação total, áudio bidirecional e inteligência artificial para detecção de presença.',
    emoji: '🛡️',
    badges: ['Visão Colorida', 'iCSee App', 'IA Humana'],
    items: [
      '4x Câmeras PTZ Wi-Fi 5MP Inteligentes (iCSee)',
      '4x Cartões de Memória MicroSD 64GB de Alta Velocidade',
      '4x Fontes 12V Blindadas contra Chuva',
      'Configuração Remota Inclusa e Suporte Técnico Pós-Venda'
    ],
    productIds: [101, 101, 101, 101] // We will add 4x camera 101
  };
  
  // Check rules for different kit recommendations
  if (answers.step1 === 'rural' || answers.step4 === 'semfio') {
    // Recommendation Solar
    recommendation = {
      name: 'Sistema Solar PTZ Totalmente Sem Fios',
      price: 399.90,
      desc: 'Ideal para locais sem ponto de eletricidade ou de difícil cabeamento (fazendas, portões afastados). Funciona 100% com energia solar e bateria de alta durabilidade.',
      emoji: '☀️',
      badges: ['Energia Solar', '100% Sem Fio', 'Conexão Wi-Fi'],
      items: [
        '1x Câmera PTZ Wi-Fi 3MP Solar com Bateria (iCSee)',
        '1x Painel Solar de Silício Monocristalino com Suporte',
        '1x Cartão de Memória MicroSD 64GB de Alta Velocidade',
        'Suporte especializado para instalação e pareamento'
      ],
      productIds: [105] // Camera solar
    };
  } else if (answers.step3 === 'dvr') {
    // Recommendation DVR cabeado
    recommendation = {
      name: 'Kit CFTV Profissional Cabeado Intelbras',
      price: 1699.80,
      desc: 'A segurança corporativa tradicional com gravação contínua em disco rígido físico de alta confiabilidade. Imagens seguras 24 horas por dia.',
      emoji: '📼',
      badges: ['Gravação Contínua', 'Alta Segurança', 'HD Seagate 1TB'],
      items: [
        '1x DVR Gravador Digital Intelbras Multi-HD 4 Canais',
        '1x HD Interno Seagate Pipeline 1TB Especial para CFTV',
        '4x Câmeras Multi-HD Dome/Bullet com Visão Noturna 20m',
        '1x Fonte Colmeia Centralizada 10A e Acessórios de Conexão',
        'Suporte pós-venda para configuração do acesso celular'
      ],
      productIds: [2, 3] // Kit CFTV 4 cameras + DVR
    };
  } else if (answers.step2 === '1cam') {
    // Recommendation Single PTZ Camera
    recommendation = {
      name: 'Câmera Inteligente PTZ Individual Pro',
      price: 289.90,
      desc: 'A solução mais rápida e econômica para monitoramento pontual. Excelente qualidade de imagem, facilidade de uso e alertas diretos no celular.',
      emoji: '📷',
      badges: ['Instalação Fácil', 'Áudio Bidirecional', 'Alerta Celular'],
      items: [
        '1x Câmera PTZ Wi-Fi Inteligente 5MP iCSee',
        '1x Cartão de Memória MicroSD 64GB de Alta Velocidade',
        '1x Fonte 12V Blindada para Tomadas Externas',
        'Aplicativo iCSee em Português Gratuito'
      ],
      productIds: [101]
    };
  } else if (answers.step2 === 'kit8' || answers.step2 === 'projeto') {
    // Recommendation Large Pro Kit
    recommendation = {
      name: 'Kit Segurança Máxima Pro 8 Câmeras PTZ',
      price: 2319.20,
      desc: 'Cinturão completo de segurança eletrônica com cobertura de 360 graus para grandes terrenos, comércios amplos ou galpões. Rastreamento inteligente em todos os canais.',
      emoji: '🛡️🔥',
      badges: ['Cobertura 360°', '8 Canais Ativos', 'iCSee App'],
      items: [
        '8x Câmeras PTZ Wi-Fi 5MP Inteligentes (iCSee)',
        '8x Cartões de Memória MicroSD 64GB de Alta Velocidade',
        '8x Fontes 12V Blindadas para Tomadas Externas',
        'Suporte total VIP de planejamento de pontos de monitoramento'
      ],
      productIds: [101, 101, 101, 101, 101, 101, 101, 101]
    };
  }
  
  // Save recommendations to state
  plannerState.recommendedKitName = recommendation.name;
  plannerState.recommendedKitPrice = recommendation.price;
  plannerState.recommendedKitDesc = recommendation.desc;
  plannerState.recommendedKitItems = recommendation.items;
  plannerState.recommendedProducts = recommendation.productIds;
  
  // Render results in HTML
  document.getElementById("recommendedKitName").textContent = recommendation.name;
  document.getElementById("recommendedKitDesc").textContent = recommendation.desc;
  document.getElementById("resultPreviewEmoji").textContent = recommendation.emoji;
  document.getElementById("recommendedKitPrice").textContent = brl(recommendation.price);
  
  // Render Badges
  const badgesContainer = document.getElementById("resultSpecsBadges");
  if (badgesContainer) {
    badgesContainer.innerHTML = recommendation.badges.map(b => `<span>${escapeHtml(b)}</span>`).join("");
  }
  
  // Render Items List
  const list = document.getElementById("recommendedKitItems");
  if (list) {
    list.innerHTML = recommendation.items.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  }
  
  // Hide step 4 panel, show results panel
  const step4Panel = document.getElementById("plannerStep4");
  if (step4Panel) step4Panel.style.display = 'none';
  
  const resultsPanel = document.getElementById("plannerResultStep");
  if (resultsPanel) {
    resultsPanel.style.display = 'block';
    resultsPanel.classList.add('active');
  }
}

function addRecommendedToCart() {
  if (!plannerState.recommendedProducts.length) return;
  
  // Add each product from recommendation to global cart
  plannerState.recommendedProducts.forEach(id => {
    const product = app.products.find(p => p.id === id);
    if (!product) return;
    
    const existing = cart.find(item => item.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1,
        fulfillment: getFulfillmentMode(product),
        supplier: product.supplier || '',
        deliveryTime: product.deliveryTime || '',
        cost: Number(product.cost || 0),
        supplierUrl: product.supplierUrl || product.sourceUrl || '',
        supplierSku: product.supplierSku || ''
      });
    }
  });
  
  // Update cart UI
  renderCart();
  
  // Fill the address text field with a cool note
  const addressField = document.getElementById("customerAddress");
  if (addressField) {
    addressField.value = `[Projeto Recomendado: ${plannerState.recommendedKitName}]\n` +
      `- Imóvel: ${plannerState.answers.step1Label}\n` +
      `- Pontos: ${plannerState.answers.step2Label}\n` +
      `- Gravação: ${plannerState.answers.step3Label}\n` +
      `- Tecnologia: ${plannerState.answers.step4Label}\n\n` +
      addressField.value;
  }
  
  // Open Cart Drawer
  openCart();
  
  // Show premium feedback toast
  showToast("Recomendação adicionada ao carrinho!");
}

function sendPlannerWhatsapp() {
  const answers = plannerState.answers;
  const message = [
    `Olá! Concluí o teste no Assistente de Projetos John@VisionSeg e gostaria de fechar este kit de segurança.`,
    ``,
    `*RESUMO DAS MINHAS RESPOSTAS:*`,
    `- Tipo de Imóvel: ${answers.step1Label}`,
    `- Pontos de Monitoramento: ${answers.step2Label}`,
    `- Formato de Gravação: ${answers.step3Label}`,
    `- Funcionalidade Chave: ${answers.step4Label}`,
    ``,
    `*PROJETO INDICADO:*`,
    `*${plannerState.recommendedKitName}*`,
    `Estimativa de Investimento: ${brl(plannerState.recommendedKitPrice)}`,
    ``,
    `Pode me confirmar os prazos de instalação/envio e formas de pagamento?`
  ].join("\n");
  
  window.open(buildWhatsAppUrl(message), "_blank", "noopener");
}

function restartPlanner() {
  plannerState.step = 1;
  plannerState.answers = {
    step1: '', step1Label: '',
    step2: '', step2Label: '',
    step3: '', step3Label: '',
    step4: '', step4Label: ''
  };
  plannerState.recommendedProducts = [];
  
  // Reset Progress
  const fill = document.getElementById("plannerProgressFill");
  const numText = document.getElementById("currentStepNum");
  if (fill) fill.style.width = '25%';
  if (numText) numText.textContent = '1';
  
  // Hide Results Panel
  const resultsPanel = document.getElementById("plannerResultStep");
  if (resultsPanel) {
    resultsPanel.classList.remove("active");
    resultsPanel.style.display = 'none';
  }
  
  // Hide all step panels
  for(let i = 2; i <= 4; i++) {
    const p = document.getElementById(`plannerStep${i}`);
    if (p) p.style.display = 'none';
  }
  
  // Show Step 1 Panel
  const step1Panel = document.getElementById("plannerStep1");
  if (step1Panel) {
    step1Panel.style.display = 'block';
    step1Panel.classList.add('active');
  }
}

// ════════════════════════════════════════════════════════════
// PREMIUM TOAST FEEDBACK SYSTEM
// ════════════════════════════════════════════════════════════
function showToast(message) {
  const existing = document.getElementById("appToast");
  if (existing) existing.remove();
  
  const toast = document.createElement("div");
  toast.id = "appToast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    left: 50%;
    bottom: 90px;
    transform: translateX(-50%);
    max-width: 90vw;
    background: #143d73;
    color: #fff;
    border: 1px solid #0f78bf;
    border-radius: 8px;
    padding: 12px 20px;
    font-weight: 800;
    z-index: 9999;
    box-shadow: 0 10px 30px rgba(15, 37, 64, 0.25);
    font-family: 'Inter', sans-serif;
    font-size: 0.88rem;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(12px)';
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// ════════════════════════════════════════════════════════════
// SUBMENU INTERACTIVE CALLBACKS
// ════════════════════════════════════════════════════════════
function setCatalogCategory(categoryName) {
  const filterSelect = document.getElementById("categoryFilter");
  if (!filterSelect) return;
  
  let found = false;
  for (let i = 0; i < filterSelect.options.length; i++) {
    if (filterSelect.options[i].text.toLowerCase().includes(categoryName.toLowerCase())) {
      filterSelect.selectedIndex = i;
      found = true;
      break;
    }
  }
  
  if (!found) {
    filterSelect.selectedIndex = 0; // fallback to 'Todas as categorias'
  }
  
  // Trigger filter rendering
  renderProducts();
  
  // Scroll smoothly to catalog
  const catalogSection = document.getElementById("produtos");
  if (catalogSection) {
    catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  
  showToast(`Vitrine filtrada por: ${categoryName}`);
}

function scrollToSolution(index) {
  const articles = document.querySelectorAll(".solution-grid article");
  if (!articles || articles.length <= index) return;
  
  const targetCard = articles[index];
  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
  
  // Highlight target card with elegant neon glow temporarily
  targetCard.style.borderColor = "var(--cyan)";
  targetCard.style.boxShadow = "var(--glow-cyan)";
  targetCard.style.transform = "translateY(-4px)";
  targetCard.style.transition = "all 0.3s ease";
  
  setTimeout(() => {
    targetCard.style.borderColor = "";
    targetCard.style.boxShadow = "";
    targetCard.style.transform = "";
  }, 2500);
}
