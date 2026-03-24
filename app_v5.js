const indexUrl = 'data/index.json';

const methodColors = {
  ppgdpo: '#6ea8fe',
  ppgdpo_zero: '#ffb366',
  pgdpo: '#c084fc',
  predictive_static: '#8dd3c7',
  equal_weight: '#9be15d',
  buy_and_hold: '#ffd166',
  ppgdpo_regime_gated: '#f87171',
};

const methodLabels = {
  ppgdpo: 'PG-DPO (With Hedging)',
  ppgdpo_zero: 'PG-DPO (No Hedging)',
  pgdpo: 'DPO',
  predictive_static: 'Predictive Static',
  equal_weight: 'Equal Weight',
  buy_and_hold: 'Buy and Hold',
  ppgdpo_regime_gated: 'PG-DPO (Regime Gated)',
};

const viewLabels = {
  combined: 'Combined',
  inSample: 'In-sample',
  outOfSample: 'Out-of-sample',
};


const stageModelLabels = {
  const: 'Const',
  dcc: 'DCC',
  adcc: 'ADCC',
  regime_dcc: 'Regime DCC',
  dcc__zero_cross: 'DCC · zero-cross',
  adcc__zero_cross: 'ADCC · zero-cross',
  regime_dcc__gated_cross: 'Regime DCC · gated cross',
  regime_dcc__zero_cross: 'Regime DCC · zero-cross',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function listToSentence(values, maxItems = 8) {
  const items = (values || []).filter(Boolean).map((item) => String(item));
  if (!items.length) return '—';
  const sliced = items.slice(0, maxItems);
  const suffix = items.length > maxItems ? ', …' : '';
  return `${sliced.join(', ')}${suffix}`;
}

function formatStageModelLabel(value) {
  if (!value) return '—';
  if (stageModelLabels[value]) return stageModelLabels[value];
  return String(value)
    .split('__')
    .map((part) => titleCase(part))
    .join(' · ');
}

function universeDisplayLabel(universeMeta) {
  return universeMeta?.label || universeMeta?.shortLabel || state.universeId?.toUpperCase() || '—';
}

function universeShortLabel(universeMeta) {
  return universeMeta?.shortLabel || universeMeta?.label || state.universeId?.toUpperCase() || '—';
}

function candidateSpecInfo(candidate, run) {
  return candidate?.specInfo || run?.metadata?.specInfo || {};
}

function renderUniverseHelp(run) {
  const universeMeta = getUniverseMeta() || {};
  const info = run?.metadata?.universeInfo || universeMeta || {};
  const sampleAssets = info.sampleAssets || run?.metadata?.assetNames || [];
  const description = info.description || universeMeta.description || 'Investable universe description unavailable.';
  const assetLine = info.assetCount ? `${info.assetCount} tradable sleeves in the base bundle.` : '';
  const sampleLine = sampleAssets.length ? `Example sleeves: ${listToSentence(sampleAssets, 6)}.` : '';
  const html = [description, assetLine, sampleLine].filter(Boolean).map((line) => `<div>${escapeHtml(line)}</div>`).join('');
  if (elements.universeHelp) elements.universeHelp.innerHTML = html;
  if (elements.universeSelect) elements.universeSelect.title = [description, assetLine, sampleLine].filter(Boolean).join(' ');
}

function renderCandidateHelp(run) {
  const candidate = getRunMeta() || {};
  const specInfo = candidateSpecInfo(candidate, run);
  const macroColumns = specInfo.macroColumns || run?.metadata?.macroColumns || [];
  const bondColumns = specInfo.bondColumns || run?.metadata?.bondColumns || [];
  const factorColumns = run?.metadata?.factorColumns || [];
  const description = specInfo.description || 'Factor-zoo candidate description unavailable.';
  const candidateLine = `Selected candidate: ${specInfo.shortLabel || run?.spec || candidate.spec || '—'}.`;
  const covarianceLine = `Selected covariance / cross-policy: ${formatStageModelLabel(run?.metadata?.stage2ModelLabel || candidate.stage2ModelLabel || run?.metadata?.covarianceKind)}.`;
  const macroLine = macroColumns.length ? `Macro / curve block: ${listToSentence(macroColumns)}.` : '';
  const factorLine = factorColumns.length ? `Configured latent factors: ${listToSentence(factorColumns)}.` : '';
  const bondLine = bondColumns.length ? `Treasury sleeves in the bundle: ${listToSentence(bondColumns)}.` : '';
  const html = [description, candidateLine, covarianceLine, macroLine, factorLine, bondLine]
    .filter(Boolean)
    .map((line) => `<div>${escapeHtml(line)}</div>`)
    .join('');
  if (elements.candidateHelp) elements.candidateHelp.innerHTML = html;
  if (elements.candidateSelect) elements.candidateSelect.title = [description, candidateLine, covarianceLine, macroLine, factorLine, bondLine].filter(Boolean).join(' ');
}

const state = {
  indexData: null,
  universeId: null,
  runId: null,
  runCache: new Map(),
  selectedMethods: null,
  baselineMethod: null,
  selectedDateIndex: null,
  sampleView: 'combined',
};

const elements = {
  universeSelect: document.getElementById('universeSelect'),
  universeHelp: document.getElementById('universeHelp'),
  candidateSelect: document.getElementById('candidateSelect'),
  candidateHelp: document.getElementById('candidateHelp'),
  sampleViewSelect: document.getElementById('sampleViewSelect'),
  baselineSelect: document.getElementById('baselineSelect'),
  methodCheckboxes: document.getElementById('methodCheckboxes'),
  methodsHedgeBtn: document.getElementById('methodsHedgeBtn'),
  methodsPaper4Btn: document.getElementById('methodsPaper4Btn'),
  methodsAllBtn: document.getElementById('methodsAllBtn'),
  methodsNoneBtn: document.getElementById('methodsNoneBtn'),
  dateSlider: document.getElementById('dateSlider'),
  selectedDateLabel: document.getElementById('selectedDateLabel'),
  runMeta: document.getElementById('runMeta'),
  downloadRunLink: document.getElementById('downloadRunLink'),
  heroUniverseLabel: document.getElementById('heroUniverseLabel'),
  heroRunLabel: document.getElementById('heroRunLabel'),
  heroViewLabel: document.getElementById('heroViewLabel'),
  wealthSubtitle: document.getElementById('wealthSubtitle'),
  spreadTitle: document.getElementById('spreadTitle'),
  spreadSubtitle: document.getElementById('spreadSubtitle'),
  summaryTitle: document.getElementById('summaryTitle'),
  metricCards: document.getElementById('metricCards'),
  summaryTable: document.getElementById('summaryTable'),
  wealthChart: document.getElementById('wealthChart'),
  drawdownChart: document.getElementById('drawdownChart'),
  spreadChart: document.getElementById('spreadChart'),
  hedgingReturnGapChart: document.getElementById('hedgingReturnGapChart'),
  rollingHedgingGainChart: document.getElementById('rollingHedgingGainChart'),
  riskyWeightChart: document.getElementById('riskyWeightChart'),
  turnoverChart: document.getElementById('turnoverChart'),
  weightsChart: document.getElementById('weightsChart'),
  weightsSubtitle: document.getElementById('weightsSubtitle'),
};

function formatPercent(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
}

function formatNumber(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Number(value).toFixed(digits);
}

function classForSigned(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return '';
}

function titleCase(value) {
  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

function methodDisplayName(method) {
  return methodLabels[method] || titleCase(method);
}

function getViewLabel(view = state.sampleView) {
  return viewLabels[view] || titleCase(view);
}

function getUniverseMeta() {
  return state.indexData.universes.find((u) => u.id === state.universeId);
}

function getRunMeta() {
  const universe = getUniverseMeta();
  return universe?.candidates.find((c) => c.runId === state.runId) || null;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

async function loadRun(runId) {
  if (state.runCache.has(runId)) return state.runCache.get(runId);
  const run = await fetchJson(`data/runs/${runId}.json`);
  run.__combinedCache = {};
  run.__derivedCache = {};
  state.runCache.set(runId, run);
  return run;
}

function candidateLabel(candidate) {
  const specLabel = candidate?.specInfo?.shortLabel || candidate?.spec || candidate?.label || `Rank ${candidate?.rank ?? '—'}`;
  const modelLabel = formatStageModelLabel(candidate?.stage2ModelLabel || candidate?.covarianceKind);
  return `Rank ${candidate.rank} · ${specLabel} · ${modelLabel}`;
}

function defaultMethodSelection(run) {
  const preferred = ['ppgdpo', 'ppgdpo_zero'];
  const chosen = preferred.filter((method) => run.methods.includes(method));
  return chosen.length > 0 ? chosen : run.methods.slice(0, 2);
}

function paper4MethodSelection(run) {
  const preferred = ['ppgdpo', 'ppgdpo_zero', 'equal_weight', 'buy_and_hold'];
  const chosen = preferred.filter((method) => run.methods.includes(method));
  return chosen.length > 0 ? chosen : defaultMethodSelection(run);
}

function ensureSelectedMethods(run) {
  if (state.selectedMethods === null) {
    state.selectedMethods = defaultMethodSelection(run);
    return;
  }
  const available = new Set(run.methods);
  state.selectedMethods = state.selectedMethods.filter((method) => available.has(method));
}

function ensureBaseline(run) {
  if (!run.methods.includes(state.baselineMethod)) {
    state.baselineMethod = run.methods.includes('ppgdpo_zero')
      ? 'ppgdpo_zero'
      : run.methods.includes('equal_weight')
        ? 'equal_weight'
        : run.methods[0];
  }
}

function getPeriods(run) {
  return run.periods || {};
}

function getActivePeriod(run) {
  const periods = getPeriods(run);
  return periods[state.sampleView] || null;
}

function combineSegmentsCached(run, method) {
  if (run.__combinedCache?.[method]) return run.__combinedCache[method];
  const parts = run.seriesByMethod?.[method] || {};
  const inSeg = parts.inSample || {};
  const outSeg = parts.outOfSample || {};
  const combined = {
    dates: [...(inSeg.dates || []), ...(outSeg.dates || [])],
    decisionDates: [...(inSeg.decisionDates || []), ...(outSeg.decisionDates || [])],
    netReturns: [...(inSeg.netReturns || []), ...(outSeg.netReturns || [])],
    grossReturns: [...(inSeg.grossReturns || []), ...(outSeg.grossReturns || [])],
    turnover: [...(inSeg.turnover || []), ...(outSeg.turnover || [])],
    riskyWeight: [...(inSeg.riskyWeight || []), ...(outSeg.riskyWeight || [])],
    hedgeSignalL2: [...(inSeg.hedgeSignalL2 || []), ...(outSeg.hedgeSignalL2 || [])],
    costateJxyL2: [...(inSeg.costateJxyL2 || []), ...(outSeg.costateJxyL2 || [])],
    topWeights: [...(inSeg.topWeights || []), ...(outSeg.topWeights || [])],
  };

  let wealth = 1.0;
  let peak = 1.0;
  combined.wealth = [];
  combined.drawdown = [];
  for (const ret of combined.netReturns) {
    wealth *= 1 + Number(ret || 0);
    peak = Math.max(peak, wealth);
    combined.wealth.push(Number(wealth.toFixed(8)));
    combined.drawdown.push(Number((wealth / peak - 1).toFixed(8)));
  }

  run.__combinedCache = run.__combinedCache || {};
  run.__combinedCache[method] = combined;
  return combined;
}

function normalizeSegmentCached(run, method, view) {
  run.__segmentCache = run.__segmentCache || {};
  const key = `${method}::${view}`;
  if (run.__segmentCache[key]) return run.__segmentCache[key];
  const raw = run.seriesByMethod?.[method]?.[view];
  if (!raw) return null;

  const normalized = {
    ...raw,
    dates: [...(raw.dates || [])],
    decisionDates: [...(raw.decisionDates || [])],
    netReturns: [...(raw.netReturns || [])],
    grossReturns: [...(raw.grossReturns || [])],
    turnover: [...(raw.turnover || [])],
    riskyWeight: [...(raw.riskyWeight || [])],
    hedgeSignalL2: [...(raw.hedgeSignalL2 || [])],
    costateJxyL2: [...(raw.costateJxyL2 || [])],
    topWeights: [...(raw.topWeights || [])],
  };

  let wealth = 1.0;
  let peak = 1.0;
  normalized.wealth = [];
  normalized.drawdown = [];
  for (const ret of normalized.netReturns) {
    wealth *= 1 + Number(ret || 0);
    peak = Math.max(peak, wealth);
    normalized.wealth.push(Number(wealth.toFixed(8)));
    normalized.drawdown.push(Number((wealth / peak - 1).toFixed(8)));
  }

  run.__segmentCache[key] = normalized;
  return normalized;
}

function getSeriesForView(run, method, view = state.sampleView) {
  const methodSeries = run.seriesByMethod?.[method];
  if (!methodSeries) return null;
  if (view === 'combined') return combineSegmentsCached(run, method);
  return normalizeSegmentCached(run, method, view);
}

function getSummaryMap(run) {
  if (run.summaryByView) return run.summaryByView[state.sampleView] || {};
  return run.summaryByMethod || {};
}

function getHeadline(run) {
  if (run.headlineByView) return run.headlineByView[state.sampleView] || {};
  return run.headline || {};
}

function getAnchorMethod(run) {
  return state.selectedMethods?.find((method) => {
    const series = getSeriesForView(run, method);
    return series?.dates?.length;
  }) || (run.methods.includes('ppgdpo') ? 'ppgdpo' : run.methods[0]);
}

function getDefaultDateIndex(run) {
  const anchorMethod = getAnchorMethod(run);
  const series = getSeriesForView(run, anchorMethod);
  const length = series?.dates?.length || 0;
  return Math.max(0, length - 1);
}

function setDateIndex(run, idx) {
  const anchorMethod = getAnchorMethod(run);
  const series = getSeriesForView(run, anchorMethod);
  const length = series?.dates?.length || 0;
  const safeIndex = Math.max(0, Math.min(idx, Math.max(0, length - 1)));
  state.selectedDateIndex = safeIndex;
  elements.dateSlider.min = '0';
  elements.dateSlider.max = String(Math.max(0, length - 1));
  elements.dateSlider.value = String(safeIndex);
  const date = series?.dates?.[safeIndex] || '—';
  const activePeriod = getActivePeriod(run);
  const suffix = activePeriod?.label ? ` · ${activePeriod.label}` : '';
  elements.selectedDateLabel.textContent = `${date}${suffix}`;
}

function getSelectedDate(run) {
  const anchorMethod = getAnchorMethod(run);
  const series = getSeriesForView(run, anchorMethod);
  return series?.dates?.[state.selectedDateIndex ?? 0] || null;
}

function updateUniverseControls() {
  elements.universeSelect.innerHTML = state.indexData.universes
    .map((u) => `<option value="${u.id}">${u.label}</option>`)
    .join('');
  elements.universeSelect.value = state.universeId;
}

function updateCandidateControls() {
  const universe = getUniverseMeta();
  elements.candidateSelect.innerHTML = universe.candidates
    .map((candidate) => `<option value="${candidate.runId}">${candidateLabel(candidate)}</option>`)
    .join('');
  elements.candidateSelect.value = state.runId;
}

function updateSampleViewControls() {
  elements.sampleViewSelect.value = state.sampleView;
}

function updateBaselineControls(run) {
  elements.baselineSelect.innerHTML = run.methods
    .map((method) => `<option value="${method}">${methodDisplayName(method)}</option>`)
    .join('');
  elements.baselineSelect.value = state.baselineMethod;
}

function updateMethodControls(run) {
  elements.methodCheckboxes.innerHTML = run.methods
    .map((method) => {
      const checked = state.selectedMethods?.includes(method) ? 'checked' : '';
      return `
        <label class="checkbox-item">
          <input type="checkbox" data-method="${method}" ${checked} />
          <span>${methodDisplayName(method)}</span>
        </label>
      `;
    })
    .join('');

  elements.methodCheckboxes.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.addEventListener('change', () => {
      const method = input.dataset.method;
      const methods = Array.isArray(state.selectedMethods) ? [...state.selectedMethods] : [];
      if (input.checked) {
        state.selectedMethods = [...new Set([...methods, method])];
      } else {
        state.selectedMethods = methods.filter((m) => m !== method);
      }
      renderCurrentRun();
    });
  });
}

function formatPeriod(period) {
  if (!period) return '';
  if (period.start && period.end) return `${period.start} → ${period.end}`;
  return period.label || '';
}

function renderRunMeta(run) {
  const meta = run.metadata;
  const activePeriod = getActivePeriod(run);
  const universeMeta = getUniverseMeta() || {};
  elements.runMeta.innerHTML = [
    universeShortLabel(universeMeta),
    candidateSpecInfo(getRunMeta(), run).shortLabel || run.spec,
    formatStageModelLabel(meta.stage2ModelLabel || meta.covarianceKind),
    getViewLabel(),
    formatPeriod(activePeriod),
    `${meta.rollingTrainMonths}m train`,
  ]
    .filter(Boolean)
    .map((item) => `<span class="pill">${item}</span>`)
    .join('');

  elements.downloadRunLink.href = `data/runs/${run.runId}.json`;
  elements.heroUniverseLabel.textContent = universeShortLabel(universeMeta);
  elements.heroRunLabel.textContent = candidateLabel(getRunMeta() || { label: run.label });
  elements.heroViewLabel.textContent = `${getViewLabel()} · ${formatPeriod(activePeriod)}`;
  const combinedPeriod = getPeriods(run).combined || {};
  if (state.sampleView === 'combined' && combinedPeriod.oosStart) {
    elements.wealthSubtitle.textContent = `Net-return wealth paths. Dotted line marks OOS start (${combinedPeriod.oosStart}). Solid line marks the selected portfolio date.`;
  } else {
    elements.wealthSubtitle.textContent = `Net-return wealth paths for the ${getViewLabel().toLowerCase()} window. Solid line marks the selected portfolio date.`;
  }

  if (state.baselineMethod === 'ppgdpo_zero') {
    elements.spreadTitle.textContent = 'Cumulative hedging gain';
    elements.spreadSubtitle.textContent = 'Selected method wealth relative to PG-DPO (No Hedging).';
  } else {
    elements.spreadTitle.textContent = `Cumulative gap vs ${methodDisplayName(state.baselineMethod)}`;
    elements.spreadSubtitle.textContent = `Selected method wealth relative to ${methodDisplayName(state.baselineMethod)}.`;
  }

  elements.summaryTitle.textContent = `Summary · ${getViewLabel()}`;
  renderUniverseHelp(run);
  renderCandidateHelp(run);
}

function getHedgingPair(run) {
  if (run.__derivedCache?.[state.sampleView]?.hedgingPair) {
    return run.__derivedCache[state.sampleView].hedgingPair;
  }
  const withHedging = getSeriesForView(run, 'ppgdpo');
  const noHedging = getSeriesForView(run, 'ppgdpo_zero');
  if (!withHedging || !noHedging) return null;

  const length = Math.min(withHedging.dates.length, noHedging.dates.length);
  const dates = withHedging.dates.slice(0, length);
  const monthlyReturnGap = [];
  const wealthGap = [];
  const rolling12mGain = [];

  for (let idx = 0; idx < length; idx += 1) {
    const withRet = Number(withHedging.netReturns[idx] || 0);
    const noRet = Number(noHedging.netReturns[idx] || 0);
    monthlyReturnGap.push(withRet - noRet);

    const withWealth = Number(withHedging.wealth[idx] || 0);
    const noWealth = Number(noHedging.wealth[idx] || 0);
    wealthGap.push(noWealth === 0 ? null : withWealth / noWealth - 1);

    if (idx < 11) {
      rolling12mGain.push(null);
    } else {
      let withProd = 1.0;
      let noProd = 1.0;
      for (let j = idx - 11; j <= idx; j += 1) {
        withProd *= 1 + Number(withHedging.netReturns[j] || 0);
        noProd *= 1 + Number(noHedging.netReturns[j] || 0);
      }
      rolling12mGain.push(noProd === 0 ? null : withProd / noProd - 1);
    }
  }

  run.__derivedCache = run.__derivedCache || {};
  run.__derivedCache[state.sampleView] = run.__derivedCache[state.sampleView] || {};
  run.__derivedCache[state.sampleView].hedgingPair = {
    dates,
    monthlyReturnGap,
    wealthGap,
    rolling12mGain,
  };
  return run.__derivedCache[state.sampleView].hedgingPair;
}

function renderMetricCards(run) {
  const headline = getHeadline(run);
  const summaryMap = getSummaryMap(run);
  const hedgingPair = getHedgingPair(run);
  const finalWealthGain = hedgingPair?.wealthGap?.length ? hedgingPair.wealthGap[hedgingPair.wealthGap.length - 1] : null;
  const maxDdGain = (() => {
    const withHedging = summaryMap.ppgdpo?.maxDrawdown;
    const noHedging = summaryMap.ppgdpo_zero?.maxDrawdown;
    if (withHedging === undefined || noHedging === undefined || withHedging === null || noHedging === null) return null;
    return withHedging - noHedging;
  })();

  const cards = [
    {
      label: 'Δ CE vs No Hedging',
      value: headline.deltaCerPpgdpoVsZero,
      formatter: (v) => formatPercent(v),
    },
    {
      label: 'Δ Sharpe vs No Hedging',
      value: headline.deltaSharpePpgdpoVsZero,
      formatter: (v) => formatNumber(v),
    },
    {
      label: 'Δ Ann. Return vs No Hedging',
      value: headline.deltaAnnRetPpgdpoVsZero,
      formatter: (v) => formatPercent(v),
    },
    {
      label: 'Final Wealth Gain vs No Hedging',
      value: finalWealthGain,
      formatter: (v) => formatPercent(v),
      subvalue: maxDdGain === null ? getViewLabel() : `Δ Max DD ${formatPercent(maxDdGain)}`,
    },
  ];

  elements.metricCards.innerHTML = cards
    .map((card) => {
      const valueClass = classForSigned(card.value);
      return `
        <div class="metric-card">
          <div class="metric-label">${card.label}</div>
          <div class="metric-value ${valueClass}">${card.formatter(card.value)}</div>
          <div class="metric-subvalue">${card.subvalue || getViewLabel()}</div>
        </div>
      `;
    })
    .join('');
}

function buildPlotlyConfig() {
  return {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };
}

function emptyPlot(div, message) {
  Plotly.react(
    div,
    [],
    {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#f4f7fb' },
      xaxis: { visible: false },
      yaxis: { visible: false },
      annotations: [
        {
          text: message,
          x: 0.5,
          y: 0.5,
          xref: 'paper',
          yref: 'paper',
          showarrow: false,
          font: { color: '#aeb8cf', size: 14 },
        },
      ],
      margin: { l: 30, r: 20, t: 30, b: 30 },
      hoverlabel: {
        bgcolor: '#11182c',
        bordercolor: '#44547a',
        font: { color: '#f4f7fb', size: 13, family: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
      },
    },
    buildPlotlyConfig(),
  );
}

function getBoundaryDecorations(run) {
  const period = getPeriods(run).combined || {};
  const shapes = [];
  const annotations = [];

  if (state.sampleView === 'combined' && period.oosStart) {
    shapes.push({
      type: 'line',
      x0: period.oosStart,
      x1: period.oosStart,
      xref: 'x',
      y0: 0,
      y1: 1,
      yref: 'paper',
      line: {
        color: 'rgba(255,255,255,0.45)',
        dash: 'dot',
        width: 1.5,
      },
    });
    annotations.push({
      text: 'OOS start',
      x: period.oosStart,
      xref: 'x',
      y: 1.04,
      yref: 'paper',
      showarrow: false,
      font: { color: '#aeb8cf', size: 11 },
    });
  }

  const selectedDate = getSelectedDate(run);
  if (selectedDate) {
    shapes.push({
      type: 'line',
      x0: selectedDate,
      x1: selectedDate,
      xref: 'x',
      y0: 0,
      y1: 1,
      yref: 'paper',
      line: {
        color: 'rgba(110,168,254,0.9)',
        dash: 'solid',
        width: 1.3,
      },
    });
  }

  return { shapes, annotations };
}

function commonLayout(run, title = '') {
  const boundary = getBoundaryDecorations(run);
  return {
    title: title ? { text: title, font: { size: 14 } } : undefined,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#f4f7fb' },
    hovermode: 'x unified',
    margin: { l: 56, r: 24, t: 32, b: 48 },
    xaxis: {
      gridcolor: 'rgba(255,255,255,0.08)',
      zerolinecolor: 'rgba(255,255,255,0.08)',
    },
    yaxis: {
      gridcolor: 'rgba(255,255,255,0.08)',
      zerolinecolor: 'rgba(255,255,255,0.08)',
    },
    legend: {
      orientation: 'h',
      y: 1.14,
      x: 0,
    },
    hoverlabel: {
      bgcolor: '#11182c',
      bordercolor: '#44547a',
      font: { color: '#f4f7fb', size: 13, family: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    },
    shapes: boundary.shapes,
    annotations: boundary.annotations,
  };
}

function buildLineTraces(run, valueKey, selectedMethods) {
  return selectedMethods
    .map((method) => {
      const series = getSeriesForView(run, method);
      if (!series?.dates?.length) return null;
      return {
        type: 'scatter',
        mode: 'lines',
        name: methodDisplayName(method),
        x: series.dates,
        y: series[valueKey],
        line: { color: methodColors[method] || undefined, width: 2.25 },
      };
    })
    .filter(Boolean);
}

function bindDateClick(div, run) {
  if (div.removeAllListeners) {
    div.removeAllListeners('plotly_click');
  }
  div.on('plotly_click', (event) => {
    const point = event?.points?.[0];
    if (!point) return;
    setDateIndex(run, point.pointIndex);
    renderAllCharts(run);
  });
}

function renderWealthChart(run) {
  if (!state.selectedMethods || state.selectedMethods.length === 0) {
    emptyPlot(elements.wealthChart, 'Select at least one method.');
    return;
  }
  const traces = state.selectedMethods
    .map((method) => {
      const series = getSeriesForView(run, method);
      if (!series?.dates?.length) return null;
      return {
        type: 'scatter',
        mode: 'lines',
        name: methodDisplayName(method),
        x: series.dates,
        y: series.wealth,
        line: { color: methodColors[method] || undefined, width: 2.5 },
        customdata: series.netReturns.map((ret, idx) => [ret, series.turnover[idx], series.riskyWeight[idx]]),
        hovertemplate:
          '<b>%{fullData.name}</b><br>Date=%{x}<br>Wealth=%{y:.3f}<br>Net return=%{customdata[0]:.2%}<br>Turnover=%{customdata[1]:.2%}<br>Risky weight=%{customdata[2]:.2%}<extra></extra>',
      };
    })
    .filter(Boolean);
  const baseLayout = commonLayout(run);
  const layout = {
    ...baseLayout,
    yaxis: { ...baseLayout.yaxis, tickformat: '.2f' },
  };
  Plotly.react(elements.wealthChart, traces, layout, buildPlotlyConfig());
  bindDateClick(elements.wealthChart, run);
}

function renderDrawdownChart(run) {
  if (!state.selectedMethods || state.selectedMethods.length === 0) {
    emptyPlot(elements.drawdownChart, 'Select at least one method.');
    return;
  }
  const traces = buildLineTraces(run, 'drawdown', state.selectedMethods);
  const baseLayout = commonLayout(run);
  const layout = {
    ...baseLayout,
    yaxis: { ...baseLayout.yaxis, tickformat: '.0%' },
  };
  Plotly.react(elements.drawdownChart, traces, layout, buildPlotlyConfig());
  bindDateClick(elements.drawdownChart, run);
}

function renderSpreadChart(run) {
  const baseline = getSeriesForView(run, state.baselineMethod);
  if (!baseline) {
    emptyPlot(elements.spreadChart, 'Choose a valid baseline.');
    return;
  }

  let methods = (state.selectedMethods || []).filter((method) => method !== state.baselineMethod);

  if (state.baselineMethod === 'ppgdpo_zero') {
    methods = methods.filter((method) => method === 'ppgdpo');
    if (methods.length === 0) {
      emptyPlot(elements.spreadChart, 'Cumulative hedging gain is only shown for PG-DPO (With Hedging) relative to PG-DPO (No Hedging).');
      return;
    }
  }

  if (methods.length === 0) {
    emptyPlot(elements.spreadChart, 'Select at least one method besides the baseline.');
    return;
  }

  const traces = methods
    .map((method) => {
      const series = getSeriesForView(run, method);
      if (!series?.dates?.length) return null;
      return {
        type: 'scatter',
        mode: 'lines',
        name: `${methodDisplayName(method)} vs ${methodDisplayName(state.baselineMethod)}`,
        x: series.dates,
        y: series.wealth.map((value, idx) => value / baseline.wealth[idx] - 1),
        line: { color: methodColors[method] || undefined, width: 2.25 },
        hovertemplate: '<b>%{fullData.name}</b><br>Date=%{x}<br>Relative gap=%{y:.2%}<extra></extra>',
      };
    })
    .filter(Boolean);

  if (!traces.length) {
    emptyPlot(elements.spreadChart, 'No valid hedging-gain trace is available for the current selection.');
    return;
  }

  const baseLayout = commonLayout(run);
  const layout = {
    ...baseLayout,
    yaxis: { ...baseLayout.yaxis, tickformat: '.0%' },
  };
  Plotly.react(elements.spreadChart, traces, layout, buildPlotlyConfig());
  bindDateClick(elements.spreadChart, run);
}

function renderHedgingReturnGapChart(run) {
  const hedgingPair = getHedgingPair(run);
  if (!hedgingPair) {
    emptyPlot(elements.hedgingReturnGapChart, 'PG-DPO hedging pair not available for this run.');
    return;
  }
  const traces = [
    {
      type: 'scatter',
      mode: 'lines',
      name: 'PG-DPO Hedging Return Gap',
      x: hedgingPair.dates,
      y: hedgingPair.monthlyReturnGap,
      line: { color: methodColors.ppgdpo || undefined, width: 2.25 },
      hovertemplate: '<b>PG-DPO Hedging Return Gap</b><br>Date=%{x}<br>Return gap=%{y:.2%}<extra></extra>',
    },
  ];
  const baseLayout = commonLayout(run);
  const layout = {
    ...baseLayout,
    yaxis: { ...baseLayout.yaxis, tickformat: '.0%' },
  };
  Plotly.react(elements.hedgingReturnGapChart, traces, layout, buildPlotlyConfig());
  bindDateClick(elements.hedgingReturnGapChart, run);
}

function renderRollingHedgingGainChart(run) {
  const hedgingPair = getHedgingPair(run);
  if (!hedgingPair) {
    emptyPlot(elements.rollingHedgingGainChart, 'PG-DPO hedging pair not available for this run.');
    return;
  }
  const traces = [
    {
      type: 'scatter',
      mode: 'lines',
      name: 'Trailing 12m Hedging Gain',
      x: hedgingPair.dates,
      y: hedgingPair.rolling12mGain,
      line: { color: methodColors.ppgdpo_zero || undefined, width: 2.25 },
      hovertemplate: '<b>Trailing 12m Hedging Gain</b><br>Date=%{x}<br>Gain=%{y:.2%}<extra></extra>',
    },
  ];
  const baseLayout = commonLayout(run);
  const layout = {
    ...baseLayout,
    yaxis: { ...baseLayout.yaxis, tickformat: '.0%' },
  };
  Plotly.react(elements.rollingHedgingGainChart, traces, layout, buildPlotlyConfig());
  bindDateClick(elements.rollingHedgingGainChart, run);
}

function renderRiskyWeightChart(run) {
  if (!state.selectedMethods || state.selectedMethods.length === 0) {
    emptyPlot(elements.riskyWeightChart, 'Select at least one method.');
    return;
  }
  const traces = buildLineTraces(run, 'riskyWeight', state.selectedMethods);
  const baseLayout = commonLayout(run);
  const layout = {
    ...baseLayout,
    yaxis: { ...baseLayout.yaxis, tickformat: '.0%' },
  };
  Plotly.react(elements.riskyWeightChart, traces, layout, buildPlotlyConfig());
  bindDateClick(elements.riskyWeightChart, run);
}

function renderTurnoverChart(run) {
  if (!state.selectedMethods || state.selectedMethods.length === 0) {
    emptyPlot(elements.turnoverChart, 'Select at least one method.');
    return;
  }
  const traces = buildLineTraces(run, 'turnover', state.selectedMethods);
  const baseLayout = commonLayout(run);
  const layout = {
    ...baseLayout,
    yaxis: { ...baseLayout.yaxis, tickformat: '.0%' },
  };
  Plotly.react(elements.turnoverChart, traces, layout, buildPlotlyConfig());
  bindDateClick(elements.turnoverChart, run);
}

function getWeightPairsAtIndex(run, method, index) {
  const series = getSeriesForView(run, method);
  const raw = series?.fullWeights?.[index] ?? series?.weights?.[index] ?? series?.topWeights?.[index] ?? [];
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    if (Array.isArray(raw[0])) {
      return raw.map(([asset, weight]) => [asset, Number(weight || 0)]);
    }
    if (typeof raw[0] === 'object' && raw[0] !== null) {
      return raw.map((row) => [row.asset ?? row.name ?? row.label, Number(row.weight ?? row.value ?? 0)]).filter((row) => row[0]);
    }
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([asset, weight]) => [asset, Number(weight || 0)]);
  }
  return [];
}

function hasNearlyFullWeights(run, pairMaps) {
  const assetNames = run?.metadata?.assetNames || [];
  if (!assetNames.length) return false;
  const threshold = Math.max(12, Math.floor(assetNames.length * 0.8));
  return [...pairMaps.values()].some((pairMap) => pairMap.size >= threshold);
}

function updateWeightsSubtitle(run, assetCount, totalCount, usingFullCoverage) {
  if (!elements.weightsSubtitle) return;
  const date = getSelectedDate(run) || 'selected date';
  if (usingFullCoverage) {
    elements.weightsSubtitle.textContent = `${assetCount} assets shown for ${date}. Hover to inspect exact portfolio weights.`;
    return;
  }
  elements.weightsSubtitle.textContent = `Showing ${assetCount} saved weights for ${date}. Current deployed JSON keeps the top weights only; regenerate site data to inspect all ${totalCount || assetCount} assets.`;
}

function renderWeightsChart(run) {
  if (!state.selectedMethods || state.selectedMethods.length === 0) {
    emptyPlot(elements.weightsChart, 'Select at least one method.');
    return;
  }

  const index = state.selectedDateIndex ?? 0;
  const pairMaps = new Map();
  const assetScores = new Map();

  for (const method of state.selectedMethods) {
    const pairs = getWeightPairsAtIndex(run, method, index);
    const pairMap = new Map(pairs);
    pairMaps.set(method, pairMap);
    for (const [asset, weight] of pairs) {
      const current = assetScores.get(asset) || 0;
      assetScores.set(asset, Math.max(current, Math.abs(weight)));
    }
  }

  const totalAssetNames = run?.metadata?.assetNames || [];
  const usingFullCoverage = hasNearlyFullWeights(run, pairMaps);
  let assets = [];

  if (usingFullCoverage) {
    assets = [...new Set([...totalAssetNames, ...assetScores.keys()])]
      .filter((asset) => assetScores.has(asset))
      .sort((a, b) => (assetScores.get(b) || 0) - (assetScores.get(a) || 0));
  } else {
    assets = [...assetScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([asset]) => asset);
  }

  if (assets.length === 0) {
    emptyPlot(elements.weightsChart, 'No weights available for this selection.');
    updateWeightsSubtitle(run, 0, totalAssetNames.length, false);
    return;
  }

  const displayAssets = assets.slice().reverse();
  updateWeightsSubtitle(run, assets.length, totalAssetNames.length, usingFullCoverage);

  const traces = state.selectedMethods.map((method) => {
    const pairMap = pairMaps.get(method) || new Map();
    return {
      type: 'bar',
      orientation: 'h',
      name: methodDisplayName(method),
      y: displayAssets,
      x: displayAssets.map((asset) => (pairMap.has(asset) ? pairMap.get(asset) : null)),
      marker: { color: methodColors[method] || undefined },
      hovertemplate: '<b>%{fullData.name}</b><br>Asset=%{y}<br>Weight=%{x:.2%}<extra></extra>',
    };
  });

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#f4f7fb' },
    hovermode: 'closest',
    hoverlabel: {
      bgcolor: '#11182c',
      bordercolor: '#44547a',
      font: { color: '#f4f7fb', size: 14, family: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    },
    margin: { l: 110, r: 28, t: 28, b: 56 },
    barmode: 'group',
    height: Math.max(420, displayAssets.length * 24 + 140),
    xaxis: {
      gridcolor: 'rgba(255,255,255,0.08)',
      zerolinecolor: 'rgba(255,255,255,0.08)',
      tickformat: '.2%',
      automargin: true,
    },
    yaxis: {
      automargin: true,
      gridcolor: 'rgba(255,255,255,0.04)',
      tickfont: { size: 11 },
    },
    legend: {
      orientation: 'h',
      y: 1.08,
      x: 0,
    },
    shapes: [],
    annotations: [],
  };
  Plotly.react(elements.weightsChart, traces, layout, buildPlotlyConfig());
}

function renderSummaryTable(run) {
  if (!state.selectedMethods || state.selectedMethods.length === 0) {
    elements.summaryTable.innerHTML = '<div class="empty-state">Select at least one method.</div>';
    return;
  }

  const summaryMap = getSummaryMap(run);
  const rows = state.selectedMethods
    .map((method) => {
      const summary = summaryMap[method];
      if (!summary) return '';
      return `
        <tr>
          <td>${methodDisplayName(method)}</td>
          <td>${formatPercent(summary.annRet)}</td>
          <td>${formatPercent(summary.annVol)}</td>
          <td>${formatNumber(summary.sharpe)}</td>
          <td>${formatPercent(summary.cerAnn)}</td>
          <td>${formatPercent(summary.avgTurnover)}</td>
          <td>${formatPercent(summary.avgRiskyWeight)}</td>
          <td>${formatPercent(summary.maxDrawdown)}</td>
        </tr>
      `;
    })
    .join('');

  elements.summaryTable.innerHTML = `
    <table class="summary-table">
      <thead>
        <tr>
          <th>Method</th>
          <th>Ann. Return</th>
          <th>Ann. Vol</th>
          <th>Sharpe</th>
          <th>CE</th>
          <th>Avg. Turnover</th>
          <th>Avg. Risky Weight</th>
          <th>Max DD</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderAllCharts(run) {
  renderWealthChart(run);
  renderDrawdownChart(run);
  renderSpreadChart(run);
  renderHedgingReturnGapChart(run);
  renderRollingHedgingGainChart(run);
  renderRiskyWeightChart(run);
  renderTurnoverChart(run);
  renderWeightsChart(run);
}

async function renderCurrentRun() {
  const run = await loadRun(state.runId);
  ensureSelectedMethods(run);
  ensureBaseline(run);
  const dateIndex = state.selectedDateIndex === null ? getDefaultDateIndex(run) : state.selectedDateIndex;
  setDateIndex(run, dateIndex);
  updateSampleViewControls();
  updateBaselineControls(run);
  updateMethodControls(run);
  renderRunMeta(run);
  renderMetricCards(run);
  renderAllCharts(run);
  renderSummaryTable(run);
}

async function onUniverseChange() {
  state.universeId = elements.universeSelect.value;
  const universe = getUniverseMeta();
  state.runId = universe.candidates[0]?.runId || null;
  state.selectedMethods = null;
  state.baselineMethod = null;
  state.selectedDateIndex = null;
  updateCandidateControls();
  await renderCurrentRun();
}

async function onCandidateChange() {
  state.runId = elements.candidateSelect.value;
  state.selectedMethods = null;
  state.baselineMethod = null;
  state.selectedDateIndex = null;
  await renderCurrentRun();
}

async function init() {
  state.indexData = await fetchJson(indexUrl);
  state.universeId = state.indexData.defaultUniverse;
  state.runId = state.indexData.defaultRunId;
  state.sampleView = state.indexData.defaultSampleView || 'combined';
  updateUniverseControls();
  updateCandidateControls();
  updateSampleViewControls();

  elements.universeSelect.addEventListener('change', onUniverseChange);
  elements.candidateSelect.addEventListener('change', onCandidateChange);
  elements.sampleViewSelect.addEventListener('change', async () => {
    state.sampleView = elements.sampleViewSelect.value;
    state.selectedDateIndex = null;
    await renderCurrentRun();
  });
  elements.baselineSelect.addEventListener('change', async () => {
    state.baselineMethod = elements.baselineSelect.value;
    await renderCurrentRun();
  });
  elements.dateSlider.addEventListener('input', async () => {
    const run = await loadRun(state.runId);
    setDateIndex(run, Number(elements.dateSlider.value));
    renderAllCharts(run);
  });
  elements.methodsHedgeBtn.addEventListener('click', async () => {
    const run = await loadRun(state.runId);
    state.selectedMethods = defaultMethodSelection(run);
    await renderCurrentRun();
  });
  elements.methodsPaper4Btn.addEventListener('click', async () => {
    const run = await loadRun(state.runId);
    state.selectedMethods = paper4MethodSelection(run);
    await renderCurrentRun();
  });
  elements.methodsAllBtn.addEventListener('click', async () => {
    const run = await loadRun(state.runId);
    state.selectedMethods = [...run.methods];
    await renderCurrentRun();
  });
  elements.methodsNoneBtn.addEventListener('click', async () => {
    state.selectedMethods = [];
    await renderCurrentRun();
  });

  await renderCurrentRun();
}

init().catch((error) => {
  console.error(error);
  const message = `<div class="empty-state">Failed to initialize explorer.<br /><br />${error.message}</div>`;
  elements.summaryTable.innerHTML = message;
  [
    elements.wealthChart,
    elements.drawdownChart,
    elements.spreadChart,
    elements.hedgingReturnGapChart,
    elements.rollingHedgingGainChart,
    elements.riskyWeightChart,
    elements.turnoverChart,
    elements.weightsChart,
  ].forEach((div) => {
    div.innerHTML = message;
  });
});
