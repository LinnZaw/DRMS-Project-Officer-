
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

const distributionReportTemplates = {
  'DIST-2026-0001': [
    { itemName: 'Rice (5kg Packs)', plannedQuantity: 400 },
    { itemName: 'Drinking Water (1L)', plannedQuantity: 1200 },
    { itemName: 'Family Hygiene Kits', plannedQuantity: 300 }
  ],
  'DIST-2026-0002': [
    { itemName: 'Blankets', plannedQuantity: 500 },
    { itemName: 'Tarpaulin Sheets', plannedQuantity: 320 },
    { itemName: 'First Aid Kits', plannedQuantity: 220 }
  ],
  'DIST-2026-0003': [
    { itemName: 'Emergency Food Parcels', plannedQuantity: 650 },
    { itemName: 'Mosquito Nets', plannedQuantity: 430 },
    { itemName: 'Water Purification Tablets', plannedQuantity: 300 }
  ]
};

const distributionReportsDb = [
  {
    reportId: 'DRPT-2026-0001',
    distributionId: 'DIST-2026-0001',
    reportDate: '2026-12-02',
    location: 'Kolonnawa, Colombo, Western',
    preparedBy: 'Project Officer',
    implementingTeam: 'Rapid Response Team A',
    weatherCondition: 'Light rain',
    status: 'Draft',
    itemSummary: [
      { itemName: 'Rice (5kg Packs)', plannedQuantity: 400, actualDistributedQuantity: 380, damagedQuantity: 5 },
      { itemName: 'Drinking Water (1L)', plannedQuantity: 1200, actualDistributedQuantity: 1150, damagedQuantity: 10 },
      { itemName: 'Family Hygiene Kits', plannedQuantity: 300, actualDistributedQuantity: 288, damagedQuantity: 2 }
    ],
    beneficiarySummary: {
      totalHouseholdsAssisted: 275,
      totalIndividualsAssisted: 1120,
      male: 520,
      female: 510,
      children: 70,
      elderly: 18,
      personsWithDisability: 12
    },
    activityReport: {
      distributionProcessSummary: 'Distribution was completed at two temporary centers with coordinated queue management.',
      challengesFaced: 'Temporary road blockage delayed second truck by 40 minutes.',
      securityIssues: 'No major security incidents reported.',
      recommendations: 'Add one more registration desk for faster household verification.'
    }
  },
  {
    reportId: 'DRPT-2026-0002',
    distributionId: 'DIST-2026-0002',
    reportDate: '2026-12-13',
    location: 'Peradeniya, Kandy, Central',
    preparedBy: 'Project Officer',
    implementingTeam: 'Relief Operations Unit B',
    weatherCondition: 'Cloudy',
    status: 'Submitted',
    itemSummary: [
      { itemName: 'Blankets', plannedQuantity: 500, actualDistributedQuantity: 500, damagedQuantity: 0 },
      { itemName: 'Tarpaulin Sheets', plannedQuantity: 320, actualDistributedQuantity: 315, damagedQuantity: 1 },
      { itemName: 'First Aid Kits', plannedQuantity: 220, actualDistributedQuantity: 215, damagedQuantity: 0 }
    ],
    beneficiarySummary: {
      totalHouseholdsAssisted: 310,
      totalIndividualsAssisted: 1385,
      male: 665,
      female: 640,
      children: 80,
      elderly: 25,
      personsWithDisability: 16
    },
    activityReport: {
      distributionProcessSummary: 'All planned relief packs were dispatched through three stations.',
      challengesFaced: 'Heavy foot traffic around noon slowed beneficiary verification.',
      securityIssues: 'Minor crowd control support was requested from local authorities.',
      recommendations: 'Deploy mobile shade and hydration points for staff and beneficiaries.'
    }
  }
];

let distributionReportSequence = distributionReportsDb.length + 1;

const generateDistributionReportId = () => {
  const id = `DRPT-2026-${String(distributionReportSequence).padStart(4, '0')}`;
  distributionReportSequence += 1;
  return id;
};

const createLocationLabel = (distribution) => `${distribution.village}, ${distribution.township}, ${distribution.state}`;

const fetchDistributionReportMeta = async () => {
  await delay();
  return {
    preparedBy: 'Project Officer',
    distributions: distributionsDb.map((distribution) => ({
      distributionId: distribution.distributionId,
      location: createLocationLabel(distribution),
      date: distribution.distributionDate
    })),
    itemTemplates: JSON.parse(JSON.stringify(distributionReportTemplates))
  };
};

const fetchDistributionReports = async () => {
  await delay();
  return [...distributionReportsDb].sort((a, b) => a.reportId.localeCompare(b.reportId));
};

const fetchDistributionReportById = async (reportId) => {
  await delay();
  const report = distributionReportsDb.find((item) => item.reportId === reportId);
  if (!report) {
    throw new Error('invalid_distribution_report_id');
  }

  return JSON.parse(JSON.stringify(report));
};

const createDistributionReport = async (payload) => {
  await delay();
  const newRecord = JSON.parse(JSON.stringify(payload));
  distributionReportsDb.push(newRecord);
  return JSON.parse(JSON.stringify(newRecord));
};

const updateDistributionReport = async (reportId, payload) => {
  await delay();
  const index = distributionReportsDb.findIndex((item) => item.reportId === reportId);
  if (index === -1) {
    throw new Error('invalid_distribution_report_id');
  }

  distributionReportsDb[index] = { ...distributionReportsDb[index], ...JSON.parse(JSON.stringify(payload)) };
  return JSON.parse(JSON.stringify(distributionReportsDb[index]));
};

const deleteDistributionReport = async (reportId) => {
  await delay();
  const index = distributionReportsDb.findIndex((item) => item.reportId === reportId);
  if (index === -1) {
    throw new Error('invalid_distribution_report_id');
  }

  distributionReportsDb.splice(index, 1);
};
