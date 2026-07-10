const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- Sample Data Generators ---
const SAMPLE_COMPANIES = [
  {
    name: 'WALMART (FIESTA)',
    billingCycle: 'Monthly',
    paymentTerms: 'Net 30',
    contactPerson: 'Srinivasan Ramanujam',
    phone: '044-66123456',
    email: 'admin.chennai@tcs.com',
    address: 'Siruseri SEZ, Navalur, Chennai - 603103',
  },
  {
    name: 'COMCAST(FIESTA)',
    billingCycle: 'Monthly',
    paymentTerms: 'Net 45',
    contactPerson: 'Arun Mozhi',
    phone: '044-24501234',
    email: 'transport.chennai@infosys.com',
    address: 'Mahindra World City, Chengalpattu, Chennai - 603004',
  },
  {
    name: 'Cognizant (FOURWAY)',
    billingCycle: 'Monthly',
    paymentTerms: 'Net 30',
    contactPerson: 'Deepika Rao',
    phone: '044-48489000',
    email: 'cts.transport@cognizant.com',
    address: 'Okkiyam Thoraipakkam, OMR, Chennai - 600097',
  },
  {
    name: 'Wipro Technologies',
    billingCycle: 'Monthly',
    paymentTerms: 'Net 30',
    contactPerson: 'Muthu Krishnan',
    phone: '044-30882000',
    email: 'wipro.chennai@wipro.com',
    address: 'Sholinganallur Campus, OMR, Chennai - 600119',
  },
  {
    name: 'HCL Technologies',
    billingCycle: 'Monthly',
    paymentTerms: 'Net 15',
    contactPerson: 'Balaji Narayanan',
    phone: '044-61115555',
    email: 'hcl.chennai@hcl.com',
    address: 'ELCOT SEZ, Sholinganallur, Chennai - 600119',
  },
];

const SAMPLE_SITES = [
  {
    id: 'S01',
    name: 'Siruseri Campus',
    companyName: 'Tata Consultancy Services (TCS)',
    location: 'Plot No. 1, OMR, Navalur, Chennai',
    contactPerson: 'Prakash S',
    phone: '9840123456',
    remarks: 'Main delivery center, heavy traffic during shift changes',
  },
  {
    id: 'S02',
    name: 'Mahindra City Campus',
    companyName: 'Infosys Limited',
    location: 'Plot No. N1, Mahindra World City, Chengalpattu',
    contactPerson: 'Senthil Velan',
    phone: '9840234567',
    remarks: 'Long distance transit',
  },
  {
    id: 'S03',
    name: 'Thoraipakkam Hub',
    companyName: 'Cognizant (CTS)',
    location: '5/535, Okkiyam Thoraipakkam, OMR, Chennai',
    contactPerson: 'Nisha Hegde',
    phone: '9840345678',
    remarks: 'Central Chennai corporate hub',
  },
  {
    id: 'S04',
    name: 'Sholinganallur Elcot',
    companyName: 'Wipro Technologies',
    location: 'Special Economic Zone, Sholinganallur, OMR',
    contactPerson: 'Ramesh Babu',
    phone: '9840456789',
    remarks: 'Multi-shift support required',
  },
  {
    id: 'S05',
    name: 'Ambattur Industrial Estate',
    companyName: 'HCL Technologies',
    location: 'MTH Road, Ambattur Industrial Estate, Chennai',
    contactPerson: 'Devendran M',
    phone: '9840567890',
    remarks: 'Industrial belt support, night shifts active',
  },
];

const SAMPLE_OWNERS = [
  {
    id: 'OWN01',
    name: 'Ananth Kumar S',
    phone: '9444011223',
    email: 'ananth.fleet@gmail.com',
    address: '12, Gandhi Nagar 3rd Street, Adyar, Chennai - 600020',
    bankName: 'State Bank of India',
    accountNumber: '10982345712',
    ifsc: 'SBIN0000871',
    upiId: 'ananths@okaxis',
    pan: 'AEOPK2381F',
    aadhaar: '2381-4921-9876',
    remarks: 'Major operator, owns multiple vehicles',
  },
  {
    id: 'OWN02',
    name: 'Rajesh Varadarajan',
    phone: '9444122334',
    email: 'rajesh.v.travels@yahoo.com',
    address: '45, Alagesan Road, Vedachalam Nagar, Chengalpattu - 603001',
    bankName: 'HDFC Bank',
    accountNumber: '501002348123',
    ifsc: 'HDFC0000122',
    upiId: 'rajeshv@okhdfc',
    pan: 'BJHPK9012A',
    aadhaar: '4512-8901-2345',
    remarks: 'Owns 10 SUVs and MUVs',
  },
  {
    id: 'OWN03',
    name: 'Meera Krishnan',
    phone: '9444233445',
    email: 'meera.krish@gmail.com',
    address: '8, Taylor\'s Road, Kilpauk, Chennai - 600010',
    bankName: 'ICICI Bank',
    accountNumber: '001205001245',
    ifsc: 'ICIC0000012',
    upiId: 'meera.k@okicici',
    pan: 'CLHPK4567K',
    aadhaar: '8910-1112-1314',
    remarks: 'Timely maintenance enthusiast',
  },
  {
    id: 'OWN04',
    name: 'Siddharth Shanmugam',
    phone: '9444344556',
    email: 'siddharth.s@hotmail.com',
    address: '77, Red Hills Road, Kolathur, Chennai - 600099',
    bankName: 'Axis Bank',
    accountNumber: '915010023485',
    ifsc: 'UTIB0000321',
    upiId: 'sidds@okaxis',
    pan: 'DMOPK7891B',
    aadhaar: '5678-9012-3456',
    remarks: 'Excellent rapport with drivers',
  },
  {
    id: 'OWN05',
    name: 'Priya Karthikeyan',
    phone: '9444455667',
    email: 'priya.karthik@gmail.com',
    address: '15/A, Velachery Main Road, Chennai - 600042',
    bankName: 'Indian Bank',
    accountNumber: '601245812',
    ifsc: 'IDIB000V012',
    upiId: 'priyak@okindian',
    pan: 'ENQPK1234D',
    aadhaar: '1234-5678-9012',
    remarks: 'Direct support manager',
  },
];

const SAMPLE_DRIVERS = [
  {
    id: 'DRV01',
    name: 'Karthik Raja M',
    phone: '9176012345',
    address: '56, Pillaiyar Kovil Street, Thiruvanmiyur, Chennai - 600041',
    badgeNumber: 'B-12891',
    badgeExpiry: '2028-11-20',
    licenceNumber: 'TN-07-201500124',
    licenceExpiry: '2035-08-15',
    aadhaar: '8901-2345-6789',
    pan: 'BJKPR1234H',
    emergencyContact: 'Vijayalakshmi (Wife) - 9176054321',
    salary: 22000,
    joiningDate: '2020-04-10',
    status: 'Active',
  },
  {
    id: 'DRV02',
    name: 'Ganesh Kumar R',
    phone: '9176123456',
    address: '11, VOC Street, Tambaram West, Chennai - 600045',
    badgeNumber: 'B-14521',
    badgeExpiry: '2027-05-14',
    licenceNumber: 'TN-11-201800234',
    licenceExpiry: '2038-03-12',
    aadhaar: '5678-1234-9012',
    pan: 'CKMPG5678L',
    emergencyContact: 'Ranganathan (Father) - 9176165432',
    salary: 21500,
    joiningDate: '2021-08-18',
    status: 'Active',
  },
  {
    id: 'DRV03',
    name: 'Subramani P',
    phone: '9176234567',
    address: '4, Perumal Kovil Street, Chromepet, Chennai - 600044',
    badgeNumber: 'B-09823',
    badgeExpiry: '2026-08-10',
    licenceNumber: 'TN-14-201200541',
    licenceExpiry: '2032-10-18',
    aadhaar: '1234-9876-5432',
    pan: 'DLKPS8901M',
    emergencyContact: 'Palani (Brother) - 9176276543',
    salary: 23000,
    joiningDate: '2019-01-15',
    status: 'Active',
  },
  {
    id: 'DRV04',
    name: 'Vijay Chandran S',
    phone: '9176345678',
    address: '32, Reddiyar Street, Poonamallee, Chennai - 600056',
    badgeNumber: 'B-15982',
    badgeExpiry: '2029-01-30',
    licenceNumber: 'TN-12-202000845',
    licenceExpiry: '2040-02-28',
    aadhaar: '4567-8901-2345',
    pan: 'EMKPC1122N',
    emergencyContact: 'Selvi (Wife) - 9176387654',
    salary: 20000,
    joiningDate: '2022-10-01',
    status: 'Active',
  },
  {
    id: 'DRV05',
    name: 'Saravanan Muthu',
    phone: '9176456789',
    address: '88, Lake View Road, Velachery, Chennai - 600042',
    badgeNumber: 'B-11122',
    badgeExpiry: '2027-09-08',
    licenceNumber: 'TN-09-201600982',
    licenceExpiry: '2036-07-20',
    aadhaar: '9012-3456-7890',
    pan: 'FNKPS2233P',
    emergencyContact: 'Munusamy (Father) - 9176498765',
    salary: 22500,
    joiningDate: '2020-09-22',
    status: 'Active',
  },
  {
    id: 'DRV06',
    name: 'Babu Janakiraman',
    phone: '9176567890',
    address: '21, Pillaiyar Koil Street, Guindy, Chennai - 600032',
    badgeNumber: 'B-10294',
    badgeExpiry: '2028-04-12',
    licenceNumber: 'TN-02-201400234',
    licenceExpiry: '2034-06-11',
    aadhaar: '3214-5698-1011',
    pan: 'GNKPB4455Q',
    emergencyContact: 'Janakiraman (Father) - 9176510987',
    salary: 21000,
    joiningDate: '2021-02-14',
    status: 'Active',
  },
  {
    id: 'DRV07',
    name: 'Suresh Raina S',
    phone: '9176678901',
    address: '14, South Sivan Kovil Street, Vadapalani, Chennai - 600026',
    badgeNumber: 'B-13982',
    badgeExpiry: '2026-12-15',
    licenceNumber: 'TN-05-201700941',
    licenceExpiry: '2037-11-20',
    aadhaar: '7841-2391-4560',
    pan: 'HPKPS7788T',
    emergencyContact: 'Gokula (Wife) - 9176623456',
    salary: 22000,
    joiningDate: '2021-11-01',
    status: 'Active',
  }
];

function generate35Vehicles() {
  const list = [];
  const manufacturers = ['Toyota', 'Maruti Suzuki', 'Mahindra', 'Force Motors', 'Hyundai'];
  const models = {
    'Toyota': ['Innova Crysta', 'Etios'],
    'Maruti Suzuki': ['Ertiga', 'Dzire', 'Ciaz'],
    'Mahindra': ['Xylo', 'Bolero Neo', 'Scorpio-N'],
    'Force Motors': ['Traveller T1', 'Traveller T2'],
    'Hyundai': ['Aura', 'Creta'],
  };
  const vehicleTypes = {
    'Innova Crysta': 'SUV',
    'Etios': 'Sedan',
    'Ertiga': 'SUV',
    'Dzire': 'Sedan',
    'Ciaz': 'Sedan',
    'Xylo': 'SUV',
    'Bolero Neo': 'SUV',
    'Scorpio-N': 'SUV',
    'Traveller T1': 'Tempo Traveler',
    'Traveller T2': 'Tempo Traveler',
    'Aura': 'Sedan',
    'Creta': 'SUV',
  };

  for (let i = 1; i <= 35; i++) {
    const regNum = `TN-${(10 + Math.floor(i / 3)).toString()}-E7-${(1000 + i).toString()}`;
    const mfg = manufacturers[i % manufacturers.length];
    const mfgModels = models[mfg];
    const model = mfgModels[i % mfgModels.length];
    const vType = vehicleTypes[model] || 'Sedan';
    const owner = SAMPLE_OWNERS[i % SAMPLE_OWNERS.length];
    
    let driverId = '';
    let driverName = '';
    if (i <= SAMPLE_DRIVERS.length) {
      driverId = SAMPLE_DRIVERS[i - 1].id;
      driverName = SAMPLE_DRIVERS[i - 1].name;
    } else {
      driverId = `DRV${i.toString().padStart(2, '0')}`;
      driverName = `Driver Partner ${i}`;
    }

    const company = SAMPLE_COMPANIES[i % SAMPLE_COMPANIES.length];
    const site = SAMPLE_SITES[i % SAMPLE_SITES.length];

    let emiDate = '2026-07-15';
    let insDate = '2026-10-24';
    let perDate = '2026-11-12';
    let fcDate = '2027-04-18';
    let pollDate = '2026-09-08';

    if (i === 1) {
      emiDate = '2026-06-05';
    } else if (i === 2) {
      insDate = '2026-07-25';
    } else if (i === 3) {
      perDate = '2026-07-28';
    } else if (i === 4) {
      fcDate = '2026-07-20';
    }

    list.push({
      id: `VEH${i.toString().padStart(3, '0')}`,
      registrationNumber: regNum,
      model,
      manufacturer: mfg,
      year: 2018 + (i % 6),
      fuelType: i % 3 === 0 ? 'CNG' : i % 3 === 1 ? 'Diesel' : 'Petrol',
      transmission: i % 4 === 0 ? 'Automatic' : 'Manual',
      vehicleType: vType,
      ownerId: owner.id,
      ownerName: owner.name,
      driverId,
      driverName,
      company: company.name,
      site: site.name,
      joiningDate: `2021-0${(1 + i % 9).toString()}-10`,
      status: i === 35 ? 'Inactive' : 'Active',
      emiAmount: 18000 + (i % 5) * 1500,
      emiDueDate: emiDate,
      insuranceExpiry: insDate,
      permitExpiry: perDate,
      fcExpiry: fcDate,
      pollutionExpiry: pollDate,
      fastagNumber: `FTG-9988-100${i}`,
      remarks: i === 1 ? 'Overdue EMI reminder sent' : 'Operating smoothly',
    });
  }
  return list;
}

function generateSampleTransactions(vehicles) {
  const expenses = [];
  const billing = [];

  const months = ['2026-06', '2026-07'];

  vehicles.forEach((v, idx) => {
    months.forEach((m) => {
      const billingAmount = 65000 + (idx % 5) * 5000;
      billing.push({
        id: `PAY-${v.id}-${m}`,
        month: m,
        vehicleNumber: v.registrationNumber,
        company: v.company,
        invoiceNumber: `E7-INV-${m.replace('-', '')}-${(200 + idx).toString()}`,
        paymentDate: `${m}-05`,
        amountReceived: billingAmount,
        remarks: `Standard billing for ${m}`,
      });

      const fuelCost = v.fuelType === 'CNG' ? 12000 : 18000;
      expenses.push({
        id: `EXP-FUEL-${v.id}-${m}`,
        date: `${m}-12`,
        month: m,
        vehicleNumber: v.registrationNumber,
        expenseType: v.fuelType === 'CNG' ? 'CNG' : 'Fuel',
        amount: fuelCost,
        remarks: `Monthly fuel logistics`,
      });

      expenses.push({
        id: `EXP-EMI-${v.id}-${m}`,
        date: `${m}-10`,
        month: m,
        vehicleNumber: v.registrationNumber,
        expenseType: 'EMI',
        amount: v.emiAmount,
        remarks: `Monthly auto loan EMI`,
      });

      expenses.push({
        id: `EXP-FTG-${v.id}-${m}`,
        date: `${m}-18`,
        month: m,
        vehicleNumber: v.registrationNumber,
        expenseType: 'FASTag',
        amount: 2500,
        remarks: `Toll transactions`,
      });

      expenses.push({
        id: `EXP-SAL-${v.id}-${m}`,
        date: `${m}-28`,
        month: m,
        vehicleNumber: v.registrationNumber,
        expenseType: 'Driver Salary',
        amount: 21000,
        remarks: `Driver salary distribution`,
      });

      if (idx % 4 === 0) {
        expenses.push({
          id: `EXP-SRV-${v.id}-${m}`,
          date: `${m}-20`,
          month: m,
          vehicleNumber: v.registrationNumber,
          expenseType: 'Service',
          amount: 4500,
          remarks: `Routine periodic maintenance`,
        });
      }

      if (idx % 7 === 1) {
        expenses.push({
          id: `EXP-ADV-${v.id}-${m}`,
          date: `${m}-15`,
          month: m,
          vehicleNumber: v.registrationNumber,
          expenseType: 'Advance',
          amount: 5000,
          remarks: `Operational advance fuel support`,
        });
      }
    });
  });

  return { expenses, billing };
}

function getInitialDatabaseState() {
  const vehicles = generate35Vehicles();
  const txs = generateSampleTransactions(vehicles);
  return {
    vehicles,
    owners: SAMPLE_OWNERS,
    drivers: SAMPLE_DRIVERS,
    companies: SAMPLE_COMPANIES,
    sites: SAMPLE_SITES,
    billing: txs.billing,
    expenses: txs.expenses,
  };
}

// --- Read/Write Database Helpers ---
function readDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialState = getInitialDatabaseState();
      fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2));
      return initialState;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading database file, returning default state:', error);
    return getInitialDatabaseState();
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to database file:', error);
  }
}

// --- REST API Endpoints ---
const collections = ['vehicles', 'owners', 'drivers', 'companies', 'sites', 'billing', 'expenses'];

// Seed endpoint
app.post('/api/seed', (req, res) => {
  const state = getInitialDatabaseState();
  writeDatabase(state);
  res.json({ message: 'Database successfully re-seeded!', data: state });
});

// Clear endpoint
app.post('/api/clear', (req, res) => {
  const emptyState = {
    vehicles: [],
    owners: [],
    drivers: [],
    companies: [],
    sites: [],
    billing: [],
    expenses: []
  };
  writeDatabase(emptyState);
  res.json({ message: 'Database successfully cleared!', data: emptyState });
});

// Generic CRUD routing
collections.forEach((colName) => {
  // Get all items
  app.get(`/api/${colName}`, (req, res) => {
    const db = readDatabase();
    res.json(db[colName] || []);
  });

  // Get item by ID
  app.get(`/api/${colName}/:id`, (req, res) => {
    const db = readDatabase();
    const idKey = colName === 'companies' ? 'name' : 'id';
    const item = (db[colName] || []).find((x) => x[idKey] === req.params.id);
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  });

  // Create or Update item
  app.post(`/api/${colName}`, (req, res) => {
    const db = readDatabase();
    const item = req.body;
    const idKey = colName === 'companies' ? 'name' : 'id';
    
    if (!item[idKey]) {
      return res.status(400).json({ error: `Missing unique identifier key "${idKey}"` });
    }

    if (!db[colName]) db[colName] = [];

    const index = db[colName].findIndex((x) => x[idKey] === item[idKey]);
    if (index !== -1) {
      // Update
      db[colName][index] = item;
    } else {
      // Create
      db[colName].push(item);
    }
    
    writeDatabase(db);
    res.json(item);
  });

  // Delete item
  app.delete(`/api/${colName}/:id`, (req, res) => {
    const db = readDatabase();
    const idKey = colName === 'companies' ? 'name' : 'id';
    const initialLength = (db[colName] || []).length;
    
    db[colName] = (db[colName] || []).filter((x) => x[idKey] !== req.params.id);
    
    if (db[colName].length < initialLength) {
      writeDatabase(db);
      res.json({ success: true, message: `Successfully deleted item from ${colName}` });
    } else {
      res.status(404).json({ error: 'Item not found for deletion' });
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Travels database API server running at http://127.0.0.1:${PORT}`);
});
