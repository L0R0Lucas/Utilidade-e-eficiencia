// ==UserScript==
// @name         Copia rapidinho
// @namespace    https://utilidade-e-eficiencia
// @version      1.1
// @description  Copia dados do chat e cola no Métricas apenas nas telas de lançamento.
// @author       L0R0Lucas
// @match        https://abramudare.chatpolos.com.br/*
// @match        https://metricas2025.up.railway.app/periodo-01
// @match        https://metricas2025.up.railway.app/periodo-02
// @match        https://metricas2025.up.railway.app/periodo-03
// @match        https://metricas2025.up.railway.app/periodo-04
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

const XPATH_NOME = '/html/body/app-root/app-main-layout/div/div/app-index/div/div[3]/div[2]/app-info-chat-v2/div/div[6]/div[1]/div/div[2]/input';
const XPATH_MATRICULA = '/html/body/app-root/app-main-layout/div/div/app-index/div/div[3]/div[2]/app-info-chat-v2/div/div[6]/div[12]/div/div[2]/input';
const XPATH_POLO = '/html/body/app-root/app-main-layout/div/div/app-index/div/div[3]/div[2]/app-info-chat-v2/div/div[6]/div[4]/div/div[2]/input';
const XPATH_ANCORAGEM_BOTAO = '/html/body/app-root/app-main-layout/div/div/app-index/div/div[5]/div[2]/app-info-chat-v2/div/div[6]/div[53]/div/div[2]/input';

const STORAGE_KEY = 'ponte_chat_registro_v2';

const METRICAS_SELECTORS = {
  nome: 'input[name="nome"], input#nome, input[name="Nome"]',
  matricula: 'input[name="NMatricula"], input#NMatricula, input[name="nMatricula"]',
  polo: 'input[name="polo"], input#polo',
  inscricaoSelect: 'select[name="matricula"], select#matricula',
  linkChat: 'input[name="chatguru"], input[name="linkChat"], input#linkChat'
};

function getByXPath(xpath) {
  try {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  } catch {
    return null;
  }
}

function qs(selectors) {
  for (const s of selectors.split(',')) {
    const el = document.querySelector(s.trim());
    if (el) return el;
  }
  return null;
}

function isVisible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function extractValue(xpath) {
  const el = getByXPath(xpath);
  return el && el.value ? el.value.trim() : '';
}

function gatherFromChat() {
  return {
    nome: extractValue(XPATH_NOME),
    matricula: extractValue(XPATH_MATRICULA),
    polo: extractValue(XPATH_POLO),
    linkChat: location.href
  };
}

async function saveDraft(data) {
  await GM_setValue(STORAGE_KEY, JSON.stringify(data));
  GM_notification({ title: 'Copia rapidinho', text: 'Dados copiados', timeout: 1200 });
}

async function readDraft() {
  const raw = await GM_getValue(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function createCopyButton() {
  if (document.querySelector('.tm-copy-btn')) return;
  const btn = document.createElement('button');
  btn.textContent = 'CR';
  btn.className = 'tm-copy-btn';
  btn.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:999999';
  btn.onclick = async () => saveDraft(gatherFromChat());
  document.body.appendChild(btn);
}

async function pasteIntoForm() {
  const data = await readDraft();
  if (!data) return;

  const nomeEl = qs(METRICAS_SELECTORS.nome);
  const matEl = qs(METRICAS_SELECTORS.matricula);
  const poloEl = qs(METRICAS_SELECTORS.polo);
  const linkEl = qs(METRICAS_SELECTORS.linkChat);
  const tipoEl = qs(METRICAS_SELECTORS.inscricaoSelect);

  if (nomeEl) nomeEl.value = data.nome;
  if (matEl) matEl.value = data.matricula;
  if (poloEl) poloEl.value = data.polo;
  if (linkEl) linkEl.value = data.linkChat;

  if (tipoEl) {
    const escolha = prompt(
      '1 = Matrícula Acadêmica\n2 = Matrícula Acadêmica Conjunta\n3 = Renovação/Reabertura\n4 = Renovação/Reabertura Conjunta'
    );

    const mapa = {
      '1': /Acadêmica(?!.*Conjunta)/i,
      '2': /Acadêmica.*Conjunta/i,
      '3': /Renovação(?!.*Conjunta)/i,
      '4': /Renovação.*Conjunta/i
    };

    const regex = mapa[escolha];
    if (regex) {
      for (const opt of tipoEl.options) {
        if (regex.test(opt.text)) {
          opt.selected = true;
          tipoEl.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    }
  }
}

function createPasteButton() {
  if (document.querySelector('.tm-paste-btn')) return;
  const btn = document.createElement('button');
  btn.textContent = 'Colar';
  btn.className = 'tm-paste-btn';
  btn.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:999999';
  btn.onclick = pasteIntoForm;
  document.body.appendChild(btn);
}

(function () {
  const host = location.host;

  if (host.includes('chatpolos.com.br')) {
    createCopyButton();
  }

  if (host.includes('metricas2025.up.railway.app')) {
    createPasteButton();
  }
})();
