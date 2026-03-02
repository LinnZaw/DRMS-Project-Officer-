const state = {
  isAuthenticated: false,
  reports: [],
  reportsLoaded: false
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

const formatDate = (value) =>
  new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

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

const createReportCard = (report) => `
  <article class="report-card" role="button" tabindex="0" data-report-id="${report.reportId}">
    <div class="row g-3 align-items-center">
      <div class="col-12 col-md-4">
        <p class="small text-muted mb-1">Report ID</p>
        <p class="fw-semibold theme-text mb-0">${report.reportId}</p>
      </div>
      <div class="col-12 col-md-4">
        <p class="small text-muted mb-1">Logistic Officer Name</p>
        <p class="mb-0">${report.logisticOfficerName}</p>
      </div>
      <div class="col-12 col-md-4 text-md-end">
        <p class="small text-muted mb-1">Reported Date</p>
        <p class="mb-0">${formatDate(report.reportedDate)}</p>
      </div>
    </div>
  </article>
`;

const renderStockBalanceList = async () => {
  elements.pageTitle.textContent = 'Stock Balance';
  elements.pageSubtitle.textContent = 'Latest reports sorted by reported date.';
  elements.contentHost.innerHTML = '<div class="text-muted">Loading reports...</div>';

  try {
    if (!state.reportsLoaded) {
      state.reports = await fetchStockBalanceReports();
      state.reportsLoaded = true;
    }

    if (!state.reports.length) {
      elements.contentHost.innerHTML = '<div class="alert alert-info">No Stock Balance Reports Available</div>';
      return;
    }

    elements.contentHost.innerHTML = `
      <section class="report-list">
        ${state.reports.map((report) => createReportCard(report)).join('')}
      </section>
    `;

    const cards = elements.contentHost.querySelectorAll('.report-card');
    cards.forEach((card) => {
      const openDetail = () => {
        window.location.hash = `#/stock-balance/${encodeURIComponent(card.dataset.reportId)}`;
      };

      card.addEventListener('click', openDetail);
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetail();
        }
      });
    });
  } catch {
    elements.contentHost.innerHTML = '<div class="alert alert-danger">Unable to load reports. Please try again later.</div>';
  }
};

const renderStockBalanceDetail = async (reportId) => {
  elements.pageTitle.textContent = 'Stock Balance Detail';
  elements.pageSubtitle.textContent = 'Detailed stock balance report view.';

  if (!reportId) {
    elements.contentHost.innerHTML = '<div class="alert alert-danger">Invalid report ID. Please select a valid report.</div>';
    return;
  }

  elements.contentHost.innerHTML = '<div class="text-muted">Loading report detail...</div>';

  try {
    const report = await fetchStockBalanceReportById(reportId);
    const rows = report.items
      .map(
        (item) => `
          <tr>
            <td>${item.itemName}</td>
            <td>${item.category}</td>
            <td>${item.quantityAvailable}</td>
            <td>${item.unit}</td>
          </tr>
        `
      )
      .join('');

    elements.contentHost.innerHTML = `
      <button id="backToReportsBtn" class="btn btn-outline-primary btn-sm mb-3">Back to Reports</button>

      <article class="detail-card p-4">
        <div class="row g-3 mb-3">
          <div class="col-12 col-md-6"><strong>Report ID:</strong> ${report.reportId}</div>
          <div class="col-12 col-md-6"><strong>Logistic Officer Name:</strong> ${report.logisticOfficerName}</div>
          <div class="col-12 col-md-6"><strong>Reported Date:</strong> ${formatDate(report.reportedDate)}</div>
          <div class="col-12 col-md-6"><strong>Warehouse Name:</strong> ${report.warehouseName || 'N/A'}</div>
          <div class="col-12 col-md-6"><strong>Total Item Count:</strong> ${report.items.length}</div>
          <div class="col-12 col-md-6"><strong>Generated Timestamp:</strong> ${formatDate(report.generatedTimestamp)}</div>
        </div>

        <div class="table-responsive">
          <table class="table table-striped align-middle mb-0">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </article>
    `;

    document.getElementById('backToReportsBtn').addEventListener('click', () => {
      window.location.hash = '#/stock-balance';
    });
  } catch (error) {
    const message =
      error.message === 'invalid_report_id'
        ? 'Invalid report ID. The selected stock balance report was not found.'
        : 'Unable to load report details right now. Please try again later.';

    elements.contentHost.innerHTML = `<div class="alert alert-danger">${message}</div>`;
  }
};

const renderRoute = async () => {
  if (!state.isAuthenticated) return;

  const { mainRoute, routeParam } = parseRoute();
  setActiveNav(mainRoute === 'stock-balance' ? 'stock-balance' : mainRoute);

  if (mainRoute === 'stock-balance' && routeParam) {
    await renderStockBalanceDetail(decodeURIComponent(routeParam));
    return;
  }

  if (mainRoute === 'stock-balance') {
    await renderStockBalanceList();
    return;
  }

  if (mainRoute === 'assign-distribution') {
    renderPlaceholder('Assign Distribution');
    return;
  }

  if (mainRoute === 'beneficiary-data') {
    renderPlaceholder('Manage Beneficiary Data');
    return;
  }

  if (mainRoute === 'distribution-report') {
    renderPlaceholder('Distribution Report');
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
