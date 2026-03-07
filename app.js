const state = {
  isAuthenticated: false
};

const demoCredentials = { email: 'officer@drms.org', password: 'password123' };

const elements = {
  loginView: document.getElementById('loginView'),
  dashboardView: document.getElementById('dashboardView'),
  loginForm: document.getElementById('loginForm'),
  errorMessage: document.getElementById('errorMessage'),
  logoutBtn: document.getElementById('logoutBtn'),
  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  contentHost: document.getElementById('contentHost'),
  sidebarLinks: document.querySelectorAll('#sidebarNav .nav-link')
};

const STOCK_API_URL = 'http://localhost:8080/api/stocks';

const formatDate = (value) =>
  new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

const formatShortDate = (value) =>
  new Date(value).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });

const getTodayDateValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now.getTime() - offset * 60000);
  return localTime.toISOString().split('T')[0];
};

const setAuthView = () => {
  elements.loginView.classList.toggle('d-none', state.isAuthenticated);
  elements.dashboardView.classList.toggle('d-none', !state.isAuthenticated);
};

const setActiveNav = (route) => {
  elements.sidebarLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.route === route);
  });
};

const parseRoute = () => {
  const hash = window.location.hash || '#/dashboard';
  const [, mainRoute, routeParam] = hash.match(/^#\/([^/]+)\/?(.*)$/) || [];

  return {
    mainRoute: mainRoute || 'dashboard',
    routeParam: routeParam || ''
  };
};

const renderDashboardOverview = () => {
  elements.pageTitle.textContent = 'Dashboard';
  elements.pageSubtitle.textContent = 'Overview of disaster relief operations.';
  elements.contentHost.innerHTML = `
    <article class="organization-card p-4 p-md-5">
      <p class="text-uppercase text-muted small mb-2">Organization Name</p>
      <h4 class="theme-text fw-semibold mb-0">Disaster Relief Management Organization</h4>
    </article>
  `;
};

const renderPlaceholder = (title) => {
  elements.pageTitle.textContent = title;
  elements.pageSubtitle.textContent = 'Module is ready for integration.';
  elements.contentHost.innerHTML = `
    <article class="placeholder-card p-4">
      <h4 class="theme-text h6 mb-2">${title}</h4>
      <p class="mb-0 text-muted">This section is part of the SPA layout and can be connected to backend APIs later.</p>
    </article>
  `;
};

/**
 * Return fallback text for empty/null values.
 */
const displayValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'N/A';
  }

  return value;
};

/**
 * Format stock dates for readable UI.
 */
const formatStockDate = (value) => {
  if (!value) return 'N/A';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return displayValue(value);
  }

  return parsedDate.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};

/**
 * Format stock date+time values for list cards.
 */
const formatStockDateTime = (value) => {
  if (!value) return 'N/A';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return displayValue(value);
  }

  return parsedDate.toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Build quantity + unit text.
 */
const formatQuantityWithUnit = (quantity, unit) => {
  const quantityText = displayValue(quantity);
  const unitText = displayValue(unit);

  if (quantityText === 'N/A' && unitText === 'N/A') {
    return 'N/A';
  }

  if (unitText === 'N/A') {
    return quantityText;
  }

  return `${quantityText} ${unitText}`;
};

/**
 * Normalize API payload to an array of stock records.
 */
const normalizeStockInfo = (payload) => {
  const source = payload?.data?.stockInfos ?? payload?.data ?? payload;

  if (Array.isArray(source)) {
    return source;
  }

  if (source && typeof source === 'object' && ('itemName' in source || 'eventType' in source || 'storageLocation' in source)) {
    return [source];
  }

  return [];
};

/**
 * Return a date value used for sorting stock cards (latest first).
 */
const getReportedDateValue = (stock) => stock.reportedDate || stock.createdDate || stock.updatedDate || stock.manufacturedDate || null;

/**
 * Return a readable stock identifier.
 */
const getStockBalanceId = (stock, index) => displayValue(stock.stockBalanceId || stock.id || `Record-${index + 1}`);

/**
 * Render stock list content with optional status messages.
 */
const renderStockBalanceContent = (messageType, messageText, bodyHtml = '') => {
  const alertClassMap = {
    success: 'alert-success',
    info: 'alert-info',
    error: 'alert-danger'
  };

  const alertClass = alertClassMap[messageType] || 'alert-info';

  elements.contentHost.innerHTML = `
    <section class="fixed-page-shell mx-auto d-flex flex-column gap-3">
      <div class="alert ${alertClass} mb-0" role="alert">${messageText}</div>
      <div class="stock-list-scroll">${bodyHtml}</div>
    </section>
  `;
};

/**
 * Build a long stock summary card for list view.
 */
const createStockSummaryCard = (stock, index) => `
  <article class="stock-summary-card" role="button" tabindex="0" data-stock-index="${index}">
    <div class="row g-3 align-items-center">
      <div class="col-12 col-md-3">
        <p class="small text-muted mb-1">Stock Balance ID</p>
        <p class="fw-semibold theme-text mb-0">${getStockBalanceId(stock, index)}</p>
      </div>
      <div class="col-12 col-md-5">
        <p class="small text-muted mb-1">Storage Location</p>
        <p class="mb-0">${displayValue(stock.storageLocation)}</p>
      </div>
      <div class="col-12 col-md-4 text-md-end">
        <p class="small text-muted mb-1">Reported Date</p>
        <p class="mb-0">${formatStockDateTime(getReportedDateValue(stock))}</p>
      </div>
    </div>
  </article>
`;

/**
 * Build detailed stock card with full fields.
 */
const createStockDetailCard = (stock, index) => `
  <article class="stock-card p-4">
    <div class="row g-3">
      <div class="col-12 col-md-6"><strong>Stock Balance ID:</strong> ${getStockBalanceId(stock, index)}</div>
      <div class="col-12 col-md-6"><strong>Reported Date:</strong> ${formatStockDateTime(getReportedDateValue(stock))}</div>
      <div class="col-12 col-md-6"><strong>Item Name:</strong> ${displayValue(stock.itemName)}</div>
      <div class="col-12 col-md-6"><strong>Event Type:</strong> ${displayValue(stock.eventType)}</div>
      <div class="col-12"><strong>Item Description:</strong> ${displayValue(stock.itemDescription)}</div>
      <div class="col-12 col-md-6"><strong>Type:</strong> ${displayValue(stock.type)}</div>
      <div class="col-12 col-md-6"><strong>Quantity:</strong> ${formatQuantityWithUnit(stock.quantity, stock.unitOfMeasure)}</div>
      <div class="col-12 col-md-6"><strong>Storage Location:</strong> ${displayValue(stock.storageLocation)}</div>
      <div class="col-12 col-md-6"><strong>Manufactured Date:</strong> ${formatStockDate(stock.manufacturedDate)}</div>
      <div class="col-12 col-md-6"><strong>Expired Date:</strong> ${formatStockDate(stock.expiriedDate || stock.expiredDate)}</div>
    </div>
  </article>
`;

/**
 * Render stock list cards and attach click handlers.
 */
const renderStockBalanceListView = (stocks) => {
  renderStockBalanceContent(
    'success',
    'Stock data loaded successfully.',
    `<section class="d-grid gap-3">${stocks.map((stock, index) => createStockSummaryCard(stock, index)).join('')}</section>`
  );

  const cards = elements.contentHost.querySelectorAll('.stock-summary-card');
  cards.forEach((card) => {
    const openDetail = () => {
      const record = stocks[Number(card.dataset.stockIndex)];
      if (record) {
        renderStockBalanceDetailView(record, Number(card.dataset.stockIndex), stocks);
      }
    };

    card.addEventListener('click', openDetail);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetail();
      }
    });
  });
};

/**
 * Render detail view for a selected stock card.
 */
const renderStockBalanceDetailView = (stock, index, stocks) => {
  renderStockBalanceContent(
    'success',
    'Stock data loaded successfully.',
    `
      <div class="mb-3">
        <button id="backToStockListBtn" class="btn btn-outline-primary btn-sm">Back to Stock List</button>
      </div>
      ${createStockDetailCard(stock, index)}
    `
  );

  const backBtn = document.getElementById('backToStockListBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => renderStockBalanceListView(stocks));
  }
};

/**
 * Fetch stock list, sort by latest date, and render list view.
 */
const renderStockBalanceList = async () => {
  elements.pageTitle.textContent = 'Stock Balance';
  elements.pageSubtitle.textContent = 'Stock balance records sorted by latest reported date.';
  renderStockBalanceContent('info', 'Loading stock data...');

  try {
    const response = await fetch(STOCK_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();

    const stocks = normalizeStockInfo(payload).sort((left, right) => {
      const leftDate = new Date(getReportedDateValue(left) || 0).getTime();
      const rightDate = new Date(getReportedDateValue(right) || 0).getTime();
      return rightDate - leftDate;
    });

    if (!stocks.length) {
      renderStockBalanceContent('info', 'No stock data available.');
      return;
    }

    renderStockBalanceListView(stocks);
  } catch {
    renderStockBalanceContent('error', 'Failed to load stock data.');
  }
};

const renderRoute = async () => {
  if (!state.isAuthenticated) return;

  const { mainRoute, routeParam } = parseRoute();
  setActiveNav(mainRoute === 'stock-balance' ? 'stock-balance' : mainRoute);

  if (mainRoute === 'stock-balance') {
    await renderStockBalanceList();
    return;
  }

  renderDashboardOverview();
};

elements.loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (email === demoCredentials.email && password === demoCredentials.password) {
    state.isAuthenticated = true;
    elements.errorMessage.classList.add('d-none');
    setAuthView();

    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    }

    renderRoute();
    return;
  }

  elements.errorMessage.textContent = 'Invalid email or password. Try officer@drms.org / password123';
  elements.errorMessage.classList.remove('d-none');
});

elements.logoutBtn.addEventListener('click', () => {
  state.isAuthenticated = false;
  elements.loginForm.reset();
  window.location.hash = '#/dashboard';
  setAuthView();
});

window.addEventListener('hashchange', renderRoute);

setAuthView();
