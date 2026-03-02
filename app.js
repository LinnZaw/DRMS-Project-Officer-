const loginForm = document.getElementById('loginForm');
const loginPage = document.getElementById('loginPage');
const homePage = document.getElementById('homePage');
const errorMessage = document.getElementById('errorMessage');
const logoutBtn = document.getElementById('logoutBtn');
const sidebarNavLinks = document.querySelectorAll('#sidebarNav .nav-link');
const spaViews = document.querySelectorAll('.spa-view');

const defaultOverview = document.getElementById('defaultOverview');
const stockBalanceListView = document.getElementById('stockBalanceListView');
const stockBalanceDetailView = document.getElementById('stockBalanceDetailView');
const placeholderView = document.getElementById('placeholderView');
const placeholderTitle = document.getElementById('placeholderTitle');

const reportCards = document.getElementById('reportCards');
const reportsState = document.getElementById('reportsState');
const detailError = document.getElementById('detailError');
const detailContainer = document.getElementById('detailContainer');
const itemsTableBody = document.getElementById('itemsTableBody');
const backToReportsBtn = document.getElementById('backToReportsBtn');

const demoCredentials = {
  email: 'officer@drms.org',
  password: 'password123'
};

const formatDate = (value) =>
  new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

const showView = (view) => {
  spaViews.forEach((section) => section.classList.add('d-none'));
  view.classList.remove('d-none');
};

const setActiveSidebar = (routeKey) => {
  sidebarNavLinks.forEach((link) => {
    if (link.dataset.route === routeKey) {
      link.classList.add('active');
      return;
    }

    link.classList.remove('active');
  });
};

const renderReportCard = (report) => {
  const card = document.createElement('article');
  card.className = 'report-card report-row p-3';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  card.innerHTML = `
    <div class="row align-items-center g-3">
      <div class="col-md-3">
        <p class="small text-muted mb-1">Report ID</p>
        <p class="mb-0 fw-semibold theme-text">${report.reportId}</p>
      </div>
      <div class="col-md-4">
        <p class="small text-muted mb-1">Logistic Officer Name</p>
        <p class="mb-0">${report.logisticOfficerName}</p>
      </div>
      <div class="col-md-4">
        <p class="small text-muted mb-1">Reported Date</p>
        <p class="mb-0">${formatDate(report.reportedDate)}</p>
      </div>
      <div class="col-md-1 text-md-end">
        <span class="text-muted">›</span>
      </div>
    </div>
  `;

  const openDetail = () => {
    window.location.hash = `#/stock-balance/${encodeURIComponent(report.reportId)}`;
  };

  card.addEventListener('click', openDetail);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetail();
    }
  });

  return card;
};

const renderReportsList = async () => {
  reportCards.innerHTML = '';
  reportsState.classList.add('d-none');

  try {
    const reports = await fetchStockBalanceReports();

    if (reports.length === 0) {
      reportsState.textContent = 'No Stock Balance Reports Available';
      reportsState.classList.remove('d-none');
      return;
    }

    reports.forEach((report) => reportCards.appendChild(renderReportCard(report)));
  } catch (error) {
    reportsState.textContent = 'Unable to load reports. Please try again later.';
    reportsState.classList.remove('d-none');
  }
};

const resetDetailState = () => {
  detailError.classList.add('d-none');
  detailContainer.classList.add('d-none');
  itemsTableBody.innerHTML = '';
};

const renderDetail = (report) => {
  document.getElementById('reportId').textContent = report.reportId;
  document.getElementById('officerName').textContent = report.logisticOfficerName;
  document.getElementById('reportedDate').textContent = formatDate(report.reportedDate);
  document.getElementById('warehouseName').textContent = report.warehouseName || 'N/A';
  document.getElementById('totalItemTypes').textContent = report.items.length;
  document.getElementById('generatedTimestamp').textContent = formatDate(report.generatedTimestamp);

  report.items.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.itemName}</td>
      <td>${item.category}</td>
      <td>${item.quantityAvailable}</td>
      <td>${item.unit}</td>
    `;
    itemsTableBody.appendChild(row);
  });

  detailContainer.classList.remove('d-none');
};

const loadReportDetail = async (reportId) => {
  resetDetailState();

  if (!reportId) {
    detailError.textContent = 'Invalid report ID. Please select a valid stock balance report.';
    detailError.classList.remove('d-none');
    return;
  }

  try {
    const report = await fetchStockBalanceReportById(reportId);
    renderDetail(report);
  } catch (error) {
    detailError.textContent =
      error.message === 'invalid_report_id'
        ? 'Invalid report ID. The selected stock balance report was not found.'
        : 'Unable to load report details right now. Please try again later.';
    detailError.classList.remove('d-none');
  }
};

const renderRoute = async () => {
  const hash = window.location.hash || '#/dashboard';

  if (hash === '#/dashboard') {
    setActiveSidebar('');
    showView(defaultOverview);
    return;
  }

  if (hash === '#/stock-balance') {
    setActiveSidebar('stock-balance');
    showView(stockBalanceListView);
    await renderReportsList();
    return;
  }

  if (hash.startsWith('#/stock-balance/')) {
    setActiveSidebar('stock-balance');
    showView(stockBalanceDetailView);
    const reportId = decodeURIComponent(hash.replace('#/stock-balance/', ''));
    await loadReportDetail(reportId);
    return;
  }

  if (hash === '#/assign-distribution' || hash === '#/manage-beneficiary' || hash === '#/distribution-report') {
    const routeKey = hash.replace('#/', '');
    const titleMap = {
      'assign-distribution': 'Assign Distribution',
      'manage-beneficiary': 'Manage Beneficiary Data',
      'distribution-report': 'Distribution Report'
    };

    setActiveSidebar(routeKey);
    placeholderTitle.textContent = titleMap[routeKey];
    showView(placeholderView);
    return;
  }

  window.location.hash = '#/dashboard';
};

const showDashboard = () => {
  loginPage.classList.add('d-none');
  homePage.classList.remove('d-none');
  homePage.classList.add('page-transition');
  if (!window.location.hash) {
    window.location.hash = '#/dashboard';
  }
  renderRoute();
};

const showLogin = () => {
  homePage.classList.add('d-none');
  loginPage.classList.remove('d-none');
  loginPage.classList.add('page-transition');
};

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (email === demoCredentials.email && password === demoCredentials.password) {
    errorMessage.classList.add('d-none');
    showDashboard();
    return;
  }

  errorMessage.textContent = 'Invalid email or password. Try officer@drms.org / password123';
  errorMessage.classList.remove('d-none');
});

sidebarNavLinks.forEach((link) => {
  link.addEventListener('click', () => {
    sidebarNavLinks.forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});

backToReportsBtn.addEventListener('click', () => {
  window.location.hash = '#/stock-balance';
});

window.addEventListener('hashchange', () => {
  if (!homePage.classList.contains('d-none')) {
    renderRoute();
  }
});

logoutBtn.addEventListener('click', () => {
  loginForm.reset();
  window.location.hash = '#/dashboard';
  showLogin();
});
