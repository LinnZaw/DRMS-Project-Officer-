const state = {
  isAuthenticated: false,
  reports: [],
  reportsLoaded: false,
  distributions: [],
  distributionsLoaded: false,
  distributionMeta: null
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
