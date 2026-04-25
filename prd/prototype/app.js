const STORAGE_KEY = 'wardrobe-os-prototype-v1';

const COLOR_HEX = {
  navy:'#243B63',
  white:'#ECEFF5',
  cream:'#E9DDC8',
  charcoal:'#3B4454',
  olive:'#596B3C',
  tan:'#B68C57',
  khaki:'#BAA175',
  black:'#16181C',
  blue:'#4F76B8',
  burgundy:'#7E2E43',
  brown:'#6B4B34',
  gray:'#9BA4B4',
  camel:'#C8A16B',
  green:'#4B7A63'
};

const COLOR_NAMES = Object.keys(COLOR_HEX);

const COLOR_COMPATIBILITY = {
  navy: {white:10, cream:10, gray:9, charcoal:8, tan:9, khaki:9, olive:8, blue:8, burgundy:8, brown:8, black:6},
  white:{navy:10, cream:8, gray:9, charcoal:9, tan:9, khaki:9, olive:9, blue:9, burgundy:8, brown:8, black:10},
  cream:{navy:10, white:8, gray:8, charcoal:7, tan:6, khaki:8, olive:9, blue:8, burgundy:7, brown:8, black:6},
  charcoal:{navy:8, white:10, cream:7, gray:8, olive:8, blue:8, burgundy:8, brown:7, black:8, tan:8, khaki:8},
  olive:{white:9, cream:9, gray:8, navy:8, khaki:7, tan:7, blue:7, burgundy:7, brown:8, black:7},
  tan:{navy:9, white:9, cream:6, gray:7, olive:8, blue:8, brown:8, burgundy:7, black:6, charcoal:8},
  khaki:{navy:9, white:9, olive:8, blue:8, cream:8, burgundy:7, brown:8, charcoal:8, black:6},
  blue:{white:9, navy:8, cream:8, khaki:8, tan:8, olive:7, charcoal:8, burgundy:7, brown:7},
  burgundy:{navy:8, gray:8, white:8, charcoal:8, cream:7, brown:8, black:8, tan:7},
  brown:{white:8, cream:8, navy:8, olive:8, tan:8, khaki:8, burgundy:8, blue:7, charcoal:7},
  black:{white:10, gray:9, burgundy:8, charcoal:8, olive:7, navy:6, brown:6, cream:6}
};

const OCCASIONS = ['casual', 'smart-casual', 'work', 'dinner', 'travel', 'formal'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const CATEGORY_OPTIONS = [
  {value:'top', label:'Top'},
  {value:'bottom', label:'Bottom'},
  {value:'layer', label:'Layer'},
  {value:'shoes', label:'Shoes'},
  {value:'outerwear', label:'Outerwear'}
];
const DRESS_LEVEL_TO_FORMALITY = {
  casual: 2,
  'smart-casual': 3,
  work: 3,
  dinner: 3,
  formal: 5
};

const PURCHASE_CANDIDATES = [
  {key:'cream_trouser', name:'Cream trousers', category:'bottom', subcategory:'trousers', primaryColor:'cream', pattern:'solid', material:'cotton', warmth:2, formality:3, seasons:['spring','summer','fall'], occasions:['smart-casual','work','dinner'], priceBand:'medium'},
  {key:'olive_chino', name:'Olive chinos', category:'bottom', subcategory:'chinos', primaryColor:'olive', pattern:'solid', material:'cotton', warmth:2, formality:2, seasons:['spring','fall'], occasions:['casual','smart-casual','travel'], priceBand:'medium'},
  {key:'white_ocbd', name:'White OCBD', category:'top', subcategory:'button-down-shirt', primaryColor:'white', pattern:'solid', material:'cotton', warmth:2, formality:3, seasons:['spring','summer','fall','winter'], occasions:['work','smart-casual','dinner'], priceBand:'medium'},
  {key:'brown_suede_loafers', name:'Brown suede loafers', category:'shoes', subcategory:'loafers', primaryColor:'brown', pattern:'solid', material:'suede', warmth:2, formality:3, seasons:['spring','summer','fall'], occasions:['smart-casual','dinner','work'], priceBand:'medium'},
  {key:'charcoal_merino_crewneck', name:'Charcoal merino crewneck', category:'layer', subcategory:'sweater', primaryColor:'charcoal', pattern:'solid', material:'merino', warmth:3, formality:3, seasons:['fall','winter','spring'], occasions:['work','smart-casual','travel'], priceBand:'medium'},
  {key:'minimal_black_sneakers', name:'Minimal black sneakers', category:'shoes', subcategory:'sneakers', primaryColor:'black', pattern:'solid', material:'leather', warmth:2, formality:2, seasons:['spring','fall','winter'], occasions:['casual','travel','smart-casual'], priceBand:'medium'},
  {key:'unstructured_navy_blazer', name:'Unstructured navy blazer', category:'layer', subcategory:'blazer', primaryColor:'navy', pattern:'solid', material:'wool-blend', warmth:3, formality:4, seasons:['spring','fall','winter'], occasions:['work','dinner','smart-casual'], priceBand:'high'},
  {key:'midwash_jeans', name:'Mid-wash straight jeans', category:'bottom', subcategory:'jeans', primaryColor:'blue', pattern:'solid', material:'denim', warmth:2, formality:1, seasons:['all'], occasions:['casual','travel','dinner'], priceBand:'medium'}
];

const EMPTY_DRAFT = () => ({
  name:'',
  category:'top',
  subcategory:'',
  primaryColor:'navy',
  pattern:'solid',
  material:'cotton',
  warmth:2,
  formality:2,
  seasons:['spring','fall'],
  occasions:['casual'],
  fitNotes:'',
  imageData:null,
  imageName:'',
  brand:''
});

function createSeedState() {
  const now = new Date().toISOString();
  const items = [
    seedItem('Navy Oxford Shirt', 'top', 'oxford-shirt', 'navy', 'solid', 'cotton', 2, 3, ['spring','fall','winter'], ['work','smart-casual','dinner'], 8, '2026-04-19T12:00:00.000Z'),
    seedItem('White Heavy Tee', 'top', 't-shirt', 'white', 'solid', 'cotton', 1, 1, ['spring','summer','fall'], ['casual','travel'], 12, '2026-04-22T09:00:00.000Z'),
    seedItem('Blue Chambray Shirt', 'top', 'chambray-shirt', 'blue', 'solid', 'cotton', 2, 2, ['spring','summer','fall','winter'], ['casual','smart-casual'], 4, '2026-04-14T08:00:00.000Z'),
    seedItem('Burgundy Knit Polo', 'top', 'knit-polo', 'burgundy', 'solid', 'cotton', 2, 2, ['spring','summer','fall'], ['casual','dinner','smart-casual'], 2, '2026-04-10T13:00:00.000Z'),
    seedItem('Gray Merino Crewneck', 'layer', 'sweater', 'gray', 'solid', 'merino', 3, 3, ['fall','winter','spring'], ['work','smart-casual','travel'], 5, '2026-04-12T10:00:00.000Z'),
    seedItem('Olive Overshirt', 'layer', 'overshirt', 'olive', 'solid', 'cotton', 2, 2, ['spring','fall'], ['casual','travel','smart-casual'], 1, '2026-03-01T10:00:00.000Z'),
    seedItem('Navy Blazer', 'layer', 'blazer', 'navy', 'solid', 'wool-blend', 3, 4, ['spring','fall','winter'], ['work','dinner'], 3, '2026-04-08T09:00:00.000Z'),
    seedItem('Camel Field Jacket', 'outerwear', 'jacket', 'camel', 'solid', 'cotton', 4, 2, ['fall','winter','spring'], ['casual','travel'], 2, '2026-04-01T09:00:00.000Z'),
    seedItem('Charcoal Trousers', 'bottom', 'trousers', 'charcoal', 'solid', 'wool', 2, 4, ['spring','summer','fall','winter'], ['work','dinner'], 6, '2026-04-21T07:00:00.000Z'),
    seedItem('Khaki Chinos', 'bottom', 'chinos', 'khaki', 'solid', 'cotton', 2, 2, ['spring','summer','fall'], ['casual','smart-casual','work','travel'], 7, '2026-04-20T11:00:00.000Z'),
    seedItem('Dark Denim Jeans', 'bottom', 'jeans', 'blue', 'solid', 'denim', 2, 1, ['spring','summer','fall','winter'], ['casual','dinner','travel'], 9, '2026-04-18T19:00:00.000Z'),
    seedItem('Black Slim Trousers', 'bottom', 'trousers', 'black', 'solid', 'wool-blend', 2, 4, ['spring','summer','fall','winter'], ['work','dinner','formal'], 2, '2026-04-07T12:00:00.000Z'),
    seedItem('White Leather Sneakers', 'shoes', 'sneakers', 'white', 'solid', 'leather', 2, 1, ['spring','summer','fall','winter'], ['casual','travel'], 10, '2026-04-22T18:00:00.000Z'),
    seedItem('Brown Suede Loafers', 'shoes', 'loafers', 'brown', 'solid', 'suede', 2, 3, ['spring','summer','fall'], ['work','dinner','smart-casual'], 4, '2026-04-17T18:00:00.000Z'),
    seedItem('Black Derbies', 'shoes', 'derbies', 'black', 'solid', 'leather', 2, 4, ['spring','summer','fall','winter'], ['work','dinner','formal'], 2, '2026-04-05T18:00:00.000Z')
  ];

  return {
    currentView:'overview',
    items,
    savedOutfits:[],
    closetFilters:{search:'', category:'all', color:'all', occasion:'all'},
    outfitQuery:{occasion:'work', temperatureBand:'mild', weather:'dry', dressLevel:'smart-casual', preferLeastWorn:true, freshnessBias:35},
    buyNextQuery:{budgetTier:'medium', targetOccasion:'smart-casual', season:'all', preferredCategory:'all', avoidDuplicates:true},
    packQuery:{tripLengthDays:4, primaryOccasion:'mixed', weather:'mild', laundryAccess:false, shoeLimit:2},
    addItemDraft: EMPTY_DRAFT(),
    updatedAt: now
  };
}

function seedItem(name, category, subcategory, primaryColor, pattern, material, warmth, formality, seasons, occasions, wearCount, lastWornAt) {
  const item = {
    id: cryptoId(),
    name,
    category,
    subcategory,
    primaryColor,
    pattern,
    material,
    warmth,
    formality,
    seasons,
    occasions,
    wearCount,
    lastWornAt,
    fitNotes:'',
    status:'active',
    brand:'',
    createdAt:new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  item.imageData = createPlaceholderImage(item);
  return item;
}

function cryptoId() {
  return 'itm_' + Math.random().toString(36).slice(2, 10);
}

let appState = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedState();
      persistState(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    parsed.addItemDraft = parsed.addItemDraft || EMPTY_DRAFT();
    return parsed;
  } catch {
    const seeded = createSeedState();
    persistState(seeded);
    return seeded;
  }
}

function persistState(next = appState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function saveAndRender(nextState) {
  appState = nextState;
  appState.updatedAt = new Date().toISOString();
  persistState(appState);
  render();
}

function mergeState(partial) {
  saveAndRender({...appState, ...partial});
}

function createPlaceholderImage(item) {
  const fill = COLOR_HEX[item.primaryColor] || '#65748B';
  const bg = '#11192A';
  let body = '';
  if (item.category === 'bottom') {
    body = `
      <path d="M120 42 L186 42 L206 236 L165 236 L154 122 L144 236 L102 236 Z" fill="${fill}" opacity="0.95"/>
      <path d="M132 42 L176 42 L180 76 L128 76 Z" fill="rgba(255,255,255,.18)" />
    `;
  } else if (item.category === 'shoes') {
    body = `
      <path d="M85 170 C120 170 134 184 164 184 C192 184 202 194 210 214 L154 214 C124 214 108 206 86 206 C74 206 64 198 64 186 C64 176 72 170 85 170 Z" fill="${fill}"/>
      <path d="M142 146 C170 146 184 158 214 158 C236 158 252 166 258 184 L202 184 C172 184 158 176 132 176 C120 176 112 168 112 158 C112 150 122 146 142 146 Z" fill="${fill}" opacity=".88"/>
    `;
  } else {
    const shoulder = item.category === 'layer' || item.category === 'outerwear' ? 64 : 76;
    const hem = item.category === 'layer' || item.category === 'outerwear' ? 224 : 206;
    body = `
      <path d="M105 ${shoulder} L134 38 L176 38 L205 ${shoulder} L238 88 L214 104 L203 ${hem} L107 ${hem} L96 104 L72 88 Z" fill="${fill}" opacity=".96"/>
      <path d="M134 38 L154 58 L176 38" stroke="rgba(255,255,255,.3)" stroke-width="4" fill="none"/>
      <rect x="145" y="64" width="10" height="${Math.max(96, hem-76)}" rx="5" fill="rgba(255,255,255,.16)"/>
    `;
  }

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 260">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#1A2740"/>
      </linearGradient>
    </defs>
    <rect width="310" height="260" rx="26" fill="url(#bg)"/>
    <circle cx="42" cy="42" r="20" fill="rgba(255,255,255,.05)"/>
    <circle cx="270" cy="220" r="34" fill="rgba(255,255,255,.03)"/>
    ${body}
    <text x="22" y="232" fill="rgba(244,247,251,.82)" font-size="14" font-family="Inter, Arial" font-weight="700">${escapeXml(item.name)}</text>
    <text x="22" y="248" fill="rgba(168,179,199,.86)" font-size="11" font-family="Inter, Arial">${escapeXml(item.primaryColor)} · ${escapeXml(item.category)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function render() {
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === appState.currentView);
  });
  const titleMap = {
    overview:'Overview',
    dashboard:'Dashboard',
    closet:'Closet',
    'add-item':'Add Item',
    outfits:'Outfit Lab',
    'buy-next':'Buy Next',
    pack:'Pack Planner',
    insights:'Insights'
  };
  document.getElementById('topbar-title').textContent = titleMap[appState.currentView] || 'Wardrobe OS';
  const root = document.getElementById('view-root');
  root.innerHTML = renderCurrentView();
}

function renderCurrentView() {
  switch (appState.currentView) {
    case 'overview': return renderOverview();
    case 'dashboard': return renderDashboard();
    case 'closet': return renderCloset();
    case 'add-item': return renderAddItem();
    case 'outfits': return renderOutfits();
    case 'buy-next': return renderBuyNext();
    case 'pack': return renderPack();
    case 'insights': return renderInsights();
    default: return renderOverview();
  }
}

function renderOverview() {
  const suggestions = getPurchaseSuggestions(appState.items, appState.buyNextQuery).slice(0, 3);
  return `
    <div class="page-stack">
      <section class="hero">
        <div class="hero-copy">
          <p class="eyebrow">Wardrobe optimizer, not another closet gallery</p>
          <h3>Wear more of what you own.<br>Buy fewer, smarter pieces.</h3>
          <p>
            Wardrobe OS turns your closet into a decision system. It catalogs what you own, suggests context-aware outfits,
            surfaces underused items, and tells you which next purchase unlocks the most combinations.
          </p>
          <div class="hero-badges">
            <span>Buy-next unlock engine</span>
            <span>Outfit scoring</span>
            <span>Underused-item revival</span>
            <span>Packing planner</span>
          </div>
          <div class="hero-actions">
            <button class="primary-btn" data-go-view="dashboard">Open demo closet</button>
            <button class="secondary-btn" data-go-view="buy-next">See the wedge feature</button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="mock-screen">
            <div class="card-title-row">
              <h3 class="section-title">Live product shape</h3>
              <span class="pill">Prototype running locally</span>
            </div>
            <div class="mock-row">
              <div class="mock-card">
                <strong>Closet coverage</strong>
                <div class="bar"><span style="width:82%"></span></div>
              </div>
              <div class="mock-card">
                <strong>Top buy next</strong>
                <p class="support">Cream trousers</p>
              </div>
              <div class="mock-card">
                <strong>Underused</strong>
                <p class="support">Olive overshirt</p>
              </div>
            </div>
            <div class="mock-card">
              <strong>App surfaces</strong>
              <div class="mini-grid">
                <div></div><div></div><div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid-3">
        <div class="card feature-card">
          <div class="feature-index">1</div>
          <h3>Catalog without chaos</h3>
          <p>Upload items, tag them fast, and build a searchable structured wardrobe instead of relying on memory.</p>
        </div>
        <div class="card feature-card">
          <div class="feature-index">2</div>
          <h3>Generate grounded outfits</h3>
          <p>Suggestions are based on color, formality, weather, rotation, and occasion. No vague “AI stylist” fluff.</p>
        </div>
        <div class="card feature-card">
          <div class="feature-index">3</div>
          <h3>Simulate the next buy</h3>
          <p>The sharpest wedge: identify the single piece that creates the most new outfits from what you already own.</p>
        </div>
      </section>

      <section class="grid-2">
        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Why this concept has teeth</h3>
              <p class="section-subtitle">Most wardrobe apps stop at digitization. This one keeps going into optimization.</p>
            </div>
          </div>
          <ul class="bad-list">
            <li>It reduces decision fatigue in the morning.</li>
            <li>It turns shopping into a measurable choice instead of impulse buying.</li>
            <li>It produces continuing value after setup through underused-item and packing guidance.</li>
            <li>It works for one person first and can extend to family/friends later.</li>
          </ul>
        </div>

        <div class="card highlight">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Top purchase opportunities in the demo closet</h3>
              <p class="section-subtitle">These are ranked by outfits unlocked.</p>
            </div>
          </div>
          <div class="recommendation-list">
            ${suggestions.map((s, i) => `
              <div class="recommendation-card">
                <div class="recommendation-head">
                  <div>
                    <h4>${i + 1}. ${escapeHtml(s.name)}</h4>
                    <p>${escapeHtml(s.reason)}</p>
                  </div>
                  <span class="score-pill">${s.unlockCount} unlocks</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <footer class="page-foot">
        This prototype is intentionally local and deterministic. The docs package describes the production build using Next.js, Supabase, and optional AI-assisted tagging.
      </footer>
    </div>
  `;
}

function renderDashboard() {
  const stats = getDashboardStats(appState.items);
  const coverage = getOccasionCoverage(appState.items);
  const topPurchase = getPurchaseSuggestions(appState.items, appState.buyNextQuery)[0];
  const underused = getUnderusedItems(appState.items).slice(0, 4);
  const recent = [...appState.items].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0,5);
  return `
    <div class="page-stack">
      <section class="grid-4">
        <div class="card compact">
          <div class="support">Active items</div>
          <div class="stat-number">${stats.activeCount}</div>
          <div class="support">Across ${stats.categoryCount} core category groups</div>
        </div>
        <div class="card compact">
          <div class="support">High-confidence outfits</div>
          <div class="stat-number">${stats.readyOutfitCount}</div>
          <div class="support">Using current scoring rules</div>
        </div>
        <div class="card compact">
          <div class="support">Underused items</div>
          <div class="stat-number">${stats.underusedCount}</div>
          <div class="support">Wear count 0–1 or stale rotation</div>
        </div>
        <div class="card compact">
          <div class="support">Top buy-next unlock</div>
          <div class="stat-number">${topPurchase ? topPurchase.unlockCount : 0}</div>
          <div class="support">${topPurchase ? escapeHtml(topPurchase.name) : 'No strong candidate yet'}</div>
        </div>
      </section>

      <section class="grid-2">
        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Occasion coverage</h3>
              <p class="section-subtitle">A useful wardrobe is about context coverage, not item count.</p>
            </div>
          </div>
          <div class="coverage-list">
            ${coverage.map(row => `
              <div class="coverage-row">
                <strong>${labelize(row.occasion)}</strong>
                <div class="bar-track"><div class="bar-fill" style="width:${row.score}%"></div></div>
                <span>${row.score}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card highlight">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Best next purchase right now</h3>
              <p class="section-subtitle">This is the wedge feature that makes the product more than a closet catalog.</p>
            </div>
          </div>
          ${topPurchase ? `
            <div class="recommendation-card">
              <div class="recommendation-head">
                <div>
                  <h4>${escapeHtml(topPurchase.name)}</h4>
                  <p>${escapeHtml(topPurchase.reason)}</p>
                </div>
                <span class="score-pill">${topPurchase.unlockCount} unlocks</span>
              </div>
              <div class="item-strip">
                ${topPurchase.impactedItems.map(name => `<span class="item-chip">${escapeHtml(name)}</span>`).join('')}
              </div>
            </div>
          ` : document.getElementById('empty-state-template').innerHTML}
        </div>
      </section>

      <section class="grid-2">
        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Underused item revival</h3>
              <p class="section-subtitle">A strong retention loop after setup.</p>
            </div>
          </div>
          <table class="table-lite">
            <thead>
              <tr><th>Item</th><th>Wear count</th><th>Likely contexts</th></tr>
            </thead>
            <tbody>
              ${underused.map(item => {
                const contexts = suggestContextsForItem(item).slice(0,3).join(', ') || 'Casual';
                return `<tr><td>${escapeHtml(item.name)}</td><td>${item.wearCount}</td><td>${escapeHtml(contexts)}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Recently touched items</h3>
              <p class="section-subtitle">Fast path back into the catalog.</p>
            </div>
          </div>
          <div class="recommendation-list">
            ${recent.map(item => `
              <div class="recommendation-card">
                <div class="recommendation-head">
                  <div>
                    <h4>${escapeHtml(item.name)}</h4>
                    <p>${escapeHtml(labelize(item.category))} · ${escapeHtml(item.primaryColor)} · ${item.wearCount} wears</p>
                  </div>
                  <button class="inline-btn small" data-open-item="${item.id}">Open</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderCloset() {
  const filteredItems = filterItems(appState.items, appState.closetFilters);
  return `
    <div class="page-stack">
      <section class="card">
        <div class="card-title-row">
          <div>
            <h3 class="section-title">Closet catalog</h3>
            <p class="section-subtitle">Filter by category, color, and occasion. Click any card for details.</p>
          </div>
          <span class="pill">${filteredItems.length} items shown</span>
        </div>

        <div class="filter-grid toolbar">
          <div class="field-group">
            <label for="filter-search">Search</label>
            <input id="filter-search" type="text" value="${escapeHtml(appState.closetFilters.search)}" placeholder="Search by name or material">
          </div>
          <div class="field-group">
            <label for="filter-category">Category</label>
            <select id="filter-category">
              ${renderOptions([{value:'all',label:'All categories'}, ...CATEGORY_OPTIONS], appState.closetFilters.category)}
            </select>
          </div>
          <div class="field-group">
            <label for="filter-color">Color</label>
            <select id="filter-color">
              ${renderOptions([{value:'all',label:'All colors'}, ...COLOR_NAMES.map(color => ({value:color,label:labelize(color)}))], appState.closetFilters.color)}
            </select>
          </div>
          <div class="field-group">
            <label for="filter-occasion">Occasion</label>
            <select id="filter-occasion">
              ${renderOptions([{value:'all',label:'All occasions'}, ...OCCASIONS.map(occasion => ({value:occasion,label:labelize(occasion)}))], appState.closetFilters.occasion)}
            </select>
          </div>
        </div>
      </section>

      ${filteredItems.length ? `
        <section class="catalog-grid">
          ${filteredItems.map(renderItemCard).join('')}
        </section>
      ` : document.getElementById('empty-state-template').innerHTML}
    </div>
  `;
}

function renderItemCard(item) {
  return `
    <article class="item-card" data-open-item="${item.id}">
      <div class="item-image">
        <img src="${item.imageData}" alt="${escapeHtml(item.name)}">
      </div>
      <div class="item-body">
        <div class="item-title">
          <div>
            <h4>${escapeHtml(item.name)}</h4>
            <div class="support">${labelize(item.category)} · ${escapeHtml(item.primaryColor)}</div>
          </div>
          <span class="meta-pill">${item.wearCount} wears</span>
        </div>
        <div class="meta-row">
          <span class="meta-pill">${escapeHtml(item.material)}</span>
          <span class="meta-pill">Formality ${item.formality}/5</span>
          <span class="meta-pill">Warmth ${item.warmth}/5</span>
        </div>
        <div class="item-actions">
          <button class="inline-btn small" data-mark-worn="${item.id}">Mark worn</button>
          <button class="inline-btn small" data-archive-item="${item.id}">Archive</button>
        </div>
      </div>
    </article>
  `;
}

function renderAddItem() {
  const d = appState.addItemDraft || EMPTY_DRAFT();
  return `
    <div class="page-stack">
      <section class="split-layout">
        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Image upload and quick tagging</h3>
              <p class="section-subtitle">The prototype processes the image locally and suggests a dominant color.</p>
            </div>
          </div>
          <div class="upload-drop">
            <div class="preview-frame">
              ${d.imageData ? `<img src="${d.imageData}" alt="Preview">` : `<div class="helper">Upload a photo to preview it here.<br><br>The local prototype compresses the image and estimates the dominant color family.</div>`}
            </div>
            <div class="field-group">
              <label for="item-image-input">Upload clothing image</label>
              <input id="item-image-input" type="file" accept="image/*">
            </div>
            <div class="helper">
              Recommended production flow: store originals privately, generate optimized variants server-side, and only use AI tagging as a soft suggestion layer.
            </div>
            ${d.imageName ? `<span class="pill">Current file: ${escapeHtml(d.imageName)}</span>` : ''}
          </div>
        </div>

        <div class="card">
          <form id="add-item-form" class="add-item-form">
            <div class="card-title-row">
              <div>
                <h3 class="section-title">Item metadata</h3>
                <p class="section-subtitle">Keep the schema tight. That is what makes the recommendations useful later.</p>
              </div>
            </div>
            <div class="form-grid">
              <div class="field-group">
                <label for="draft-name">Item name</label>
                <input id="draft-name" name="name" type="text" value="${escapeHtml(d.name)}" placeholder="e.g. Cream pleated trousers">
              </div>
              <div class="field-group">
                <label for="draft-category">Category</label>
                <select id="draft-category" name="category">
                  ${renderOptions(CATEGORY_OPTIONS, d.category)}
                </select>
              </div>
              <div class="field-group">
                <label for="draft-subcategory">Subcategory</label>
                <input id="draft-subcategory" name="subcategory" type="text" value="${escapeHtml(d.subcategory)}" placeholder="e.g. trousers, oxford shirt">
              </div>
              <div class="field-group">
                <label for="draft-color">Primary color</label>
                <select id="draft-color" name="primaryColor">
                  ${renderOptions(COLOR_NAMES.map(color => ({value:color, label:labelize(color)})), d.primaryColor)}
                </select>
              </div>
              <div class="field-group">
                <label for="draft-pattern">Pattern</label>
                <select id="draft-pattern" name="pattern">
                  ${renderOptions([
                    {value:'solid', label:'Solid'},
                    {value:'stripe', label:'Stripe'},
                    {value:'check', label:'Check'},
                    {value:'texture', label:'Texture'}
                  ], d.pattern)}
                </select>
              </div>
              <div class="field-group">
                <label for="draft-material">Material</label>
                <input id="draft-material" name="material" type="text" value="${escapeHtml(d.material)}" placeholder="cotton, wool, denim">
              </div>
              <div class="field-group">
                <label for="draft-formality">Formality</label>
                <select id="draft-formality" name="formality">
                  ${renderOptions([1,2,3,4,5].map(v => ({value:String(v), label:`${v} / 5`})), String(d.formality))}
                </select>
              </div>
              <div class="field-group">
                <label for="draft-warmth">Warmth</label>
                <select id="draft-warmth" name="warmth">
                  ${renderOptions([1,2,3,4,5].map(v => ({value:String(v), label:`${v} / 5`})), String(d.warmth))}
                </select>
              </div>
            </div>

            <div class="field-group">
              <label>Seasons</label>
              <div class="chip-row">
                ${SEASONS.map(season => `
                  <button type="button" class="chip-button ${d.seasons.includes(season) ? 'active' : ''}" data-toggle-array="seasons" data-value="${season}">
                    ${labelize(season)}
                  </button>`).join('')}
              </div>
            </div>

            <div class="field-group">
              <label>Occasions</label>
              <div class="chip-row">
                ${OCCASIONS.map(occasion => `
                  <button type="button" class="chip-button ${d.occasions.includes(occasion) ? 'active' : ''}" data-toggle-array="occasions" data-value="${occasion}">
                    ${labelize(occasion)}
                  </button>`).join('')}
              </div>
            </div>

            <div class="field-group">
              <label for="draft-fit-notes">Fit notes</label>
              <textarea id="draft-fit-notes" name="fitNotes" placeholder="Trim, relaxed, cropped, long-sleeve, etc.">${escapeHtml(d.fitNotes)}</textarea>
            </div>

            <div class="field-group">
              <label for="draft-brand">Brand</label>
              <input id="draft-brand" name="brand" type="text" value="${escapeHtml(d.brand)}" placeholder="Optional">
            </div>

            <div class="toolbar">
              <button type="submit" class="primary-btn">Save item</button>
              <button type="button" class="secondary-btn" id="clear-draft">Clear draft</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  `;
}

function renderOutfits() {
  const results = getOutfitSuggestions(appState.items, appState.outfitQuery).slice(0, 6);
  return `
    <div class="page-stack split-layout">
      <section class="card">
        <form id="outfit-form" class="outfit-form">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Outfit query</h3>
              <p class="section-subtitle">This engine is deliberately rule-based first. It stays explainable.</p>
            </div>
          </div>
          <div class="field-group">
            <label for="outfit-occasion">Occasion</label>
            <select id="outfit-occasion" name="occasion">
              ${renderOptions(OCCASIONS.map(o => ({value:o, label:labelize(o)})), appState.outfitQuery.occasion)}
            </select>
          </div>
          <div class="field-group">
            <label for="outfit-temp">Temperature band</label>
            <select id="outfit-temp" name="temperatureBand">
              ${renderOptions([
                {value:'hot', label:'Hot'},
                {value:'mild', label:'Mild'},
                {value:'cold', label:'Cold'}
              ], appState.outfitQuery.temperatureBand)}
            </select>
          </div>
          <div class="field-group">
            <label for="outfit-weather">Weather</label>
            <select id="outfit-weather" name="weather">
              ${renderOptions([
                {value:'dry', label:'Dry'},
                {value:'windy', label:'Windy'},
                {value:'rainy', label:'Rainy'}
              ], appState.outfitQuery.weather)}
            </select>
          </div>
          <div class="field-group">
            <label for="outfit-dress">Dress level</label>
            <select id="outfit-dress" name="dressLevel">
              ${renderOptions([
                {value:'casual', label:'Casual'},
                {value:'smart-casual', label:'Smart casual'},
                {value:'work', label:'Work'},
                {value:'dinner', label:'Dinner'},
                {value:'formal', label:'Formal'}
              ], appState.outfitQuery.dressLevel)}
            </select>
          </div>
          <div class="field-group">
            <label for="outfit-freshness">Freshness bias</label>
            <input id="outfit-freshness" name="freshnessBias" type="number" min="0" max="100" value="${appState.outfitQuery.freshnessBias}">
          </div>
          <div class="field-group">
            <label for="outfit-rotation">Rotation boost</label>
            <select id="outfit-rotation" name="preferLeastWorn">
              ${renderOptions([
                {value:'true', label:'Prefer lower-wear items'},
                {value:'false', label:'Ignore wear counts'}
              ], String(appState.outfitQuery.preferLeastWorn))}
            </select>
          </div>
          <button class="primary-btn" type="submit">Generate outfits</button>
        </form>
      </section>

      <section class="recommendation-list">
        ${results.length ? results.map(renderOutfitCard).join('') : document.getElementById('empty-state-template').innerHTML}
      </section>
    </div>
  `;
}

function renderOutfitCard(rec) {
  return `
    <article class="recommendation-card">
      <div class="recommendation-head">
        <div>
          <h4>${rec.items.map(item => item.name).join(' · ')}</h4>
          <p>${escapeHtml(rec.rationale)}</p>
        </div>
        <span class="score-pill">${rec.score}</span>
      </div>
      <div class="item-strip">
        ${rec.items.map(item => `<span class="item-chip">${escapeHtml(item.name)}</span>`).join('')}
      </div>
      <div class="score-breakdown">
        ${Object.entries(rec.scoreBreakdown).map(([key, value]) => `
          <div class="score-cell">
            <span>${labelize(key)}</span>
            <strong>${value}</strong>
          </div>
        `).join('')}
      </div>
      <div class="item-actions" style="margin-top:16px">
        <button class="inline-btn small" data-save-outfit="${rec.key}">Save outfit</button>
        <button class="inline-btn small" data-mark-outfit-worn="${rec.key}">Wore this</button>
      </div>
    </article>
  `;
}

function renderBuyNext() {
  const recs = getPurchaseSuggestions(appState.items, appState.buyNextQuery).slice(0, 6);
  return `
    <div class="page-stack split-layout">
      <section class="card">
        <form id="buy-form" class="buy-form">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Purchase simulation query</h3>
              <p class="section-subtitle">This is the wedge feature. Keep it brutally practical.</p>
            </div>
          </div>
          <div class="field-group">
            <label for="buy-budget">Budget tier</label>
            <select id="buy-budget" name="budgetTier">
              ${renderOptions([
                {value:'low', label:'Low'},
                {value:'medium', label:'Medium'},
                {value:'high', label:'High'}
              ], appState.buyNextQuery.budgetTier)}
            </select>
          </div>
          <div class="field-group">
            <label for="buy-occasion">Target occasion</label>
            <select id="buy-occasion" name="targetOccasion">
              ${renderOptions(OCCASIONS.map(o => ({value:o, label:labelize(o)})), appState.buyNextQuery.targetOccasion)}
            </select>
          </div>
          <div class="field-group">
            <label for="buy-season">Season</label>
            <select id="buy-season" name="season">
              ${renderOptions([{value:'all',label:'All seasons'}, ...SEASONS.map(s => ({value:s,label:labelize(s)}))], appState.buyNextQuery.season)}
            </select>
          </div>
          <div class="field-group">
            <label for="buy-category">Preferred category</label>
            <select id="buy-category" name="preferredCategory">
              ${renderOptions([{value:'all',label:'Any category'}, ...CATEGORY_OPTIONS], appState.buyNextQuery.preferredCategory)}
            </select>
          </div>
          <div class="field-group">
            <label for="buy-duplicates">Duplicate guard</label>
            <select id="buy-duplicates" name="avoidDuplicates">
              ${renderOptions([
                {value:'true', label:'Avoid obvious duplicates'},
                {value:'false', label:'Show all candidates'}
              ], String(appState.buyNextQuery.avoidDuplicates))}
            </select>
          </div>
          <button class="primary-btn" type="submit">Run buy-next analysis</button>
        </form>
      </section>

      <section class="recommendation-list">
        ${recs.length ? recs.map(renderPurchaseCard).join('') : document.getElementById('empty-state-template').innerHTML}
      </section>
    </div>
  `;
}

function renderPurchaseCard(rec) {
  return `
    <article class="recommendation-card">
      <div class="recommendation-head">
        <div>
          <h4>${escapeHtml(rec.name)}</h4>
          <p>${escapeHtml(rec.reason)}</p>
        </div>
        <span class="score-pill">${rec.unlockCount} unlocks</span>
      </div>
      <div class="item-strip">
        <span class="item-chip">${labelize(rec.category)}</span>
        <span class="item-chip">${labelize(rec.primaryColor)}</span>
        <span class="item-chip">Confidence · ${labelize(rec.confidence)}</span>
        ${rec.riskFlags.map(flag => `<span class="item-chip">${escapeHtml(flag)}</span>`).join('')}
      </div>
      <div class="score-breakdown">
        ${Object.entries(rec.coverageDelta).map(([key, value]) => `
          <div class="score-cell">
            <span>${labelize(key)}</span>
            <strong>${value}</strong>
          </div>
        `).join('')}
      </div>
      <div class="item-strip">
        ${rec.impactedItems.map(item => `<span class="item-chip">${escapeHtml(item)}</span>`).join('')}
      </div>
    </article>
  `;
}

function renderPack() {
  const plan = getPackPlan(appState.items, appState.packQuery);
  return `
    <div class="page-stack split-layout">
      <section class="card">
        <form id="pack-form" class="pack-form">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Trip capsule planner</h3>
              <p class="section-subtitle">A sticky wedge after the closet is set up.</p>
            </div>
          </div>
          <div class="field-group">
            <label for="pack-days">Trip length</label>
            <input id="pack-days" name="tripLengthDays" type="number" min="1" max="21" value="${appState.packQuery.tripLengthDays}">
          </div>
          <div class="field-group">
            <label for="pack-occasion">Primary occasion</label>
            <select id="pack-occasion" name="primaryOccasion">
              ${renderOptions([
                {value:'mixed', label:'Mixed'},
                ...OCCASIONS.map(o => ({value:o, label:labelize(o)}))
              ], appState.packQuery.primaryOccasion)}
            </select>
          </div>
          <div class="field-group">
            <label for="pack-weather">Weather</label>
            <select id="pack-weather" name="weather">
              ${renderOptions([
                {value:'hot', label:'Hot'},
                {value:'mild', label:'Mild'},
                {value:'cold', label:'Cold'}
              ], appState.packQuery.weather)}
            </select>
          </div>
          <div class="field-group">
            <label for="pack-laundry">Laundry access</label>
            <select id="pack-laundry" name="laundryAccess">
              ${renderOptions([
                {value:'false', label:'No laundry'},
                {value:'true', label:'Laundry available'}
              ], String(appState.packQuery.laundryAccess))}
            </select>
          </div>
          <div class="field-group">
            <label for="pack-shoes">Shoe limit</label>
            <input id="pack-shoes" name="shoeLimit" type="number" min="1" max="4" value="${appState.packQuery.shoeLimit}">
          </div>
          <button class="primary-btn" type="submit">Build packing plan</button>
        </form>
      </section>

      <section class="page-stack">
        <div class="card highlight">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Recommended capsule</h3>
              <p class="section-subtitle">${escapeHtml(plan.note)}</p>
            </div>
            <span class="score-pill">${plan.outfitCount} outfits</span>
          </div>
          <div class="item-strip">
            ${plan.items.map(item => `<span class="item-chip">${escapeHtml(item.name)}</span>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Packing breakdown</h3>
              <p class="section-subtitle">Keep the set small but flexible.</p>
            </div>
          </div>
          <dl>
            <div class="kv"><dt>Tops</dt><dd>${plan.counts.top}</dd></div>
            <div class="kv"><dt>Bottoms</dt><dd>${plan.counts.bottom}</dd></div>
            <div class="kv"><dt>Layers</dt><dd>${plan.counts.layer}</dd></div>
            <div class="kv"><dt>Outerwear</dt><dd>${plan.counts.outerwear}</dd></div>
            <div class="kv"><dt>Shoes</dt><dd>${plan.counts.shoes}</dd></div>
          </dl>
        </div>
      </section>
    </div>
  `;
}

function renderInsights() {
  const coverage = getOccasionCoverage(appState.items);
  const duplicates = getDuplicateClusters(appState.items);
  const underused = getUnderusedItems(appState.items).slice(0, 8);
  const composition = getCategoryComposition(appState.items);
  return `
    <div class="page-stack">
      <section class="grid-2">
        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Occasion coverage map</h3>
              <p class="section-subtitle">This is how balanced the current closet actually is.</p>
            </div>
          </div>
          <div class="coverage-list">
            ${coverage.map(row => `
              <div class="coverage-row">
                <strong>${labelize(row.occasion)}</strong>
                <div class="bar-track"><div class="bar-fill" style="width:${row.score}%"></div></div>
                <span>${row.score}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Category composition</h3>
              <p class="section-subtitle">Wardrobe shape matters as much as item count.</p>
            </div>
          </div>
          <div class="coverage-list">
            ${composition.map(row => `
              <div class="coverage-row">
                <strong>${labelize(row.category)}</strong>
                <div class="bar-track"><div class="bar-fill" style="width:${row.percent}%"></div></div>
                <span>${row.count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <section class="grid-2">
        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Duplicate clusters</h3>
              <p class="section-subtitle">Redundancy is useful to spot before recommending new purchases.</p>
            </div>
          </div>
          ${duplicates.length ? `
            <table class="table-lite">
              <thead>
                <tr><th>Cluster</th><th>Count</th><th>Items</th></tr>
              </thead>
              <tbody>
                ${duplicates.map(cluster => `
                  <tr>
                    <td>${escapeHtml(cluster.label)}</td>
                    <td>${cluster.count}</td>
                    <td>${cluster.items.map(item => escapeHtml(item.name)).join(', ')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : `<div class="notice">No obvious duplicate clusters right now.</div>`}
        </div>

        <div class="card">
          <div class="card-title-row">
            <div>
              <h3 class="section-title">Underused item list</h3>
              <p class="section-subtitle">This should drive revival suggestions and shopping restraint.</p>
            </div>
          </div>
          <table class="table-lite">
            <thead>
              <tr><th>Item</th><th>Wear count</th><th>Suggested contexts</th></tr>
            </thead>
            <tbody>
              ${underused.map(item => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${item.wearCount}</td>
                  <td>${escapeHtml(suggestContextsForItem(item).slice(0,3).join(', '))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function renderOptions(options, selected) {
  return options.map(option => {
    const value = typeof option === 'string' ? option : option.value;
    const label = typeof option === 'string' ? option : option.label;
    return `<option value="${escapeHtml(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');
}

function filterItems(items, filters) {
  return items.filter(item => {
    if (item.status !== 'active') return false;
    if (filters.search) {
      const hay = `${item.name} ${item.material} ${item.subcategory}`.toLowerCase();
      if (!hay.includes(filters.search.toLowerCase())) return false;
    }
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    if (filters.color !== 'all' && item.primaryColor !== filters.color) return false;
    if (filters.occasion !== 'all' && !(item.occasions || []).includes(filters.occasion)) return false;
    return true;
  });
}

function getDashboardStats(items) {
  const activeItems = items.filter(i => i.status === 'active');
  const categoryCount = new Set(activeItems.map(i => i.category)).size;
  const readyOutfitCount = getOutfitSuggestions(items, {
    occasion:'smart-casual',
    temperatureBand:'mild',
    weather:'dry',
    dressLevel:'smart-casual',
    preferLeastWorn:true,
    freshnessBias:35
  }).filter(r => r.score >= 74).length;
  const underusedCount = getUnderusedItems(items).length;
  return {
    activeCount: activeItems.length,
    categoryCount,
    readyOutfitCount,
    underusedCount
  };
}

function getUnderusedItems(items) {
  const now = Date.now();
  return items
    .filter(item => item.status === 'active')
    .map(item => {
      const daysSince = item.lastWornAt ? Math.floor((now - new Date(item.lastWornAt).getTime()) / 86400000) : 999;
      return {...item, daysSinceLastWorn: daysSince};
    })
    .filter(item => item.wearCount <= 1 || item.daysSinceLastWorn > 35)
    .sort((a,b) => (a.wearCount - b.wearCount) || (b.daysSinceLastWorn - a.daysSinceLastWorn));
}

function suggestContextsForItem(item) {
  const suggestions = new Set(item.occasions || []);
  if (item.category === 'layer' || item.category === 'outerwear') suggestions.add('travel');
  if (item.formality >= 3) suggestions.add('work');
  if (['burgundy','navy','olive'].includes(item.primaryColor)) suggestions.add('smart-casual');
  return [...suggestions];
}

function getDuplicateClusters(items) {
  const map = new Map();
  items.filter(i => i.status === 'active').forEach(item => {
    const key = `${item.category}|${item.primaryColor}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return [...map.entries()]
    .map(([key, grouped]) => ({
      key,
      label: `${labelize(grouped[0].primaryColor)} ${labelize(grouped[0].category)}`,
      count: grouped.length,
      items: grouped
    }))
    .filter(cluster => cluster.count >= 2)
    .sort((a,b) => b.count - a.count);
}

function getCategoryComposition(items) {
  const activeItems = items.filter(i => i.status === 'active');
  const total = Math.max(activeItems.length, 1);
  const counts = {};
  activeItems.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([category, count]) => ({category, count, percent: Math.round(count / total * 100)}))
    .sort((a,b) => b.count - a.count);
}

function getOccasionCoverage(items) {
  return ['casual','smart-casual','work','dinner','travel','formal'].map(occasion => {
    const recs = getOutfitSuggestions(items, {
      occasion,
      temperatureBand: occasion === 'formal' ? 'mild' : 'mild',
      weather:'dry',
      dressLevel: occasion,
      preferLeastWorn:false,
      freshnessBias:20
    });
    const high = recs.filter(rec => rec.score >= 72).length;
    const score = Math.min(100, high * 14 + Math.min(recs.length, 5) * 6);
    return {occasion, score};
  });
}

function getActiveItemsByCategory(items, category) {
  return items.filter(item => item.status === 'active' && item.category === category);
}

function getOutfitSuggestions(items, query) {
  const tops = getActiveItemsByCategory(items, 'top');
  const bottoms = getActiveItemsByCategory(items, 'bottom');
  const layers = [...getActiveItemsByCategory(items, 'layer'), ...getActiveItemsByCategory(items, 'outerwear')];
  const shoes = getActiveItemsByCategory(items, 'shoes');

  const results = [];
  for (const top of tops) {
    for (const bottom of bottoms) {
      const baseLayerOptions = [null, ...layers];
      for (const layer of baseLayerOptions) {
        const shoeOptions = shoes.length ? shoes : [null];
        for (const shoe of shoeOptions) {
          const outfitItems = [top, bottom];
          if (layer) outfitItems.push(layer);
          if (shoe) outfitItems.push(shoe);
          const evaluation = scoreOutfit(outfitItems, query);
          if (evaluation.valid) {
            results.push({
              key: outfitKey(outfitItems),
              items: outfitItems,
              score: evaluation.score,
              scoreBreakdown: evaluation.breakdown,
              rationale: evaluation.rationale
            });
          }
        }
      }
    }
  }

  const deduped = dedupeBy(results, rec => rec.key)
    .sort((a,b) => b.score - a.score)
    .slice(0, 24);

  return deduped;
}

function outfitKey(items) {
  return items.map(item => item.id).join('|');
}

function dedupeBy(list, keyFn) {
  const map = new Map();
  list.forEach(item => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  });
  return [...map.values()];
}

function scoreOutfit(items, query) {
  const top = items.find(i => i.category === 'top');
  const bottom = items.find(i => i.category === 'bottom');
  const layer = items.find(i => i.category === 'layer' || i.category === 'outerwear');
  const shoe = items.find(i => i.category === 'shoes');

  if (!top || !bottom) return {valid:false};

  const formalityTarget = DRESS_LEVEL_TO_FORMALITY[query.dressLevel] || 3;
  const avgFormality = average(items.map(i => i.formality || 2));
  const formalityGap = Math.abs(avgFormality - formalityTarget);

  if (formalityGap > 1.8) return {valid:false};

  const occasionScore = sum(items.map(item => occasionFit(item, query.occasion)));
  if (occasionScore < 8) return {valid:false};

  const seasonScore = sum(items.map(item => seasonFit(item, query.temperatureBand)));
  if (seasonScore < 8) return {valid:false};

  const colorScore = Math.round((
    colorCompatibility(top.primaryColor, bottom.primaryColor) +
    (layer ? colorCompatibility(layer.primaryColor, bottom.primaryColor) : 8) +
    (shoe ? colorCompatibility(shoe.primaryColor, bottom.primaryColor) : 7)
  ) / 3 * 2.2);

  const formalityScore = Math.max(8, Math.round(24 - formalityGap * 8));
  const weatherScore = Math.round(weatherFit(items, query.temperatureBand, query.weather));
  const rotationScore = query.preferLeastWorn ? Math.round(rotationBoost(items, query.freshnessBias)) : 8;

  const total = clamp(colorScore + occasionScore + formalityScore + weatherScore + rotationScore, 0, 100);
  if (total < 60) return {valid:false};

  return {
    valid:true,
    score: total,
    breakdown:{
      occasion: occasionScore,
      color: colorScore,
      formality: formalityScore,
      weather: weatherScore,
      rotation: rotationScore
    },
    rationale: buildOutfitRationale({top, bottom, layer, shoe, total, occasionScore, colorScore, rotationScore}, query)
  };
}

function occasionFit(item, occasion) {
  if ((item.occasions || []).includes(occasion)) return 8;
  if (occasion === 'work' && item.formality >= 3) return 6;
  if (occasion === 'dinner' && item.formality >= 2) return 5;
  if (occasion === 'formal' && item.formality >= 4) return 8;
  if (occasion === 'casual' && item.formality <= 2) return 6;
  if (occasion === 'travel' && ['top','bottom','layer','outerwear','shoes'].includes(item.category)) return 4;
  if (occasion === 'smart-casual' && item.formality >= 2 && item.formality <= 4) return 6;
  return 2;
}

function seasonFit(item, temperatureBand) {
  const seasons = item.seasons || [];
  if (seasons.includes('all')) return 5;
  if (temperatureBand === 'hot') {
    if (item.warmth >= 4) return 1;
    if (seasons.includes('summer') || seasons.includes('spring')) return 5;
    return 3;
  }
  if (temperatureBand === 'cold') {
    if (item.warmth <= 1) return 2;
    if (seasons.includes('winter') || seasons.includes('fall')) return 5;
    return 4;
  }
  if (seasons.includes('spring') || seasons.includes('fall') || seasons.includes('summer') || seasons.includes('winter')) return 4;
  return 3;
}

function weatherFit(items, temperatureBand, weather) {
  let score = 16;
  const hasLayer = items.some(i => i.category === 'layer' || i.category === 'outerwear');
  const avgWarmth = average(items.map(i => i.warmth || 2));
  if (temperatureBand === 'cold') {
    if (!hasLayer) score -= 6;
    if (avgWarmth < 2.2) score -= 4;
  }
  if (temperatureBand === 'hot') {
    if (hasLayer) score -= 4;
    if (avgWarmth > 2.6) score -= 4;
  }
  if (weather === 'rainy') {
    if (!items.some(i => i.category === 'outerwear')) score -= 2;
  }
  return clamp(score, 6, 18);
}

function rotationBoost(items, freshnessBias) {
  const lowWear = average(items.map(i => Math.max(0, 12 - Math.min(i.wearCount || 0, 12))));
  return clamp(4 + lowWear * (freshnessBias / 100), 4, 16);
}

function buildOutfitRationale(meta, query) {
  const bits = [];
  if (meta.colorScore >= 18) bits.push('strong color pairing');
  else bits.push('balanced color pairing');

  if (meta.occasionScore >= 20) bits.push(`clear ${query.occasion} fit`);
  else bits.push(`good enough for ${query.occasion}`);

  if (meta.rotationScore >= 11) bits.push('rotation boost from lower-wear pieces');
  if (meta.layer && query.temperatureBand === 'cold') bits.push('layer support for cooler weather');

  return `${capitalize(bits[0])}, ${bits[1]}${bits[2] ? ', plus ' + bits[2] : ''}${bits[3] ? ', and ' + bits[3] : ''}.`;
}

function colorCompatibility(a, b) {
  if (a === b) return ['navy','charcoal','gray','white','cream'].includes(a) ? 8 : 6;
  return (COLOR_COMPATIBILITY[a] && COLOR_COMPATIBILITY[a][b]) ||
         (COLOR_COMPATIBILITY[b] && COLOR_COMPATIBILITY[b][a]) || 5;
}

function getPurchaseSuggestions(items, query) {
  const targetOccasion = query.targetOccasion || 'smart-casual';
  const baseOutfits = getOutfitSuggestions(items, {
    occasion: targetOccasion,
    temperatureBand: query.season === 'summer' ? 'hot' : query.season === 'winter' ? 'cold' : 'mild',
    weather:'dry',
    dressLevel: targetOccasion,
    preferLeastWorn:false,
    freshnessBias:20
  });
  const baseKeys = new Set(baseOutfits.map(outfit => outfit.key));

  return PURCHASE_CANDIDATES
    .filter(candidate => query.preferredCategory === 'all' || candidate.category === query.preferredCategory)
    .filter(candidate => query.season === 'all' || (candidate.seasons || []).includes(query.season))
    .map(candidate => {
      const duplicateItems = items.filter(item => item.status === 'active' && item.category === candidate.category && item.primaryColor === candidate.primaryColor);
      if (query.avoidDuplicates && duplicateItems.length >= 1) {
        return {...candidate, unlockCount:0, score:-999, coverageDelta:{[targetOccasion]:0}, confidence:'low', reason:'Too close to an item already in the closet.', impactedItems:[], riskFlags:['Duplicate risk']};
      }

      const virtualItem = {
        id:`candidate_${candidate.key}`,
        name:candidate.name,
        category:candidate.category,
        subcategory:candidate.subcategory,
        primaryColor:candidate.primaryColor,
        pattern:candidate.pattern || 'solid',
        material:candidate.material || 'cotton',
        warmth:candidate.warmth || 2,
        formality:candidate.formality || 2,
        seasons:candidate.seasons || ['spring','fall'],
        occasions:candidate.occasions || [targetOccasion],
        wearCount:0,
        lastWornAt:null,
        status:'active',
        imageData:createPlaceholderImage(candidate)
      };

      const futureOutfits = getOutfitSuggestions([...items, virtualItem], {
        occasion: targetOccasion,
        temperatureBand: query.season === 'summer' ? 'hot' : query.season === 'winter' ? 'cold' : 'mild',
        weather:'dry',
        dressLevel: targetOccasion,
        preferLeastWorn:false,
        freshnessBias:15
      });

      const unlocked = futureOutfits.filter(outfit => outfit.items.some(item => item.id === virtualItem.id) && !baseKeys.has(outfit.key.replace(virtualItem.id, '')));
      const highConfidence = unlocked.filter(outfit => outfit.score >= 72);
      const impactedItems = [...new Set(unlocked.flatMap(outfit => outfit.items.filter(item => item.id !== virtualItem.id).map(item => item.name)))].slice(0, 5);

      const coverageDelta = {
        [targetOccasion]: highConfidence.length
      };

      const riskFlags = [];
      if (duplicateItems.length) riskFlags.push('Similar item already owned');
      const score = highConfidence.length * 10 + impactedItems.length * 2 - duplicateItems.length * 12;
      const confidence = highConfidence.length >= 8 ? 'high' : highConfidence.length >= 4 ? 'medium' : 'low';
      const reason = highConfidence.length
        ? `${candidate.name} links ${impactedItems.length || 1} existing pieces and improves ${targetOccasion} coverage without forcing a full wardrobe reset.`
        : `${candidate.name} adds limited incremental value for the current closet shape.`;

      return {
        ...candidate,
        unlockCount: highConfidence.length,
        score,
        coverageDelta,
        confidence,
        reason,
        impactedItems,
        riskFlags
      };
    })
    .filter(rec => rec.unlockCount > 0 || !query.avoidDuplicates)
    .sort((a,b) => b.score - a.score || b.unlockCount - a.unlockCount);
}

function getPackPlan(items, query) {
  const topCount = query.laundryAccess ? Math.min(3, query.tripLengthDays) : Math.min(4, Math.ceil(query.tripLengthDays * 0.75));
  const bottomCount = query.tripLengthDays <= 3 ? 1 : 2;
  const layerCount = query.weather === 'cold' ? 2 : 1;
  const outerwearCount = query.weather === 'cold' ? 1 : 0;
  const shoeCount = Math.max(1, Number(query.shoeLimit) || 2);

  const preferredOccasion = query.primaryOccasion === 'mixed' ? 'smart-casual' : query.primaryOccasion;

  const tops = getActiveItemsByCategory(items, 'top').sort(sortForCapsule(preferredOccasion)).slice(0, topCount);
  const bottoms = getActiveItemsByCategory(items, 'bottom').sort(sortForCapsule(preferredOccasion)).slice(0, bottomCount);
  const layers = getActiveItemsByCategory(items, 'layer').sort(sortForCapsule(preferredOccasion)).slice(0, layerCount);
  const outerwear = getActiveItemsByCategory(items, 'outerwear').sort(sortForCapsule(preferredOccasion)).slice(0, outerwearCount);
  const shoes = getActiveItemsByCategory(items, 'shoes').sort(sortForCapsule(preferredOccasion)).slice(0, shoeCount);

  const allItems = [...tops, ...bottoms, ...layers, ...outerwear, ...shoes];
  const outfitCount = Math.max(1, tops.length * bottoms.length * Math.max(1, Math.min(2, shoes.length)));
  const note = query.primaryOccasion === 'mixed'
    ? 'Built to cover mixed use without overpacking.'
    : `Built around ${preferredOccasion} as the main trip context.`;

  return {
    items: allItems,
    outfitCount,
    note,
    counts:{
      top: tops.length,
      bottom: bottoms.length,
      layer: layers.length,
      outerwear: outerwear.length,
      shoes: shoes.length
    }
  };
}

function sortForCapsule(occasion) {
  return (a, b) => {
    const aFit = occasionFit(a, occasion);
    const bFit = occasionFit(b, occasion);
    if (bFit !== aFit) return bFit - aFit;
    return (a.wearCount || 0) - (b.wearCount || 0);
  };
}

function labelize(value) {
  return String(value || '')
    .replaceAll('-', ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : '';
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function showItemModal(itemId) {
  const item = appState.items.find(entry => entry.id === itemId);
  if (!item) return;
  const compatible = findCompatibleItems(item).slice(0, 6);
  const modalContent = `
    <div class="modal-stack">
      <div class="card-title-row">
        <div>
          <h3 class="section-title">${escapeHtml(item.name)}</h3>
          <p class="section-subtitle">${labelize(item.category)} · ${escapeHtml(item.primaryColor)} · ${escapeHtml(item.subcategory || 'core piece')}</p>
        </div>
        <span class="pill">${item.wearCount} wears</span>
      </div>
      <div class="modal-image">
        <img src="${item.imageData}" alt="${escapeHtml(item.name)}">
      </div>
      <dl>
        <div class="kv"><dt>Material</dt><dd>${escapeHtml(item.material)}</dd></div>
        <div class="kv"><dt>Pattern</dt><dd>${escapeHtml(item.pattern)}</dd></div>
        <div class="kv"><dt>Formality</dt><dd>${item.formality}/5</dd></div>
        <div class="kv"><dt>Warmth</dt><dd>${item.warmth}/5</dd></div>
        <div class="kv"><dt>Occasions</dt><dd>${(item.occasions || []).map(labelize).join(', ')}</dd></div>
      </dl>
      <div>
        <h4>Likely pairings</h4>
        <div class="item-strip">
          ${compatible.length ? compatible.map(entry => `<span class="item-chip">${escapeHtml(entry.name)}</span>`).join('') : '<span class="item-chip">No pairings found yet</span>'}
        </div>
      </div>
      <div class="item-actions">
        <button class="primary-btn" data-mark-worn="${item.id}">Mark worn</button>
        <button class="secondary-btn" data-archive-item="${item.id}">Archive item</button>
      </div>
    </div>
  `;
  document.getElementById('modal-content').innerHTML = modalContent;
  document.getElementById('item-modal').classList.remove('hidden');
  document.getElementById('item-modal').setAttribute('aria-hidden', 'false');
}

function closeItemModal() {
  document.getElementById('item-modal').classList.add('hidden');
  document.getElementById('item-modal').setAttribute('aria-hidden', 'true');
}

function findCompatibleItems(item) {
  return appState.items
    .filter(other => other.id !== item.id && other.status === 'active')
    .map(other => {
      const color = colorCompatibility(item.primaryColor, other.primaryColor);
      const form = 10 - Math.abs((item.formality || 2) - (other.formality || 2)) * 2;
      const occasionOverlap = (item.occasions || []).filter(o => (other.occasions || []).includes(o)).length * 3;
      return {other, score: color + form + occasionOverlap};
    })
    .sort((a,b) => b.score - a.score)
    .map(entry => entry.other);
}

function markWorn(itemId) {
  const nextItems = appState.items.map(item => item.id === itemId
    ? {...item, wearCount:(item.wearCount || 0) + 1, lastWornAt:new Date().toISOString(), updatedAt:new Date().toISOString()}
    : item
  );
  saveAndRender({...appState, items: nextItems});
  toast('Wear count updated.');
}

function archiveItem(itemId) {
  const nextItems = appState.items.map(item => item.id === itemId
    ? {...item, status:'archived', updatedAt:new Date().toISOString()}
    : item
  );
  saveAndRender({...appState, items: nextItems});
  closeItemModal();
  toast('Item archived.');
}

function saveOutfitFromKey(outfitKeyValue) {
  const outfit = getOutfitSuggestions(appState.items, appState.outfitQuery).find(entry => entry.key === outfitKeyValue);
  if (!outfit) return;
  const saved = [...appState.savedOutfits, {id:'outfit_' + Math.random().toString(36).slice(2,8), key:outfit.key, name: outfit.items.map(i => i.name).join(' + '), createdAt:new Date().toISOString()}];
  saveAndRender({...appState, savedOutfits: saved});
  toast('Outfit saved.');
}

function markOutfitWorn(outfitKeyValue) {
  const outfit = getOutfitSuggestions(appState.items, appState.outfitQuery).find(entry => entry.key === outfitKeyValue);
  if (!outfit) return;
  let nextItems = appState.items;
  outfit.items.forEach(item => {
    nextItems = nextItems.map(current => current.id === item.id
      ? {...current, wearCount:(current.wearCount || 0) + 1, lastWornAt:new Date().toISOString(), updatedAt:new Date().toISOString()}
      : current
    );
  });
  saveAndRender({...appState, items: nextItems});
  toast('Outfit recorded as worn.');
}

function updateClosetFiltersFromDom() {
  const next = {
    search: document.getElementById('filter-search')?.value || '',
    category: document.getElementById('filter-category')?.value || 'all',
    color: document.getElementById('filter-color')?.value || 'all',
    occasion: document.getElementById('filter-occasion')?.value || 'all'
  };
  saveAndRender({...appState, closetFilters: next});
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

async function handleImageUpload(file) {
  if (!file) return;
  const compressed = await resizeImageToDataUrl(file, 1200, 0.78);
  const color = await estimateDominantColorFamily(compressed);
  const draft = {
    ...(appState.addItemDraft || EMPTY_DRAFT()),
    imageData: compressed,
    imageName: file.name,
    primaryColor: color || (appState.addItemDraft?.primaryColor || 'navy')
  };
  saveAndRender({...appState, addItemDraft: draft});
  toast(`Image processed locally. Suggested color: ${labelize(draft.primaryColor)}.`);
}

function resizeImageToDataUrl(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function estimateDominantColorFamily(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const sample = 32;
      canvas.width = sample;
      canvas.height = sample;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0, sample, sample);
      const {data} = ctx.getImageData(0, 0, sample, sample);
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 40) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count += 1;
      }
      if (!count) {
        resolve('navy');
        return;
      }
      const avg = {r: r / count, g: g / count, b: b / count};
      resolve(nearestColor(avg));
    };
    image.onerror = () => resolve('navy');
    image.src = dataUrl;
  });
}

function nearestColor(avg) {
  let bestColor = 'navy';
  let bestDistance = Infinity;
  Object.entries(COLOR_HEX).forEach(([name, hex]) => {
    const rgb = hexToRgb(hex);
    const distance = Math.sqrt(
      Math.pow(avg.r - rgb.r, 2) +
      Math.pow(avg.g - rgb.g, 2) +
      Math.pow(avg.b - rgb.b, 2)
    );
    if (distance < bestDistance) {
      bestDistance = distance;
      bestColor = name;
    }
  });
  return bestColor;
}

function hexToRgb(hex) {
  const raw = hex.replace('#','');
  const full = raw.length === 3 ? raw.split('').map(char => char + char).join('') : raw;
  return {
    r: parseInt(full.slice(0,2), 16),
    g: parseInt(full.slice(2,4), 16),
    b: parseInt(full.slice(4,6), 16)
  };
}

function setView(view) {
  saveAndRender({...appState, currentView:view});
}

document.addEventListener('click', (event) => {
  const navLink = event.target.closest('.nav-link');
  if (navLink) {
    setView(navLink.dataset.view);
    return;
  }

  const goView = event.target.closest('[data-go-view]');
  if (goView) {
    setView(goView.dataset.goView);
    return;
  }

  const openItem = event.target.closest('[data-open-item]');
  if (openItem && !event.target.closest('[data-mark-worn]') && !event.target.closest('[data-archive-item]')) {
    showItemModal(openItem.dataset.openItem);
    return;
  }

  const mark = event.target.closest('[data-mark-worn]');
  if (mark) {
    markWorn(mark.dataset.markWorn);
    return;
  }

  const archive = event.target.closest('[data-archive-item]');
  if (archive) {
    archiveItem(archive.dataset.archiveItem);
    return;
  }

  const saveOutfitBtn = event.target.closest('[data-save-outfit]');
  if (saveOutfitBtn) {
    saveOutfitFromKey(saveOutfitBtn.dataset.saveOutfit);
    return;
  }

  const markOutfitBtn = event.target.closest('[data-mark-outfit-worn]');
  if (markOutfitBtn) {
    markOutfitWorn(markOutfitBtn.dataset.markOutfitWorn);
    return;
  }

  const toggleArrayBtn = event.target.closest('[data-toggle-array]');
  if (toggleArrayBtn) {
    const arrayKey = toggleArrayBtn.dataset.toggleArray;
    const value = toggleArrayBtn.dataset.value;
    const draft = {...(appState.addItemDraft || EMPTY_DRAFT())};
    const current = new Set(draft[arrayKey] || []);
    if (current.has(value)) current.delete(value); else current.add(value);
    draft[arrayKey] = [...current];
    saveAndRender({...appState, addItemDraft:draft});
    return;
  }

  if (event.target.id === 'clear-draft') {
    saveAndRender({...appState, addItemDraft: EMPTY_DRAFT()});
    toast('Draft cleared.');
    return;
  }

  if (event.target.id === 'jump-add') {
    setView('add-item');
    return;
  }

  if (event.target.id === 'seed-sample') {
    const next = createSeedState();
    next.currentView = appState.currentView;
    saveAndRender(next);
    toast('Sample closet seeded.');
    return;
  }

  if (event.target.id === 'reset-demo') {
    const next = createSeedState();
    saveAndRender(next);
    closeItemModal();
    toast('Prototype reset.');
    return;
  }

  if (event.target.closest('[data-close-modal]')) {
    closeItemModal();
    return;
  }
});

document.addEventListener('change', async (event) => {
  if (['filter-search','filter-category','filter-color','filter-occasion'].includes(event.target.id)) {
    updateClosetFiltersFromDom();
    return;
  }

  if (event.target.id === 'item-image-input') {
    const file = event.target.files?.[0];
    if (file) await handleImageUpload(file);
    return;
  }

  if (event.target.closest('#add-item-form')) {
    const form = document.getElementById('add-item-form');
    const draft = collectAddItemDraft(form);
    saveAndRender({...appState, addItemDraft: {...appState.addItemDraft, ...draft}});
    return;
  }
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'add-item-form') {
    event.preventDefault();
    const form = event.target;
    const draft = collectAddItemDraft(form);
    if (!draft.name.trim()) {
      toast('Item name is required.');
      return;
    }
    const item = {
      id: cryptoId(),
      ...draft,
      imageData: appState.addItemDraft?.imageData || createPlaceholderImage(draft),
      wearCount: 0,
      lastWornAt: null,
      status:'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const nextItems = [item, ...appState.items];
    saveAndRender({...appState, items: nextItems, currentView:'closet', addItemDraft: EMPTY_DRAFT()});
    toast('Item added to closet.');
    return;
  }

  if (event.target.id === 'outfit-form') {
    event.preventDefault();
    const formData = new FormData(event.target);
    const nextQuery = {
      occasion: formData.get('occasion'),
      temperatureBand: formData.get('temperatureBand'),
      weather: formData.get('weather'),
      dressLevel: formData.get('dressLevel'),
      preferLeastWorn: formData.get('preferLeastWorn') === 'true',
      freshnessBias: Number(formData.get('freshnessBias') || 35)
    };
    saveAndRender({...appState, outfitQuery: nextQuery});
    return;
  }

  if (event.target.id === 'buy-form') {
    event.preventDefault();
    const formData = new FormData(event.target);
    const nextQuery = {
      budgetTier: formData.get('budgetTier'),
      targetOccasion: formData.get('targetOccasion'),
      season: formData.get('season'),
      preferredCategory: formData.get('preferredCategory'),
      avoidDuplicates: formData.get('avoidDuplicates') === 'true'
    };
    saveAndRender({...appState, buyNextQuery: nextQuery});
    return;
  }

  if (event.target.id === 'pack-form') {
    event.preventDefault();
    const formData = new FormData(event.target);
    const nextQuery = {
      tripLengthDays: Number(formData.get('tripLengthDays') || 4),
      primaryOccasion: formData.get('primaryOccasion'),
      weather: formData.get('weather'),
      laundryAccess: formData.get('laundryAccess') === 'true',
      shoeLimit: Number(formData.get('shoeLimit') || 2)
    };
    saveAndRender({...appState, packQuery: nextQuery});
  }
});

function collectAddItemDraft(form) {
  const fd = new FormData(form);
  return {
    ...(appState.addItemDraft || EMPTY_DRAFT()),
    name: String(fd.get('name') || ''),
    category: String(fd.get('category') || 'top'),
    subcategory: String(fd.get('subcategory') || ''),
    primaryColor: String(fd.get('primaryColor') || 'navy'),
    pattern: String(fd.get('pattern') || 'solid'),
    material: String(fd.get('material') || 'cotton'),
    warmth: Number(fd.get('warmth') || 2),
    formality: Number(fd.get('formality') || 2),
    fitNotes: String(fd.get('fitNotes') || ''),
    brand: String(fd.get('brand') || '')
  };
}

render();