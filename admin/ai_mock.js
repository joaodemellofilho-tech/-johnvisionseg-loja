// admin/ai_mock.js
// Mock IA Vendedora (Prompt Supremo) – gera conteúdo de vendas a partir de imagem.
// Esta versão é apenas um mock que retorna dados estáticos para demonstração.

/**
 * Prompt Supremo – IA de Vendas Automática
 */
const PROMPT_SUPREMO = `PROMPT MASTER - IA VENDEDORA DE PRODUTOS\n\
Você é uma IA especialista em marketing digital, copywriting, neurovendas, gatilhos mentais e conversão de vendas.\n\
Sua função é analisar qualquer imagem de produto enviada pelo usuário e gerar automaticamente argumentos de venda altamente persuasivos.\n\
[... (texto completo do prompt) ...]`;

/**
 * Função mock que simula a geração de copy a partir da imagem.
 * Retorna um objeto com as seções solicitadas no prompt.
 */
function mockGenerateSalesCopy(imageFile) {
  // Em produção aqui poderia chamar um modelo de IA (ex.: OpenAI, Gemini). Para demo retornamos dados estáticos.
  return {
    analysis: {
      productName: "Câmera PTZ Wi‑Fi 5 MP",
      category: "Câmeras PTZ",
      targetAudience: "Residencial, pequenos negócios e instalações agrícolas",
      keyBenefits: [
        "Visão noturna em alta resolução",
        "Rastreamento automático com IA",
        "Acesso remoto pelo app iCSee",
        "Compressão H.265 para menor consumo de banda"
      ]
    },
    salesArguments: [
      "Proteção 24 h com alertas instantâneos no celular",
      "Instalação plug‑and‑play, sem fios",
      "Economia de energia com compressão H.265",
      "Tecnologia de detecção humana por IA",
      "Visão 5 MP com detalhe nítido",
      "Opção de energia solar para locais sem rede elétrica",
      "Garantia de 30 dias e suporte remoto",
      "Exclusivo para clientes John VisionSeg",
      "Preço promocional por tempo limitado",
      "Frete grátis para todo o Brasil"
    ],
    commercialDescription: `
      <h2>Câmera PTZ Wi‑Fi 5 MP – Segurança Inteligente</h2>
      <p>Monitore sua casa ou comércio em tempo real com a mais avançada tecnologia de IA e visão noturna. Instalação simples, sem fios, e acesso pelo app iCSee 24 h/7 dias. Economize energia com compressão H.265 e conte com garantia de 30 dias.</p>
      <ul>
        <li>Visão 5 MP com zoom digital 4x</li>
        <li>Rastreamento automático de pessoas</li>
        <li>Alertas instantâneos no celular</li>
        <li>Alimentação via energia solar opcional</li>
        <li>Instalação plug‑and‑play</li>
      </ul>
    `,
    whatsappText: "⚡ Câmera PTZ 5 MP com IA – segurança 24 h, instalação fácil. Aproveite 10 % OFF hoje! 🎯",
    instagramCaption: "📹✨ Eleve a segurança da sua casa com a nova Câmera PTZ 5 MP! Visão noturna, IA de rastreamento e controle pelo app. 🚀 #Segurança #CâmeraIP #HomeSecurity #JohnVisionSeg",
    videoScript: `
      // 30‑seg Reel – Câmera PTZ AI\n      // Gancho: "Cansado de ficar no escuro quando ocorre um roubo?"\n      // Demonstração: imagens da câmera em ação, visão noturna e app.\n      // Benefícios: alerta imediato, instalação plug‑and‑play, energia solar.\n      // CTA: "Clique no link e garanta a sua com 10 % OFF!"
    `,
    irresistibleOffer: {
      scarcity: "Restam apenas 5 unidades em estoque",
      urgency: "Oferta válida até meia‑noite de hoje",
      bonus: "Frete grátis + suporte remoto por 30 dias",
      guarantee: "Garantia total de 30 dias ou seu dinheiro de volta"
    },
    ctas: [
      "Compre agora!",
      "Garanta o seu antes que acabe!",
      "Últimas unidades disponíveis!",
      "Aproveite a promoção de hoje!",
      "Clique e adquira já!",
      "Não perca, estoque limitado!",
      "Desconto relâmpago – 10 % OFF!",
      "Peça já e receba em 24h!",
      "Seu segurança começa aqui!",
      "Adquira agora e economize!"
    ],
    highConversionTitles: Array.from({length:20},(_,i)=>`Câmera PTZ 5 MP – Segurança Inteligente ${i+1}`),
    ads: {
      facebook: [
        {title:"Câmera PTZ 5 MP – Promoção Exclusiva", copy:"Alerta imediato, visão noturna e controle pelo app. 10 % OFF hoje!"},
        {title:"Proteja sua casa 24 h", copy:"Câmera com IA de detecção humana. Frete grátis para todo Brasil."},
        {title:"Tecnologia de Segurança Avançada", copy:"Instalação plug‑and‑play, garantia 30 dias. Clique e compre!"},
        {title:"Câmera PTZ – Oferta Limitada", copy:"Restam poucos unidades. Não perca!"},
        {title:"Visão Noturna 5 MP", copy:"Veja tudo mesmo no escuro. Promoção até meia‑noite."}
      ],
      instagram: [
        {caption:"📹✨ Segurança em alta definição! #CâmeraPTZ #Segurança"},
        {caption:"🚀 Instalação fácil, monitoramento 24 h. #HomeSecurity"},
        {caption:"💡 Tecnologia AI para sua proteção. #IA #Câmera"},
        {caption:"🔒 Proteja sua família com visão noturna. #SegurançaDoméstica"},
        {caption:"⚡ Oferta relâmpago 10 % OFF! #Desconto"}
      ],
      google: {
        titles: [
          "Câmera PTZ 5 MP – Compra Online",
          "Câmera de Segurança com IA – Melhor Preço",
          "Visão Noturna 5 MP – Frete Grátis",
          "Câmera PTZ Wi‑Fi – Instalação Fácil",
          "Câmera de Segurança 5 MP – Promoção"
        ],
        descriptions: [
          "Alerta imediato, controle via app, 10 % OFF hoje. Compre já!",
          "Visão noturna, IA, energia solar opcional. Garanta a sua.",
          "Instalação plug‑and‑play, garantia 30 dias. Oferta limitada.",
          "Câmera PTZ 5 MP com compressão H.265. Frete grátis.",
          "Proteja sua casa com a tecnologia mais avançada. Clique agora."
        ]
      },
      tiktok: [
        {script:"Comece com um roubo simulado, depois mostre a câmera descobrindo e enviando alerta. CTA: ‘Clique e ganhe 10% OFF!’"},
        {script:"Mostre a câmera em ação à noite, destaque a visão noturna. CTA: ‘Compre agora!’"},
        {script:"Unboxing da câmera, demonstração rápida no app. CTA: ‘Aproveite a promoção!’"}
      ],
      whatsapp: [
        {message:"⚡ Câmera PTZ 5 MP – segurança 24 h, instalação fácil. 10 % OFF hoje! Responda ‘SIM’ para garantir a sua."},
        {message:"🚀 Oferta relâmpago: frete grátis + suporte por 30 dias. Só até meia‑noite!"},
        {message:"🛡️ Proteja seu lar com IA – veja o vídeo e confirme sua compra."},
        {message:"💰 Desconto exclusivo 10 % – clique aqui e finalize a compra agora!"},
        {message:"⏰ Últimas unidades! Garanta a sua câmera PTZ antes que acabe."}
      ]
    }
  };
}

/**
 * Função que popula os campos do formulário de importação de produto.
 * Recebe o objeto retornado por `mockGenerateSalesCopy`.
 */
function populateGeneratedFields(data) {
  // Painel de importação por link – IDs já definidos no HTML.
  document.getElementById('linkImportName').value = data.analysis.productName || '';
  document.getElementById('linkImportCategory').value = data.analysis.category || '';
  document.getElementById('linkImportPrice').value = data.analysis.keyBenefits.includes('Economia') ? 199.90 : 0;
  document.getElementById('linkImportStock').value = 5;
  document.getElementById('linkImportMin').value = 2;
  document.getElementById('linkImportImage').value = '';
  document.getElementById('linkImportSpecs').value = (data.analysis.keyBenefits || []).join('\n');
  document.getElementById('linkImportDesc').value = data.commercialDescription.replace(/<[^>]+>/g, '').trim();
  document.getElementById('linkImportSource').value = '';
  // Exibir preview
  document.getElementById('linkImportPreview').style.display = 'block';
}

/**
 * Handler chamado ao clicar no botão “Gerar a partir da imagem”.
 */
async function generateProductFromImage() {
  const input = document.getElementById('iaImageInput');
  if (!input.files || !input.files[0]) {
    alert('Selecione uma imagem antes de gerar.');
    return;
  }
  // Neste mock não enviamos a imagem para IA – apenas chamamos a função stub.
  const mockData = mockGenerateSalesCopy(input.files[0]);
  populateGeneratedFields(mockData);
  // Opcional: exibir feedback visual ao usuário.
  const status = document.getElementById('linkImportStatus');
  if (status) {
    status.textContent = '✅ Conteúdo gerado – revise e confirme.';
    status.style.background = 'rgba(0,255,136,.12)';
    status.style.color = '#00ff88';
    status.style.display = 'block';
  }
}

// Exportar funções para uso externo (se necessário)
window.aiMock = {
  generateProductFromImage,
  mockGenerateSalesCopy,
  populateGeneratedFields,
  PROMPT_SUPREMO
};
