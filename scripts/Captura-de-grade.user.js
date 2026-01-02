// ==UserScript==
// @name         Captura de Grade Curricular
// @namespace    https://github.com/L0R0Lucas/Utilidade-e-eficiencia
// @version      1.0
// @description  Captura automática dos nomes completos das disciplinas
// @author       L0R0Lucas
// @match        https://estacio.br/cursos/*
// @updateURL    https://raw.githubusercontent.com/L0R0Lucas/Utilidade-e-eficiencia/main/scripts/Captura-de-grade.user.js
// @downloadURL  https://raw.githubusercontent.com/L0R0Lucas/Utilidade-e-eficiencia/main/scripts/Captura-de-grade.user.js
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  'use strict';

  const mapa = new Map();
  let painel;
  let alvoAtual = null;
  let timer = null;

  function criarPainel() {
    if (painel) return;

    painel = document.createElement('div');
    painel.style.cssText = `
      position: fixed;
      top: 90px;
      right: 12px;
      width: 320px;
      max-height: 60vh;
      background: #111;
      color: #fff;
      z-index: 99999;
      padding: 10px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      overflow: auto;
      box-shadow: 0 0 10px #000;
    `;

    painel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong>🖱️ Disciplinas</strong>
        <div>
          <button id="limpar" style="font-size:11px">🧹</button>
          <button id="copiar" style="font-size:11px">📋</button>
        </div>
      </div>
      <p style="margin:6px 0;font-size:11px;opacity:.8">
        Passe o mouse nas disciplinas
      </p>
      <pre id="saida" style="white-space:pre-wrap;margin-top:8px"></pre>
    `;

    document.body.appendChild(painel);

    painel.querySelector('#copiar').onclick = () => {
      GM_setClipboard([...mapa.values()].join('\n'));
      alert('Copiado');
    };

    painel.querySelector('#limpar').onclick = () => {
      mapa.clear();
      painel.querySelector('#saida').innerText = '';
    };
  }

  criarPainel();

  function tooltipVisivel() {
    const tooltips = [...document.querySelectorAll('div[role="tooltip"]')];
    for (let i = tooltips.length - 1; i >= 0; i--) {
      const t = tooltips[i];
      if (t.offsetParent !== null) {
        return t.innerText.trim();
      }
    }
    return null;
  }

  function atualizarPainel() {
    painel.querySelector('#saida').innerText =
      [...mapa.values()].join('\n');
  }

  document.addEventListener('mouseover', e => {
    const titulo = e.target.closest('[data-testid="card-title"]');
    if (!titulo) return;
    if (mapa.has(titulo)) return;

    alvoAtual = titulo;
    clearTimeout(timer);

    const textoVisivel = titulo.innerText.trim();

    timer = setTimeout(() => {
      let ultimaLeitura = null;
      let tentativas = 0;

      const intervalo = setInterval(() => {
        if (alvoAtual !== titulo) {
          clearInterval(intervalo);
          return;
        }

        const tooltip = tooltipVisivel();
        tentativas++;

        if (tooltip && tooltip === ultimaLeitura) {
          salvar(titulo, tooltip);
          clearInterval(intervalo);
          return;
        }

        if (!tooltip && tentativas >= 4) {
          salvar(titulo, textoVisivel);
          clearInterval(intervalo);
          return;
        }

        ultimaLeitura = tooltip;

        if (tentativas > 10) {
          clearInterval(intervalo);
        }
      }, 50);
    }, 120);
  });

  function salvar(titulo, nome) {
    const card = titulo.closest('[data-testid="curriculum-card"]');
    const horas = card?.querySelector('span')?.innerText || '';
    mapa.set(titulo, `${nome} — ${horas}`);
    atualizarPainel();
  }

})();
