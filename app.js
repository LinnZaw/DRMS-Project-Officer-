const state = {
  isAuthenticated: false,
  assignLocationFlash: null
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
const LOCATION_API_URL = 'http://localhost:8080/api/locations';
const USER_API_URL = 'http://localhost:8080/api/users';
const LOCATION_CREATOR_ID = 1;

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

const displayValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'N/A';
  }

  return value;
};

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

const getReportedDateValue = (stock) => stock.reportedDate || stock.createdDate || stock.updatedDate || stock.manufacturedDate || null;

const getStockBalanceId = (stock, index) => displayValue(stock.stockBalanceId || stock.id || `Record-${index + 1}`);

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

const normalizeUsers = (payload) => {
  const source = payload?.data?.users ?? payload?.data ?? payload;

  if (!Array.isArray(source)) {
    return [];
  }

  return source.map((user) => {
    const userId = user.userId ?? user.id;
    const composedName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const userName = user.name || user.userName || user.username || composedName || `User ${displayValue(userId)}`;

    return {
      userId,
      userName
    };
  });
};

const normalizeLocations = (payload) => {
  const source = payload?.data?.locations ?? payload?.data ?? payload;

  if (!Array.isArray(source)) {
    return [];
  }

  return source.map((location) => ({
    locationId: location.locationId ?? location.id,
    locationName: location.locationName ?? location.name ?? 'Unnamed Location',
    staffId: location.staffId ?? location.userId ?? location.assignedStaffId,
    staffName: location.staffName ?? location.assignedStaffName ?? location.assignedStaff
  }));
};

const findUserName = (users, staffId, fallback) => {
  const matched = users.find((user) => String(user.userId) === String(staffId));
  return matched?.userName || fallback || 'Unassigned';
};

const showAssignLocationModal = ({ mode, users, location, onSuccess }) => {
  const isEdit = mode === 'edit';
  const modalWrapper = document.createElement('div');
  modalWrapper.innerHTML = `
    <div class="modal fade" id="assignLocationModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${isEdit ? 'Update Assigned Location' : 'Create Assign Location'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="assignLocationForm" novalidate>
            <div class="modal-body">
              <div id="assignLocationModalAlert" class="alert d-none" role="alert"></div>
              <div class="mb-3">
                <label class="form-label" for="locationNameInput">Location Name</label>
                <input id="locationNameInput" name="locationName" type="text" class="form-control" required value="${isEdit ? location.locationName : ''}" />
              </div>
              <div class="mb-0">
                <label class="form-label" for="staffIdInput">User</label>
                <select id="staffIdInput" name="staffId" class="form-select" required>
                  <option value="">Select user</option>
                  ${users
                    .map(
                      (user) =>
                        `<option value="${user.userId}" ${String(user.userId) === String(location?.staffId || '') ? 'selected' : ''}>${user.userName}</option>`
                    )
                    .join('')}
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-theme">${isEdit ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalWrapper);

  const modalElement = modalWrapper.querySelector('#assignLocationModal');
  const form = modalWrapper.querySelector('#assignLocationForm');
  const alertBox = modalWrapper.querySelector('#assignLocationModalAlert');
  const bootstrapModal = new bootstrap.Modal(modalElement);

  const showAlert = (type, message) => {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const payload = {
      locationName: form.locationName.value.trim(),
      staffId: Number(form.staffId.value)
    };

    try {
      const endpoint = isEdit
        ? `${LOCATION_API_URL}/${encodeURIComponent(location.locationId)}`
        : `${LOCATION_API_URL}/${LOCATION_CREATOR_ID}`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      state.assignLocationFlash = {
        type: 'success',
        text: isEdit ? 'Location assignment updated successfully.' : 'Location assignment created successfully.'
      };
      bootstrapModal.hide();
      await onSuccess();
    } catch {
      showAlert('danger', isEdit ? 'Failed to update location assignment.' : 'Failed to create location assignment.');
    }
  });

  modalElement.addEventListener('hidden.bs.modal', () => {
    bootstrapModal.dispose();
    modalWrapper.remove();
  });

  bootstrapModal.show();
};

const renderAssignLocationPage = async () => {
  elements.pageTitle.textContent = 'Assign Location';
  elements.pageSubtitle.textContent = 'Assign field staff to locations and manage updates.';

  const flash = state.assignLocationFlash;
  state.assignLocationFlash = null;

  elements.contentHost.innerHTML = '<div class="text-muted">Loading assigned locations...</div>';

  try {
    const [usersResponse, locationsResponse] = await Promise.all([fetch(USER_API_URL), fetch(LOCATION_API_URL)]);

    if (!usersResponse.ok || !locationsResponse.ok) {
      throw new Error('request_failed');
    }

    const users = normalizeUsers(await usersResponse.json());
    const locations = normalizeLocations(await locationsResponse.json());

    const tableRows = locations.length
      ? locations
          .map(
            (location) => `
              <tr>
                <td>${displayValue(location.locationName)}</td>
                <td>${displayValue(findUserName(users, location.staffId, location.staffName))}</td>
                <td>
                  <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-outline-primary btn-sm" data-action="edit" data-location-id="${location.locationId}">Update</button>
                    <button class="btn btn-outline-danger btn-sm" data-action="delete" data-location-id="${location.locationId}">Delete</button>
                  </div>
                </td>
              </tr>
            `
          )
          .join('')
      : '<tr><td colspan="3" class="text-center text-muted py-4">No assigned locations found.</td></tr>';

    elements.contentHost.innerHTML = `
      <section class="fixed-page-shell mx-auto w-100 assign-location-shell d-flex flex-column gap-3">
        ${
          flash
            ? `<div class="alert alert-${flash.type} mb-0" role="alert">${flash.text}</div>`
            : ''
        }
        <div class="d-flex justify-content-end">
          <button id="createAssignBtn" class="btn btn-theme">Create Assign</button>
        </div>
        <div class="table-responsive assign-location-table-wrap">
          <table class="table table-hover align-middle mb-0 assign-location-table">
            <thead class="table-light">
              <tr>
                <th scope="col">Location Name</th>
                <th scope="col">Assigned Staff</th>
                <th scope="col" class="text-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </section>
    `;

    const rerender = async () => {
      await renderAssignLocationPage();
    };

    const createBtn = document.getElementById('createAssignBtn');
    createBtn.addEventListener('click', () => {
      showAssignLocationModal({ mode: 'create', users, onSuccess: rerender });
    });

    elements.contentHost.querySelectorAll('[data-action="edit"]').forEach((button) => {
      button.addEventListener('click', () => {
        const location = locations.find((item) => String(item.locationId) === button.dataset.locationId);
        if (!location) return;
        showAssignLocationModal({ mode: 'edit', users, location, onSuccess: rerender });
      });
    });

    elements.contentHost.querySelectorAll('[data-action="delete"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const location = locations.find((item) => String(item.locationId) === button.dataset.locationId);
        if (!location) return;

        const confirmed = window.confirm(`Delete location assignment for "${location.locationName}"?`);
        if (!confirmed) return;

        try {
          const response = await fetch(`${LOCATION_API_URL}/${encodeURIComponent(location.locationId)}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          state.assignLocationFlash = {
            type: 'success',
            text: 'Location assignment deleted successfully.'
          };
          await rerender();
        } catch {
          state.assignLocationFlash = {
            type: 'danger',
            text: 'Failed to delete location assignment.'
          };
          await rerender();
        }
      });
    });
  } catch {
    elements.contentHost.innerHTML = '<div class="alert alert-danger">Unable to load assigned locations. Please try again later.</div>';
  }
};

const renderRoute = async () => {
  if (!state.isAuthenticated) return;

  const { mainRoute } = parseRoute();
  setActiveNav(mainRoute === 'stock-balance' || mainRoute === 'assign-location' ? mainRoute : 'dashboard');

  if (mainRoute === 'stock-balance') {
    await renderStockBalanceList();
    return;
  }

  if (mainRoute === 'assign-location') {
    await renderAssignLocationPage();
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
