// ==UserScript==
// @name         Copia Rapidinho
// @namespace    https://github.com/L0R0Lucas/Utilidade-e-eficiencia
// @version      1.0
// @description  Copia dados do chat (nome, matrícula, polo e link) e cola automaticamente no formulário do Métricas
// @author       L0R0Lucas
// @match        https://abramudare.chatpolos.com.br/*
// @match        https://metricas2025.up.railway.app/*
// @updateURL    https://raw.githubusercontent.com/L0R0Lucas/Utilidade-e-eficiencia/main/scripts/Copia-rapidinho.user.js
// @downloadURL  https://raw.githubusercontent.com/L0R0Lucas/Utilidade-e-eficiencia/main/scripts/Copia-rapidinho.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==


const XPATH_NOME = '/html/body/app-root/app-main-layout/div/div/app-index/div/div[5]/div[2]/app-info-chat-v2/div/div[6]/div[1]/div/div[2]/input';
const XPATH_MATRICULA = '/html/body/app-root/app-main-layout/div/div/app-index/div/div[5]/div[2]/app-info-chat-v2/div/div[6]/div[12]/div/div[2]/input';
const XPATH_POLO = '/html/body/app-root/app-main-layout/div/div/app-index/div/div[5]/div[2]/app-info-chat-v2/div/div[6]/div[4]/div/div[2]/input';
const XPATH_ANCORAGEM_BOTAO = '/html/body/app-root/app-main-layout/div/div/app-index/div/div[5]/div[2]/app-info-chat-v2/div/div[6]/div[53]/div/div[2]/input';

const STORAGE_KEY = 'ponte_chat_registro_v2';
const METRICAS_SELECTORS = {
  nome: 'input[name="nome"], input#nome, input[name="Nome"]',
  matricula: 'input[name="NMatricula"], input#NMatricula, input[name="nMatricula"]',
  polo: 'input[name="polo"], input#polo',
  inscricaoSelect: 'select[name="matricula"], select#matricula',
  linkChat: 'input[name="chatguru"], input[name="linkChat"], input#linkChat'
};

function getByXPath(xpath, root=document) {
  try {
    const r = document.evaluate(xpath, root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return r.singleNodeValue || null;
  } catch (e) { return null; }
}
function qs(selectors) {
  if (!selectors) return null;
  const parts = selectors.split(',');
  for (let s of parts) {
    s = s.trim();
    if (!s) continue;
    const el = document.querySelector(s);
    if (el) return el;
  }
  return null;
}
function qp(sel) { try { return document.querySelector(sel); } catch(e) { return null; } }
function isVisible(el){
  if(!el) return false;
  if(el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

GM_addStyle(`
  .tm-bridge-toast { position: fixed; right: 18px; bottom: 72px; z-index: 9999999; background: rgba(0,0,0,0.78); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 13px; box-shadow: 0 8px 20px rgba(0,0,0,0.25); opacity: 0; transform: translateY(6px); transition: opacity .28s, transform .28s; }
  .tm-bridge-toast.show { opacity: 1; transform: translateY(0); }
  .tm-small-bridge-btn-chat { cursor: pointer; border: none; padding: 6px; width: 28px; height: 28px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); background: #0b76ef; color: #fff; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; z-index: 999999; }
  .tm-small-bridge-btn-fixed { position: fixed !important; right: 8px !important; bottom: 8px !important; z-index: 999999 !important; }
  .tm-bridge-paste-btn-fixed { position: fixed; top: 12px; right: 12px; z-index: 9999999; padding: 8px 10px; border-radius: 6px; border: none; background: #21a179; color: #fff; cursor: pointer; box-shadow: 0 8px 18px rgba(0,0,0,0.12); }
  .tm-modal-paste-btn { position: absolute; top: 8px; right: 8px; z-index: 99999999; padding:6px 8px; border-radius:6px; background:#21a179; color:#fff; border:none; cursor:pointer; font-size:13px; }
`);
let toastTimer = null;
function showToast(text, ms = 1500) {
  let t = document.getElementById('tm-bridge-toast');
  if (!t) { t = document.createElement('div'); t.id = 'tm-bridge-toast'; t.className = 'tm-bridge-toast'; document.body.appendChild(t); }
  t.textContent = text; t.classList.add('show'); if (toastTimer) clearTimeout(toastTimer); toastTimer = setTimeout(()=>{ t.classList.remove('show'); }, ms);
}

async function saveDraft(data) {
  try {
    const payload = { nome: data.nome || '', matricula: data.matricula || '', polo: data.polo || '', linkChat: data.linkChat || '' };
    await GM_setValue(STORAGE_KEY, JSON.stringify(payload));
    showToast('Copiado, vá para o Métricas');
    try { GM_notification({ title: 'Copia Rapidinho', text: 'Dados copiados.', timeout: 1200 }); } catch(e){}
    try { await navigator.clipboard.writeText(JSON.stringify(payload)); } catch(e){}
  } catch (e) {
    try { await navigator.clipboard.writeText(JSON.stringify(data)); showToast('Copiado para área de transferência'); } catch (e2) { alert('Não foi possível salvar rascunho.'); console.error(e, e2); }
  }
}
async function readDraft() {
  try {
    const raw = await GM_getValue(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function extractValue(xpath) {
  if (!xpath) return '';
  const el = getByXPath(xpath);
  if (!el) return '';
  if ('value' in el) return String(el.value || '').trim();
  return String(el.textContent || '').trim();
}
function gatherFromChat() {
  const nome = extractValue(XPATH_NOME) || '';
  const matricula = extractValue(XPATH_MATRICULA) || '';
  const polo = extractValue(XPATH_POLO) || '';
  const url = location.href || '';
  return { nome, matricula, polo, linkChat: url };
}
function createSmallCopyButton() {
  if (document.querySelector('.tm-small-bridge-btn-chat')) return null;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.title = 'Pega os dados'; btn.innerHTML = 'CR'; btn.className = 'tm-small-bridge-btn-chat';
  btn.addEventListener('click', async (e) => { e.preventDefault(); const data = gatherFromChat(); await saveDraft(data); });
  return btn;
}
function insertCopyButtonAtAnchor() {
  if (document.querySelector('.tm-small-bridge-btn-chat')) return true;
  const anchor = getByXPath(XPATH_ANCORAGEM_BOTAO);
  const btn = createSmallCopyButton();
  if (!btn) return false;
  if (anchor && anchor.parentElement) {
    try { const wrapper = document.createElement('span'); wrapper.style.marginLeft = '6px'; wrapper.appendChild(btn); anchor.parentElement.appendChild(wrapper); return true; } catch (e){}
  }
  btn.classList.add('tm-small-bridge-btn-fixed'); document.body.appendChild(btn); return true;
}

function findAddButton() {
  const candidates = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
  const txtRegex = /Adicionar Novo Registro|Adicionar Registro|Adicionar Novo|Adicionar Registro/i;
  for (const el of candidates) {
    try {
      if (!isVisible(el)) continue;
      const text = (el.textContent || el.value || '').trim();
      if (txtRegex.test(text)) return el;
      const onclick = el.getAttribute && el.getAttribute('onclick');
      if (onclick && /openModal\(|openModal/.test(onclick)) return el;
      const dt = el.dataset || {};
      if (dt.toggle === 'modal' || (dt.target && String(dt.target).includes('addModal'))) return el;
      const aria = el.getAttribute && el.getAttribute('aria-controls');
      if (aria && /addModal|modal/i.test(aria)) return el;
    } catch(e){}
  }
  const onclickEls = Array.from(document.querySelectorAll('[onclick]')).filter(e => /openModal|AddModal|addModal/i.test(e.getAttribute('onclick')));
  if (onclickEls.length) return onclickEls[0];
  return null;
}
function tryOpenAddModal() {
  try {
    const btn = findAddButton();
    if (btn) { btn.click(); return true; }
    if (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.openModal === 'function') { try { unsafeWindow.openModal(); return true; } catch(e){} }
    if (typeof window.openModal === 'function') { try { window.openModal(); return true; } catch(e){} }
    const fallback = document.querySelector('#openAddModal, #btnAdd, #btnAddRegistro, .btn-add, .open-modal');
    if (fallback) { fallback.click(); return true; }
    return false;
  } catch(e) { console.error('tryOpenAddModal', e); return false; }
}

function findModal() {
  let modal = document.getElementById('addModal');
  if (modal && isVisible(modal)) return modal;
  modal = Array.from(document.querySelectorAll('[role="dialog"], .modal, .dialog')).find(el => {
    if (!isVisible(el)) return false;
    if (el.querySelector('form#formUpload, form#formAviso, form')) return true;
    const txt = (el.textContent || '').slice(0,200);
    if (/Novo Documento|Adicionar Aviso|Novo Registro|Adicionar Novo/i.test(txt)) return true;
    return false;
  });
  if (modal) return modal;
  modal = Array.from(document.querySelectorAll('.modal')).find(m => isVisible(m));
  if (modal) return modal;
  return null;
}
function insertModalInnerPasteButton(modal) {
  if (!modal) return null;
  if (modal.querySelector('.tm-modal-paste-btn')) return modal.querySelector('.tm-modal-paste-btn');
  modal.style.position = modal.style.position || 'relative';
  const btn = document.createElement('button');
  btn.className = 'tm-modal-paste-btn';
  btn.textContent = 'Cola rapidinho';
  btn.addEventListener('click', async (e) => { e.preventDefault(); await pasteIntoModalAndFocus(); });
  modal.appendChild(btn);
  return btn;
}

async function pasteIntoModalAndFocus() {
  let data = await readDraft();
  if (!data) {
    try { const txt = await navigator.clipboard.readText(); data = JSON.parse(txt); } catch(e) { data = null; }
  }
  if (!data) { alert('Nenhum rascunho encontrado. Copie do chat primeiro.'); return; }

  let modal = findModal();
  if (!modal) {
    tryOpenAddModal();
    const ok = await new Promise(res => {
      let tries = 0;
      const iv = setInterval(() => {
        tries++;
        modal = findModal();
        if (modal) { clearInterval(iv); res(true); }
        if (tries > 30) { clearInterval(iv); res(false); }
      }, 200);
    });
    if (!ok) { alert('Não foi possível localizar o modal. Abra manualmente e clique "Cola rapidinho".'); return; }
  }

  insertModalInnerPasteButton(modal);

  try {
    const sel = METRICAS_SELECTORS;
    const nomeEl = qs(sel.nome);
    const matEl = qs(sel.matricula);
    const poloEl = qs(sel.polo);
    const linkChatEl = qs(sel.linkChat);
    const inscricaoEl = qs(sel.inscricaoSelect);

    if (nomeEl) { nomeEl.value = data.nome || ''; nomeEl.dispatchEvent(new Event('input',{bubbles:true})); }
    if (matEl) { matEl.value = data.matricula || ''; matEl.dispatchEvent(new Event('input',{bubbles:true})); }
    if (poloEl) { poloEl.value = data.polo || ''; poloEl.dispatchEvent(new Event('input',{bubbles:true})); }

    if (linkChatEl) { linkChatEl.value = data.linkChat || ''; linkChatEl.dispatchEvent(new Event('input',{bubbles:true})); }

    if (inscricaoEl) {
      const escolha = prompt('Tipo de matrícula: 1 = Matrícula Acadêmica Conjunta, 2 = Renovação/Reabertura Conjunta', '');
      if (escolha === '1') { Array.from(inscricaoEl.options||[]).forEach(o=>{ if(/Matr/i.test(o.text)) o.selected = true; }); inscricaoEl.dispatchEvent(new Event('change',{bubbles:true})); }
      else if (escolha === '2') { Array.from(inscricaoEl.options||[]).forEach(o=>{ if(/Renov|Reab/i.test(o.text)) o.selected = true; }); inscricaoEl.dispatchEvent(new Event('change',{bubbles:true})); }
    }

    showToast('Dados colados no formulário');
    try { GM_notification({ title: 'Cola rapidinho', text: 'Dados colados no formulário', timeout: 1200 }); } catch(e){}
    const first = (qs(METRICAS_SELECTORS.nome) || qs(METRICAS_SELECTORS.matricula) || qp('input,textarea,select'));
    if (first) first.focus();
  } catch (e) { console.error('Erro ao colar: ', e); alert('Erro ao colar, veja console.'); }
}

function createMetricsPasteButton() {
  if (document.querySelector('.tm-bridge-paste-btn-fixed')) return null;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'tm-bridge-paste-btn-fixed'; btn.textContent = 'Cola rapidinho';
  btn.addEventListener('click', async () => {
    tryOpenAddModal();
    await pasteIntoModalAndFocus();
  });
  return btn;
}
function insertMetricsPasteButton() {
  if (document.querySelector('.tm-bridge-paste-btn-fixed')) return true;
  const btn = createMetricsPasteButton();
  if (!btn) return false;
  document.body.appendChild(btn);
  return true;
}

(function main(){
  try {
    const host = location.host || '';

    if (host.includes('chatpolos.com.br')) {
      let tries = 0;
      const int = setInterval(()=> {
        tries++;
        try { if (insertCopyButtonAtAnchor()) clearInterval(int); } catch(e){}
        if (tries > 30) clearInterval(int);
      }, 700);
      const mo = new MutationObserver(()=> { if (!document.querySelector('.tm-small-bridge-btn-chat')) insertCopyButtonAtAnchor(); });
      mo.observe(document.body, { childList: true, subtree: true });
    }

    if (host.includes('metricas2025.up.railway.app')) {
      let tries2 = 0;
      const int2 = setInterval(()=> {
        tries2++;
        try { if (insertMetricsPasteButton()) { clearInterval(int2); } } catch(e){}
        if (tries2 > 40) clearInterval(int2);
      }, 600);

      const mo2 = new MutationObserver(()=> {
        if (!document.querySelector('.tm-bridge-paste-btn-fixed')) insertMetricsPasteButton();
        const modal = findModal();
        if (modal) insertModalInnerPasteButton(modal);
      });
      mo2.observe(document.body, { childList: true, subtree: true });
    }
  } catch (e) { console.error('Cola rapidinho erro', e); }
})();
