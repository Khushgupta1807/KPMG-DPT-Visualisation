// ============================================
// KPMG Demand Planning Tool — 6-Stage Pipeline
// ============================================

const stages = [
  {
    id: 1, color: '#c0392b',
    title: 'Outlier Correction Engine',
    subtitle: 'Cleanses historical sales data by detecting and handling erratic spikes or drops.',
    desc: 'The Python engine connects to TM1 via REST APIs, constructs a complete time-series grid for all SKU–Location–Customer combinations, applies configurable statistical methods to detect anomalies, and writes cleansed actuals back with full audit logging.',
    steps: [
      { name: 'Scenario & Parameter Loading', detail: 'Connects to TM1 via REST API to read active scenario and fetch default/overridden configuration thresholds.' },
      { name: 'Grid Construction', detail: 'Builds a complete time-series grid for all Date × SKU × Location × Customer combinations, filling missing periods with zeros.' },
      { name: 'Statistical Detection', detail: 'Dynamically applies Seasonal IQR, Fixed Sigma, Rolling Sigma, MAD, or EWMA to calculate lower/upper bounds per SKU.' },
      { name: 'Anomaly Correction', detail: 'Corrects outliers via Limit Capping (clipping to bounds) or Interpolation-Based Filling (nullify + linear interpolation).' },
      { name: 'Write-Back', detail: 'Cleansed actuals and computed thresholds are logged back into a dedicated TM1 output cube.' }
    ]
  },
  {
    id: 2, color: '#1a8a5c',
    title: 'Segmentation Engine',
    subtitle: 'Profiles cleansed data to classify distinct demand behaviors per SKU.',
    desc: 'Every SKU is classified across multiple dimensions — volume ranking (ABC), demand variability (XYZ/CoV), trend direction, seasonality strength, intermittency ratio, and new-item status.',
    steps: [
      { name: 'Configuration Loading', detail: 'Reads active scenario to determine look-back windows, trend p-values, and ABC/XYZ class thresholds.' },
      { name: 'Data Extraction', detail: 'Extracts cleansed history and applies the specified window to ensure segmentation reflects recent performance.' },
      { name: 'ABC-XYZ Classification', detail: 'Assigns Volume Class (A/B/C) by cumulative sales % and Variability Class (X/Y/Z) by Coefficient of Variation.' },
      { name: 'New Item Detection', detail: 'Flags products with first sale date within a configured cutoff window as "New Items".' },
      { name: 'Time-Series Profiling', detail: 'Analyzes trend direction (STL + linear regression), seasonality strength, and intermittency ratios.' },
      { name: 'TM1 Integration', detail: 'Batches and writes fully segmented profiles back to TM1 as the single source of truth.' }
    ]
  },
  {
    id: 3, color: '#8e5ea2',
    title: 'Forecast Rule Engine',
    subtitle: 'Automates forecasting strategy assignment based on segmented profiles.',
    desc: 'Segment profiles are mapped to one of eight configurable forecasting rules. Each rule defines which model families to run, PLC status, and whether the SKU requires manual review or full automation.',
    steps: [
      { name: 'Scenario Reading', detail: 'Fetches active scenarios for both segmentation and rule-setup configurations from TM1.' },
      { name: 'Profile Pivoting', detail: 'Loads segmentation outputs and pivots so every SKU-location-customer has its complete profile on a single row.' },
      { name: 'Rule Mapping', detail: 'Hardcoded business logic maps profiles to rule keys (e.g., intermittent → Rule 1, declining trend → Rule 2).' },
      { name: 'Definition Merging', detail: 'Fetches detailed rule configurations (which models to run) from the TM1 Rule Setup cube and merges with SKUs.' },
      { name: 'Rule Output', detail: 'Writes the completed table — dictating how each SKU should be forecasted — into TM1 rule output cube.' }
    ]
  },
  {
    id: 4, color: '#d4883a',
    title: 'Forecasting Pipeline',
    subtitle: 'Generates, evaluates, and selects the most accurate predictive models.',
    desc: 'Over 15 statistical and ML models (ARIMA, Prophet, LSTM, Holt-Winters, TBATS) are back-tested per SKU. The model with the lowest RMSE or MAPE is auto-selected for the final forecast horizon.',
    steps: [
      { name: 'Parameter & Data Loading', detail: 'Loads train/test/forecast date ranges, error metrics (RMSE/MAPE), cleansed history, and rule constraints.' },
      { name: 'Back-Test Phase', detail: 'Splits data into train/test slices. Candidate models are fitted on training data and scored against the test slice.' },
      { name: 'Model Filtering', detail: 'Evaluates back-test results and retains only models that ran successfully and produced valid forecasts.' },
      { name: 'Final Forecast Generation', detail: 'Retained models are retrained on the entire historical dataset to project demand into the future horizon.' },
      { name: 'Post-Processing', detail: 'Clips negative forecasts to zero and interpolates any data gaps in the projected series.' },
      { name: 'Output & Logging', detail: 'Writes final actuals, projected forecasts, and accuracy metrics into TM1 Forecast and Accuracy cubes.' }
    ]
  },
  {
    id: 5, color: '#2980b9',
    title: 'Inventory Planning Module',
    subtitle: 'Translates demand forecasts into actionable inventory targets.',
    desc: 'Safety stock, EOQ, cycle stock, reorder points, and Days of Supply are computed from forecasted demand and configurable service-level targets, feeding directly into the inventory dashboard.',
    steps: [
      { name: 'Data Ingestion', detail: 'Loads three months of daily demand along with cost and lead-time parameters, then cleans the dataset.' },
      { name: 'Metric Aggregation', detail: 'Aggregates daily demand to compute total demand, average daily demand, and standard deviation.' },
      { name: 'Safety Stock Calculation', detail: 'Computes safety stock using Z-score combined with demand variance and lead-time variability.' },
      { name: 'Stock Targeting', detail: 'Derives EOQ, Cycle Stock, Reorder Point, and Base Stock levels mathematically from demand parameters.' },
      { name: 'KPI Export', detail: 'Calculates recommended Days of Supply (DoS) and writes final results to output for planner visibility.' }
    ]
  },
  {
    id: 6, color: '#4a5568',
    title: 'S&OP Workflow & Dashboarding',
    subtitle: 'Facilitates human review, collaboration, and executive approvals.',
    desc: 'Role-based dashboards in Planning Analytics Workspace serve planners, sales managers, and leadership. A 5-stage approval workflow routes forecasts through ASM, RSM, Marketing, and consensus lock.',
    steps: [
      { name: 'Interface Delivery', detail: 'Role-based interactive dashboards built in PAW are served to Planners, Sales Managers, and Marketing teams.' },
      { name: 'Data Review', detail: 'Users view outlier diagnostics, segmentation breakdowns, and model-wise forecast comparisons natively in PAW.' },
      { name: 'Manual Overrides', detail: 'Planners input real-time manual overrides on the forecast with required comment boxes for justification.' },
      { name: 'Stage-Gate Approvals', detail: 'Forecasts move through 5 gates (Planner → ASM → RSM → Marketing → Consensus) with timestamps and audit logs in TM1.' }
    ]
  }
];

// ============================================
// Build Pipeline Grid
// ============================================
const grid = document.getElementById('pipelineGrid');

stages.forEach(s => {
  const card = document.createElement('div');
  card.className = 'node';
  card.dataset.order = s.id;
  card.innerHTML = `
    <div class="node-bar" style="background:${s.color}"></div>
    <div class="node-num" style="background:${s.color}">${s.id}</div>
    <div class="node-title">${s.title}</div>
    <div class="node-sub">${s.subtitle}</div>
    <span class="node-hint">click to explore</span>
  `;
  card.addEventListener('click', () => openModal(s));
  grid.appendChild(card);
});

// ============================================
// Counter Animation (Impact Row)
// ============================================
function animateCounters() {
  document.querySelectorAll('.impact-num').forEach(el => {
    const target = parseInt(el.dataset.target);
    const fmt = el.dataset.format === 'comma';
    const duration = 1500;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(eased * target);
      el.textContent = fmt ? value.toLocaleString() : value;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

const impactObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounters();
      impactObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
impactObserver.observe(document.getElementById('impactRow'));

// ============================================
// Scroll Reveal for Cards
// ============================================
const cardObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = parseInt(entry.target.dataset.order) * 80;
      setTimeout(() => {
        entry.target.classList.add('visible');
        setTimeout(initCanvas, 400);
      }, delay);
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.node').forEach(n => cardObserver.observe(n));

// ============================================
// Canvas — Animated Flowing Connections
// ============================================
const canvas = document.getElementById('pipelineCanvas');
const ctx = canvas.getContext('2d');
let connections = [];
let dots = [];
let animId;

function getCardCenter(order) {
  const card = document.querySelector(`.node[data-order="${order}"]`);
  if (!card) return null;
  const r = card.getBoundingClientRect();
  const cr = canvas.getBoundingClientRect();
  return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top };
}

function getCardEdge(order, side) {
  const card = document.querySelector(`.node[data-order="${order}"]`);
  if (!card) return null;
  const r = card.getBoundingClientRect();
  const cr = canvas.getBoundingClientRect();
  const cx = r.left + r.width / 2 - cr.left;
  const cy = r.top + r.height / 2 - cr.top;
  switch (side) {
    case 'right': return { x: r.right - cr.left, y: cy };
    case 'left': return { x: r.left - cr.left, y: cy };
    case 'bottom': return { x: cx, y: r.bottom - cr.top };
    case 'top': return { x: cx, y: r.top - cr.top };
  }
}

function initCanvas() {
  if (window.innerWidth < 700) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  // Define connections: from → to with edge directions
  connections = [
    { from: getCardEdge(1, 'right'), to: getCardEdge(2, 'left') },
    { from: getCardEdge(2, 'right'), to: getCardEdge(3, 'left') },
    { from: getCardEdge(3, 'bottom'), to: getCardEdge(4, 'top') },
    { from: getCardEdge(4, 'left'), to: getCardEdge(5, 'right') },
    { from: getCardEdge(5, 'left'), to: getCardEdge(6, 'right') },
  ].filter(c => c.from && c.to);

  // Create flowing dots for each connection
  dots = [];
  connections.forEach((conn, ci) => {
    for (let d = 0; d < 3; d++) {
      dots.push({ conn: ci, t: d / 3, speed: 0.003 + Math.random() * 0.002 });
    }
  });

  if (!animId) animate();
}

function bezierPoint(p0, p1, cp1, cp2, t) {
  const u = 1 - t;
  return {
    x: u*u*u*p0.x + 3*u*u*t*cp1.x + 3*u*t*t*cp2.x + t*t*t*p1.x,
    y: u*u*u*p0.y + 3*u*u*t*cp1.y + 3*u*t*t*cp2.y + t*t*t*p1.y
  };
}

function getControlPoints(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical connection
    return [
      { x: from.x, y: from.y + dy * 0.4 },
      { x: to.x, y: to.y - dy * 0.4 }
    ];
  } else {
    // Horizontal connection
    return [
      { x: from.x + dx * 0.4, y: from.y },
      { x: to.x - dx * 0.4, y: to.y }
    ];
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);

  // Draw connection lines
  connections.forEach(conn => {
    const [cp1, cp2] = getControlPoints(conn.from, conn.to);
    ctx.beginPath();
    ctx.moveTo(conn.from.x, conn.from.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, conn.to.x, conn.to.y);
    ctx.strokeStyle = 'rgba(79,70,200,0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.stroke();

    // Draw arrowhead at the end
    const t2 = 0.95;
    const end = bezierPoint(conn.from, conn.to, cp1, cp2, 1);
    const pre = bezierPoint(conn.from, conn.to, cp1, cp2, t2);
    const angle = Math.atan2(end.y - pre.y, end.x - pre.x);
    const arrowLen = 14;
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - arrowLen * Math.cos(angle - 0.4), end.y - arrowLen * Math.sin(angle - 0.4));
    ctx.lineTo(end.x - arrowLen * 0.35 * Math.cos(angle), end.y - arrowLen * 0.35 * Math.sin(angle));
    ctx.lineTo(end.x - arrowLen * Math.cos(angle + 0.4), end.y - arrowLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = 'rgba(79,70,200,0.7)';
    ctx.fill();
  });

  // Animate particles with trails
  dots.forEach(dot => {
    dot.t += dot.speed;
    if (dot.t > 1) dot.t -= 1;
    const conn = connections[dot.conn];
    if (!conn) return;
    const [cp1, cp2] = getControlPoints(conn.from, conn.to);
    const p = bezierPoint(conn.from, conn.to, cp1, cp2, dot.t);

    // Trail particles
    for (let i = 4; i >= 0; i--) {
      const trailT = dot.t - i * 0.015;
      if (trailT < 0) continue;
      const tp = bezierPoint(conn.from, conn.to, cp1, cp2, trailT);
      const alpha = (1 - i / 5) * 0.6;
      const radius = 2.5 - i * 0.35;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, Math.max(radius, 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(79,70,200,${alpha})`;
      ctx.fill();
    }

    // Soft glow on lead particle
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 6);
    glow.addColorStop(0, 'rgba(99,102,241,0.4)');
    glow.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  });

  animId = requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  cancelAnimationFrame(animId);
  animId = null;
  initCanvas();
});

// ============================================
// Modal
// ============================================
const overlay = document.getElementById('modalOverlay');

function openModal(stage) {
  document.getElementById('modalBadge').textContent = `Stage ${stage.id}`;
  document.getElementById('modalBadge').style.background = stage.color;
  document.getElementById('modalTitle').textContent = stage.title;
  document.getElementById('modalDesc').textContent = stage.desc;
  document.getElementById('modalSteps').innerHTML = stage.steps.map((s, i) => `
    <div class="step-item">
      <div class="step-num" style="background:${stage.color}">${i + 1}</div>
      <div><strong>${s.name}</strong><br><span>${s.detail}</span></div>
    </div>
  `).join('');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ============================================
// Page Navigation
// ============================================
const pages = { viz: document.getElementById('pageViz'), role: document.getElementById('pageRole') };
const tabs = { viz: document.getElementById('tabViz'), role: document.getElementById('tabRole') };

function switchPage(target) {
  // Deactivate all
  Object.values(pages).forEach(p => p.classList.remove('active'));
  Object.values(tabs).forEach(t => t.classList.remove('active'));

  // Activate target
  pages[target].classList.add('active');
  tabs[target].classList.add('active');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Re-init canvas when switching to viz
  if (target === 'viz') {
    setTimeout(() => {
      cancelAnimationFrame(animId);
      animId = null;
      initCanvas();
    }, 100);
  }

  // Animate role items on entry
  if (target === 'role') {
    document.querySelectorAll('.role-item').forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-12px)';
      setTimeout(() => {
        item.style.transition = 'all .3s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      }, 60 + i * 40);
    });
  }
}

// Tab clicks
tabs.viz.addEventListener('click', () => switchPage('viz'));
tabs.role.addEventListener('click', () => switchPage('role'));

// CTA button on role page → viz
const ctaBtn = document.getElementById('ctaToViz');
if (ctaBtn) ctaBtn.addEventListener('click', () => switchPage('viz'));
