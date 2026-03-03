const state = {
  isAuthenticated: false,
  reports: [],
  reportsLoaded: false,
  distributions: [],
  distributionsLoaded: false,
  distributionMeta: null,
  distributionReports: [],
  distributionReportsLoaded: false,
  distributionReportMeta: null
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

const getDistributionStatusClass = (status) => {
  const mapping = {
    Draft: 'status-draft',
    Assigned: 'status-assigned',
    Completed: 'status-completed',
    Cancelled: 'status-cancelled'
  };

  return mapping[status] || 'status-draft';
};

const getStaffName = (staffId) => {
  const person = state.distributionMeta?.staff.find((staff) => staff.id === staffId);
  return person ? `${person.name} (${person.id})` : 'N/A';
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

const createDistributionCard = (distribution) => `
  <article class="distribution-card" role="button" tabindex="0" data-distribution-id="${distribution.distributionId}">
    <div class="row g-3 align-items-center">
      <div class="col-12 col-md-3">
        <p class="small text-muted mb-1">Distribution ID</p>
        <p class="fw-semibold theme-text mb-0">${distribution.distributionId}</p>
      </div>
      <div class="col-12 col-md-4">
        <p class="small text-muted mb-1">Project Name</p>
        <p class="mb-0">${distribution.projectName}</p>
      </div>
      <div class="col-12 col-md-3">
        <p class="small text-muted mb-1">Distribution Date</p>
        <p class="mb-0">${formatShortDate(distribution.distributionDate)}</p>
      </div>
      <div class="col-12 col-md-2 text-md-end">
        <span class="status-badge ${getDistributionStatusClass(distribution.status)}">${distribution.status}</span>
      </div>
    </div>
  </article>
`;

const initializeDistributionData = async () => {
  if (!state.distributionMeta) {
    state.distributionMeta = await fetchDistributionMeta();
  }

  if (!state.distributionsLoaded) {
    state.distributions = await fetchDistributions();
    state.distributionsLoaded = true;
  }
};

const loadTownshipOptions = (stateName) => {
  const locations = state.distributionMeta?.locationHierarchy || {};
  return stateName ? Object.keys(locations[stateName] || {}) : [];
};

const loadVillageOptions = (stateName, townshipName) => {
  const locations = state.distributionMeta?.locationHierarchy || {};
  if (!stateName || !townshipName) {
    return [];
  }

  return locations[stateName]?.[townshipName] || [];
};

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

const renderAssignDistributionList = async () => {
  elements.pageTitle.textContent = 'Assign Distribution';
  elements.pageSubtitle.textContent = 'Manage disaster distribution plans with complete CRUD workflow.';
  elements.contentHost.innerHTML = '<div class="text-muted">Loading distributions...</div>';

  try {
    await initializeDistributionData();

    elements.contentHost.innerHTML = `
      <section class="distribution-shell mx-auto w-100">
        <div class="d-flex justify-content-end mb-3">
          <button id="createDistributionBtn" class="btn btn-theme">+ Create Distribution</button>
        </div>
        <div class="distribution-list">
          ${
            state.distributions.length
              ? state.distributions.map((distribution) => createDistributionCard(distribution)).join('')
              : '<div class="alert alert-info mb-0">No distributions available yet.</div>'
          }
        </div>
      </section>
    `;

    const createBtn = document.getElementById('createDistributionBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        window.location.hash = '#/assign-distribution/create';
      });
    }

    const cards = elements.contentHost.querySelectorAll('.distribution-card');
    cards.forEach((card) => {
      const openDetail = () => {
        window.location.hash = `#/assign-distribution/${encodeURIComponent(card.dataset.distributionId)}`;
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
    elements.contentHost.innerHTML = '<div class="alert alert-danger">Unable to load distributions. Please try again later.</div>';
  }
};

const renderDistributionDetail = async (distributionId) => {
  elements.pageTitle.textContent = 'Distribution Detail';
  elements.pageSubtitle.textContent = 'Review full distribution information.';

  elements.contentHost.innerHTML = '<div class="text-muted">Loading distribution detail...</div>';

  try {
    await initializeDistributionData();
    const distribution = await fetchDistributionById(distributionId);
    const canEdit = ['Draft', 'Assigned'].includes(distribution.status);
    const canDelete = distribution.status === 'Draft';

    elements.contentHost.innerHTML = `
      <section class="distribution-shell mx-auto w-100">
        <button id="backToDistributionsBtn" class="btn btn-outline-primary btn-sm mb-3">Back to Distributions</button>
        <article class="detail-card p-4">
          <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
            <div>
              <h4 class="h6 mb-1 theme-text">${distribution.distributionId}</h4>
              <p class="mb-0 text-muted">${distribution.projectName}</p>
            </div>
            <span class="status-badge ${getDistributionStatusClass(distribution.status)}">${distribution.status}</span>
          </div>

          <div class="row g-3">
            <div class="col-12 col-md-6"><strong>Distribution Date:</strong> ${formatShortDate(distribution.distributionDate)}</div>
            <div class="col-12 col-md-6"><strong>Emergency Type:</strong> ${distribution.emergencyType}</div>
            <div class="col-12 col-md-4"><strong>State:</strong> ${distribution.state}</div>
            <div class="col-12 col-md-4"><strong>Township:</strong> ${distribution.township}</div>
            <div class="col-12 col-md-4"><strong>Village:</strong> ${distribution.village}</div>
            <div class="col-12"><strong>Field Staff:</strong> ${getStaffName(distribution.fieldStaffId)}</div>
          </div>

          <div class="d-flex gap-2 mt-4 flex-wrap">
            <button id="editDistributionBtn" class="btn btn-theme" ${canEdit ? '' : 'disabled'}>Edit</button>
            <button id="deleteDistributionBtn" class="btn btn-outline-danger" ${canDelete ? '' : 'disabled'}>Delete</button>
          </div>

          ${
            !canEdit || !canDelete
              ? '<p class="text-muted small mt-2 mb-0">Completed/Cancelled records cannot be edited. Only Draft records can be deleted.</p>'
              : ''
          }
        </article>
      </section>
    `;

    document.getElementById('backToDistributionsBtn').addEventListener('click', () => {
      window.location.hash = '#/assign-distribution';
    });

    document.getElementById('editDistributionBtn').addEventListener('click', () => {
      if (!canEdit) {
        return;
      }
      window.location.hash = `#/assign-distribution/edit/${encodeURIComponent(distribution.distributionId)}`;
    });

    document.getElementById('deleteDistributionBtn').addEventListener('click', async () => {
      if (!canDelete) {
        return;
      }

      const confirmed = window.confirm('Delete this distribution? This action cannot be undone.');
      if (!confirmed) {
        return;
      }

      await deleteDistribution(distribution.distributionId);
      state.distributions = await fetchDistributions();
      window.location.hash = '#/assign-distribution';
    });
  } catch {
    elements.contentHost.innerHTML =
      '<div class="alert alert-danger">Invalid distribution ID. The selected distribution was not found.</div>';
  }
};

const renderDistributionForm = async (mode, distributionId = '') => {
  const isEdit = mode === 'edit';
  elements.pageTitle.textContent = isEdit ? 'Edit Distribution' : 'Create Distribution';
  elements.pageSubtitle.textContent = isEdit
    ? 'Update distribution details based on current status rules.'
    : 'Fill in all required information to assign a new distribution.';

  elements.contentHost.innerHTML = '<div class="text-muted">Loading form...</div>';

  try {
    await initializeDistributionData();
    const today = getTodayDateValue();

    let existing = null;
    if (isEdit) {
      existing = await fetchDistributionById(distributionId);
      if (['Completed', 'Cancelled'].includes(existing.status)) {
        elements.contentHost.innerHTML = `
          <section class="distribution-shell mx-auto w-100">
            <div class="alert alert-warning">Completed/Cancelled distributions cannot be edited.</div>
            <button id="backToDistributionDetailBtn" class="btn btn-outline-primary btn-sm">Back to Detail</button>
          </section>
        `;

        document.getElementById('backToDistributionDetailBtn').addEventListener('click', () => {
          window.location.hash = `#/assign-distribution/${encodeURIComponent(distributionId)}`;
        });
        return;
      }
    }

    const distributionIdValue = existing?.distributionId || generateDistributionId();

    const emergencyTypes = ['Flood', 'Earthquake', 'Conflict', 'Cyclone', 'Landslide'];
    const statuses = ['Draft', 'Assigned', 'Completed', 'Cancelled'];

    const formDefaults = {
      projectName: existing?.projectName || '',
      status: existing?.status || 'Draft',
      distributionDate: existing?.distributionDate || today,
      state: existing?.state || '',
      township: existing?.township || '',
      village: existing?.village || '',
      emergencyType: existing?.emergencyType || '',
      fieldStaffId: existing?.fieldStaffId || ''
    };

    const projectOptions = state.distributionMeta.projects
      .map((project) => `<option value="${project}" ${project === formDefaults.projectName ? 'selected' : ''}>${project}</option>`)
      .join('');

    const statusOptions = statuses
      .map((status) => `<option value="${status}" ${status === formDefaults.status ? 'selected' : ''}>${status}</option>`)
      .join('');

    const stateOptions = Object.keys(state.distributionMeta.locationHierarchy)
      .map((stateName) => `<option value="${stateName}" ${stateName === formDefaults.state ? 'selected' : ''}>${stateName}</option>`)
      .join('');

    const emergencyOptions = emergencyTypes
      .map((type) => `<option value="${type}" ${type === formDefaults.emergencyType ? 'selected' : ''}>${type}</option>`)
      .join('');

    const staffOptions = state.distributionMeta.staff
      .map(
        (staff) =>
          `<option value="${staff.id}" ${staff.id === formDefaults.fieldStaffId ? 'selected' : ''}>${staff.name} (${staff.id})</option>`
      )
      .join('');

    elements.contentHost.innerHTML = `
      <section class="distribution-shell mx-auto w-100">
        <button id="backFromFormBtn" class="btn btn-outline-primary btn-sm mb-3">Back to Distributions</button>
        <article class="detail-card p-4">
          <form id="distributionForm" novalidate>
            <section class="form-section mb-4">
              <h4 class="h6 theme-text mb-3">SECTION 1 — Basic Information</h4>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label" for="distributionIdInput">Distribution ID</label>
                  <input id="distributionIdInput" name="distributionId" class="form-control" value="${distributionIdValue}" readonly />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="projectNameInput">Project Name</label>
                  <select id="projectNameInput" name="projectName" class="form-select" required>
                    <option value="">Select project</option>
                    ${projectOptions}
                  </select>
                  <div class="invalid-feedback">Project name is required.</div>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="statusInput">Status</label>
                  <select id="statusInput" name="status" class="form-select" required>
                    <option value="">Select status</option>
                    ${statusOptions}
                  </select>
                  <div class="invalid-feedback">Status is required.</div>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="distributionDateInput">Distribution Date</label>
                  <input id="distributionDateInput" name="distributionDate" type="date" min="${today}" class="form-control" value="${formDefaults.distributionDate}" required />
                  <div class="invalid-feedback">Date is required and cannot be in the past.</div>
                </div>
              </div>
            </section>

            <section class="form-section mb-4">
              <h4 class="h6 theme-text mb-3">SECTION 2 — Location Information</h4>
              <div class="row g-3">
                <div class="col-12 col-lg-4">
                  <label class="form-label" for="stateInput">State</label>
                  <select id="stateInput" name="state" class="form-select" required>
                    <option value="">Select state</option>
                    ${stateOptions}
                  </select>
                  <div class="invalid-feedback">State is required.</div>
                </div>
                <div class="col-12 col-lg-4">
                  <label class="form-label" for="townshipInput">Township</label>
                  <select id="townshipInput" name="township" class="form-select" required>
                    <option value="">Select township</option>
                  </select>
                  <div class="invalid-feedback">Township is required.</div>
                </div>
                <div class="col-12 col-lg-4">
                  <label class="form-label" for="villageInput">Village</label>
                  <select id="villageInput" name="village" class="form-select" required>
                    <option value="">Select village</option>
                  </select>
                  <div class="invalid-feedback">Village is required.</div>
                </div>
              </div>
            </section>

            <section class="form-section mb-4">
              <h4 class="h6 theme-text mb-3">SECTION 3 — Emergency &amp; Staff</h4>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <label class="form-label" for="emergencyTypeInput">Emergency Type</label>
                  <select id="emergencyTypeInput" name="emergencyType" class="form-select" required>
                    <option value="">Select emergency type</option>
                    ${emergencyOptions}
                  </select>
                  <div class="invalid-feedback">Emergency type is required.</div>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label" for="fieldStaffInput">Field Staff</label>
                  <input list="fieldStaffOptions" id="fieldStaffInput" class="form-control" placeholder="Search field staff" autocomplete="off" />
                  <datalist id="fieldStaffOptions">
                    ${staffOptions}
                  </datalist>
                  <input type="hidden" id="fieldStaffIdInput" name="fieldStaffId" value="${formDefaults.fieldStaffId}" required />
                  <div class="invalid-feedback d-block d-none" id="fieldStaffError">Field Staff is required.</div>
                </div>
              </div>
            </section>

            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-theme">${isEdit ? 'Update Distribution' : 'Create Distribution'}</button>
              <button type="button" id="cancelFormBtn" class="btn btn-outline-secondary">Cancel</button>
            </div>
          </form>
        </article>
      </section>
    `;

    const form = document.getElementById('distributionForm');
    const stateInput = document.getElementById('stateInput');
    const townshipInput = document.getElementById('townshipInput');
    const villageInput = document.getElementById('villageInput');
    const fieldStaffInput = document.getElementById('fieldStaffInput');
    const fieldStaffIdInput = document.getElementById('fieldStaffIdInput');
    const fieldStaffError = document.getElementById('fieldStaffError');
    const dateInput = document.getElementById('distributionDateInput');

    const syncStaffLabelFromId = () => {
      const selectedStaff = state.distributionMeta.staff.find((staff) => staff.id === fieldStaffIdInput.value);
      fieldStaffInput.value = selectedStaff ? `${selectedStaff.name} (${selectedStaff.id})` : '';
    };

    const populateTownships = (selected = '') => {
      const townships = loadTownshipOptions(stateInput.value);
      townshipInput.innerHTML = `<option value="">Select township</option>${townships
        .map((township) => `<option value="${township}" ${township === selected ? 'selected' : ''}>${township}</option>`)
        .join('')}`;
    };

    const populateVillages = (selected = '') => {
      const villages = loadVillageOptions(stateInput.value, townshipInput.value);
      villageInput.innerHTML = `<option value="">Select village</option>${villages
        .map((village) => `<option value="${village}" ${village === selected ? 'selected' : ''}>${village}</option>`)
        .join('')}`;
    };

    populateTownships(formDefaults.township);
    populateVillages(formDefaults.village);
    syncStaffLabelFromId();

    stateInput.addEventListener('change', () => {
      populateTownships();
      populateVillages();
    });

    townshipInput.addEventListener('change', () => {
      populateVillages();
    });

    fieldStaffInput.addEventListener('input', () => {
      const matched = state.distributionMeta.staff.find(
        (staff) => `${staff.name} (${staff.id})`.toLowerCase() === fieldStaffInput.value.trim().toLowerCase()
      );
      fieldStaffIdInput.value = matched ? matched.id : '';
    });

    dateInput.addEventListener('change', () => {
      if (dateInput.value && dateInput.value < today) {
        dateInput.setCustomValidity('Date cannot be in the past');
      } else {
        dateInput.setCustomValidity('');
      }
    });

    document.getElementById('backFromFormBtn').addEventListener('click', () => {
      window.location.hash = '#/assign-distribution';
    });

    document.getElementById('cancelFormBtn').addEventListener('click', () => {
      window.location.hash = isEdit
        ? `#/assign-distribution/${encodeURIComponent(distributionId)}`
        : '#/assign-distribution';
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (dateInput.value && dateInput.value < today) {
        dateInput.setCustomValidity('Date cannot be in the past');
      } else {
        dateInput.setCustomValidity('');
      }

      const isFieldStaffMissing = !fieldStaffIdInput.value;
      fieldStaffError.classList.toggle('d-none', !isFieldStaffMissing);

      if (!form.checkValidity() || isFieldStaffMissing) {
        form.classList.add('was-validated');
        return;
      }

      const payload = {
        distributionId: distributionIdValue,
        projectName: form.projectName.value,
        status: form.status.value,
        distributionDate: form.distributionDate.value,
        state: form.state.value,
        township: form.township.value,
        village: form.village.value,
        emergencyType: form.emergencyType.value,
        fieldStaffId: fieldStaffIdInput.value
      };

      if (isEdit) {
        await updateDistribution(distributionId, payload);
        state.distributions = await fetchDistributions();
        window.location.hash = `#/assign-distribution/${encodeURIComponent(distributionId)}`;
        return;
      }

      await createDistribution(payload);
      state.distributions = await fetchDistributions();
      window.location.hash = `#/assign-distribution/${encodeURIComponent(distributionIdValue)}`;
    });
  } catch {
    elements.contentHost.innerHTML = '<div class="alert alert-danger">Unable to load distribution form.</div>';
  }
};


const getDistributionReportStatusClass = (status) => {
  const mapping = {
    Draft: 'status-draft',
    Submitted: 'status-submitted'
  };

  return mapping[status] || 'status-draft';
};

const initializeDistributionReportData = async () => {
  await initializeDistributionData();

  if (!state.distributionReportMeta) {
    state.distributionReportMeta = await fetchDistributionReportMeta();
  }

  if (!state.distributionReportsLoaded) {
    state.distributionReports = await fetchDistributionReports();
    state.distributionReportsLoaded = true;
  }
};

const getRemainingQuantity = (planned, actual, damaged) => Math.max((Number(planned) || 0) - (Number(actual) || 0) - (Number(damaged) || 0), 0);

const createDistributionReportCard = (report) => `
  <article class="distribution-report-card" role="button" tabindex="0" data-report-id="${report.reportId}">
    <div class="row g-3 align-items-center">
      <div class="col-12 col-md-2">
        <p class="small text-muted mb-1">Report ID</p>
        <p class="fw-semibold theme-text mb-0">${report.reportId}</p>
      </div>
      <div class="col-12 col-md-2">
        <p class="small text-muted mb-1">Distribution ID</p>
        <p class="mb-0">${report.distributionId}</p>
      </div>
      <div class="col-12 col-md-3">
        <p class="small text-muted mb-1">Location</p>
        <p class="mb-0">${report.location}</p>
      </div>
      <div class="col-12 col-md-3">
        <p class="small text-muted mb-1">Report Date</p>
        <p class="mb-0">${formatShortDate(report.reportDate)}</p>
      </div>
      <div class="col-12 col-md-2 text-md-end">
        <span class="status-badge ${getDistributionReportStatusClass(report.status)}">${report.status}</span>
      </div>
    </div>
  </article>
`;

const renderDistributionReportList = async () => {
  elements.pageTitle.textContent = 'Distribution Reports';
  elements.pageSubtitle.textContent = 'Create and manage field distribution reports.';
  elements.contentHost.innerHTML = '<div class="text-muted">Loading distribution reports...</div>';

  try {
    await initializeDistributionReportData();

    elements.contentHost.innerHTML = `
      <section class="distribution-shell fixed-page-shell mx-auto w-100">
        <div class="d-flex justify-content-end mb-3">
          <button id="createDistributionReportBtn" class="btn btn-theme">+ Create Report</button>
        </div>
        <div class="distribution-report-list">
          ${
            state.distributionReports.length
              ? state.distributionReports.map((report) => createDistributionReportCard(report)).join('')
              : '<div class="alert alert-info mb-0">No distribution reports available yet.</div>'
          }
        </div>
      </section>
    `;

    document.getElementById('createDistributionReportBtn').addEventListener('click', () => {
      window.location.hash = '#/distribution-report/create';
    });

    elements.contentHost.querySelectorAll('.distribution-report-card').forEach((card) => {
      const openDetail = () => {
        window.location.hash = `#/distribution-report/${encodeURIComponent(card.dataset.reportId)}`;
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
    elements.contentHost.innerHTML = '<div class="alert alert-danger">Unable to load distribution reports right now.</div>';
  }
};

const renderDistributionReportDetail = async (reportId) => {
  elements.pageTitle.textContent = 'Distribution Report Detail';
  elements.pageSubtitle.textContent = 'Review report sections and submission status.';
  elements.contentHost.innerHTML = '<div class="text-muted">Loading report detail...</div>';

  try {
    const report = await fetchDistributionReportById(reportId);
    const isDraft = report.status === 'Draft';

    const tableRows = report.itemSummary
      .map(
        (item) => `
          <tr>
            <td>${item.itemName}</td>
            <td>${item.plannedQuantity}</td>
            <td>${item.actualDistributedQuantity}</td>
            <td>${item.damagedQuantity}</td>
            <td>${getRemainingQuantity(item.plannedQuantity, item.actualDistributedQuantity, item.damagedQuantity)}</td>
          </tr>
        `
      )
      .join('');

    elements.contentHost.innerHTML = `
      <section class="distribution-shell fixed-page-shell mx-auto w-100">
        <button id="backToDistributionReportsBtn" class="btn btn-outline-primary btn-sm mb-3">Back to Distribution Reports</button>

        <article class="detail-card p-4 mb-3">
          <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
            <div>
              <h4 class="h6 mb-1 theme-text">${report.reportId}</h4>
              <p class="mb-0 text-muted">Related Distribution: ${report.distributionId}</p>
            </div>
            <span class="status-badge ${getDistributionReportStatusClass(report.status)}">${report.status}</span>
          </div>
        </article>

        <article class="detail-card p-4 mb-3">
          <h5 class="h6 theme-text mb-3">Basic Information</h5>
          <div class="row g-3">
            <div class="col-12 col-md-6"><strong>Report Date:</strong> ${formatShortDate(report.reportDate)}</div>
            <div class="col-12 col-md-6"><strong>Location:</strong> ${report.location}</div>
            <div class="col-12 col-md-6"><strong>Prepared By:</strong> ${report.preparedBy}</div>
            <div class="col-12 col-md-6"><strong>Implementing Team:</strong> ${report.implementingTeam}</div>
            <div class="col-12"><strong>Weather Condition:</strong> ${report.weatherCondition || 'N/A'}</div>
          </div>
        </article>

        <article class="detail-card p-4 mb-3">
          <h5 class="h6 theme-text mb-3">Item Distribution Summary</h5>
          <div class="table-responsive">
            <table class="table table-striped align-middle mb-0">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Planned Quantity</th>
                  <th>Actual Distributed Quantity</th>
                  <th>Damaged Quantity</th>
                  <th>Remaining Quantity</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </article>

        <article class="detail-card p-4 mb-3">
          <h5 class="h6 theme-text mb-3">Beneficiary Summary</h5>
          <div class="row g-3">
            <div class="col-12 col-md-6"><strong>Total Households Assisted:</strong> ${report.beneficiarySummary.totalHouseholdsAssisted}</div>
            <div class="col-12 col-md-6"><strong>Total Individuals Assisted:</strong> ${report.beneficiarySummary.totalIndividualsAssisted}</div>
            <div class="col-6 col-md-3"><strong>Male:</strong> ${report.beneficiarySummary.male}</div>
            <div class="col-6 col-md-3"><strong>Female:</strong> ${report.beneficiarySummary.female}</div>
            <div class="col-6 col-md-3"><strong>Children:</strong> ${report.beneficiarySummary.children}</div>
            <div class="col-6 col-md-3"><strong>Elderly:</strong> ${report.beneficiarySummary.elderly}</div>
            <div class="col-12 col-md-4"><strong>Persons with Disability:</strong> ${report.beneficiarySummary.personsWithDisability}</div>
          </div>
        </article>

        <article class="detail-card p-4 mb-3">
          <h5 class="h6 theme-text mb-3">Activity Report</h5>
          <div class="mb-3"><strong>Distribution Process Summary</strong><p class="mb-0">${report.activityReport.distributionProcessSummary || 'N/A'}</p></div>
          <div class="mb-3"><strong>Challenges Faced</strong><p class="mb-0">${report.activityReport.challengesFaced || 'N/A'}</p></div>
          <div class="mb-3"><strong>Security Issues</strong><p class="mb-0">${report.activityReport.securityIssues || 'N/A'}</p></div>
          <div><strong>Recommendations</strong><p class="mb-0">${report.activityReport.recommendations || 'N/A'}</p></div>
        </article>

        <div class="d-flex flex-wrap gap-2">
          <button id="editDistributionReportBtn" class="btn btn-theme" ${isDraft ? '' : 'disabled'}>Edit</button>
          <button id="deleteDistributionReportBtn" class="btn btn-outline-danger" ${isDraft ? '' : 'disabled'}>Delete</button>
          <button id="submitDistributionReportBtn" class="btn btn-success" ${isDraft ? '' : 'disabled'}>Submit</button>
        </div>
        ${isDraft ? '' : '<p class="text-muted small mt-2 mb-0">This report has been submitted. Editing and deletion are disabled.</p>'}
      </section>
    `;

    document.getElementById('backToDistributionReportsBtn').addEventListener('click', () => {
      window.location.hash = '#/distribution-report';
    });

    document.getElementById('editDistributionReportBtn').addEventListener('click', () => {
      if (isDraft) {
        window.location.hash = `#/distribution-report/edit/${encodeURIComponent(report.reportId)}`;
      }
    });

    document.getElementById('deleteDistributionReportBtn').addEventListener('click', async () => {
      if (!isDraft) return;
      if (!window.confirm('Delete this distribution report?')) return;
      await deleteDistributionReport(report.reportId);
      state.distributionReports = await fetchDistributionReports();
      window.location.hash = '#/distribution-report';
    });

    document.getElementById('submitDistributionReportBtn').addEventListener('click', async () => {
      if (!isDraft) return;
      await updateDistributionReport(report.reportId, { status: 'Submitted' });
      state.distributionReports = await fetchDistributionReports();
      window.location.hash = `#/distribution-report/${encodeURIComponent(report.reportId)}`;
    });
  } catch {
    elements.contentHost.innerHTML = '<div class="alert alert-danger">Distribution report not found.</div>';
  }
};

const renderDistributionReportForm = async (mode, reportId = '') => {
  const isEdit = mode === 'edit';
  elements.pageTitle.textContent = isEdit ? 'Edit Distribution Report' : 'Create Distribution Report';
  elements.pageSubtitle.textContent = 'Provide complete information across all report sections.';
  elements.contentHost.innerHTML = '<div class="text-muted">Loading report form...</div>';

  try {
    await initializeDistributionReportData();
    const meta = state.distributionReportMeta;
    const existing = isEdit ? await fetchDistributionReportById(reportId) : null;

    if (existing && existing.status === 'Submitted') {
      elements.contentHost.innerHTML = '<div class="alert alert-warning">Submitted reports cannot be edited.</div>';
      return;
    }

    const reportIdValue = existing?.reportId || generateDistributionReportId();
    const defaultDistributionId = existing?.distributionId || meta.distributions[0]?.distributionId || '';

    const distributionOptions = meta.distributions
      .map(
        (distribution) =>
          `<option value="${distribution.distributionId}" ${distribution.distributionId === defaultDistributionId ? 'selected' : ''}>${distribution.distributionId}</option>`
      )
      .join('');

    const getInitialItems = (distributionId) => {
      if (existing?.itemSummary?.length && distributionId === existing.distributionId) {
        return existing.itemSummary;
      }
      return (meta.itemTemplates[distributionId] || []).map((item) => ({
        ...item,
        actualDistributedQuantity: 0,
        damagedQuantity: 0
      }));
    };

    const initialItems = getInitialItems(defaultDistributionId);

    const beneficiary = existing?.beneficiarySummary || {
      totalHouseholdsAssisted: 0,
      totalIndividualsAssisted: 0,
      male: 0,
      female: 0,
      children: 0,
      elderly: 0,
      personsWithDisability: 0
    };

    const activity = existing?.activityReport || {
      distributionProcessSummary: '',
      challengesFaced: '',
      securityIssues: '',
      recommendations: ''
    };

    const getLocationForDistribution = (distributionId) =>
      meta.distributions.find((distribution) => distribution.distributionId === distributionId)?.location || '';

    elements.contentHost.innerHTML = `
      <section class="distribution-shell fixed-page-shell mx-auto w-100">
        <button id="backToDistributionReportListBtn" type="button" class="btn btn-outline-primary btn-sm mb-3">Back to Distribution Reports</button>

        <form id="distributionReportForm" class="needs-validation" novalidate>
          <article class="form-section mb-3">
            <h5 class="h6 theme-text mb-3">SECTION 1 — Basic Information</h5>
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label" for="distributionIdInput">Distribution ID</label>
                <select id="distributionIdInput" name="distributionId" class="form-select" required>
                  <option value="">Select distribution</option>
                  ${distributionOptions}
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="reportDateInput">Report Date</label>
                <input id="reportDateInput" name="reportDate" type="date" class="form-control" required value="${existing?.reportDate || getTodayDateValue()}" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="locationInput">Location</label>
                <input id="locationInput" name="location" type="text" class="form-control" readonly value="${existing?.location || getLocationForDistribution(defaultDistributionId)}" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="preparedByInput">Prepared By</label>
                <input id="preparedByInput" name="preparedBy" type="text" class="form-control" readonly value="${existing?.preparedBy || meta.preparedBy}" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="implementingTeamInput">Implementing Team</label>
                <input id="implementingTeamInput" name="implementingTeam" type="text" class="form-control" required value="${existing?.implementingTeam || ''}" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label" for="weatherConditionInput">Weather Condition</label>
                <input id="weatherConditionInput" name="weatherCondition" type="text" class="form-control" value="${existing?.weatherCondition || ''}" />
              </div>
            </div>
          </article>

          <article class="form-section mb-3">
            <h5 class="h6 theme-text mb-3">SECTION 2 — Item Distribution Summary</h5>
            <div class="table-responsive">
              <table class="table table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Planned Quantity</th>
                    <th>Actual Distributed Quantity</th>
                    <th>Damaged Quantity</th>
                    <th>Remaining Quantity</th>
                  </tr>
                </thead>
                <tbody id="itemSummaryRows"></tbody>
              </table>
            </div>
          </article>

          <article class="form-section mb-3">
            <h5 class="h6 theme-text mb-3">SECTION 3 — Beneficiary Summary</h5>
            <div class="row g-3">
              ${[
                ['totalHouseholdsAssisted', 'Total Households Assisted'],
                ['totalIndividualsAssisted', 'Total Individuals Assisted'],
                ['male', 'Male'],
                ['female', 'Female'],
                ['children', 'Children'],
                ['elderly', 'Elderly'],
                ['personsWithDisability', 'Persons with Disability']
              ]
                .map(
                  ([key, label]) => `
                    <div class="col-12 col-md-6 col-xl-4">
                      <label class="form-label" for="${key}Input">${label}</label>
                      <input id="${key}Input" name="${key}" type="number" min="0" class="form-control" required value="${beneficiary[key]}" />
                    </div>
                  `
                )
                .join('')}
            </div>
          </article>

          <article class="form-section mb-4">
            <h5 class="h6 theme-text mb-3">SECTION 4 — Activity Report</h5>
            <div class="row g-3">
              ${[
                ['distributionProcessSummary', 'Distribution Process Summary'],
                ['challengesFaced', 'Challenges Faced'],
                ['securityIssues', 'Security Issues'],
                ['recommendations', 'Recommendations']
              ]
                .map(
                  ([key, label]) => `
                    <div class="col-12">
                      <label class="form-label" for="${key}Input">${label}</label>
                      <textarea id="${key}Input" name="${key}" class="form-control" rows="4" required>${activity[key]}</textarea>
                    </div>
                  `
                )
                .join('')}
            </div>
          </article>

          <div class="d-flex flex-wrap gap-2 justify-content-end">
            <button type="button" id="saveDraftBtn" class="btn btn-outline-primary">Save as Draft</button>
            <button type="button" id="submitReportBtn" class="btn btn-theme">Submit Report</button>
          </div>
        </form>
      </section>
    `;

    const form = document.getElementById('distributionReportForm');
    const distributionInput = document.getElementById('distributionIdInput');
    const locationInput = document.getElementById('locationInput');
    const itemRowsHost = document.getElementById('itemSummaryRows');
    let workingItems = JSON.parse(JSON.stringify(initialItems));

    const renderItemRows = () => {
      itemRowsHost.innerHTML = workingItems
        .map(
          (item, index) => `
            <tr>
              <td>${item.itemName}</td>
              <td><input type="number" class="form-control" value="${item.plannedQuantity}" readonly /></td>
              <td><input type="number" min="0" class="form-control item-actual" data-index="${index}" value="${item.actualDistributedQuantity || 0}" required /></td>
              <td><input type="number" min="0" class="form-control item-damaged" data-index="${index}" value="${item.damagedQuantity || 0}" required /></td>
              <td><input type="number" class="form-control" value="${getRemainingQuantity(item.plannedQuantity, item.actualDistributedQuantity, item.damagedQuantity)}" readonly /></td>
            </tr>
          `
        )
        .join('');

      itemRowsHost.querySelectorAll('.item-actual').forEach((input) => {
        input.addEventListener('input', (event) => {
          const index = Number(event.target.dataset.index);
          workingItems[index].actualDistributedQuantity = Number(event.target.value) || 0;
          renderItemRows();
        });
      });

      itemRowsHost.querySelectorAll('.item-damaged').forEach((input) => {
        input.addEventListener('input', (event) => {
          const index = Number(event.target.dataset.index);
          workingItems[index].damagedQuantity = Number(event.target.value) || 0;
          renderItemRows();
        });
      });
    };

    renderItemRows();

    distributionInput.addEventListener('change', () => {
      locationInput.value = getLocationForDistribution(distributionInput.value);
      if (!isEdit || distributionInput.value !== existing?.distributionId) {
        workingItems = getInitialItems(distributionInput.value);
        renderItemRows();
      }
    });

    document.getElementById('backToDistributionReportListBtn').addEventListener('click', () => {
      window.location.hash = '#/distribution-report';
    });

    const persistReport = async (status) => {
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      const payload = {
        reportId: reportIdValue,
        distributionId: form.distributionId.value,
        reportDate: form.reportDate.value,
        location: form.location.value,
        preparedBy: form.preparedBy.value,
        implementingTeam: form.implementingTeam.value,
        weatherCondition: form.weatherCondition.value,
        status,
        itemSummary: workingItems.map((item) => ({
          itemName: item.itemName,
          plannedQuantity: Number(item.plannedQuantity) || 0,
          actualDistributedQuantity: Number(item.actualDistributedQuantity) || 0,
          damagedQuantity: Number(item.damagedQuantity) || 0
        })),
        beneficiarySummary: {
          totalHouseholdsAssisted: Number(form.totalHouseholdsAssisted.value) || 0,
          totalIndividualsAssisted: Number(form.totalIndividualsAssisted.value) || 0,
          male: Number(form.male.value) || 0,
          female: Number(form.female.value) || 0,
          children: Number(form.children.value) || 0,
          elderly: Number(form.elderly.value) || 0,
          personsWithDisability: Number(form.personsWithDisability.value) || 0
        },
        activityReport: {
          distributionProcessSummary: form.distributionProcessSummary.value,
          challengesFaced: form.challengesFaced.value,
          securityIssues: form.securityIssues.value,
          recommendations: form.recommendations.value
        }
      };

      if (isEdit) {
        await updateDistributionReport(reportId, payload);
      } else {
        await createDistributionReport(payload);
      }

      state.distributionReports = await fetchDistributionReports();
      window.location.hash = `#/distribution-report/${encodeURIComponent(reportIdValue)}`;
    };

    document.getElementById('saveDraftBtn').addEventListener('click', () => persistReport('Draft'));
    document.getElementById('submitReportBtn').addEventListener('click', () => persistReport('Submitted'));
  } catch {
    elements.contentHost.innerHTML = '<div class="alert alert-danger">Unable to open report form.</div>';
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
    if (!routeParam) {
      await renderAssignDistributionList();
      return;
    }

    if (routeParam === 'create') {
      await renderDistributionForm('create');
      return;
    }

    const editMatch = routeParam.match(/^edit\/(.*)$/);
    if (editMatch) {
      await renderDistributionForm('edit', decodeURIComponent(editMatch[1]));
      return;
    }

    await renderDistributionDetail(decodeURIComponent(routeParam));
    return;
  }

  if (mainRoute === 'beneficiary-data') {
    renderPlaceholder('Manage Beneficiary Data');
    return;
  }

  if (mainRoute === 'distribution-report') {
    if (!routeParam) {
      await renderDistributionReportList();
      return;
    }

    if (routeParam === 'create') {
      await renderDistributionReportForm('create');
      return;
    }

    const editMatch = routeParam.match(/^edit\/(.*)$/);
    if (editMatch) {
      await renderDistributionReportForm('edit', decodeURIComponent(editMatch[1]));
      return;
    }

    await renderDistributionReportDetail(decodeURIComponent(routeParam));
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
