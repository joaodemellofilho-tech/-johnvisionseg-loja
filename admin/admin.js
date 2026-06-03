let app = getApp();
let agentMessages = [];
let currentAdmin = null;
let selectedProductIndexes = new Set();

async function login() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const auth = await getFirebaseAuth();
  if (auth) {
    try {
      const credential = await auth.signInWithEmailAndPassword(email, password);
      const user = credential.user;
      if (!isAllowedAdmin(user.email)) {
        await auth.signOut();
        alert("Este e-mail não está autorizado como administrador.");
        return;
      }
      currentAdmin = user;
      sessionStorage.setItem("jv_admin_email", user.email);
      showAdmin();
      return;
    } catch (error) {
      alert(`Falha no login Firebase: ${error.code || error.message}. Confira e-mail, senha e Authentication.`);
      return;
    }
  }
  if (canUseLocalFallback() && password === "admin123") {
    currentAdmin = { email: "local-fallback@johnvisionseg" };
    sessionStorage.setItem("jv_admin_email", currentAdmin.email);
    showAdmin();
    return;
  }
  alert("Login seguro indisponível. Configure Firebase Auth ou habilite fallback local temporário.");
}

async function restoreSession() {
  const auth = await getFirebaseAuth();
  if (auth && auth.currentUser && isAllowedAdmin(auth.currentUser.email)) {
    currentAdmin = auth.currentUser;
    showAdmin();
    return;
  }
  if (canUseLocalFallback() && sessionStorage.getItem("jv_admin_email") === "local-fallback@johnvisionseg") {
    currentAdmin = { email: "local-fallback@johnvisionseg" };
    showAdmin();
  }
}

function showAdmin() {
  document.getElementById("login").style.display = "none";
  document.getElementById("appAdmin").style.display = "grid";
  bootAdmin();
}

async function logout() {
  const auth = await getFirebaseAuth();
  if (auth) await auth.signOut();
  sessionStorage.removeItem("jv_admin_email");
  currentAdmin = null;
  document.getElementById("appAdmin").style.display = "none";
  document.getElementById("login").style.display = "block";
}

function isAllowedAdmin(email) {
  const security = window.JOHNVISIONSEG_SECURITY || {};
  const admins = (security.adminEmails || [])
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean)
    .filter((item) => item !== "admin@johnvisionseg.com");
  if (!admins.length) return true;
  return admins.includes(String(email || "").trim().toLowerCase());
}

function canUseLocalFallback() {
  return Boolean(window.JOHNVISIONSEG_SECURITY && window.JOHNVISIONSEG_SECURITY.allowLocalAdminFallback);
}

async function bootAdmin() {
  app = await loadAppData();
  renderAll();
}

restoreSession();

function showPanel(name) {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.getElementById(`panel-${name}`).classList.add("active");
  renderAll();
}

function notice() {
  const element = document.getElementById("notice");
  element.style.display = "block";
  setTimeout(() => { element.style.display = "none"; }, 1500);
}

function renderAll() {
  renderDashboard();
  renderAgent();
  renderSettings();
  renderProducts();
  renderServices();
  renderOrders();
  renderQuotes();
  renderCustomers();
  renderPortfolio();
  renderTestimonials();
}

function metric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderDashboard() {
  const sales = app.orders.reduce((total, order) => total + Number(order.total || 0), 0);
  const status = getDataStatus();
  document.getElementById("dashboardBox").innerHTML =
    metric("Produtos", app.products.length) +
    metric("Pedidos", app.orders.length) +
    metric("Orçamentos", app.quotes.length) +
    metric("Clientes", app.customers.length) +
    metric("Vendas", brl(sales)) +
    metric(status.mode === "firestore" ? "Firestore" : "Local", status.mode === "firestore" ? "Online" : "Fallback");
}

function renderAgent() {
  const low = app.products.filter((product) => product.stock > 0 && product.stock <= product.minStock);
  const out = app.products.filter((product) => product.stock <= 0);
  const noPrice = app.products.filter((product) => !product.price || product.price <= 0);
  const pending = app.orders.filter((order) => order.status === "Novo");
  const quotes = app.quotes.filter((quote) => quote.status === "Novo");
  const totalSales = app.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const avgTicket = app.orders.length ? totalSales / app.orders.length : 0;
  const health = calculateBusinessHealth({ low, out, noPrice, pending, quotes });

  let html = `
    <div class="agent-grid">
      <div class="agent-score">
        <span>Saúde operacional</span>
        <strong>${health.score}%</strong>
        <p>${escapeHtml(health.label)}</p>
      </div>
      <div class="agent-box">
        <h3>Resumo inteligente</h3>
        <p>Pedidos novos: <strong>${pending.length}</strong></p>
        <p>Orçamentos novos: <strong>${quotes.length}</strong></p>
        <p>Vendas registradas: <strong>${brl(totalSales)}</strong></p>
        <p>Ticket médio: <strong>${brl(avgTicket)}</strong></p>
      </div>
      <div class="agent-box">
        <h3>Riscos detectados</h3>
        <p>Baixo estoque: <strong>${low.length}</strong></p>
        <p>Esgotados: <strong>${out.length}</strong></p>
        <p>Sem preço: <strong>${noPrice.length}</strong></p>
        <p>Cadastros incompletos: <strong>${findIncompleteProducts().length}</strong></p>
      </div>
    </div>
  `;
  html += `<div class="agent-box"><h3>Plano recomendado</h3>${buildAgentRecommendations(low, out, noPrice, pending, quotes).map((item) => `<p>${escapeHtml(item)}</p>`).join("")}</div>`;
  if (low.length) html += `<div class="agent-box"><h3>Reposição recomendada</h3>${low.map((product) => `<p>${escapeHtml(product.name)}: estoque ${product.stock}, mínimo ${product.minStock}</p>`).join("")}</div>`;
  if (out.length) html += `<div class="agent-box"><h3>Produtos esgotados</h3>${out.map((product) => `<p>${escapeHtml(product.name)}</p>`).join("")}</div>`;
  if (noPrice.length) html += `<div class="agent-box"><h3>Corrigir preço</h3>${noPrice.map((product) => `<p>${escapeHtml(product.name)}</p>`).join("")}</div>`;
  document.getElementById("agentReport").innerHTML = html;
  renderAgentChat();
}

function calculateBusinessHealth({ low, out, noPrice, pending, quotes }) {
  let score = 100;
  score -= out.length * 14;
  score -= low.length * 8;
  score -= noPrice.length * 12;
  score -= Math.min(25, pending.length * 5);
  score -= Math.min(20, quotes.length * 4);
  score = Math.max(0, Math.min(100, score));
  const label = score >= 85 ? "Tudo pronto para vender com tranquilidade." : score >= 65 ? "Boa operação, mas há pontos para acompanhar." : "Atenção: há pendências que podem prejudicar vendas.";
  return { score, label };
}

function findIncompleteProducts() {
  return app.products.filter((product) => !product.name || !product.category || !product.desc || Number(product.price) <= 0);
}

function buildAgentRecommendations(low, out, noPrice, pending, quotes) {
  const items = [];
  if (pending.length) items.push(`Responder ${pending.length} pedido(s) novo(s) e marcar como "Em atendimento".`);
  if (quotes.length) items.push(`Retornar ${quotes.length} orçamento(s) novo(s) para aumentar a chance de fechamento.`);
  if (out.length) items.push(`Repor ou ocultar ${out.length} produto(s) esgotado(s).`);
  if (low.length) items.push(`Comprar reposição para ${low.length} produto(s) com estoque baixo.`);
  if (noPrice.length) items.push(`Corrigir preço de ${noPrice.length} produto(s) antes de divulgar a loja.`);
  if (!items.length) items.push("Nenhum bloqueio crítico no momento. Foque em divulgar a loja e revisar novos leads diariamente.");
  return items;
}

function handleAgentInput() {
  const input = document.getElementById("agentCommand");
  runAgentCommand(input.value);
  input.value = "";
}

function runAgentCommand(rawCommand) {
  const command = String(rawCommand || "").trim();
  if (!command) return;
  agentMessages.unshift({ role: "user", text: command, date: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
  const response = executeAgentCommand(command);
  agentMessages.unshift({ role: "agent", text: response, date: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) });
  saveApp(app);
  renderAll();
}

function executeAgentCommand(command) {
  const normalized = normalizeText(command);
  if (normalized.includes("resumo")) return getExecutiveSummary();
  if (normalized.includes("alerta")) return getCriticalAlerts();
  if (normalized.includes("marcar pedidos") || normalized.includes("atender pedidos")) return setNewOrdersInProgress();
  if (normalized.includes("marcar orcamentos") || normalized.includes("atender orcamentos")) return setNewQuotesInProgress();
  if (normalized.startsWith("criar produto") || normalized.startsWith("adicionar produto")) return createProductByCommand(command);
  if (normalized.includes("ajustar estoque") || normalized.includes("alterar estoque")) return updateStockByCommand(command);
  if (normalized.includes("trocar titulo") || normalized.includes("alterar titulo")) return updateHeroTitle(command);
  if (normalized.includes("trocar whatsapp") || normalized.includes("alterar whatsapp")) return updateWhatsapp(command);
  if (normalized.includes("ajuda") || normalized.includes("comandos")) return getAgentHelp();
  return "Ainda não entendi esse comando. Tente: gerar resumo executivo, listar alertas críticos, ajustar estoque [produto] para [n], criar produto Nome | Categoria | Preço | Estoque | Descrição, trocar título para [texto].";
}

function normalizeText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getExecutiveSummary() {
  const sales = app.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pendingOrders = app.orders.filter((order) => order.status === "Novo").length;
  const pendingQuotes = app.quotes.filter((quote) => quote.status === "Novo").length;
  const low = app.products.filter((product) => product.stock > 0 && product.stock <= product.minStock).length;
  const out = app.products.filter((product) => product.stock <= 0).length;
  return `Resumo: ${app.products.length} produto(s), ${app.orders.length} pedido(s), ${app.quotes.length} orçamento(s), ${brl(sales)} em vendas registradas. Prioridade agora: ${pendingOrders} pedido(s) novo(s), ${pendingQuotes} orçamento(s) novo(s), ${low} item(ns) com baixo estoque e ${out} esgotado(s).`;
}

function getCriticalAlerts() {
  const alerts = buildAgentRecommendations(
    app.products.filter((product) => product.stock > 0 && product.stock <= product.minStock),
    app.products.filter((product) => product.stock <= 0),
    app.products.filter((product) => !product.price || product.price <= 0),
    app.orders.filter((order) => order.status === "Novo"),
    app.quotes.filter((quote) => quote.status === "Novo")
  );
  return `Alertas críticos: ${alerts.join(" ")}`;
}

function setNewOrdersInProgress() {
  const orders = app.orders.filter((order) => order.status === "Novo");
  orders.forEach((order) => { order.status = "Em atendimento"; });
  return orders.length ? `${orders.length} pedido(s) marcado(s) como Em atendimento.` : "Não há pedidos novos para atualizar.";
}

function setNewQuotesInProgress() {
  const quotes = app.quotes.filter((quote) => quote.status === "Novo");
  quotes.forEach((quote) => { quote.status = "Em atendimento"; });
  return quotes.length ? `${quotes.length} orçamento(s) marcado(s) como Em atendimento.` : "Não há orçamentos novos para atualizar.";
}

function updateStockByCommand(command) {
  const match = command.match(/estoque\s+(.+?)\s+(?:para|=)\s*(\d+)/i) || command.match(/(.+?)\s+estoque\s+(?:para|=)\s*(\d+)/i);
  if (!match) return "Para ajustar estoque, use: ajustar estoque Nome do produto para 10.";
  const name = normalizeText(match[1].replace(/ajustar|alterar|estoque/gi, "").trim());
  const amount = Number(match[2]);
  const product = findProductByText(name);
  if (!product) return "Não encontrei esse produto. Use parte exata do nome cadastrado.";
  product.stock = amount;
  return `Estoque de ${product.name} atualizado para ${amount}.`;
}

function findProductByText(search) {
  const searchTokens = normalizeText(search).split(/\s+/).filter((token) => token.length >= 3);
  return app.products.find((product) => {
    const productText = normalizeText(`${product.name} ${product.category} ${product.desc}`);
    if (productText.includes(normalizeText(search))) return true;
    return searchTokens.some((token) => productText.includes(token));
  });
}

function createProductByCommand(command) {
  const clean = command.replace(/^(criar|adicionar)\s+produto\s*/i, "").trim();
  const parts = clean.split("|").map((part) => part.trim());
  if (parts.length < 5) return "Para criar produto, use: criar produto Nome | Categoria | Preço | Estoque | Descrição.";
  const [name, category, price, stock, desc] = parts;
  const generated = generateProductProfile({ name, category, price: Number(price.replace(",", ".")), stock: Number(stock), desc });
  app.products.push({ id: Date.now(), name, category, price: Number(price.replace(",", ".")), stock: Number(stock), minStock: generated.minStock, emoji: generated.emoji, imageUrl: "", specs: generated.specs, desc });
  return `Produto "${name}" criado na categoria ${category}.`;
}

function updateHeroTitle(command) {
  const title = command.replace(/.*(?:trocar|alterar)\s+t[ií]tulo\s+(?:para|=)\s*/i, "").trim();
  if (!title || title === command) return "Para trocar o título, use: trocar título para Seu novo título.";
  app.settings.heroTitle = title;
  return "Título principal do site atualizado.";
}

function updateWhatsapp(command) {
  const value = command.replace(/.*(?:trocar|alterar)\s+whatsapp\s+(?:para|=)\s*/i, "").trim();
  if (!value || value === command) return "Para trocar WhatsApp, use: trocar whatsapp para (11) 99999-9999.";
  app.settings.whatsapp = value;
  const digits = value.replace(/\D/g, "");
  if (digits.length >= 10) app.settings.whatsappLink = `https://wa.me/55${digits.replace(/^55/, "")}`;
  return "WhatsApp visual e link de atendimento atualizados.";
}

function getAgentHelp() {
  return "Comandos disponíveis: gerar resumo executivo; listar alertas críticos; marcar pedidos novos em atendimento; marcar orçamentos novos em atendimento; ajustar estoque Nome para 10; criar produto Nome | Categoria | Preço | Estoque | Descrição; trocar título para Novo texto; trocar whatsapp para Número.";
}

function renderAgentChat() {
  const chat = document.getElementById("agentChat");
  if (!chat) return;
  chat.innerHTML = agentMessages.length ? agentMessages.slice(0, 8).map((message) => `
    <div class="agent-message ${message.role}">
      <strong>${message.role === "agent" ? "Agente IA" : "Você"}</strong>
      <span>${escapeHtml(message.date)}</span>
      <p>${escapeHtml(message.text)}</p>
    </div>
  `).join("") : '<div class="agent-message agent"><strong>Agente IA</strong><span>agora</span><p>Pronto para administrar o site. Digite “ajuda” para ver comandos.</p></div>';
}

function renderSettings() {
  Object.keys(app.settings).forEach((key) => {
    const element = document.getElementById(key);
    if (!element) return;
    if (element.type === "checkbox") {
      element.checked = Boolean(app.settings[key]);
    } else {
      element.value = app.settings[key];
    }
  });
}

async function saveSettings() {
  Object.keys(app.settings).forEach((key) => {
    const element = document.getElementById(key);
    if (!element) return;
    app.settings[key] = element.type === "checkbox" ? element.checked : element.value.trim();
  });
  app.settings.mercadoPagoMaxInstallments = Math.max(1, Math.min(24, Number(app.settings.mercadoPagoMaxInstallments || 10)));
  const savedCloud = await saveApp(app);
  notice();
  if (!savedCloud) {
    alert("Salvei neste navegador, mas o Firestore recusou a gravação. Verifique login admin/regras antes de recarregar.");
  }
}

function toggleMaintenanceMode() {
  const checkbox = document.getElementById("maintenanceMode");
  if (!checkbox) return;
  checkbox.checked = !checkbox.checked;
  app.settings.maintenanceMode = checkbox.checked;
  if (!app.settings.maintenanceTitle) app.settings.maintenanceTitle = "Loja em manutencao";
  if (!app.settings.maintenanceMessage) app.settings.maintenanceMessage = "Estamos ajustando a vitrine. Volte em breve ou fale conosco pelo WhatsApp.";
  saveApp(app);
  renderSettings();
  notice();
  alert(checkbox.checked ? "Loja desligada para manutencao." : "Loja online novamente.");
}

function renderProducts() {
  selectedProductIndexes = new Set([...selectedProductIndexes].filter((index) => index >= 0 && index < app.products.length));
  updateProductSelectionSummary();
  document.getElementById("productsList").innerHTML = app.products.map((product, index) => `
    <div class="admin-card product-editor ${selectedProductIndexes.has(index) ? "selected" : ""}">
      <label class="product-select-row">
        <input type="checkbox" data-product-select="${index}" ${selectedProductIndexes.has(index) ? "checked" : ""} onchange="toggleProductSelection(${index}, this.checked)">
        <span>Selecionar produto</span>
      </label>
      <div class="admin-product-grid">
        <div class="product-preview has-photo">
          <img src="${escapeHtml(getAdminProductImage(product))}" alt="${escapeHtml(product.name)}">
        </div>
        <div>
          <input value="${escapeHtml(product.name)}" data-name="${index}" placeholder="Nome">
          <input value="${escapeHtml(product.category)}" data-cat="${index}" placeholder="Categoria">
          <div class="admin-inline">
            <input type="number" step="0.01" value="${Number(product.price || 0)}" data-price="${index}" placeholder="Preço">
            <input type="number" value="${Number(product.stock || 0)}" data-stock="${index}" placeholder="Estoque">
            <input type="number" value="${Number(product.minStock || 0)}" data-min="${index}" placeholder="Estoque mínimo">
          </div>
          <div class="admin-inline">
            <input value="${escapeHtml(product.emoji || "")}" data-emoji="${index}" placeholder="Sigla/ícone">
            <input value="${escapeHtml(getProductEditorImages(product)[0] || "")}" data-image="${index}" data-image-slot="0" placeholder="Imagem 1">
            <input value="${escapeHtml(getProductEditorImages(product)[1] || "")}" data-image="${index}" data-image-slot="1" placeholder="Imagem 2">
            <input value="${escapeHtml(getProductEditorImages(product)[2] || "")}" data-image="${index}" data-image-slot="2" placeholder="Imagem 3">
          </div>
          <div class="admin-inline">
            <input value="${escapeHtml(product.mercadoLivreUrl || "")}" data-ml-url="${index}" placeholder="Link Mercado Livre">
            <input value="${escapeHtml(product.mercadoLivreId || "")}" data-ml-id="${index}" placeholder="Código MLB">
            <button onclick="syncMercadoLivreProduct(${index})" type="button">Buscar ML</button>
          </div>
          <div class="admin-inline">
            <select data-fulfillment="${index}">
              <option value="local" ${getFulfillmentMode(product) === "local" ? "selected" : ""}>Produto proprio</option>
              <option value="dropshipping" ${getFulfillmentMode(product) === "dropshipping" ? "selected" : ""}>Dropshipping</option>
              <option value="preorder" ${getFulfillmentMode(product) === "preorder" ? "selected" : ""}>Sob encomenda</option>
            </select>
            <input value="${escapeHtml(product.supplier || "")}" data-supplier="${index}" placeholder="Fornecedor">
            <input value="${escapeHtml(product.deliveryTime || "")}" data-delivery="${index}" placeholder="Prazo de entrega">
          </div>
          <div class="admin-inline">
            <input type="number" step="0.01" value="${Number(product.cost || 0)}" data-cost="${index}" placeholder="Custo fornecedor">
            <input value="${escapeHtml(product.supplierUrl || product.sourceUrl || "")}" data-supplier-url="${index}" placeholder="Link do fornecedor">
            <input value="${escapeHtml(product.supplierSku || "")}" data-supplier-sku="${index}" placeholder="SKU fornecedor">
          </div>
          <div class="dropship-summary">${renderProductMarginSummary(product)}</div>
          <input type="file" accept="image/*" multiple onchange="uploadProductImages(${index}, this.files)">
          <textarea data-desc="${index}" placeholder="Descrição">${escapeHtml(product.desc)}</textarea>
          <textarea data-specs="${index}" placeholder="Especificações, uma por linha">${escapeHtml((product.specs || []).join("\n"))}</textarea>
          <button onclick="autoFillProduct(${index})" type="button">Preencher automático</button>
          <button onclick="automateProductDropshipping(${index})" type="button">Automatizar dropshipping</button>
          <button onclick="repriceProductByMargin(${index})" type="button">Recalcular preco 35%</button>
          <button class="danger" onclick="removeProduct(${index})" type="button">Remover</button>
        </div>
      </div>
    </div>
  `).join("");
  updateProductSelectionSummary();
}

function toggleProductSelection(index, checked) {
  if (checked) selectedProductIndexes.add(index);
  else selectedProductIndexes.delete(index);
  updateProductSelectionSummary();
  const card = document.querySelector(`[data-product-select="${index}"]`)?.closest(".product-editor");
  if (card) card.classList.toggle("selected", checked);
}

function toggleAllProductSelection(checked) {
  selectedProductIndexes = checked ? new Set(app.products.map((_, index) => index)) : new Set();
  renderProducts();
}

function clearProductSelection() {
  selectedProductIndexes.clear();
  renderProducts();
}

async function removeSelectedProducts() {
  const indexes = [...selectedProductIndexes].sort((a, b) => b - a);
  if (!indexes.length) return alert("Selecione pelo menos um produto para remover.");
  const preview = indexes.slice(0, 5).map((index) => app.products[index]?.name).filter(Boolean).join("\n- ");
  const extra = indexes.length > 5 ? `\n...e mais ${indexes.length - 5} produto(s)` : "";
  if (!confirm(`Remover ${indexes.length} produto(s)?\n\n- ${preview}${extra}`)) return;
  indexes.forEach((index) => app.products.splice(index, 1));
  selectedProductIndexes.clear();
  await saveApp(app);
  renderProducts();
  renderDashboard();
  renderAgent();
  notice();
}

function updateProductSelectionSummary() {
  const count = selectedProductIndexes.size;
  const countEl = document.getElementById("selectedProductsCount");
  const toggle = document.getElementById("selectAllProducts");
  if (countEl) countEl.textContent = `${count} selecionado${count === 1 ? "" : "s"}`;
  if (toggle) {
    toggle.checked = app.products.length > 0 && count === app.products.length;
    toggle.indeterminate = count > 0 && count < app.products.length;
  }
}

function getFulfillmentMode(product) {
  return ["dropshipping", "preorder"].includes(product.fulfillment) ? product.fulfillment : "local";
}

function renderProductMarginSummary(product) {
  const cost = Number(product.cost || 0);
  const price = Number(product.price || 0);
  const profit = price - cost;
  const margin = price > 0 && cost > 0 ? (profit / price) * 100 : 0;
  const mode = getFulfillmentMode(product) === "dropshipping" ? "Dropshipping" : getFulfillmentMode(product) === "preorder" ? "Sob encomenda" : "Pronta entrega";
  const supplier = product.supplier ? `Fornecedor: ${escapeHtml(product.supplier)} | ` : "";
  const delivery = product.deliveryTime ? `Prazo: ${escapeHtml(product.deliveryTime)} | ` : "";
  const financial = cost > 0 ? `Custo: ${brl(cost)} | Lucro: ${brl(profit)} (${margin.toFixed(0)}%)` : "Informe o custo para calcular lucro.";
  return `${mode} | ${supplier}${delivery}${financial}`;
}

function getSupplierFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("mercadolivre")) return "Mercado Livre";
    if (host.includes("aliexpress")) return "AliExpress";
    if (host.includes("shopee")) return "Shopee";
    if (host.includes("amazon")) return "Amazon";
    return host.split(".")[0].replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return "";
  }
}

function getDeliveryBySupplier(supplier) {
  const text = normalizeText(supplier);
  if (text.includes("mercado livre") || text.includes("amazon")) return "3 a 8 dias uteis";
  if (text.includes("shopee")) return "7 a 15 dias uteis";
  if (text.includes("aliexpress")) return "15 a 30 dias uteis";
  return "7 a 15 dias uteis";
}

function roundSalePrice(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.max(9.9, Math.ceil(value / 10) * 10 - 0.1);
}

function calculateSalePrice(cost, margin) {
  const numericCost = Number(cost || 0);
  const numericMargin = Math.min(80, Math.max(5, Number(margin || 35)));
  if (numericCost <= 0) return 0;
  return roundSalePrice(numericCost / (1 - numericMargin / 100));
}

function quickCalculateSalePrice() {
  const cost = Number(document.getElementById("quickProductCost").value || 0);
  if (cost <= 0) {
    setQuickProductStatus("Informe o custo no fornecedor para calcular o preco de venda.", "error");
    return;
  }
  const margin = Number(document.getElementById("quickProductMargin").value || 35);
  document.getElementById("quickProductPrice").value = calculateSalePrice(cost, margin).toFixed(2);
  setQuickProductStatus(`Preco calculado com margem de ${margin}% sobre o custo.`, "success");
}

function quickAutomateDropshipping() {
  const source = document.getElementById("quickProductSupplierUrl").value.trim() || document.getElementById("quickProductSource").value.trim() || document.getElementById("quickProductName").value.trim();
  if (source.startsWith("http")) {
    const supplier = getSupplierFromUrl(source);
    document.getElementById("quickProductSource").value = document.getElementById("quickProductSource").value.trim() || source;
    document.getElementById("quickProductSupplierUrl").value = source;
    document.getElementById("quickProductSupplier").value = document.getElementById("quickProductSupplier").value.trim() || supplier;
    document.getElementById("quickProductDelivery").value = document.getElementById("quickProductDelivery").value.trim() || getDeliveryBySupplier(supplier);
    document.getElementById("quickProductSku").value = document.getElementById("quickProductSku").value.trim() || extractMercadoLivreId(source);
  }
  document.getElementById("quickProductFulfillment").value = "dropshipping";
  if (!Number(document.getElementById("quickProductStock").value || 0)) document.getElementById("quickProductStock").value = 999;
  if (!Number(document.getElementById("quickProductMinStock").value || 0)) document.getElementById("quickProductMinStock").value = 0;
  if (Number(document.getElementById("quickProductCost").value || 0) > 0) quickCalculateSalePrice();
  setQuickProductStatus("Dropshipping automatizado: fornecedor, prazo, estoque virtual e margem preparados.", "success");
}

async function quickAutoFillProduct() {
  const rawName = document.getElementById("quickProductName").value.trim();
  const source = document.getElementById("quickProductSource").value.trim();
  const maybeLink = rawName.startsWith("http") ? rawName : source;
  if (rawName.startsWith("http") && !source) document.getElementById("quickProductSource").value = rawName;

  let linkData = null;
  if (maybeLink) linkData = await getQuickProductLinkData(maybeLink);
  const name = linkData?.title || (rawName.startsWith("http") ? extractReadableNameFromUrl(rawName) : rawName);
  if (!name) {
    setQuickProductStatus("Digite o nome do produto ou cole um link para preencher.", "error");
    return;
  }

  const current = {
    name,
    category: document.getElementById("quickProductCategory").value,
    price: Number(document.getElementById("quickProductPrice").value || linkData?.price || 0),
    stock: Number(document.getElementById("quickProductStock").value || 0),
    minStock: Number(document.getElementById("quickProductMinStock").value || 0),
    desc: document.getElementById("quickProductDesc").value
  };
  const generated = generateProductProfile(current);
  const imageUrl = document.getElementById("quickProductImage").value.trim() || linkData?.imageUrl || getStorefrontFallbackImage({
    name,
    category: current.category || generated.category
  });

  document.getElementById("quickProductName").value = name;
  document.getElementById("quickProductCategory").value = current.category && current.category !== "Categoria" ? current.category : generated.category;
  document.getElementById("quickProductPrice").value = current.price > 0 ? current.price : generated.price;
  document.getElementById("quickProductStock").value = current.stock > 0 ? current.stock : generated.stock;
  document.getElementById("quickProductMinStock").value = current.minStock > 0 ? current.minStock : generated.minStock;
  document.getElementById("quickProductDesc").value = current.desc && current.desc !== "Descricao" ? current.desc : (linkData?.desc || generated.desc);
  document.getElementById("quickProductSpecs").value = (linkData?.specs?.length ? linkData.specs : generated.specs).join("\n");
  document.getElementById("quickProductImage").value = imageUrl;
  if (maybeLink) {
    document.getElementById("quickProductSource").value = maybeLink;
    if (maybeLink.startsWith("http")) {
      const supplier = getSupplierFromUrl(maybeLink);
      document.getElementById("quickProductFulfillment").value = "dropshipping";
      document.getElementById("quickProductSupplier").value = document.getElementById("quickProductSupplier").value.trim() || supplier;
      document.getElementById("quickProductSupplierUrl").value = document.getElementById("quickProductSupplierUrl").value.trim() || maybeLink;
      document.getElementById("quickProductDelivery").value = document.getElementById("quickProductDelivery").value.trim() || getDeliveryBySupplier(supplier);
      document.getElementById("quickProductSku").value = document.getElementById("quickProductSku").value.trim() || extractMercadoLivreId(maybeLink);
    }
  }
  updateQuickProductPreview(collectQuickProductImages());
  setQuickProductStatus("Campos preenchidos automaticamente. Revise e clique em Adicionar e salvar.", "success");
}

async function quickCreateProduct() {
  const rawName = document.getElementById("quickProductName").value.trim();
  if (!rawName) {
    setQuickProductStatus("Informe o nome do produto antes de salvar.", "error");
    return;
  }
  if (rawName.startsWith("http") || !document.getElementById("quickProductCategory").value.trim()) {
    await quickAutoFillProduct();
  }

  const name = document.getElementById("quickProductName").value.trim();
  const category = document.getElementById("quickProductCategory").value.trim();
  const source = document.getElementById("quickProductSource").value.trim();
  const generated = generateProductProfile({
    name,
    category,
    price: Number(document.getElementById("quickProductPrice").value || 0),
    stock: Number(document.getElementById("quickProductStock").value || 0),
    desc: document.getElementById("quickProductDesc").value.trim()
  });
  const product = {
    id: Date.now(),
    name,
    category: category || generated.category,
    price: Number(document.getElementById("quickProductPrice").value || generated.price),
    stock: Number(document.getElementById("quickProductStock").value || generated.stock),
    minStock: Number(document.getElementById("quickProductMinStock").value || generated.minStock),
    emoji: generated.emoji,
    imageUrl: collectQuickProductImages()[0] || getStorefrontFallbackImage({ name, category: category || generated.category }),
    images: collectQuickProductImages(),
    mercadoLivreUrl: source.includes("mercadolivre") ? source : "",
    mercadoLivreId: extractMercadoLivreId(source),
    sourceUrl: source,
    fulfillment: document.getElementById("quickProductFulfillment").value || "local",
    supplier: document.getElementById("quickProductSupplier").value.trim(),
    deliveryTime: document.getElementById("quickProductDelivery").value.trim(),
    cost: Number(document.getElementById("quickProductCost").value || 0),
    supplierUrl: document.getElementById("quickProductSupplierUrl").value.trim() || source,
    supplierSku: document.getElementById("quickProductSku").value.trim(),
    specs: document.getElementById("quickProductSpecs").value.split("\n").map((item) => item.trim()).filter(Boolean),
    desc: document.getElementById("quickProductDesc").value.trim() || generated.desc
  };
  if (product.fulfillment === "dropshipping" && !product.deliveryTime) product.deliveryTime = "Prazo informado apos confirmacao do fornecedor";
  if (!product.specs.length) product.specs = generated.specs;

  app.products.unshift(product);
  saveApp(app);
  renderProducts();
  renderDashboard();
  quickClearProduct();
  setQuickProductStatus(`Produto "${product.name}" adicionado e salvo. Se a loja estiver aberta, ela atualiza automaticamente.`, "success");
  notice();
}

function quickClearProduct() {
  ["quickProductName", "quickProductCategory", "quickProductPrice", "quickProductStock", "quickProductImage", "quickProductImage2", "quickProductImage3", "quickProductSource", "quickProductMinStock", "quickProductSupplier", "quickProductDelivery", "quickProductCost", "quickProductSupplierUrl", "quickProductSku", "quickProductDesc", "quickProductSpecs"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = "";
  });
  const fulfillment = document.getElementById("quickProductFulfillment");
  if (fulfillment) fulfillment.value = "local";
  const margin = document.getElementById("quickProductMargin");
  if (margin) margin.value = "35";
  const file = document.getElementById("quickProductFile");
  if (file) file.value = "";
  updateQuickProductPreview("");
}

function quickUploadProductImages(files) {
  const selected = Array.from(files || []).slice(0, 3);
  if (!selected.length) return;
  const slots = ["quickProductImage", "quickProductImage2", "quickProductImage3"];
  let loaded = 0;
  selected.forEach((file, index) => {
    if (!file.type.startsWith("image/")) {
      setQuickProductStatus("Selecione apenas arquivos de imagem.", "error");
      return;
    }
    if (file.size > 650 * 1024) {
      setQuickProductStatus("Use imagens de ate 650 KB para o cadastro ficar leve.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      document.getElementById(slots[index]).value = reader.result;
      loaded += 1;
      if (loaded === selected.length) {
        updateQuickProductPreview(collectQuickProductImages());
        setQuickProductStatus(`${loaded} imagem(ns) carregada(s). Agora clique em Adicionar e salvar.`, "success");
      }
    };
    reader.readAsDataURL(file);
  });
}

function collectQuickProductImages() {
  return ["quickProductImage", "quickProductImage2", "quickProductImage3"]
    .map((id) => document.getElementById(id)?.value.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function updateQuickProductPreview(src) {
  const preview = document.getElementById("quickProductPreview");
  if (!preview) return;
  const images = Array.isArray(src) ? src : [src].filter(Boolean);
  if (!images.length) {
    preview.classList.remove("has-photo");
    preview.innerHTML = "IMG";
    return;
  }
  preview.classList.add("has-photo");
  preview.innerHTML = `
    <img src="${escapeHtml(resolveAdminImageSrc(images[0]))}" alt="Preview do produto">
    ${images.length > 1 ? `<div class="admin-preview-thumbs">${images.map((image) => `<span><img src="${escapeHtml(resolveAdminImageSrc(image))}" alt=""></span>`).join("")}</div>` : ""}
  `;
}

function setQuickProductStatus(message, type) {
  const status = document.getElementById("quickProductStatus");
  if (!status) return;
  status.hidden = !message;
  status.textContent = message || "";
  status.className = `quick-product-status ${type || ""}`;
}

async function getQuickProductLinkData(url) {
  if (!url || !url.startsWith("http")) return null;
  const mlId = extractMercadoLivreId(url);
  if (!mlId) return null;
  setQuickProductStatus("Buscando dados do Mercado Livre...", "");
  const data = await fetchMercadoLivreItem(mlId) || await parseMercadoLivreApi(mlId);
  if (!data) return null;
  return {
    title: data.title || data.name,
    price: Number(data.price || 0),
    imageUrl: data.imageUrl || data.thumbnail || data.pictures?.[0]?.url || "",
    desc: data.desc || data.title || "",
    specs: data.specs || []
  };
}

function extractReadableNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const slug = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname);
    return slug
      .replace(/^MLB-?\d+-?/i, "")
      .replace(/\.(html?|php)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getAdminProductImage(product) {
  return resolveAdminImageSrc(getProductEditorImages(product)[0] || getStorefrontFallbackImage(product));
}

function getProductEditorImages(product) {
  const images = Array.isArray(product.images) ? product.images : [];
  return [...new Set([...images, product.imageUrl].map((item) => String(item || "").trim()).filter(Boolean))].slice(0, 3);
}

function collectProductEditorImages(index) {
  return Array.from(document.querySelectorAll(`[data-image="${index}"]`))
    .map((input) => input.value.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function resolveAdminImageSrc(src) {
  if (!src) return "";
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (src.startsWith("../")) return src;
  return `../${src.replace(/^\.?\//, "")}`;
}

function getStorefrontFallbackImage(product) {
  const text = normalizeText(`${product.category || ""} ${product.name || ""}`);
  if (text.includes("ptz")) return "assets/images/product-ptz.svg";
  if (text.includes("kit cftv") || text.includes("cftv")) return "assets/images/product-kit-cftv.svg";
  if (text.includes("dvr") || text.includes("gravador")) return "assets/images/product-dvr.svg";
  if (text.includes("alarme")) return "assets/images/product-alarm.svg";
  if (text.includes("cerca")) return "assets/images/product-fence.svg";
  if (text.includes("acesso") || text.includes("porteiro")) return "assets/images/product-access.svg";
  return "assets/images/product-camera.svg";
}

function addProduct() {
  const generated = generateProductProfile({ name: "Novo produto", category: "Cameras", price: 0, stock: 0, desc: "" });
  app.products.unshift({ id: Date.now(), name: "Novo produto", category: generated.category, price: generated.price, stock: generated.stock, minStock: generated.minStock, emoji: generated.emoji, imageUrl: getStorefrontFallbackImage(generated), fulfillment: "local", supplier: "", deliveryTime: "Pronta entrega", cost: 0, supplierUrl: "", supplierSku: "", specs: generated.specs, desc: generated.desc });
  selectedProductIndexes.clear();
  saveApp(app);
  renderProducts();
  renderDashboard();
  notice();
}

function removeProduct(index) {
  if (confirm("Remover este produto?")) {
    app.products.splice(index, 1);
    selectedProductIndexes.clear();
    saveApp(app);
    renderProducts();
    renderDashboard();
  }
}

function saveProducts() {
  app.products = app.products.map((product, index) => ({
    id: product.id || Date.now() + index,
    name: document.querySelector(`[data-name="${index}"]`).value,
    category: document.querySelector(`[data-cat="${index}"]`).value,
    price: Number(document.querySelector(`[data-price="${index}"]`).value),
    stock: Number(document.querySelector(`[data-stock="${index}"]`).value),
    minStock: Number(document.querySelector(`[data-min="${index}"]`).value),
    emoji: document.querySelector(`[data-emoji="${index}"]`).value,
    imageUrl: collectProductEditorImages(index)[0] || "",
    images: collectProductEditorImages(index),
    mercadoLivreUrl: document.querySelector(`[data-ml-url="${index}"]`).value,
    mercadoLivreId: document.querySelector(`[data-ml-id="${index}"]`).value,
    sourceUrl: product.sourceUrl || "",
    fulfillment: document.querySelector(`[data-fulfillment="${index}"]`).value || "local",
    supplier: document.querySelector(`[data-supplier="${index}"]`).value,
    deliveryTime: document.querySelector(`[data-delivery="${index}"]`).value,
    cost: Number(document.querySelector(`[data-cost="${index}"]`).value || 0),
    supplierUrl: document.querySelector(`[data-supplier-url="${index}"]`).value,
    supplierSku: document.querySelector(`[data-supplier-sku="${index}"]`).value,
    specs: document.querySelector(`[data-specs="${index}"]`).value.split("\n").map((item) => item.trim()).filter(Boolean),
    desc: document.querySelector(`[data-desc="${index}"]`).value
  }));
  saveApp(app);
  notice();
}

function automateProductDropshipping(index) {
  const supplierUrlInput = document.querySelector(`[data-supplier-url="${index}"]`);
  const sourceInput = document.querySelector(`[data-ml-url="${index}"]`);
  const supplierInput = document.querySelector(`[data-supplier="${index}"]`);
  const deliveryInput = document.querySelector(`[data-delivery="${index}"]`);
  const skuInput = document.querySelector(`[data-supplier-sku="${index}"]`);
  const fulfillmentInput = document.querySelector(`[data-fulfillment="${index}"]`);
  const stockInput = document.querySelector(`[data-stock="${index}"]`);
  const minInput = document.querySelector(`[data-min="${index}"]`);
  const source = supplierUrlInput?.value.trim() || sourceInput?.value.trim() || app.products[index]?.sourceUrl || "";
  const supplier = source.startsWith("http") ? getSupplierFromUrl(source) : supplierInput?.value.trim();
  if (fulfillmentInput) fulfillmentInput.value = "dropshipping";
  if (supplierUrlInput && source) supplierUrlInput.value = source;
  if (supplierInput && supplier && !supplierInput.value.trim()) supplierInput.value = supplier;
  if (deliveryInput && !deliveryInput.value.trim()) deliveryInput.value = getDeliveryBySupplier(supplier);
  if (skuInput && !skuInput.value.trim()) skuInput.value = extractMercadoLivreId(source);
  if (stockInput && Number(stockInput.value || 0) <= 0) stockInput.value = 999;
  if (minInput && Number(minInput.value || 0) > 0) minInput.value = 0;
  saveProducts();
  renderProducts();
  notice();
}

function repriceProductByMargin(index, margin = 35) {
  const cost = Number(document.querySelector(`[data-cost="${index}"]`)?.value || 0);
  if (cost <= 0) {
    alert("Informe o custo do fornecedor antes de recalcular o preco.");
    return;
  }
  const priceInput = document.querySelector(`[data-price="${index}"]`);
  if (priceInput) priceInput.value = calculateSalePrice(cost, margin).toFixed(2);
  saveProducts();
  renderProducts();
  notice();
}

function autoFillProduct(index) {
  const current = {
    name: document.querySelector(`[data-name="${index}"]`).value || app.products[index].name,
    category: document.querySelector(`[data-cat="${index}"]`).value || app.products[index].category,
    price: Number(document.querySelector(`[data-price="${index}"]`).value || 0),
    stock: Number(document.querySelector(`[data-stock="${index}"]`).value || 0),
    minStock: Number(document.querySelector(`[data-min="${index}"]`).value || 0),
    desc: document.querySelector(`[data-desc="${index}"]`).value || ""
  };
  const generated = generateProductProfile(current);
  document.querySelector(`[data-cat="${index}"]`).value = current.category && current.category !== "Categoria" ? current.category : generated.category;
  document.querySelector(`[data-price="${index}"]`).value = current.price > 0 ? current.price : generated.price;
  document.querySelector(`[data-stock="${index}"]`).value = current.stock > 0 ? current.stock : generated.stock;
  document.querySelector(`[data-min="${index}"]`).value = current.minStock > 0 ? current.minStock : generated.minStock;
  document.querySelector(`[data-emoji="${index}"]`).value = generated.emoji;
  document.querySelector(`[data-desc="${index}"]`).value = current.desc && current.desc !== "Descrição" ? current.desc : generated.desc;
  document.querySelector(`[data-specs="${index}"]`).value = generated.specs.join("\n");
  notice();
}

function generateProductProfile(product) {
  const text = normalizeText(`${product.name} ${product.category}`);
  const templates = [
    {
      keys: ["ptz", "icsee", "onvif", "rastreamento", "h.265", "h265"],
      category: "Câmeras PTZ",
      emoji: "PTZ",
      price: 289.90,
      minStock: 3,
      stock: 6,
      desc: "Câmera PTZ Wi-Fi para vigilância inteligente com rastreamento automático, acesso por aplicativo e recursos avançados de monitoramento.",
      specs: buildCameraSpecs(text, ["Movimento PTZ", "Rastreamento automático", "Acesso remoto por aplicativo", "Detecção humana por IA", "Indicado para CFTV residencial e comercial"])
    },
    {
      keys: ["camera", "wi-fi", "wifi", "ip"],
      category: "Câmeras",
      emoji: "CAM",
      price: 189.90,
      minStock: 3,
      stock: 8,
      desc: "Câmera de segurança com acesso pelo celular, imagem em alta definição e instalação prática.",
      specs: ["Imagem HD/Full HD", "Visão noturna", "Acesso remoto por aplicativo", "Detecção de movimento", "Indicado para ambientes internos ou externos conforme modelo"]
    },
    {
      keys: ["kit", "cftv", "dvr", "nvr"],
      category: "Kits CFTV",
      emoji: "CFTV",
      price: 1299.90,
      minStock: 2,
      stock: 4,
      desc: "Kit CFTV completo para monitoramento residencial ou comercial com gravação e acesso remoto.",
      specs: ["Gravação local", "Acesso por celular", "Câmeras inclusas conforme kit", "Fonte e cabeamento conforme instalação", "Ideal para casas, lojas e empresas"]
    },
    {
      keys: ["alarme", "sensor", "sirene"],
      category: "Alarmes",
      emoji: "ALM",
      price: 349.90,
      minStock: 2,
      stock: 6,
      desc: "Sistema de alarme para proteção do imóvel com sensores e acionamento rápido.",
      specs: ["Central de alarme", "Sensores configuráveis", "Sirene de alerta", "Controle remoto ou aplicativo conforme modelo", "Indicado para portas, janelas e áreas vulneráveis"]
    },
    {
      keys: ["cerca", "eletrica", "perimetral"],
      category: "Cerca Elétrica",
      emoji: "CER",
      price: 699.90,
      minStock: 2,
      stock: 3,
      desc: "Kit de cerca elétrica para proteção perimetral com instalação profissional.",
      specs: ["Central eletrificadora", "Hastes e isoladores conforme projeto", "Sirene ou alarme compatível", "Alta resistência para área externa", "Instalação conforme normas de segurança"]
    },
    {
      keys: ["porteiro", "video", "fechadura", "acesso", "biometria"],
      category: "Acesso",
      emoji: "ACE",
      price: 599.90,
      minStock: 1,
      stock: 3,
      desc: "Solução de controle de acesso para entradas com mais segurança e praticidade.",
      specs: ["Controle de entrada", "Áudio ou vídeo conforme modelo", "Acionamento de fechadura", "Instalação em porta ou portão", "Indicado para residências e empresas"]
    }
  ];
  const selected = templates.find((template) => template.keys.some((key) => text.includes(key))) || {
    category: product.category && product.category !== "Categoria" ? product.category : "Segurança",
    emoji: "PRO",
    price: 199.90,
    minStock: 2,
    stock: 5,
    desc: "Produto de segurança eletrônica com instalação e suporte profissional.",
    specs: ["Produto profissional", "Compatível com projetos residenciais e comerciais", "Instalação sob avaliação técnica", "Garantia conforme fornecedor", "Suporte John@VisionSeg"]
  };
  return selected;
}

function buildCameraSpecs(text, defaults) {
  const specs = [...defaults];
  const mp = text.match(/(\d+)\s*mp/);
  if (mp) specs.unshift(`Resolução ${mp[1]}MP`);
  const zoom = text.match(/zoom(?: digital)?(?: de)?\s*(\d+)x/);
  if (zoom) specs.push(`Zoom digital ${zoom[1]}x`);
  if (text.includes("4k")) specs.unshift("Imagem 4K");
  if (text.includes("6k")) specs.unshift("Imagem 6K");
  if (text.includes("h.265") || text.includes("h265")) specs.push("Compressão H.265");
  if (text.includes("onvif")) specs.push("Compatível com ONVIF");
  if (text.includes("icsee") || text.includes("icsee")) specs.push("Aplicativo iCSee");
  if (text.includes("lente dupla")) specs.push("Lente dupla");
  if (text.includes("tres lentes") || text.includes("três lentes")) specs.push("Três lentes");
  if (text.includes("tela dupla") || text.includes("duas telas")) specs.push("Tela dupla");
  if (text.includes("solar")) specs.push("Painel solar");
  if (text.includes("bateria")) specs.push("Bateria recarregável");
  if (text.includes("pir")) specs.push("Detecção PIR");
  if (text.includes("prova d'agua") || text.includes("prova dagua") || text.includes("externo") || text.includes("exterior")) specs.push("Uso externo à prova d'água");
  if (text.includes("luz dupla") || text.includes("fonte de luz dupla") || text.includes("visao noturna colorida") || text.includes("visão noturna colorida")) specs.push("Luz dupla e visão noturna colorida");
  return [...new Set(specs)].slice(0, 8);
}

function importBulkProducts() {
  const input = document.getElementById("bulkProductsInput");
  const lines = input.value.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    alert("Cole pelo menos um produto para importar.");
    return;
  }
  const imported = lines.map((line, index) => createProductFromTitle(line, index));
  app.products.push(...imported);
  saveApp(app);
  input.value = "";
  renderProducts();
  notice();
}

function createProductFromTitle(title, index) {
  const cleanTitle = title.replace(/\.(jpg|jpeg|png|webp)$/i, "").trim();
  const generated = generateProductProfile({ name: cleanTitle, category: "Câmeras PTZ", price: 0, stock: 0, desc: "" });
  return {
    id: Date.now() + index,
    name: cleanTitle,
    category: generated.category,
    price: generated.price,
    stock: generated.stock,
    minStock: generated.minStock,
    emoji: generated.emoji,
    imageUrl: "",
    specs: generated.specs,
    desc: generated.desc
  };
}

function extractMercadoLivreId(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/MLB[-\s]?(\d+)/i);
  return match ? `MLB${match[1]}` : "";
}

function normalizeMercadoLivreUrl(value, id) {
  const raw = String(value || "").trim();
  if (raw.startsWith("http")) return raw;
  return id ? `https://produto.mercadolivre.com.br/${id}` : "";
}

async function importMercadoLivreProducts() {
  const input = document.getElementById("mlProductsInput");
  const lines = input.value.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) {
    alert("Cole pelo menos um link ou código MLB.");
    return;
  }
  for (const line of lines) {
    const product = await buildMercadoLivreProduct(line);
    app.products.push(product);
  }
  saveApp(app);
  input.value = "";
  renderProducts();
  notice();
}

async function buildMercadoLivreProduct(value) {
  const id = extractMercadoLivreId(value);
  const fallbackName = id || value.replace(/^https?:\/\//, "").slice(0, 90);
  const url = normalizeMercadoLivreUrl(value, id);
  const publicData = id ? await fetchMercadoLivreItem(id) : null;
  const name = publicData?.title || fallbackName;
  const generated = generateProductProfile({ name, category: "Câmeras PTZ", price: publicData?.price || 0, stock: 0, desc: "" });
  return {
    id: Date.now() + Math.floor(Math.random() * 10000),
    name,
    category: generated.category,
    price: publicData?.price || generated.price,
    stock: generated.stock,
    minStock: generated.minStock,
    emoji: generated.emoji,
    imageUrl: publicData?.thumbnail || "",
    mercadoLivreUrl: publicData?.permalink || url,
    mercadoLivreId: id,
    specs: generated.specs,
    desc: generated.desc
  };
}

async function fetchMercadoLivreItem(id) {
  if (!window.JOHNVISIONSEG_MERCADO_LIVRE?.usePublicItemLookup) return null;
  try {
    const base = window.JOHNVISIONSEG_MERCADO_LIVRE.apiBase || "https://api.mercadolibre.com";
    const response = await fetch(`${base}/items/${encodeURIComponent(id)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function syncMercadoLivreProduct(index) {
  const idInput = document.querySelector(`[data-ml-id="${index}"]`);
  const urlInput = document.querySelector(`[data-ml-url="${index}"]`);
  const id = extractMercadoLivreId(idInput.value || urlInput.value);
  if (!id) {
    alert("Informe um código ou link Mercado Livre com MLB.");
    return;
  }
  const data = await fetchMercadoLivreItem(id);
  idInput.value = id;
  urlInput.value = data?.permalink || normalizeMercadoLivreUrl(urlInput.value, id);
  if (data) {
    document.querySelector(`[data-name="${index}"]`).value = data.title || document.querySelector(`[data-name="${index}"]`).value;
    document.querySelector(`[data-price="${index}"]`).value = data.price || document.querySelector(`[data-price="${index}"]`).value;
    document.querySelector(`[data-image="${index}"]`).value = data.thumbnail || document.querySelector(`[data-image="${index}"]`).value;
    autoFillProduct(index);
  }
  notice();
}

function uploadProductImages(index, files) {
  const selected = Array.from(files || []).slice(0, 3);
  if (!selected.length) return;
  const inputs = Array.from(document.querySelectorAll(`[data-image="${index}"]`));
  let loaded = 0;
  selected.forEach((file, slot) => {
    if (!file.type.startsWith("image/")) {
      alert("Selecione apenas arquivos de imagem.");
      return;
    }
    if (file.size > 650 * 1024) {
      alert("Use imagens de ate 650 KB para nao deixar o Firestore pesado. Voce pode compactar antes de enviar.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (inputs[slot]) inputs[slot].value = reader.result;
      loaded += 1;
      if (loaded === selected.length) {
        const images = collectProductEditorImages(index);
        app.products[index].images = images;
        app.products[index].imageUrl = images[0] || "";
        renderProducts();
        notice();
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderServices() {
  document.getElementById("servicesList").innerHTML = app.services.map((service, index) => `<div class="admin-card"><input value="${escapeHtml(service.title)}" data-service-title="${index}"><textarea data-service-desc="${index}">${escapeHtml(service.desc)}</textarea><button class="danger" onclick="removeService(${index})" type="button">Remover</button></div>`).join("");
}
function addService() { app.services.push({ title: "Novo serviço", desc: "Descrição" }); renderServices(); }
function removeService(index) { if (confirm("Remover este serviço?")) { app.services.splice(index, 1); renderServices(); } }
function saveServices() {
  app.services = app.services.map((service, index) => ({ title: document.querySelector(`[data-service-title="${index}"]`).value, desc: document.querySelector(`[data-service-desc="${index}"]`).value }));
  saveApp(app); notice();
}

function renderOrders() {
  document.getElementById("ordersList").innerHTML = app.orders.length ? app.orders.map((order, index) => `<div class="admin-card order"><span class="status">${escapeHtml(order.status)}</span><h3>${escapeHtml(order.name)}</h3><p>${escapeHtml(order.phone)}</p><p>${escapeHtml(order.address || "")}</p><p><strong>${brl(order.total)}</strong> • ${escapeHtml(order.date)}</p><ul>${order.items.map((item) => `<li>${item.qty}x ${escapeHtml(item.name)}</li>`).join("")}</ul><select onchange="changeOrderStatus(${index}, this.value)"><option ${order.status === "Novo" ? "selected" : ""}>Novo</option><option ${order.status === "Em atendimento" ? "selected" : ""}>Em atendimento</option><option ${order.status === "Finalizado" ? "selected" : ""}>Finalizado</option><option ${order.status === "Cancelado" ? "selected" : ""}>Cancelado</option></select></div>`).join("") : "<p>Nenhum pedido ainda.</p>";
}
function changeOrderStatus(index, status) {
  app.orders[index].status = status;
  if (status === "Pago" && app.orders[index].fulfillmentStatus === "Aguardando pagamento") {
    app.orders[index].fulfillmentStatus = "Comprar no fornecedor";
  }
  saveApp(app);
  renderOrders();
  renderAgent();
  renderDashboard();
}

function renderOrders() {
  document.getElementById("ordersList").innerHTML = app.orders.length ? app.orders.map((order, index) => {
    const supplierCost = Number(order.supplierCost || calculateOrderSupplierCost(order));
    const profit = Number(order.profit || Number(order.total || 0) - supplierCost);
    return `
      <div class="admin-card order">
        <span class="status">${escapeHtml(order.status)}</span>
        <h3>${escapeHtml(order.name)}</h3>
        <p>${escapeHtml(order.phone)}</p>
        <p>${escapeHtml(order.address || "")}</p>
        <p><strong>${brl(order.total)}</strong> | ${escapeHtml(order.date)}</p>
        <div class="order-profit">Custo fornecedor: ${brl(supplierCost)} | Lucro estimado: ${brl(profit)}</div>
        <ul>${(order.items || []).map((item) => renderOrderItem(item)).join("")}</ul>
        <div class="admin-inline">
          <select onchange="changeOrderStatus(${index}, this.value)">
            <option ${order.status === "Novo" ? "selected" : ""}>Novo</option>
            <option ${order.status === "Em atendimento" ? "selected" : ""}>Em atendimento</option>
            <option ${order.status === "Pago" ? "selected" : ""}>Pago</option>
            <option ${order.status === "Finalizado" ? "selected" : ""}>Finalizado</option>
            <option ${order.status === "Cancelado" ? "selected" : ""}>Cancelado</option>
          </select>
          <select onchange="changeOrderFulfillmentStatus(${index}, this.value)">
            ${["Aguardando pagamento", "Comprar no fornecedor", "Pedido no fornecedor", "Enviado", "Entregue"].map((status) => `<option ${order.fulfillmentStatus === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </div>
        <button onclick="copySupplierOrder(${index})" type="button">Copiar pedido para fornecedor</button>
        <button onclick="openOrderSuppliers(${index})" type="button">Abrir fornecedores</button>
        <button onclick="automateOrderStatus(${index})" type="button">Automatizar status</button>
      </div>
    `;
  }).join("") : "<p>Nenhum pedido ainda.</p>";
}

function renderOrderItem(item) {
  const supplier = item.supplier ? ` | Fornecedor: ${escapeHtml(item.supplier)}` : "";
  const delivery = item.deliveryTime ? ` | Prazo: ${escapeHtml(item.deliveryTime)}` : "";
  const sku = item.supplierSku ? ` | SKU: ${escapeHtml(item.supplierSku)}` : "";
  const link = item.supplierUrl ? ` | <a href="${escapeHtml(item.supplierUrl)}" target="_blank" rel="noopener">comprar</a>` : "";
  const cost = Number(item.cost || 0) > 0 ? ` | Custo: ${brl(Number(item.cost || 0) * Number(item.qty || 1))}` : "";
  return `<li>${item.qty}x ${escapeHtml(item.name)}${supplier}${delivery}${sku}${cost}${link}</li>`;
}

function calculateOrderSupplierCost(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.cost || 0) * Number(item.qty || 1), 0);
}

function changeOrderFulfillmentStatus(index, status) { app.orders[index].fulfillmentStatus = status; saveApp(app); renderOrders(); }

function automateOrderStatus(index) {
  const order = app.orders[index];
  if (!order) return;
  if (order.status === "Novo") {
    order.status = "Em atendimento";
    order.fulfillmentStatus = "Aguardando pagamento";
  } else if (order.status === "Em atendimento" || order.status === "Pago") {
    order.status = "Pago";
    order.fulfillmentStatus = "Comprar no fornecedor";
  } else if (order.fulfillmentStatus === "Comprar no fornecedor") {
    order.fulfillmentStatus = "Pedido no fornecedor";
  } else if (order.fulfillmentStatus === "Pedido no fornecedor") {
    order.fulfillmentStatus = "Enviado";
  }
  saveApp(app);
  renderOrders();
  renderAgent();
  renderDashboard();
}

function openOrderSuppliers(index) {
  const links = [...new Set((app.orders[index]?.items || []).map((item) => item.supplierUrl).filter(Boolean))];
  if (!links.length) {
    alert("Este pedido nao tem links de fornecedor cadastrados.");
    return;
  }
  links.slice(0, 8).forEach((link) => window.open(link, "_blank", "noopener"));
}

async function copySupplierOrder(index) {
  const order = app.orders[index];
  const text = [
    `Pedido fornecedor JohnVisionSeg #${String(order.id).slice(-6)}`,
    `Cliente: ${order.name}`,
    `Telefone: ${order.phone || ""}`,
    `Endereco: ${order.address || ""}`,
    "",
    "Itens:",
    ...(order.items || []).map((item) => `${item.qty}x ${item.name}${item.supplierSku ? ` | SKU ${item.supplierSku}` : ""}${item.supplierUrl ? ` | ${item.supplierUrl}` : ""}`)
  ].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    alert("Pedido copiado. Cole no fornecedor para comprar/enviar.");
  } catch {
    window.prompt("Copie o pedido para o fornecedor:", text);
  }
}

function renderQuotes() {
  document.getElementById("quotesList").innerHTML = app.quotes.length ? app.quotes.map((quote, index) => `<div class="admin-card"><span class="status">${escapeHtml(quote.status)}</span><h3>${escapeHtml(quote.name)}</h3><p>${escapeHtml(quote.phone)}</p><p>${escapeHtml(quote.service)}</p><p>${escapeHtml(quote.message || "")}</p><small>${escapeHtml(quote.date)}</small><br><select onchange="changeQuoteStatus(${index}, this.value)"><option ${quote.status === "Novo" ? "selected" : ""}>Novo</option><option ${quote.status === "Em atendimento" ? "selected" : ""}>Em atendimento</option><option ${quote.status === "Finalizado" ? "selected" : ""}>Finalizado</option><option ${quote.status === "Cancelado" ? "selected" : ""}>Cancelado</option></select></div>`).join("") : "<p>Nenhum orçamento ainda.</p>";
}
function changeQuoteStatus(index, status) { app.quotes[index].status = status; saveApp(app); renderQuotes(); renderAgent(); renderDashboard(); }

function renderCustomers() {
  document.getElementById("customersList").innerHTML = app.customers.length ? app.customers.map((customer) => `<div class="admin-card"><h3>${escapeHtml(customer.name)}</h3><p>${escapeHtml(customer.phone)}</p><p>${escapeHtml(customer.type)} • ${escapeHtml(customer.date)}</p></div>`).join("") : "<p>Nenhum cliente ainda.</p>";
}

function renderPortfolio() {
  document.getElementById("portfolioList").innerHTML = app.portfolio.map((item, index) => `<div class="admin-card"><input value="${escapeHtml(item.title)}" data-port-title="${index}"><input value="${escapeHtml(item.category)}" data-port-cat="${index}"><button class="danger" onclick="removePortfolio(${index})" type="button">Remover</button></div>`).join("");
}
function addPortfolio() { app.portfolio.push({ title: "Novo projeto", category: "Categoria" }); renderPortfolio(); }
function removePortfolio(index) { if (confirm("Remover este projeto?")) { app.portfolio.splice(index, 1); renderPortfolio(); } }
function savePortfolio() { app.portfolio = app.portfolio.map((item, index) => ({ title: document.querySelector(`[data-port-title="${index}"]`).value, category: document.querySelector(`[data-port-cat="${index}"]`).value })); saveApp(app); notice(); }

function renderTestimonials() {
  document.getElementById("testimonialsList").innerHTML = app.testimonials.map((testimonial, index) => `<div class="admin-card"><input value="${escapeHtml(testimonial.name)}" data-test-name="${index}"><textarea data-test-text="${index}">${escapeHtml(testimonial.text)}</textarea><button class="danger" onclick="removeTestimonial(${index})" type="button">Remover</button></div>`).join("");
}
function addTestimonial() { app.testimonials.push({ name: "Cliente", text: "Depoimento" }); renderTestimonials(); }
function removeTestimonial(index) { if (confirm("Remover este depoimento?")) { app.testimonials.splice(index, 1); renderTestimonials(); } }
function saveTestimonials() { app.testimonials = app.testimonials.map((testimonial, index) => ({ name: document.querySelector(`[data-test-name="${index}"]`).value, text: document.querySelector(`[data-test-text="${index}"]`).value })); saveApp(app); notice(); }

function exportData() {
  const blob = new Blob([JSON.stringify(app, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "backup-johnvisionseg-pro.json";
  link.click();
}

function resetData() {
  if (confirm("Resetar todos os dados locais?")) {
    localStorage.removeItem("johnvisionseg_app_pro");
    app = getApp();
    renderAll();
    notice();
  }
}


// ═══════════════════════════════════════════════════════════
//  IMPORTAR PRODUTO POR LINK
// ═══════════════════════════════════════════════════════════

function setLinkImportStatus(msg, type) {
  const el = document.getElementById('linkImportStatus');
  if (!el) return;
  if (!msg) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.background = type === 'error'   ? 'rgba(220,38,38,.15)'  :
                        type === 'success'  ? 'rgba(0,255,136,.12)'  :
                                             'rgba(0,212,255,.10)';
  el.style.color      = type === 'error'   ? '#ff6b6b'  :
                        type === 'success'  ? '#00ff88'  :
                                             '#00d4ff';
  el.style.border     = `1px solid ${
    type === 'error'   ? 'rgba(220,38,38,.3)'  :
    type === 'success' ? 'rgba(0,255,136,.3)'  :
                        'rgba(0,212,255,.25)'}`;
  el.textContent = msg;
}

function linkImportSetImg(src) {
  const wrap = document.getElementById('linkImportImgWrap');
  if (!wrap) return;
  if (src) {
    wrap.innerHTML = `<img src="${escapeHtml(src)}" alt="preview" style="width:100%;height:100%;object-fit:cover;display:block">`;
  } else {
    wrap.innerHTML = '📷';
  }
}

async function importProductByLink() {
  const urlInput = document.getElementById('linkImportUrl');
  const raw = (urlInput?.value || '').trim();
  if (!raw) { setLinkImportStatus('Cole um link de produto antes de buscar.', 'error'); return; }

  let url;
  try { url = new URL(raw); } catch {
    setLinkImportStatus('Link inválido. Certifique-se de incluir https://.', 'error'); return;
  }

  const btn = document.getElementById('linkImportBtn');
  if (btn) btn.disabled = true;
  document.getElementById('linkImportPreview').style.display = 'none';
  setLinkImportStatus('⟳ Buscando dados do produto…', 'info');

  try {
    let data = null;

    // ── 1. Mercado Livre API pública ────────────────────────
    const mlId = extractMercadoLivreId(raw);
    if (mlId) {
      data = await fetchMercadoLivreItem(mlId) || await parseMercadoLivreApi(mlId);
    }

    // ── 2. Open Graph / meta tags via proxy ─────────────────
    if (!data) {
      data = await parseOpenGraph(url.href);
    }

    // ── 3. Gera perfil pelo título + url ────────────────────
    const title  = data?.title  || data?.name || url.hostname.replace('www.', '');
    const imgUrl = data?.imageUrl || data?.thumbnail || data?.image || '';
    const price  = data?.price  || 0;
    const generated = generateProductProfile({ name: title, category: 'Câmeras PTZ', price, stock: 0, desc: '' });

    // ── Preenche preview ─────────────────────────────────────
    document.getElementById('linkImportName').value     = title;
    document.getElementById('linkImportCategory').value = generated.category;
    document.getElementById('linkImportPrice').value    = price > 0 ? price : generated.price;
    document.getElementById('linkImportStock').value    = generated.stock;
    document.getElementById('linkImportMin').value      = generated.minStock;
    document.getElementById('linkImportImage').value    = imgUrl;
    document.getElementById('linkImportSpecs').value    = (data?.specs || generated.specs).join('\n');
    document.getElementById('linkImportDesc').value     = data?.desc || generated.desc;
    document.getElementById('linkImportSource').value   = raw;
    linkImportSetImg(imgUrl);

    document.getElementById('linkImportPreview').style.display = 'block';
    setLinkImportStatus('✓ Dados extraídos. Revise e clique em "Adicionar ao catálogo".', 'success');

    // sync live image preview when admin changes the URL
    document.getElementById('linkImportImage').oninput = function() {
      linkImportSetImg(this.value.trim());
    };

  } catch (err) {
    setLinkImportStatus('Não foi possível extrair dados automaticamente. Preencha manualmente e confirme.', 'error');
    // show empty preview so user can fill manually
    document.getElementById('linkImportName').value     = '';
    document.getElementById('linkImportCategory').value = 'Câmeras PTZ';
    document.getElementById('linkImportPrice').value    = '';
    document.getElementById('linkImportStock').value    = '5';
    document.getElementById('linkImportMin').value      = '2';
    document.getElementById('linkImportImage').value    = '';
    document.getElementById('linkImportSpecs').value    = '';
    document.getElementById('linkImportDesc').value     = '';
    document.getElementById('linkImportSource').value   = raw;
    linkImportSetImg('');
    document.getElementById('linkImportPreview').style.display = 'block';
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ── Mercado Livre API via cors-anywhere / allorigins fallback ──
async function parseMercadoLivreApi(mlId) {
  const endpoints = [
    `https://api.mercadolibre.com/items/${encodeURIComponent(mlId)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.mercadolibre.com/items/${mlId}`)}`
  ];
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) continue;
      const d = await r.json();
      if (!d?.title) continue;
      // extract specs from attributes
      const attrs = d.attributes || [];
      const specs = attrs.slice(0, 8).map(a => `${a.name}: ${a.value_name || a.value_struct?.number || ''}`).filter(s => !s.endsWith(': ') && !s.endsWith(': null'));
      return {
        title:    d.title,
        price:    d.price || 0,
        imageUrl: (d.pictures?.[0]?.url || d.thumbnail || '').replace('-I.jpg', '-O.jpg'),
        desc:     d.title,
        specs:    specs.length ? specs : null
      };
    } catch { /* try next */ }
  }
  return null;
}

// ── Open Graph scraper via allorigins proxy ────────────────────
async function parseOpenGraph(pageUrl) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(pageUrl)}`;
  const r = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error('proxy_fail');
  const json = await r.json();
  const html  = json.contents || '';
  const doc   = new DOMParser().parseFromString(html, 'text/html');

  const og   = (prop) => doc.querySelector(`meta[property="${prop}"]`)?.content?.trim()  || '';
  const meta = (name) => doc.querySelector(`meta[name="${name}"]`)?.content?.trim()      || '';
  const ld   = extractLdJson(doc);

  // title
  const title = og('og:title') || ld?.name || meta('title') || doc.title || '';

  // image — try multiple sources in priority order
  let imgUrl = og('og:image') || ld?.image?.url || ld?.image ||
    doc.querySelector('meta[property="product:image"]')?.content || '';

  // price — structured data first
  const rawPrice = ld?.offers?.price || ld?.offers?.[0]?.price ||
    og('product:price:amount') || meta('price') || meta('product:price:amount') || '';
  const price = rawPrice ? Number(String(rawPrice).replace(/[^0-9,.]/g, '').replace(',', '.')) : 0;

  // description
  const desc = og('og:description') || meta('description') || ld?.description || '';

  // specs from microdata / ld+json
  const specs = [];
  if (ld?.brand?.name)       specs.push(`Marca: ${ld.brand.name}`);
  if (ld?.model)             specs.push(`Modelo: ${ld.model}`);
  if (ld?.color)             specs.push(`Cor: ${ld.color}`);
  if (ld?.material)          specs.push(`Material: ${ld.material}`);
  if (ld?.weight)            specs.push(`Peso: ${ld.weight}`);
  if (ld?.width)             specs.push(`Largura: ${ld.width}`);
  if (ld?.height)            specs.push(`Altura: ${ld.height}`);

  if (!title && !imgUrl) throw new Error('no_data');

  return { title, imageUrl: imgUrl, price, desc, specs: specs.length ? specs : null };
}

function extractLdJson(doc) {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    try {
      const d = JSON.parse(s.textContent);
      if (d['@type'] === 'Product' || d?.['@graph']?.find(g => g['@type'] === 'Product')) {
        return d['@type'] === 'Product' ? d : d['@graph'].find(g => g['@type'] === 'Product');
      }
    } catch { /* skip */ }
  }
  return null;
}

function cancelLinkImport() {
  document.getElementById('linkImportPreview').style.display = 'none';
  setLinkImportStatus('', '');
  document.getElementById('linkImportUrl').value = '';
}

function confirmLinkImport() {
  const name     = document.getElementById('linkImportName').value.trim();
  const category = document.getElementById('linkImportCategory').value.trim();
  const price    = Number(document.getElementById('linkImportPrice').value) || 0;
  const stock    = Number(document.getElementById('linkImportStock').value) || 5;
  const minStock = Number(document.getElementById('linkImportMin').value)   || 2;
  const imageUrl = document.getElementById('linkImportImage').value.trim();
  const source   = document.getElementById('linkImportSource').value.trim();
  const rawSpecs = document.getElementById('linkImportSpecs').value.trim();
  const desc     = document.getElementById('linkImportDesc').value.trim();

  if (!name) { setLinkImportStatus('Informe o nome do produto antes de adicionar.', 'error'); return; }

  const generated = generateProductProfile({ name, category, price, stock, desc });
  const specs = rawSpecs
    ? rawSpecs.split('\n').map(s => s.trim()).filter(Boolean)
    : generated.specs;

  const product = {
    id:              Date.now(),
    name,
    category:        category || generated.category,
    price:           price  > 0 ? price  : generated.price,
    stock:           stock  > 0 ? stock  : generated.stock,
    minStock:        minStock > 0 ? minStock : generated.minStock,
    emoji:           generated.emoji,
    imageUrl,
    mercadoLivreUrl: source.includes('mercadolivre') || source.includes('mlstatic') ? source : '',
    mercadoLivreId:  extractMercadoLivreId(source),
    sourceUrl:       source,
    fulfillment:     source ? 'dropshipping' : 'local',
    supplier:        source ? getSupplierFromUrl(source) : '',
    deliveryTime:    source ? getDeliveryBySupplier(getSupplierFromUrl(source)) : 'Pronta entrega',
    cost:            0,
    supplierUrl:     source,
    supplierSku:     extractMercadoLivreId(source) || '',
    specs,
    desc:            desc || generated.desc
  };

  app.products.unshift(product);   // add at top
  saveApp(app);
  renderProducts();
  cancelLinkImport();
  setLinkImportStatus(`✓ Produto "${name}" adicionado ao catálogo e salvo!`, 'success');
  notice();
}

// ── Keydown: Buscar produto ao apertar Enter no campo de link ──
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target && event.target.id === 'agentCommand') {
    event.preventDefault();
    handleAgentInput();
  }
  if (event.key === 'Enter' && event.target && event.target.id === 'linkImportUrl') {
    event.preventDefault();
    importProductByLink();
  }
  if (event.key === 'Enter' && event.target && event.target.id === 'quickProductName') {
    event.preventDefault();
    quickAutoFillProduct();
  }
});
