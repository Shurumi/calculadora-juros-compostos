/**
 * FinCalc — Calculadora de Juros Compostos
 * Lógica principal de cálculo e renderização
 * Versão 1.0.0
 */

let grafico = null;
let tabelaData = [];

/** Formata valor como moeda BRL */
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Formata valor como percentual */
function formatarPorcentagem(valor) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

/**
 * Calcula juros compostos com ou sem aportes mensais
 * Fórmula: M = C*(1+i)^n + PMT*[(1+i)^n - 1]/i
 */
function calcularJurosCompostos(capital, taxa, periodos, aporte) {
  const evolucao = [];
  let saldo = capital, totalAportado = 0, totalJuros = 0;

  for (let n = 1; n <= periodos; n++) {
    const jurosPeriodo = saldo * taxa;
    saldo = saldo + jurosPeriodo + aporte;
    totalAportado += aporte;
    totalJuros += jurosPeriodo;
    evolucao.push({ periodo: n, capitalInvestido: capital + totalAportado, jurosPeriodo, jurosAcumulados: totalJuros, montante: saldo });
  }

  const jurosSobreCapital = capital * (Math.pow(1 + taxa, periodos) - 1);
  return {
    montanteFinal: saldo, capitalInicial: capital, totalAportado, totalJuros,
    jurosSobreCapital, jurosSobreAportes: totalJuros - jurosSobreCapital,
    crescimentoPct: ((saldo - capital) / capital) * 100, evolucao
  };
}

function calcular() {
  const capitalInput = parseFloat(document.getElementById('capital').value) || 0;
  const taxaInput    = parseFloat(document.getElementById('taxa').value) || 0;
  const tempoInput   = parseInt(document.getElementById('tempo').value) || 0;
  const aporteInput  = parseFloat(document.getElementById('aporte').value) || 0;
  const periodoTaxa  = document.querySelector('input[name="periodo-taxa"]:checked').value;
  const periodoTempo = document.querySelector('input[name="periodo-tempo"]:checked').value;

  if (capitalInput <= 0) { exibirErro('O capital inicial deve ser maior que zero.'); return; }
  if (taxaInput <= 0)    { exibirErro('A taxa de juros deve ser maior que zero.'); return; }
  if (tempoInput <= 0)   { exibirErro('O período deve ser maior que zero.'); return; }

  const taxaMensal    = periodoTaxa === 'anual' ? Math.pow(1 + taxaInput / 100, 1/12) - 1 : taxaInput / 100;
  const periodosMeses = periodoTempo === 'anos' ? tempoInput * 12 : tempoInput;
  const resultado = calcularJurosCompostos(capitalInput, taxaMensal, periodosMeses, aporteInput);

  atualizarResultados(resultado, capitalInput, taxaInput, periodosMeses, taxaMensal, periodoTaxa, aporteInput);
  renderizarGrafico(resultado.evolucao);
  renderizarTabela(resultado.evolucao);
  atualizarHeroCards(resultado);
}

function atualizarResultados(res, capital, taxaInput, periodos, taxaMensal, tipoTaxa, aporte) {
  document.getElementById('result-montante').textContent = formatarMoeda(res.montanteFinal);
  document.getElementById('result-capital').textContent  = formatarMoeda(res.capitalInicial);
  document.getElementById('result-juros').textContent    = formatarMoeda(res.totalJuros);
  document.getElementById('result-crescimento-pct').textContent = `+${formatarPorcentagem(res.crescimentoPct)} de crescimento`;

  const rowAportes = document.getElementById('row-aportes');
  if (aporte > 0) {
    rowAportes.style.display = 'grid';
    document.getElementById('result-aportes').textContent       = formatarMoeda(res.totalAportado);
    document.getElementById('result-juros-aportes').textContent = formatarMoeda(res.jurosSobreAportes);
  } else { rowAportes.style.display = 'none'; }

  const taxaExibida = tipoTaxa === 'anual' ? `${taxaInput}% a.a. → ${(taxaMensal*100).toFixed(4)}% a.m.` : `${taxaInput}% a.m.`;
  document.getElementById('formula-display').innerHTML = `
    <p class="formula-text">${aporte > 0 ? 'M = C×(1+i)ⁿ + PMT×[(1+i)ⁿ−1]/i' : 'M = C × (1 + i)ⁿ'}</p>
    <div class="formula-legend">
      <span><b>M</b> = ${formatarMoeda(res.montanteFinal)}</span>
      <span><b>C</b> = ${formatarMoeda(capital)}</span>
      <span><b>i</b> = ${taxaExibida}</span>
      <span><b>n</b> = ${periodos} meses</span>
      ${aporte > 0 ? `<span><b>PMT</b> = ${formatarMoeda(aporte)}/mês</span>` : ''}
    </div>`;
}

function renderizarGrafico(evolucao) {
  document.getElementById('chart-section').style.display = 'block';
  const ctx = document.getElementById('grafico').getContext('2d');
  if (grafico) grafico.destroy();
  grafico = new Chart(ctx, {
    type: 'line',
    data: {
      labels: evolucao.map(e => `Mês ${e.periodo}`),
      datasets: [
        { label: 'Montante Total', data: evolucao.map(e => +e.montante.toFixed(2)), borderColor: 'hsl(230,80%,65%)', backgroundColor: 'hsla(230,80%,65%,0.1)', borderWidth: 2.5, pointRadius: evolucao.length > 60 ? 0 : 3, pointHoverRadius: 6, fill: true, tension: 0.4 },
        { label: 'Juros Acumulados', data: evolucao.map(e => +e.jurosAcumulados.toFixed(2)), borderColor: 'hsl(142,70%,50%)', backgroundColor: 'hsla(142,70%,50%,0.08)', borderWidth: 2, pointRadius: evolucao.length > 60 ? 0 : 3, pointHoverRadius: 6, fill: true, tension: 0.4, borderDash: [6,3] },
        { label: 'Capital Investido', data: evolucao.map(e => +e.capitalInvestido.toFixed(2)), borderColor: 'hsl(220,15%,40%)', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, tension: 0.4, borderDash: [4,4] }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: 'hsl(225,20%,13%)', borderColor: 'hsl(225,20%,22%)', borderWidth: 1, titleColor: 'hsl(220,20%,92%)', bodyColor: 'hsl(220,15%,58%)', padding: 12, callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatarMoeda(ctx.raw)}` } }
      },
      scales: {
        x: { ticks: { color: 'hsl(220,15%,40%)', maxTicksLimit: 12, font: { size: 11 } }, grid: { color: 'hsla(225,20%,22%,0.5)', drawBorder: false } },
        y: { ticks: { color: 'hsl(220,15%,40%)', font: { size: 11 }, callback: v => v >= 1e6 ? 'R$ '+(v/1e6).toFixed(1)+'M' : v >= 1e3 ? 'R$ '+(v/1e3).toFixed(0)+'k' : 'R$ '+v }, grid: { color: 'hsla(225,20%,22%,0.5)', drawBorder: false } }
      }
    }
  });
}

function renderizarTabela(evolucao) {
  document.getElementById('table-section').style.display = 'block';
  tabelaData = evolucao;
  const tbody = document.getElementById('tabela-body');
  tbody.innerHTML = '';
  const limite = Math.min(evolucao.length, 120);
  for (let i = 0; i < limite; i++) {
    const e = evolucao[i];
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>Mês ${e.periodo}</td><td>${formatarMoeda(e.capitalInvestido)}</td><td class="green">${formatarMoeda(e.jurosPeriodo)}</td><td class="green">${formatarMoeda(e.jurosAcumulados)}</td><td class="highlight">${formatarMoeda(e.montante)}</td>`;
    tbody.appendChild(tr);
  }
  if (evolucao.length > 120) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="5" style="text-align:center;color:var(--text-dim);padding:16px">... e mais ${evolucao.length-120} períodos (exportar CSV para ver todos)</td>`;
    tbody.appendChild(tr);
  }
}

function atualizarHeroCards(res) {
  document.getElementById('hero-montante').textContent    = formatarMoeda(res.montanteFinal);
  document.getElementById('hero-rendimento').textContent  = formatarMoeda(res.totalJuros);
  document.getElementById('hero-crescimento').textContent = '+' + formatarPorcentagem(res.crescimentoPct);
}

function exportarCSV() {
  if (!tabelaData.length) return;
  const linhas = [['Período','Capital + Aportes','Juros do Período','Juros Acumulados','Montante'].join(';')];
  tabelaData.forEach(e => linhas.push([`Mês ${e.periodo}`,e.capitalInvestido.toFixed(2).replace('.',','),e.jurosPeriodo.toFixed(2).replace('.',','),e.jurosAcumulados.toFixed(2).replace('.',','),e.montante.toFixed(2).replace('.',',')].join(';')));
  const blob = new Blob(['\uFEFF'+linhas.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'juros-compostos.csv'; a.click();
  URL.revokeObjectURL(url);
}

function limpar() {
  ['capital','taxa','tempo','aporte'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('result-montante').textContent = 'R$ 0,00';
  document.getElementById('result-capital').textContent  = 'R$ 0,00';
  document.getElementById('result-juros').textContent    = 'R$ 0,00';
  document.getElementById('result-crescimento-pct').textContent = '+0,00% de crescimento';
  ['chart-section','table-section','row-aportes'].forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById('hero-montante').textContent    = 'R$ 0,00';
  document.getElementById('hero-rendimento').textContent  = 'R$ 0,00';
  document.getElementById('hero-crescimento').textContent = '0,00%';
  document.getElementById('formula-display').innerHTML = `<p class="formula-text">M = C × (1 + i)ⁿ</p><div class="formula-legend"><span><b>M</b> = Montante</span><span><b>C</b> = Capital inicial</span><span><b>i</b> = Taxa de juros</span><span><b>n</b> = Período</span></div>`;
  tabelaData = [];
  if (grafico) { grafico.destroy(); grafico = null; }
}

function exibirErro(msg) { alert('⚠️ ' + msg); }

document.querySelectorAll('input[name="periodo-tempo"]').forEach(r => {
  r.addEventListener('change', () => { document.getElementById('suffix-tempo').textContent = r.value === 'anos' ? 'anos' : 'meses'; });
});
document.querySelectorAll('.form-input').forEach(input => {
  input.addEventListener('keydown', e => { if (e.key === 'Enter') calcular(); });
});
window.addEventListener('DOMContentLoaded', () => { calcular(); });