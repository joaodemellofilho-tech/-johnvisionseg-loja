# Automacao de pagamento e fornecedor

Este projeto agora tem uma base de backend em Firebase Functions para:

- criar checkout Mercado Pago com valor exato do carrinho;
- receber webhook de pagamento;
- marcar pedido como Pago no Firestore;
- mover o pedido para Comprar no fornecedor;
- enviar o pedido para um fornecedor com API/webhook, quando configurado.

## Variaveis obrigatorias

Configure no Firebase Functions:

```bash
firebase functions:config:set mercadopago.token="SEU_ACCESS_TOKEN"
```

Ou, em runtime que use variaveis de ambiente:

```bash
MERCADO_PAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN
PUBLIC_SITE_URL=https://joaodemellofilho-tech.github.io/-johnvisionseg-loja/
FIRESTORE_COLLECTION=johnvisionseg_sites
FIRESTORE_DOC_ID=main
```

## Variaveis opcionais para fornecedor

Se o fornecedor tiver API/webhook para receber pedidos:

```bash
SUPPLIER_WEBHOOK_URL=https://api-do-fornecedor.com/pedidos
SUPPLIER_WEBHOOK_TOKEN=TOKEN_DO_FORNECEDOR
```

Quando o Mercado Pago aprovar o pagamento, a Function envia:

```json
{
  "orderId": "123",
  "customer": {
    "name": "Cliente",
    "phone": "telefone",
    "email": "",
    "address": "endereco"
  },
  "items": [],
  "total": 0
}
```

## Deploy

Instale dependencias das Functions:

```bash
cd functions
npm install
```

Volte para a raiz e publique:

```bash
firebase deploy --only functions,hosting
```

Depois do deploy, copie a URL base das Functions e preencha em:

`assets/js/firebase-config.js`

```js
window.JOHNVISIONSEG_BACKEND = {
  functionsBaseUrl: "https://southamerica-east1-johnvisionseg-site.cloudfunctions.net",
  createCheckoutPath: "/createCheckout"
};
```

## Mercado Pago

No painel de desenvolvedor Mercado Pago, configure o webhook para:

```text
https://southamerica-east1-johnvisionseg-site.cloudfunctions.net/mercadoPagoWebhook
```

Evento: pagamento.

## Observacao importante

Compra totalmente automatica no fornecedor so funciona quando o fornecedor oferece API ou webhook. Para marketplaces sem API de compra, o sistema deixa o pedido pronto, abre links e copia dados para compra semi-automatica.
