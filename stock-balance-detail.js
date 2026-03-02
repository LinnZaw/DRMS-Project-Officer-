const detailError = document.getElementById('detailError');
const detailContainer = document.getElementById('detailContainer');
const itemsTableBody = document.getElementById('itemsTableBody');

const formatDate = (value) =>
  new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

const showError = (message) => {
  detailError.textContent = message;
  detailError.classList.remove('d-none');
  detailContainer.classList.add('d-none');
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

const loadDetail = async () => {
  const params = new URLSearchParams(window.location.search);
  const reportId = params.get('reportId');

  if (!reportId) {
    showError('Invalid report ID. Please select a valid stock balance report.');
    return;
  }

  try {
    const report = await fetchStockBalanceReportById(reportId);
    renderDetail(report);
  } catch (error) {
    if (error.message === 'invalid_report_id') {
      showError('Invalid report ID. The selected stock balance report was not found.');
      return;
    }

    showError('Unable to load report details right now. Please try again later.');
  }
};

loadDetail();
