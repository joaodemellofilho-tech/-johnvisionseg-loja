JOHNVISIONSEG LOJA ONLINE PRO

Pacote estático pronto para hospedagem em serviços como Hostinger, Netlify, Vercel, GitHub Pages ou qualquer hospedagem com HTML/CSS/JS.

Inclui:
1. Loja online responsiva focada em venda de produtos
2. Loja online com busca e filtro por categoria
3. Carrinho de compras
4. Pedido via WhatsApp
5. Painel administrativo local
6. Produtos, estoque, pedidos, clientes e orçamentos
7. Produtos com imagem, especificações e Mercado Livre
8. Agente IA administrativo local
9. Integração preparada para Firebase Firestore
10. Fallback automático para LocalStorage se o Firebase não estiver configurado
11. Metadados SEO, manifest PWA, favicon e service worker

Como usar:
- Abra index.html para acessar o site e a loja.
- Abra admin/index.html para acessar o painel.
- Senha padrão do painel: admin123.

Configurar Firebase Firestore:
1. Crie um projeto no Firebase Console.
2. Ative o Cloud Firestore.
3. Em Configurações do projeto > Seus apps, crie um app Web.
4. Copie o objeto firebaseConfig.
5. Abra assets/js/firebase-config.js.
6. A configuração do projeto johnvisionseg-site já foi preenchida neste pacote.
7. Publique o site novamente.

Arquivo de configuração:
assets/js/firebase-config.js

Documento usado no Firestore:
- Coleção: johnvisionseg_sites
- Documento: main

O painel salva todo o estado do site nesse documento: textos, produtos, estoque, pedidos, orçamentos, clientes, portfólio e depoimentos.

Regras temporárias para teste:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /johnvisionseg_sites/{docId} {
      allow read, write: if true;
    }
  }
}

Importante:
Use o arquivo firestore.rules deste pacote para proteger escrita no banco. O site público continua lendo os dados, mas somente administradores autenticados podem alterar o documento.

Configurar painel seguro:
1. No Firebase Console, abra Authentication.
2. Ative o provedor Email/Senha.
3. Crie um usuário administrador.
4. No Firestore, crie a coleção admins.
5. Crie um documento com ID igual ao e-mail do administrador, por exemplo seuemail@gmail.com.
6. Dentro do documento, pode colocar role = admin.
7. Publique as regras do arquivo firestore.rules no Firebase.
8. Opcional: se quiser travar também na interface, abra assets/js/firebase-config.js e coloque o e-mail em JOHNVISIONSEG_SECURITY.adminEmails.

Erros comuns:
- auth/invalid-login-credentials: e-mail ou senha incorretos, ou usuário ainda não existe no Authentication.
- auth/operation-not-allowed: provedor Email/Senha não foi ativado no Firebase Authentication.
- permission-denied ao salvar: falta criar o documento admins/seuemail no Firestore ou falta publicar firestore.rules.
- Painel abre, mas não salva no Firestore: verifique se o e-mail logado é exatamente igual ao ID do documento em admins.

Fallback local:
- Por segurança, allowLocalAdminFallback está false.
- Se precisar testar sem Firebase Auth, mude temporariamente para true e use senha admin123.
- Volte para false antes de publicar.

Agente IA administrativo:
- Analisa saúde operacional, estoque, pedidos e orçamentos.
- Gera resumo executivo e alertas críticos.
- Executa comandos simples no painel.
- Exemplos de comando:
  - gerar resumo executivo
  - listar alertas críticos
  - ajustar estoque camera para 10
  - criar produto Sensor Porta | Alarmes | 79.90 | 5 | Sensor magnético
  - trocar título para Proteção completa para sua casa e empresa
  - trocar whatsapp para (11) 99999-9999

Imagens e especificações automáticas:
- No painel, abra Produtos.
- Em cada produto, use URL da imagem ou selecione um arquivo de imagem.
- Upload local é convertido para base64 e salvo junto com o produto.
- Para não deixar o Firestore pesado, use imagens até 650 KB.
- Clique em Preencher automático para gerar categoria, descrição, sigla, estoque mínimo e especificações técnicas.
- O algoritmo reconhece termos como câmera, CFTV, DVR, NVR, alarme, sensor, cerca elétrica, vídeo porteiro, fechadura, biometria e controle de acesso.
- Também reconhece câmeras PTZ avançadas com 3MP, 5MP, 8MP, 4K, 6K, H.265, ONVIF, iCSee, zoom 4x/8x, lente dupla, três lentes, tela dupla, painel solar, bateria, PIR e uso externo à prova d'água.
- A lista de câmeras PTZ enviada já foi adicionada como catálogo inicial.
- As especificações aparecem automaticamente no card do produto da loja.

Recursos Mercado Livre:
- No painel, abra Produtos > Mercado Livre.
- Cole links ou códigos MLB, um por linha.
- O sistema tenta buscar dados públicos em https://api.mercadolibre.com/items/{ITEM_ID}.
- Quando encontra o item, preenche nome, preço, imagem, permalink e especificações.
- Quando a rede/API não responde, cria o produto mesmo assim usando o código/link como base.
- Cada produto tem campos Link Mercado Livre e Código MLB.
- Se o produto tiver link Mercado Livre, a loja exibe o botão Ver no Mercado Livre.
- Para publicação/gestão real de anúncios, a API oficial do Mercado Livre exige OAuth/token; não coloque client secret no frontend.
- Para afiliado/campanha, configure affiliateTag em assets/js/firebase-config.js.

Publicação:
- Envie todos os arquivos desta pasta para a raiz da hospedagem.
- Depois de publicar em domínio real, ajuste sitemap.xml com o domínio correto.
- Configure o domínio autorizado no Firebase se usar Authentication no futuro.
- Se usar Netlify, o arquivo _headers aplica headers de segurança.
- Se usar Apache/Hostinger com suporte a .htaccess, o arquivo .htaccess aplica headers de segurança.
