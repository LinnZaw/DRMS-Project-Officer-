const stockCards = document.getElementById('stockCards');

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
};

const getField = (item, keys, fallback = 'N/A') => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item[key] !== null && item[key] !== '') {
      return item[key];
    }
  }
  return fallback;
};

const renderStockCard = (stock) => {
  const col = document.createElement('div');
  col.className = 'col-12 col-lg-6';

  const itemName = getField(stock, ['itemName', 'item_name', 'name']);
  const eventType = getField(stock, ['eventType', 'event_type']);
  const itemDescription = getField(stock, ['itemDescription', 'item_description', 'description']);
  const itemType = getField(stock, ['type', 'itemType', 'item_type']);
  const quantity = getField(stock, ['quantity', 'qty'], '-');
  const unit = getField(stock, ['unit', 'unitType'], '');
  const storageLocation = getField(stock, ['storageLocation', 'storage_location', 'location']);
  const manufacturedDate = formatDate(getField(stock, ['manufacturedDate', 'manufactureDate', 'manufactured_date'], ''));
  const expiredDate = formatDate(getField(stock, ['expiredDate', 'expiryDate', 'expired_date'], ''));

  col.innerHTML = `
    <article class="stock-card h-100 p-3">
      <h2 class="h5 theme-text mb-3">${itemName}</h2>
      <div class="stock-field"><span class="stock-label">Event Type:</span> <span>${eventType}</span></div>
      <div class="stock-field"><span class="stock-label">Item Description:</span> <span>${itemDescription}</span></div>
      <div class="stock-field"><span class="stock-label">Type:</span> <span>${itemType}</span></div>
      <div class="stock-field"><span class="stock-label">Quantity:</span> <span>${quantity} ${unit}</span></div>
      <div class="stock-field"><span class="stock-label">Storage Location:</span> <span>${storageLocation}</span></div>
      <div class="stock-field"><span class="stock-label">Manufactured Date:</span> <span>${manufacturedDate}</span></div>
      <div class="stock-field"><span class="stock-label">Expired Date:</span> <span>${expiredDate}</span></div>
    </article>
  `;

  return col;
};

const loadStocks = async () => {
  try {
    const response = await fetch('http://localhost:8080/api/stocks');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const stocks = Array.isArray(payload?.data?.stockInfo) ? payload.data.stockInfo : [];

    stockCards.innerHTML = '';
    stocks.forEach((stock) => stockCards.appendChild(renderStockCard(stock)));
  } catch (error) {
    console.error('Failed to load stock data');
  }
};

loadStocks();
