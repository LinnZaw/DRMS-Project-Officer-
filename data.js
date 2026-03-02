const stockBalanceReportsDb = [
  {
    reportId: 'SBR-2025-0009',
    logisticOfficerName: 'Nimal Perera',
    reportedDate: '2026-02-28T09:15:00Z',
    warehouseName: 'Central Warehouse - Colombo',
    generatedTimestamp: '2026-02-28T09:20:35Z',
    items: [
      { itemName: 'Rice', category: 'Food', quantityAvailable: 3500, unit: 'kg' },
      { itemName: 'Lentils', category: 'Food', quantityAvailable: 1800, unit: 'kg' },
      { itemName: 'Water Bottles', category: 'Essentials', quantityAvailable: 4200, unit: 'pcs' }
    ]
  },
  {
    reportId: 'SBR-2025-0008',
    logisticOfficerName: 'Ayesha Silva',
    reportedDate: '2026-02-25T14:05:00Z',
    warehouseName: 'Regional Depot - Kandy',
    generatedTimestamp: '2026-02-25T14:10:45Z',
    items: [
      { itemName: 'Blankets', category: 'Shelter', quantityAvailable: 850, unit: 'pcs' },
      { itemName: 'Tents', category: 'Shelter', quantityAvailable: 200, unit: 'box' },
      { itemName: 'First Aid Kits', category: 'Medical', quantityAvailable: 460, unit: 'pcs' }
    ]
  },
  {
    reportId: 'SBR-2025-0007',
    logisticOfficerName: 'Kamal Fernando',
    reportedDate: '2026-02-20T08:45:00Z',
    warehouseName: 'Southern Hub - Galle',
    generatedTimestamp: '2026-02-20T08:50:15Z',
    items: [
      { itemName: 'Infant Formula', category: 'Food', quantityAvailable: 120, unit: 'box' },
      { itemName: 'Sanitary Packs', category: 'Hygiene', quantityAvailable: 980, unit: 'pcs' }
    ]
  }
];

const fetchStockBalanceReports = async () => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return [...stockBalanceReportsDb].sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));
};

const fetchStockBalanceReportById = async (reportId) => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const report = stockBalanceReportsDb.find((item) => item.reportId === reportId);
  if (!report) {
    throw new Error('invalid_report_id');
  }
  return report;
};
