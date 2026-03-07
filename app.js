const state = {
  isAuthenticated: false,
  assignLocationFlash: null,
  roleLookupLoaded: false,
  roleLookup: [],
  fieldStaffRoleId: null,
  assignDistributionFlash: null
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
const ROLE_API_URL = 'http://localhost:8080/api/roles';
const ASSIGN_DISTRIBUTION_API_URL = 'http://localhost:8080/api/assign-distributions';
const LOCATION_CREATOR_ID = 2;
const PROJECT_OFFICER_ID = 2;

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

  return source
    .map((user) => {
      const userId = user.userId ?? user.id;
      const composedName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const userName = user.name || user.userName || user.username || composedName || `User ${displayValue(userId)}`;

      return {
        userId,
        userName
      };
    })
    .filter((user) => user.userId !== undefined && user.userId !== null);
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

const normalizeRoles = (payload) => {
  const source = payload?.data?.roles ?? payload?.data ?? payload;

  if (!Array.isArray(source)) {
    return [];
  }

  return source.map((role) => ({
    roleId: role.roleId ?? role.id,
    roleName: String(role.roleName ?? role.name ?? '').toUpperCase()
  }));
};

const ensureRoleLookup = async () => {
  if (state.roleLookupLoaded) {
    return state.roleLookup;
  }

  const response = await fetch(ROLE_API_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  state.roleLookup = normalizeRoles(await response.json());
  state.roleLookupLoaded = true;
  return state.roleLookup;
};

const getFieldStaffRoleId = async () => {
  if (state.fieldStaffRoleId !== null) {
    return state.fieldStaffRoleId;
  }

  const roles = await ensureRoleLookup();
  const fieldStaffRole = roles.find((role) => role.roleName === 'FIELDSTAFF');
  if (!fieldStaffRole?.roleId) {
    throw new Error('field_staff_role_not_found');
  }

  state.fieldStaffRoleId = fieldStaffRole.roleId;
  return state.fieldStaffRoleId;
};

const fetchFieldStaffUsers = async () => {
  const roleId = await getFieldStaffRoleId();
  const response = await fetch(`${USER_API_URL}?role=${encodeURIComponent(roleId)}`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return normalizeUsers(await response.json());
};

const displayAssignedStaff = (location) => {
  if (location.staffName) {
    return location.staffName;
  }

  if (location.staffId !== undefined && location.staffId !== null && location.staffId !== '') {
    return `Staff ID: ${location.staffId}`;
  }

  return 'Unassigned';
};

const showAssignLocationModal = ({ mode, users = [], location, onSuccess }) => {
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
                <label class="form-label" for="staffIdInput">Field Staff</label>
                <select id="staffIdInput" name="staffId" class="form-select" required>
                  <option value="">Loading field staff...</option>
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
  const staffSelect = modalWrapper.querySelector('#staffIdInput');
  const submitBtn = form.querySelector('button[type="submit"]');
  const bootstrapModal = new bootstrap.Modal(modalElement);

  const showAlert = (type, message) => {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
  };

  const populateStaffSelect = (staffUsers) => {
    if (!staffUsers.length) {
      staffSelect.innerHTML = '<option value="">No field staff available</option>';
      submitBtn.disabled = true;
      showAlert('warning', 'No FIELD_STAFF users found.');
      return;
    }

    const selectedStaffId = String(location?.staffId || '');
    staffSelect.innerHTML = `
      <option value="">Select Field Staff</option>
      ${staffUsers
        .map((user) => `<option value="${user.userId}" ${String(user.userId) === selectedStaffId ? 'selected' : ''}>${user.userName}</option>`)
        .join('')}
    `;
    submitBtn.disabled = false;
  };

  (async () => {
    try {
      const staffUsers = users.length ? users : await fetchFieldStaffUsers();
      populateStaffSelect(staffUsers);
    } catch {
      staffSelect.innerHTML = '<option value="">Failed to load field staff</option>';
      submitBtn.disabled = true;
      showAlert('danger', 'Unable to load roles/field staff. Please try again.');
    }
  })();

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
      const method = isEdit ? 'PATCH' : 'POST';

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
    const locationsResponse = await fetch(LOCATION_API_URL);

    if (!locationsResponse.ok) {
      throw new Error('request_failed');
    }

    const locations = normalizeLocations(await locationsResponse.json());

    const tableRows = locations.length
      ? locations
          .map(
            (location) => `
              <tr>
                <td>${displayValue(location.locationName)}</td>
                <td>${displayValue(displayAssignedStaff(location))}</td>
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
      showAssignLocationModal({ mode: 'create', onSuccess: rerender });
    });

    elements.contentHost.querySelectorAll('[data-action="edit"]').forEach((button) => {
      button.addEventListener('click', () => {
        const location = locations.find((item) => String(item.locationId) === button.dataset.locationId);
        if (!location) return;
        showAssignLocationModal({ mode: 'edit', location, onSuccess: rerender });
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


const normalizeAssignDistributions = (payload) => {
  const source = payload?.data?.assignDistributions ?? payload?.data ?? payload;

  if (!Array.isArray(source)) {
    return [];
  }

  return source.map((item) => ({
    id: item.id,
    userId: item.userId,
    locationId: item.locationId,
    locationName: item.locationName ?? item.location?.locationName ?? 'N/A',
    eventType: item.eventType ?? 'N/A',
    distributionDate: item.distributionDate,
    status: item.status ?? 'Pending'
  }));
};

const getDerivedDistributionStatus = (distributionDate, fallbackStatus = 'Pending') => {
  if (!distributionDate) {
    return fallbackStatus;
  }

  const assignedDate = new Date(distributionDate);
  if (Number.isNaN(assignedDate.getTime())) {
    return fallbackStatus;
  }

  const completionDate = new Date(assignedDate);
  completionDate.setDate(completionDate.getDate() + 1);
  completionDate.setHours(12, 0, 0, 0);

  if (new Date() >= completionDate) {
    return 'Completed';
  }

  return 'Assigned';
};

const fetchDistributionLocations = async () => {
  const response = await fetch(LOCATION_API_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return normalizeLocations(await response.json());
};

const showAssignDistributionModal = ({ mode, distribution, onSuccess }) => {
  const isEdit = mode === 'edit';
  const modalWrapper = document.createElement('div');
  const defaultDate = (() => {
    if (isEdit && distribution?.distributionDate) {
      const parsed = new Date(distribution.distributionDate);
      if (!Number.isNaN(parsed.getTime())) {
        const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 16);
      }
    }
    return '';
  })();

  modalWrapper.innerHTML = `
    <div class="modal fade" id="assignDistributionModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${isEdit ? 'Update Assign Distribution' : 'Create Assign Distribution'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="assignDistributionForm" novalidate>
            <div class="modal-body">
              <div id="assignDistributionModalAlert" class="alert d-none" role="alert"></div>
              <div class="mb-3">
                <label class="form-label" for="distributionDateInput">Distribution Date</label>
                <input id="distributionDateInput" name="distributionDate" type="datetime-local" class="form-control" required value="${defaultDate}" />
              </div>
              <div class="mb-3">
                <label class="form-label" for="distributionEventTypeInput">Event Type</label>
                <select id="distributionEventTypeInput" name="eventType" class="form-select" required>
                  <option value="">Select event type</option>
                  ${['Conflict_Area','EarthQuake','Fire','Flood','Remote_Area','Storm']
                    .map((eventType) => `<option value="${eventType}" ${distribution?.eventType === eventType ? 'selected' : ''}>${eventType}</option>`)
                    .join('')}
                </select>
              </div>
              <div class="mb-0">
                <label class="form-label" for="distributionLocationInput">Location</label>
                <select id="distributionLocationInput" name="locationId" class="form-select" required>
                  <option value="">Loading locations...</option>
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

  const modalElement = modalWrapper.querySelector('#assignDistributionModal');
  const form = modalWrapper.querySelector('#assignDistributionForm');
  const alertBox = modalWrapper.querySelector('#assignDistributionModalAlert');
  const locationSelect = modalWrapper.querySelector('#distributionLocationInput');
  const submitBtn = form.querySelector('button[type="submit"]');
  const bootstrapModal = new bootstrap.Modal(modalElement);

  const showAlert = (type, message) => {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
  };

  (async () => {
    try {
      const locations = await fetchDistributionLocations();
      if (!locations.length) {
        locationSelect.innerHTML = '<option value="">No locations available</option>';
        submitBtn.disabled = true;
        showAlert('warning', 'No locations found. Please create a location first.');
        return;
      }

      locationSelect.innerHTML = `
        <option value="">Select location</option>
        ${locations
          .map(
            (location) =>
              `<option value="${location.locationId}" ${String(location.locationId) === String(distribution?.locationId || '') ? 'selected' : ''}>${location.locationName}</option>`
          )
          .join('')}
      `;
      submitBtn.disabled = false;
    } catch {
      locationSelect.innerHTML = '<option value="">Failed to load locations</option>';
      submitBtn.disabled = true;
      showAlert('danger', 'Unable to load locations. Please try again.');
    }
  })();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const payload = {
      distributionDate: new Date(form.distributionDate.value).toISOString(),
      eventType: form.eventType.value,
      status: 'Pending',
      userId: distribution?.userId ?? PROJECT_OFFICER_ID,
      locationId: Number(form.locationId.value)
    };

    try {
      const endpoint = isEdit
        ? `${ASSIGN_DISTRIBUTION_API_URL}/${encodeURIComponent(distribution?.id)}`
        : `${ASSIGN_DISTRIBUTION_API_URL}?userId=${encodeURIComponent(PROJECT_OFFICER_ID)}`;
      const method = isEdit ? 'PATCH' : 'POST';

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

      state.assignDistributionFlash = {
        type: 'success',
        text: isEdit ? 'Assigned distribution updated successfully.' : 'Assigned distribution created successfully.'
      };
      bootstrapModal.hide();
      await onSuccess();
    } catch {
      showAlert('danger', isEdit ? 'Failed to update assigned distribution.' : 'Failed to create assigned distribution.');
    }
  });

  modalElement.addEventListener('hidden.bs.modal', () => {
    bootstrapModal.dispose();
    modalWrapper.remove();
  });

  bootstrapModal.show();
};

const renderAssignDistributionPage = async () => {
  elements.pageTitle.textContent = 'Assign Distribution';
  elements.pageSubtitle.textContent = 'Manage assigned distributions and track status by date.';

  const flash = state.assignDistributionFlash;
  state.assignDistributionFlash = null;

  elements.contentHost.innerHTML = '<div class="text-muted">Loading assigned distributions...</div>';

  try {
    const response = await fetch(ASSIGN_DISTRIBUTION_API_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rows = normalizeAssignDistributions(await response.json());

    const tableRows = rows.length
      ? rows
          .map((row, index) => {
            const derivedStatus = getDerivedDistributionStatus(row.distributionDate, row.status);
            const isCompleted = derivedStatus === 'Completed';
            return `
              <tr>
                <td>${index + 1}</td>
                <td>${displayValue(row.locationName)}</td>
                <td>${displayValue(row.eventType)}</td>
                <td>${formatStockDateTime(row.distributionDate)}</td>
                <td><span class="badge ${isCompleted ? 'text-bg-success' : 'text-bg-warning'}">${derivedStatus}</span></td>
                <td>
                  <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-outline-primary btn-sm" data-action="update-distribution" data-row-index="${index}" ${isCompleted ? 'disabled' : ''}>
                      ✏️ Update
                    </button>
                    <button class="btn btn-outline-danger btn-sm" data-action="delete-distribution" data-row-index="${index}">
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            `;
          })
          .join('')
      : '<tr><td colspan="6" class="text-center text-muted py-4">No assigned distributions found.</td></tr>';

    elements.contentHost.innerHTML = `
      <section class="fixed-page-shell mx-auto w-100 assign-distribution-shell d-flex flex-column gap-3">
        ${
          flash
            ? `<div class="alert alert-${flash.type} mb-0" role="alert">${flash.text}</div>`
            : ''
        }
        <div class="d-flex justify-content-end">
          <button id="createAssignDistributionBtn" class="btn btn-theme">Create Assign Distribution</button>
        </div>
        <div class="table-responsive assign-distribution-table-wrap">
          <table class="table table-hover align-middle mb-0 assign-distribution-table">
            <thead class="table-light">
              <tr>
                <th scope="col">No</th>
                <th scope="col">Location Name</th>
                <th scope="col">Event Type</th>
                <th scope="col">Distribution Date</th>
                <th scope="col">Status</th>
                <th scope="col" class="text-nowrap">Action</th>
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
      await renderAssignDistributionPage();
    };

    document.getElementById('createAssignDistributionBtn').addEventListener('click', () => {
      showAssignDistributionModal({ mode: 'create', onSuccess: rerender });
    });

    elements.contentHost.querySelectorAll('[data-action="update-distribution"]').forEach((button) => {
      button.addEventListener('click', () => {
        const row = rows[Number(button.dataset.rowIndex)];
        if (!row) return;

        const status = getDerivedDistributionStatus(row.distributionDate, row.status);
        if (status === 'Completed') {
          state.assignDistributionFlash = {
            type: 'warning',
            text: 'Completed distributions cannot be edited.'
          };
          rerender();
          return;
        }

        showAssignDistributionModal({ mode: 'edit', distribution: row, onSuccess: rerender });
      });
    });

      elements.contentHost.querySelectorAll('[data-action="delete-distribution"]').forEach((button) => {
      button.addEventListener('click', async () => {
        const rowIndex = Number(button.dataset.rowIndex);
        const row = rows[rowIndex];
        if (!row) return;

        const confirmed = window.confirm(`Delete assigned distribution for ${row.locationName}?`);
        if (!confirmed) return;

        try {
          const response = await fetch(`${ASSIGN_DISTRIBUTION_API_URL}/${encodeURIComponent(row.id)}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          // Remove deleted row from UI state
          rows.splice(rowIndex, 1);

          state.assignDistributionFlash = {
            type: 'success',
            text: 'Assigned distribution deleted successfully.'
          };

          await rerender();

        } catch {
          state.assignDistributionFlash = {
            type: 'danger',
            text: 'Failed to delete assigned distribution.'
          };

          await rerender();
        }
      });
    });
  } catch {
    elements.contentHost.innerHTML = '<div class="alert alert-danger">Unable to load assigned distributions. Please try again later.</div>';
  }
};

const renderRoute = async () => {
  if (!state.isAuthenticated) return;

  const { mainRoute } = parseRoute();
  setActiveNav(mainRoute === 'stock-balance' || mainRoute === 'assign-location' || mainRoute === 'assign-distribution' ? mainRoute : 'dashboard');

  if (mainRoute === 'stock-balance') {
    await renderStockBalanceList();
    return;
  }

  if (mainRoute === 'assign-location') {
    await renderAssignLocationPage();
    return;
  }

  if (mainRoute === 'assign-distribution') {
    await renderAssignDistributionPage();
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
