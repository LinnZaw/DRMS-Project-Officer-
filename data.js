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

const distributionProjects = [
  'Northern Flood Relief',
  'Kandy Landslide Recovery',
  'Cyclone Shelter Support',
  'Conflict Displacement Aid'
];

const fieldStaffDirectory = [
  { id: 'FS-010', name: 'Nuwani Jayasinghe', role: 'FIELD_STAFF' },
  { id: 'FS-011', name: 'Roshan Mendis', role: 'FIELD_STAFF' },
  { id: 'FS-012', name: 'Tharindu Rajapaksha', role: 'FIELD_STAFF' }
];

const locationHierarchy = {
  'Western': {
    'Colombo': ['Kolonnawa', 'Maharagama', 'Kaduwela'],
    'Gampaha': ['Negombo', 'Ja-Ela', 'Wattala']
  },
  'Central': {
    'Kandy': ['Katugastota', 'Peradeniya', 'Akurana'],
    'Matale': ['Rattota', 'Dambulla', 'Ukuwela']
  },
  'Southern': {
    'Galle': ['Hikkaduwa', 'Elpitiya', 'Ambalangoda'],
    'Matara': ['Weligama', 'Kamburupitiya', 'Hakmana']
  }
};

const distributionsDb = [
  {
    distributionId: 'DIST-2026-0001',
    projectName: 'Northern Flood Relief',
    status: 'Draft',
    distributionDate: '2026-12-01',
    state: 'Western',
    township: 'Colombo',
    village: 'Kolonnawa',
    emergencyType: 'Flood',
    fieldStaffId: 'FS-010'
  },
  {
    distributionId: 'DIST-2026-0002',
    projectName: 'Kandy Landslide Recovery',
    status: 'Assigned',
    distributionDate: '2026-12-12',
    state: 'Central',
    township: 'Kandy',
    village: 'Peradeniya',
    emergencyType: 'Landslide',
    fieldStaffId: 'FS-011'
  },
  {
    distributionId: 'DIST-2026-0003',
    projectName: 'Cyclone Shelter Support',
    status: 'Completed',
    distributionDate: '2026-12-18',
    state: 'Southern',
    township: 'Galle',
    village: 'Hikkaduwa',
    emergencyType: 'Cyclone',
    fieldStaffId: 'FS-012'
  }
];

let distributionSequence = distributionsDb.length + 1;

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchStockBalanceReports = async () => {
  await delay();
  return [...stockBalanceReportsDb].sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));
};

const fetchStockBalanceReportById = async (reportId) => {
  await delay();
  const report = stockBalanceReportsDb.find((item) => item.reportId === reportId);
  if (!report) {
    throw new Error('invalid_report_id');
  }
  return report;
};

const fetchDistributionMeta = async () => {
  await delay();
  return {
    projects: [...distributionProjects],
    staff: fieldStaffDirectory.filter((person) => person.role === 'FIELD_STAFF').map((person) => ({ ...person })),
    locationHierarchy: JSON.parse(JSON.stringify(locationHierarchy))
  };
};

const generateDistributionId = () => {
  const id = `DIST-2026-${String(distributionSequence).padStart(4, '0')}`;
  distributionSequence += 1;
  return id;
};

const fetchDistributions = async () => {
  await delay();
  return [...distributionsDb].sort((a, b) => a.distributionId.localeCompare(b.distributionId));
};

const fetchDistributionById = async (distributionId) => {
  await delay();
  const distribution = distributionsDb.find((item) => item.distributionId === distributionId);
  if (!distribution) {
    throw new Error('invalid_distribution_id');
  }
  return { ...distribution };
};

const createDistribution = async (payload) => {
  await delay();
  const newRecord = { ...payload };
  distributionsDb.push(newRecord);
  return { ...newRecord };
};

const updateDistribution = async (distributionId, payload) => {
  await delay();
  const index = distributionsDb.findIndex((item) => item.distributionId === distributionId);
  if (index === -1) {
    throw new Error('invalid_distribution_id');
  }

  distributionsDb[index] = { ...distributionsDb[index], ...payload };
  return { ...distributionsDb[index] };
};

const deleteDistribution = async (distributionId) => {
  await delay();
  const index = distributionsDb.findIndex((item) => item.distributionId === distributionId);
  if (index === -1) {
    throw new Error('invalid_distribution_id');
  }

  distributionsDb.splice(index, 1);
};
