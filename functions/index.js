const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");

admin.initializeApp();

const db = admin.firestore();
const REGION = process.env.FUNCTION_REGION || "southamerica-east1";
const COLLECTION = process.env.FIRESTORE_COLLECTION || "johnvisionseg_sites";
const DOC_ID = process.env.FIRESTORE_DOC_ID || "main";
const MP_API = "https://api.mercadopago.com";

function configValue(envName, configPath) {
  if (process.env[envName]) return process.env[envName];
  try {
    const functions = require("firebase-functions");
    return configPath.split(".").reduce((obj, key) => obj && obj[key], functions.config()) || "";
  } catch {
    return "";
  }
}

function cors(res) {
  res.set("Access-Control-Allow-Origin", process.env.PUBLIC_SITE_URL || "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
}

function requireEnv(name) {
  const legacyMap = {
    MERCADO_PAGO_ACCESS_TOKEN: "mercadopago.token"
  };
  const value = configValue(name, legacyMap[name] || name.toLowerCase().replace(/_/g, "."));
  if (!value) throw new Error(`Variavel ${name} nao configurada.`);
  return value;
}

function cleanOrder(raw) {
  const items = Array.isArray(raw.items) ? raw.items : [];
  const safeItems = items.slice(0, 30).map((item) => ({
    id: String(item.id || ""),
    name: String(item.name || "Produto").slice(0, 180),
    price: Number(item.price || 0),
    qty: Math.max(1, Number(item.qty || 1)),
    fulfillment: String(item.fulfillment || "local"),
    supplier: String(item.supplier || ""),
    supplierUrl: String(item.supplierUrl || ""),
    supplierSku: String(item.supplierSku || ""),
    deliveryTime: String(item.deliveryTime || ""),
    cost: Number(item.cost || 0)
  })).filter((item) => item.price > 0 && item.qty > 0);

  if (!safeItems.length) throw new Error("Pedido sem itens validos.");
  const total = safeItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const supplierCost = safeItems.reduce((sum, item) => sum + Number(item.cost || 0) * item.qty, 0);
  const id = String(raw.id || Date.now());

  return {
    id,
    date: raw.date || new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    name: String(raw.name || "Cliente").slice(0, 120),
    phone: String(raw.phone || "").slice(0, 40),
    email: String(raw.email || "").slice(0, 160),
    address: String(raw.address || "").slice(0, 500),
    total,
    supplierCost,
    profit: total - supplierCost,
    status: "Aguardando pagamento",
    fulfillmentStatus: "Aguardando pagamento",
    paymentProvider: "mercadopago",
    paymentStatus: "pending",
    items: safeItems
  };
}

async function upsertOrder(order) {
  const ref = db.collection(COLLECTION).doc(DOC_ID);
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.exists ? snap.data() : {};
    const orders = Array.isArray(data.orders) ? data.orders : [];
    const nextOrders = [order, ...orders.filter((item) => String(item.id) !== String(order.id))].slice(0, 500);
    transaction.set(ref, { orders: nextOrders, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  });
}

async function patchOrder(orderId, patch) {
  const ref = db.collection(COLLECTION).doc(DOC_ID);
  let updatedOrder = null;
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) return;
    const data = snap.data();
    const orders = Array.isArray(data.orders) ? data.orders : [];
    const nextOrders = orders.map((order) => {
      if (String(order.id) !== String(orderId)) return order;
      updatedOrder = { ...order, ...patch };
      return updatedOrder;
    });
    transaction.set(ref, { orders: nextOrders, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  });
  return updatedOrder;
}

async function mercadoPago(path, options = {}) {
  const token = requireEnv("MERCADO_PAGO_ACCESS_TOKEN");
  const response = await fetch(`${MP_API}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || data.error || `Mercado Pago HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function buildNotificationUrl(req) {
  const configured = configValue("MERCADO_PAGO_WEBHOOK_URL", "mercadopago.webhook_url");
  if (configured) return configured;
  const protocol = req.get("x-forwarded-proto") || "https";
  return `${protocol}://${req.get("host")}/mercadoPagoWebhook`;
}

exports.createCheckout = onRequest({ region: REGION }, async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo nao permitido." });

  try {
    const order = cleanOrder(req.body || {});
    await upsertOrder(order);

    const siteUrl = configValue("PUBLIC_SITE_URL", "site.url") || "https://joaodemellofilho-tech.github.io/-johnvisionseg-loja/";
    const preference = await mercadoPago("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify({
        external_reference: String(order.id),
        notification_url: buildNotificationUrl(req),
        items: order.items.map((item) => ({
          id: String(item.id),
          title: item.name,
          quantity: item.qty,
          unit_price: Number(item.price),
          currency_id: "BRL"
        })),
        payer: {
          name: order.name,
          email: order.email || undefined,
          phone: order.phone ? { number: order.phone } : undefined
        },
        back_urls: {
          success: `${siteUrl}?pedido=${encodeURIComponent(order.id)}&pagamento=aprovado`,
          pending: `${siteUrl}?pedido=${encodeURIComponent(order.id)}&pagamento=pendente`,
          failure: `${siteUrl}?pedido=${encodeURIComponent(order.id)}&pagamento=falhou`
        },
        auto_return: "approved",
        metadata: {
          order_id: String(order.id),
          source: "johnvisionseg"
        }
      })
    });

    await patchOrder(order.id, {
      mercadoPagoPreferenceId: preference.id,
      paymentUrl: preference.init_point || preference.sandbox_init_point || "",
      paymentStatus: "pending"
    });

    return res.json({
      orderId: order.id,
      preferenceId: preference.id,
      initPoint: preference.init_point || preference.sandbox_init_point
    });
  } catch (error) {
    logger.error("Falha ao criar checkout", error);
    return res.status(400).json({ error: error.message || "Falha ao criar checkout." });
  }
});

exports.mercadoPagoWebhook = onRequest({ region: REGION }, async (req, res) => {
  if (req.method !== "POST") return res.status(200).send("ok");
  try {
    const body = req.body || {};
    const paymentId = body?.data?.id || body?.id || req.query["data.id"];
    const type = body.type || body.topic || req.query.type;
    if (!paymentId || (type && !String(type).includes("payment"))) return res.status(200).send("ignored");

    const payment = await mercadoPago(`/v1/payments/${encodeURIComponent(paymentId)}`);
    const orderId = payment.external_reference || payment.metadata?.order_id;
    if (!orderId) return res.status(200).send("missing-reference");

    const approved = payment.status === "approved";
    const order = await patchOrder(orderId, {
      paymentId: String(payment.id),
      paymentStatus: payment.status,
      status: approved ? "Pago" : "Aguardando pagamento",
      fulfillmentStatus: approved ? "Comprar no fornecedor" : "Aguardando pagamento",
      paidAt: approved ? new Date().toISOString() : null,
      paymentDetail: {
        status: payment.status,
        statusDetail: payment.status_detail || "",
        method: payment.payment_method_id || "",
        amount: payment.transaction_amount || 0
      }
    });

    if (approved && order) await sendSupplierOrder(order);
    return res.status(200).send("ok");
  } catch (error) {
    logger.error("Falha no webhook Mercado Pago", error);
    return res.status(200).send("error-logged");
  }
});

async function sendSupplierOrder(order) {
  const url = configValue("SUPPLIER_WEBHOOK_URL", "supplier.webhook_url");
  if (!url) return;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(configValue("SUPPLIER_WEBHOOK_TOKEN", "supplier.token") ? { "Authorization": `Bearer ${configValue("SUPPLIER_WEBHOOK_TOKEN", "supplier.token")}` } : {})
      },
      body: JSON.stringify({
        orderId: order.id,
        customer: {
          name: order.name,
          phone: order.phone,
          email: order.email,
          address: order.address
        },
        items: order.items,
        total: order.total
      })
    });
    await patchOrder(order.id, {
      fulfillmentStatus: response.ok ? "Pedido no fornecedor" : "Comprar no fornecedor",
      supplierAutomation: response.ok ? "sent" : `failed-${response.status}`
    });
  } catch (error) {
    logger.error("Falha ao enviar pedido ao fornecedor", error);
    await patchOrder(order.id, {
      fulfillmentStatus: "Comprar no fornecedor",
      supplierAutomation: "failed"
    });
  }
}
