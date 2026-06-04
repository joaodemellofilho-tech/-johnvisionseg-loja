const defaultApp = {
  settings: {
    companyName: "John@VisionSeg Cameras",
    tagline: "Cameras de Seguranca, CFTV e Loja Online",
    whatsapp: "(00) 00000-0000",
    whatsappLink: "https://wa.me/5500000000000",
    email: "contato@johnvisionseg.com",
    pixKey: "",
    pixName: "John@VisionSeg Cameras",
    paymentLink: "",
    mercadoPagoPublicKey: "",
    mercadoPagoMaxInstallments: 10,
    paymentInstructions: "Apos o pagamento, envie o comprovante pelo WhatsApp para confirmarmos disponibilidade e entrega.",
    maintenanceMode: false,
    maintenanceTitle: "Loja em manutencao",
    maintenanceMessage: "Estamos ajustando a vitrine para melhorar sua experiencia. Volte em breve ou fale conosco pelo WhatsApp.",
    heroTitle: "Cameras de seguranca e CFTV para comprar online",
    heroSubtitle: "Cameras PTZ, kits CFTV, alarmes e equipamentos de seguranca com atendimento tecnico e pedido pelo WhatsApp.",
    aboutText: "A John@VisionSeg Cameras oferece equipamentos de seguranca eletronica, orientacao para escolha do produto e suporte para projetos residenciais, comerciais e empresariais."
  },
  navigationMenus: [
    { label: "Produtos", href: "#produtos", children: [
      { label: "Cameras PTZ", href: "#produtos" },
      { label: "Kits CFTV", href: "#produtos" },
      { label: "Gravadores / DVR", href: "#produtos" },
      { label: "Alarmes e Cerca", href: "#produtos" }
    ] },
    { label: "Solucoes", href: "#solucoes", children: [
      { label: "Casa e Apartamento", href: "#solucoes" },
      { label: "Loja e Comercio", href: "#solucoes" },
      { label: "Area Externa / Rural", href: "#solucoes" }
    ] },
    { label: "Modulos Pro", href: "#simulador-cftv", children: [
      { label: "Simulador de CFTV", href: "#simulador-cftv" },
      { label: "Assistente de Projetos", href: "#assistente-projeto" },
      { label: "Como Comprar", href: "#como-comprar" }
    ] },
    { label: "Atendimento", href: "#contato", children: [] },
    { label: "Painel", href: "admin/index.html", children: [] }
  ],
  services: [
    { title: "Instalação de Câmeras", desc: "CFTV profissional para casas, lojas, empresas e condomínios." },
    { title: "Alarmes e Sensores", desc: "Sistemas com sensores, sirenes e monitoramento remoto." },
    { title: "Cerca Elétrica", desc: "Instalação e manutenção com segurança e acabamento." },
    { title: "Controle de Acesso", desc: "Biometria, tags, fechaduras e controle de entrada." },
    { title: "Vídeo Porteiro", desc: "Mais controle e segurança na entrada do imóvel." },
    { title: "Manutenção Técnica", desc: "Revisão, troca, configuração e suporte para equipamentos." }
  ],
  products: [
    { id: 1, name: "Câmera Wi-Fi Inteligente", category: "Câmeras", price: 189.90, stock: 8, minStock: 3, emoji: "CAM", desc: "Acesso pelo celular, áudio, visão noturna e detecção de movimento." },
    { id: 2, name: "Kit CFTV 4 Câmeras", category: "Kits CFTV", price: 1299.90, stock: 4, minStock: 2, emoji: "CFTV", desc: "Kit completo para residência, loja ou pequeno comércio." },
    { id: 3, name: "DVR 4 Canais", category: "Gravadores", price: 399.90, stock: 5, minStock: 2, emoji: "DVR", desc: "Gravador digital para sistema de câmeras com acesso remoto." },
    { id: 4, name: "Alarme Residencial", category: "Alarmes", price: 349.90, stock: 6, minStock: 2, emoji: "ALM", desc: "Central de alarme com sensores, sirene e acionamento prático." },
    { id: 5, name: "Kit Cerca Elétrica", category: "Cerca Elétrica", price: 699.90, stock: 2, minStock: 2, emoji: "CER", desc: "Proteção perimetral para muros e fachadas." },
    { id: 6, name: "Vídeo Porteiro", category: "Acesso", price: 599.90, stock: 3, minStock: 1, emoji: "VID", desc: "Controle de entrada com vídeo, áudio e mais comodidade." },
    { id: 201, name: "Câmera iCSee Wi-Fi 5MP PTZ Inteligente", category: "Câmeras iCSee", price: 279.90, stock: 9, minStock: 3, emoji: "ICS", imageUrl: "", desc: "Câmera iCSee com movimento PTZ, áudio bidirecional, visão noturna e detecção humana para monitoramento pelo celular.", specs: ["Aplicativo iCSee", "Resolução 5MP", "Movimento PTZ", "Áudio bidirecional", "Detecção humana", "Visão noturna", "Wi-Fi", "Uso interno/externo"] },
    { id: 202, name: "Câmera iCSee 4K 8MP Lente Dupla", category: "Câmeras iCSee", price: 449.90, stock: 7, minStock: 2, emoji: "4K", imageUrl: "", desc: "Modelo iCSee 4K com lente dupla, imagem ampla, rastreamento automático e alerta de movimento em tempo real.", specs: ["Aplicativo iCSee", "Imagem 4K", "Resolução 8MP", "Lente dupla", "Rastreamento automático", "Alerta de movimento", "Visão noturna colorida", "Wi-Fi"] },
    { id: 203, name: "Câmera iCSee Solar 3MP com Bateria", category: "Câmeras iCSee", price: 399.90, stock: 6, minStock: 2, emoji: "SOL", imageUrl: "", desc: "Câmera sem fio iCSee com painel solar, bateria recarregável, sensor PIR e instalação prática em áreas externas.", specs: ["Aplicativo iCSee", "Painel solar", "Bateria recarregável", "Resolução 3MP", "Sensor PIR", "Sem fio", "Uso externo", "Visão noturna"] },
    { id: 204, name: "Câmera iCSee Mini Dome Wi-Fi 3MP", category: "Câmeras iCSee", price: 199.90, stock: 10, minStock: 4, emoji: "DME", imageUrl: "", desc: "Mini câmera dome iCSee para ambientes internos, com acesso remoto, áudio e gravação em cartão de memória.", specs: ["Aplicativo iCSee", "Resolução 3MP", "Modelo dome", "Áudio", "Cartão microSD", "Acesso remoto", "Wi-Fi", "Instalação interna"] },
    { id: 205, name: "Câmera iCSee Externa Bullet 5MP", category: "Câmeras iCSee", price: 249.90, stock: 8, minStock: 3, emoji: "EXT", imageUrl: "", desc: "Câmera bullet externa iCSee com boa definição, proteção contra chuva e acompanhamento pelo aplicativo.", specs: ["Aplicativo iCSee", "Resolução 5MP", "Modelo bullet", "Uso externo", "Proteção contra chuva", "Visão noturna", "Detecção de movimento", "Wi-Fi"] },
    { id: 206, name: "Câmera iCSee PTZ 6K Três Lentes", category: "Câmeras iCSee", price: 589.90, stock: 5, minStock: 2, emoji: "6K", imageUrl: "", desc: "Câmera iCSee avançada com três lentes, imagem 6K, PTZ e rastreamento para áreas amplas.", specs: ["Aplicativo iCSee", "Imagem 6K", "Três lentes", "Movimento PTZ", "Rastreamento automático", "Tela múltipla", "Uso externo", "Wi-Fi"] },
    { id: 101, name: "Mini Câmera PTZ Wi-Fi 5MP H.265 ONVIF", category: "Câmeras PTZ", price: 289.90, stock: 6, minStock: 3, emoji: "PTZ", imageUrl: "", desc: "Câmera PTZ Wi-Fi de 5MP com rastreamento automático, detecção humana por IA, ONVIF e acesso pelo aplicativo iCSee.", specs: ["Resolução 5MP", "Movimento PTZ", "Rastreamento automático", "Detecção humana por IA", "Zoom digital 4x", "Compressão H.265", "Compatível com ONVIF", "Aplicativo iCSee"] },
    { id: 102, name: "Mini Câmera PTZ Wi-Fi 5MP com Luz Dupla", category: "Câmeras PTZ", price: 289.90, stock: 6, minStock: 3, emoji: "PTZ", imageUrl: "", desc: "Mini câmera IP sem fio com rastreamento automático, fonte de luz dupla, zoom digital e detecção humana.", specs: ["Resolução 5MP", "Movimento PTZ", "Rastreamento automático", "Detecção humana por IA", "Zoom digital 4x", "Luz dupla e visão noturna colorida", "Compatível com ONVIF", "Aplicativo iCSee"] },
    { id: 103, name: "Câmera PTZ Wi-Fi 5MP H.265 iCSee", category: "Câmeras PTZ", price: 299.90, stock: 6, minStock: 3, emoji: "PTZ", imageUrl: "", desc: "Câmera Wi-Fi PTZ para CFTV com compressão H.265, ONVIF, zoom digital 4x e rastreamento automático.", specs: ["Resolução 5MP", "Movimento PTZ", "Rastreamento automático", "Zoom digital 4x", "Compressão H.265", "Compatível com ONVIF", "Detecção humana por IA", "Aplicativo iCSee"] },
    { id: 104, name: "Câmera IP 4K 8MP Externa PTZ Lente Dupla", category: "Câmeras PTZ", price: 449.90, stock: 4, minStock: 2, emoji: "4K", imageUrl: "", desc: "Câmera IP externa 4K de 8MP com Wi-Fi, PTZ, lente dupla, tela dupla e rastreamento automático.", specs: ["Imagem 4K", "Resolução 8MP", "Movimento PTZ", "Lente dupla", "Tela dupla", "Rastreamento automático", "Uso externo à prova d'água", "Alarme com luz policial"] },
    { id: 105, name: "Câmera PTZ Wi-Fi 3MP Solar com Bateria", category: "Câmeras PTZ", price: 399.90, stock: 4, minStock: 2, emoji: "SOL", imageUrl: "", desc: "Câmera PTZ Wi-Fi externa com painel solar, bateria recarregável, detecção PIR e visão noturna colorida.", specs: ["Resolução 3MP", "Movimento PTZ", "Painel solar", "Bateria recarregável", "Detecção PIR", "Uso externo à prova d'água", "Luz dupla e visão noturna colorida", "Aplicativo iCSee"] },
    { id: 106, name: "Câmera Wi-Fi PTZ 4K 8MP Lente Dupla iCSee", category: "Câmeras PTZ", price: 459.90, stock: 4, minStock: 2, emoji: "4K", imageUrl: "", desc: "Câmera de vigilância externa sem fio com lente dupla, tela dupla, detecção humana por IA e rastreamento automático.", specs: ["Imagem 4K", "Resolução 8MP", "Movimento PTZ", "Lente dupla", "Tela dupla", "Detecção humana por IA", "Rastreamento automático", "Aplicativo iCSee"] },
    { id: 107, name: "Câmera PTZ Wi-Fi iCSee 5MP Zoom 4x", category: "Câmeras PTZ", price: 289.90, stock: 6, minStock: 3, emoji: "PTZ", imageUrl: "", desc: "Câmera IP PTZ externa para CFTV com zoom digital 4x, detecção humana e rastreamento automático.", specs: ["Resolução 5MP", "Movimento PTZ", "Zoom digital 4x", "Detecção humana por IA", "Rastreamento automático", "Uso externo à prova d'água", "Aplicativo iCSee", "Câmera IP sem fio"] },
    { id: 108, name: "Câmera IP PTZ Três Lentes 6K Externa", category: "Câmeras PTZ", price: 599.90, stock: 3, minStock: 2, emoji: "6K", imageUrl: "", desc: "Câmera PTZ externa com três lentes, três telas, Wi-Fi, rastreamento automático e imagem 6K HD.", specs: ["Imagem 6K", "Movimento PTZ", "Três lentes", "Três telas", "Rastreamento automático", "Uso externo à prova d'água", "CFTV sem fio", "Aplicativo iCSee"] },
    { id: 109, name: "Câmera PTZ Wi-Fi Zoom 8x Três Lentes", category: "Câmeras PTZ", price: 549.90, stock: 3, minStock: 2, emoji: "PTZ", imageUrl: "", desc: "Câmera PTZ Wi-Fi com zoom 8x, três lentes, tela dupla, rastreamento automático e conexão P2P iCSee.", specs: ["Movimento PTZ", "Zoom digital 8x", "Três lentes", "Tela dupla", "Rastreamento automático", "CFTV sem fio", "Conexão P2P", "Aplicativo iCSee"] }
  ],
  portfolio: [
    { title: "Instalação residencial", category: "Câmeras e acesso remoto" },
    { title: "Loja monitorada", category: "CFTV comercial" },
    { title: "Controle de acesso empresarial", category: "Empresa" }
  ],
  testimonials: [
    { name: "Cliente residencial", text: "Atendimento rápido, instalação limpa e sistema funcionando perfeitamente." },
    { name: "Comércio local", text: "Melhorou muito a segurança da loja. Recomendo." }
  ],
  orders: [],
  quotes: [],
  customers: []
};

const APP_STORAGE_KEY = "johnvisionseg_app_pro";
const APP_SYNC_KEY = "johnvisionseg_app_pro_updated_at";
const FIRESTORE_COLLECTION = window.JOHNVISIONSEG_FIRESTORE_COLLECTION || "johnvisionseg_sites";
const FIRESTORE_DOC_ID = window.JOHNVISIONSEG_FIRESTORE_DOC_ID || "main";
let firestoreDb = null;
let firestoreInitPromise = null;
let dataStatus = { mode: "local", message: "Dados locais ativos." };
const FIREBASE_SDK_VERSION = "11.0.1";

function mergeAppData(data) {
  const savedProducts = Array.isArray(data && data.products) ? data.products : defaultApp.products;
  const savedIds = new Set(savedProducts.map((product) => Number(product.id)));
  const missingDefaultProducts = defaultApp.products.filter((product) => !savedIds.has(Number(product.id)));
  return {
    ...JSON.parse(JSON.stringify(defaultApp)),
    ...(data || {}),
    settings: { ...defaultApp.settings, ...((data && data.settings) || {}) },
    navigationMenus: Array.isArray(data && data.navigationMenus) ? data.navigationMenus : defaultApp.navigationMenus,
    services: Array.isArray(data && data.services) ? data.services : defaultApp.services,
    products: [...savedProducts, ...missingDefaultProducts],
    portfolio: Array.isArray(data && data.portfolio) ? data.portfolio : defaultApp.portfolio,
    testimonials: Array.isArray(data && data.testimonials) ? data.testimonials : defaultApp.testimonials,
    orders: Array.isArray(data && data.orders) ? data.orders : [],
    quotes: Array.isArray(data && data.quotes) ? data.quotes : [],
    customers: Array.isArray(data && data.customers) ? data.customers : []
  };
}

function getApp() {
  const saved = localStorage.getItem(APP_STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(defaultApp));
    return JSON.parse(JSON.stringify(defaultApp));
  }
  try {
    return mergeAppData(JSON.parse(saved));
  } catch (e) {
    return JSON.parse(JSON.stringify(defaultApp));
  }
}

function isFirebaseConfigured() {
  const config = window.JOHNVISIONSEG_FIREBASE_CONFIG || {};
  return Boolean(config.apiKey && config.projectId && config.appId);
}

async function initFirestore() {
  if (firestoreInitPromise) return firestoreInitPromise;
  firestoreInitPromise = new Promise(async (resolve) => {
    if (!isFirebaseConfigured()) {
      dataStatus = { mode: "local", message: "Firestore não configurado. Usando LocalStorage." };
      resolve(null);
      return;
    }
    await loadFirebaseSdk();
    if (!window.firebase || !firebase.apps) {
      dataStatus = { mode: "local", message: "SDK Firebase não carregou. Usando LocalStorage." };
      resolve(null);
      return;
    }
    try {
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(window.JOHNVISIONSEG_FIREBASE_CONFIG);
      firestoreDb = firebase.firestore(app);
      dataStatus = { mode: "firestore", message: "Firestore conectado." };
      resolve(firestoreDb);
    } catch (error) {
      console.warn("Falha ao iniciar Firestore:", error);
      dataStatus = { mode: "local", message: "Falha no Firestore. Usando LocalStorage." };
      resolve(null);
    }
  });
  return firestoreInitPromise;
}

function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      if (existing.dataset.loaded === "1") resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function loadFirebaseSdk() {
  if (window.firebase && firebase.firestore) return true;
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
  try {
    await loadScriptOnce(`${base}/firebase-app-compat.js`);
    await loadScriptOnce(`${base}/firebase-auth-compat.js`);
    await loadScriptOnce(`${base}/firebase-firestore-compat.js`);
    return true;
  } catch (error) {
    console.warn("Não foi possível carregar o SDK Firebase:", error);
    return false;
  }
}

async function getFirebaseAuth() {
  const db = await initFirestore();
  if (!db || !window.firebase || !firebase.auth) return null;
  return firebase.auth();
}

async function loadAppData() {
  const localData = getApp();
  const db = await initFirestore();
  if (!db) return localData;
  try {
    const snap = await db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID).get();
    if (snap.exists) {
      const cloudData = mergeAppData(snap.data());
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(cloudData));
      return cloudData;
    }
    await db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID).set(localData);
    return localData;
  } catch (error) {
    console.warn("Falha ao carregar Firestore:", error);
    dataStatus = { mode: "local", message: "Sem acesso ao Firestore. Usando dados locais." };
    return localData;
  }
}

function saveApp(data) {
  const cleanData = mergeAppData(data);
  localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(cleanData));
  localStorage.setItem(APP_SYNC_KEY, String(Date.now()));
  return saveAppCloud(cleanData);
}

async function saveAppCloud(data) {
  const db = await initFirestore();
  if (!db) return false;
  try {
    await db.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID).set({
      ...mergeAppData(data),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    dataStatus = { mode: "firestore", message: "Firestore sincronizado." };
    return true;
  } catch (error) {
    console.warn("Falha ao salvar no Firestore:", error);
    dataStatus = { mode: "local", message: "Salvo localmente. Firestore indisponível." };
    return false;
  }
}

function getDataStatus() {
  return dataStatus;
}

function brl(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}
