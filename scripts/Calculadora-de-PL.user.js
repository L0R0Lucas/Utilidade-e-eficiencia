// ==UserScript==
// @name         Calculadora PL
// @namespace    https://github.com/L0R0Lucas/Calculadora-de-PL
// @version      1.0
// @description  Calculadora Parcela Leve para simulador de preços no SalesForce
// @author       L0R0Lucas
// @match        https://yduqs2020.my.site.com/PolosSite/s/simulador-de-preco
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const PARCELA_LEVE = 79;

  const toggleBtn = document.createElement('div');
  toggleBtn.textContent = '⇧';
  toggleBtn.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    background: #222;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    cursor: pointer;
    z-index: 99999;
    font-size: 18px;
    box-shadow: 0 4px 10px rgba(0,0,0,.4);
  `;
  document.body.appendChild(toggleBtn);

  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed;
    bottom: 60px;
    right: 16px;
    width: 270px;
    background: #1c1c1c;
    color: #ffffff;
    padding: 12px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 99999;
    box-shadow: 0 4px 12px rgba(0,0,0,.6);
    display: none;
  `;

  panel.innerHTML = `
    <strong style="font-size:13px">Parcela Leve</strong>

    <div style="margin-top:8px">
      <label>Valor bruto do curso (R$)</label>
      <input id="pl-vb" type="number"
        style="width:100%; background:#2b2b2b; color:#fff; border:1px solid #555; padding:4px; border-radius:4px"/>
    </div>

    <div style="margin-top:6px">
      <label>Duração (anos)</label>
      <input id="pl-anos" type="number" value="4" min="1"
        style="width:100%; background:#2b2b2b; color:#fff; border:1px solid #555; padding:4px; border-radius:4px"/>
    </div>

    <div id="pl-result" style="margin-top:10px; line-height:1.6"></div>

    <div style="display:flex; gap:6px; margin-top:10px; color: #1c1c1c">
      <button id="pl-limpar" style="flex:1; cursor:pointer">Limpar</button>
      <button id="pl-hide" style="flex:1; cursor:pointer">⇩</button>
    </div>
  `;

  document.body.appendChild(panel);

  function calcular(valorBruto, meses, n) {
    const restante = meses - n;
    if (restante <= 0) return '—';
    const total = (valorBruto - PARCELA_LEVE) * n;
    return (total / restante).toFixed(2);
  }

  function atualizar() {
    const vb = Number(document.getElementById('pl-vb').value);
    const anos = Number(document.getElementById('pl-anos').value);

    if (!vb || !anos) {
      document.getElementById('pl-result').innerHTML = '';
      return;
    }

    const meses = anos * 12;

    const p1 = calcular(vb, meses, 1);
    const p2 = calcular(vb, meses, 2);
    const p3 = calcular(vb, meses, 3);

    document.getElementById('pl-result').innerHTML = `
      <div>Parcela Leve 1 → <strong style="color:#7dd3fc">R$ ${p1}</strong></div>
      <div>Parcela Leve 2 → <strong style="color:#86efac">R$ ${p2}</strong></div>
      <div>Parcela Leve 3 → <strong style="color:#fcd34d">R$ ${p3}</strong></div>
    `;
  }

  toggleBtn.addEventListener('click', () => {
    panel.style.display = 'block';
    toggleBtn.style.display = 'none';
  });

  document.getElementById('pl-hide').addEventListener('click', () => {
    panel.style.display = 'none';
    toggleBtn.style.display = 'flex';
  });

  document.getElementById('pl-limpar').addEventListener('click', () => {
    document.getElementById('pl-vb').value = '';
    document.getElementById('pl-result').innerHTML = '';
  });

  document.getElementById('pl-vb').addEventListener('input', atualizar);
  document.getElementById('pl-anos').addEventListener('input', atualizar);

})();