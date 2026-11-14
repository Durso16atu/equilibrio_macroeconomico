# Guia Técnico — Consultor ChangeMacro (Índice Local + Google AI Studio)

O **Consultor ChangeMacro** foi arquitetado em dupla camada para garantir **escopo 100% restrito aos dados homologados no projeto** (`7 fontes oficiais`, `7 tópicos canônicos de engenharia` e `364 blocos minutados` das transcrições):

1. **Camada 1 — Índice Local Homologado ([`src/data/knowledge_index.json`](file:///home/jose-eduardo/projetos/basico_economia/src/data/knowledge_index.json) & [`src/data/knowledge_index.js`](file:///home/jose-eduardo/projetos/basico_economia/src/data/knowledge_index.js)):**
   - Funciona imediatamente (zero latência e sem exigir chave externa), cruzando a pergunta do usuário com os 364 trechos minutados e lendo em tempo real os **4 controles da planta 2D** (`Tanque Hidráulico`, `Caldeira Monetária`, `Válvulas` e `Ponte Social`).
   - Bloqueia imediatamente qualquer pergunta fora do escopo macroeconômico homologado.
2. **Camada 2 — Conector Google AI Studio (`gemini-2.5-flash` com Structured JSON Schema):**
   - No próprio painel do Consultor (`🔑 AI Studio`), você ou um Key User pode ativar a síntese generativa do **Google AI Studio**:
     - **Opção Direta (Chave no Navegador):** Gere uma chave gratuita em [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) e cole no campo `GEMINI_API_KEY`. Ela fica salva exclusivamente no `localStorage` do seu navegador (nunca vai para o GitHub).
     - **Opção Proxy Gratuito Google Apps Script (Sem expor chave para Key Users):** Caso queira que todos os seus Key Users usem a sua cota gratuita do Google AI Studio sem precisarem colar chave própria, basta criar um script gratuito em [https://script.google.com](https://script.google.com) na conta `changeinvestmentos@gmail.com` com as 22 linhas abaixo:

```javascript
// Google Apps Script (script.google.com) — Proxy Gratuito ChangeMacro
// 1. Em "Configurações do Projeto > Propriedades do Script", adicione: GEMINI_API_KEY = sua_chave_ai_studio
// 2. Clique em "Implantar > Nova implantação > App da Web" (Quem pode acessar: "Qualquer pessoa")
function doPost(e) {
  var apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
  var response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: e.postData.contents,
    muteHttpExceptions: true
  });
  return ContentService
    .createTextOutput(response.getContentText())
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## Como Reindexar Após Aprovar Novas Fontes às Sextas-Feiras

Sempre que uma nova transcrição for homologada pelo **Radar Semanal Substack**, execute:

```bash
python3 src/ai/build_knowledge_base.py
```

O script atualizará automaticamente [`src/data/knowledge_index.json`](file:///home/jose-eduardo/projetos/basico_economia/src/data/knowledge_index.json) e [`src/data/knowledge_index.js`](file:///home/jose-eduardo/projetos/basico_economia/src/data/knowledge_index.js).
