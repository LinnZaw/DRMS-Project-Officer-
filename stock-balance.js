const reportCards = document.getElementById('reportCards');
const reportsState = document.getElementById('reportsState');

const formatDate = (value) =>
  new Date(value).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

const renderCard = (report) => {
  const col = document.createElement('div');
  col.className = 'col-12 col-md-6 col-lg-4';

  col.innerHTML = `
    <article class="report-card h-100 p-3" role="button" tabindex="0" data-id="${report.reportId}">
      <p class="small text-muted mb-1">Report ID</p>
      <h2 class="h6 theme-text mb-2">${report.reportId}</h2>
      <p class="small text-muted mb-1">Logistic Officer Name</p>
      <p class="mb-2">${report.logisticOfficerName}</p>
      <p class="small text-muted mb-1">Reported Date</p>
      <p class="mb-0">${formatDate(report.reportedDate)}</p>
    </article>
  `;

  const goToDetail = () => {
    window.location.href = `stock-balance-detail.html?reportId=${encodeURIComponent(report.reportId)}`;
  };

  const card = col.querySelector('.report-card');
  card.addEventListener('click', goToDetail);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      goToDetail();
    }
  });

  return col;
};

const loadReports = async () => {
  try {
    const reports = await fetchStockBalanceReports();

    if (reports.length === 0) {
      reportsState.textContent = 'No Stock Balance Reports Available';
      reportsState.classList.remove('d-none');
      return;
    }

    reports.forEach((report) => reportCards.appendChild(renderCard(report)));
  } catch (error) {
    reportsState.textContent = 'Unable to load reports. Please try again later.';
    reportsState.classList.remove('d-none');
  }
};

loadReports();
