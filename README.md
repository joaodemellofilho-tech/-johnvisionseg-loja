# JohnVisionSeg Loja Online

Loja online estatica para venda de cameras de seguranca, CFTV, alarmes e controle de acesso.

## Publicacao no GitHub Pages

1. Crie um repositorio no GitHub.
2. Envie todos os arquivos desta pasta para o repositorio.
3. No GitHub, abra `Settings > Pages`.
4. Em `Build and deployment`, selecione:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Salve e aguarde o link do GitHub Pages.

## Arquivos principais

- `index.html`: loja publica.
- `admin/index.html`: painel administrativo.
- `assets/css/style.css`: visual do site.
- `assets/js/app.js`: vitrine, carrinho e pagamento.
- `assets/js/app-data.js`: dados padrao e persistencia.
- `assets/js/customer-auth.js`: area do cliente com login e senha.

## Observacao

Depois de publicar, atualize links do WhatsApp, Pix e pagamento em `Painel > Site`.

## Mercado Pago API

O site tem dois fluxos via Firebase Functions:
- Checkout Pro: cria uma preferencia e redireciona o cliente para o Mercado Pago.
- Cartao via Card Payment Brick: o SDK tokeniza o cartao no frontend e a Function cria o pagamento em `/v1/payments`.

O Access Token do Mercado Pago deve ficar somente no backend, nunca no HTML ou JavaScript publico. A Public Key pode ficar no frontend.

1. No Mercado Pago Developers, crie uma aplicacao e copie o Access Token.
2. Configure o token na Function:
   `firebase functions:config:set mercadopago.token="SEU_ACCESS_TOKEN"`
3. Em `assets/js/firebase-config.js`, preencha `JOHNVISIONSEG_MERCADO_PAGO.publicKey` com sua Public Key.
4. Publique Functions, Hosting e regras do Firestore:
   `firebase deploy --only functions,hosting,firestore:rules`
5. Confirme que `assets/js/firebase-config.js` aponta para:
   `https://southamerica-east1-johnvisionseg-site.cloudfunctions.net`

Quando o cliente clicar em pagar, o site chama `createCheckout`, a Function cria a preferencia em `https://api.mercadopago.com/checkout/preferences` e retorna o link de pagamento.

Quando o cliente clicar em "Pagar com cartao", o SDK `https://sdk.mercadopago.com/js/v2` renderiza o Card Payment Brick, gera o token do cartao e envia para `processCardPayment`. A Function chama `https://api.mercadopago.com/v1/payments` com `X-Idempotency-Key`.
