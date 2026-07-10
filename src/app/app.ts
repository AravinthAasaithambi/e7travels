import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { DatabaseService } from './services/database.service';
import {
  Vehicle,
  Owner,
  Driver,
  Company,
  Site,
  CompanyPayment,
  Expense,
  EXPENSE_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
  VEHICLE_TYPES,
  VEHICLE_STATUSES,
} from './types';
import { formatDate, toInputDateFormat, formatMonth } from './services/dateUtils';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private dbService = inject(DatabaseService);

  // --- Core ERP States ---
  vehicles: Vehicle[] = [];
  owners: Owner[] = [];
  drivers: Driver[] = [];
  companies: Company[] = [];
  sites: Site[] = [];
  payments: CompanyPayment[] = [];
  expenses: Expense[] = [];

  // --- UI/Routing State ---
  activeTab: 'Dashboard' | 'Registers' | 'Transactions' | 'Ledgers' | 'Settlement' | 'Reports' | 'VBA Export' | 'Settings' = 'Dashboard';
  activeSubTab: string = 'Vehicle Master';
  vehicleFilter: 'all' | 'running' | 'idle' | 'new' = 'all';

  // --- CRUD States ---
  searchQuery: string = '';
  editingId: string | null = null;
  isAdding: boolean = false;
  formError: string | null = null;
  deleteCandidate: { id: string; type: string; title: string } | null = null;

  // --- Form Models ---
  vehicleForm: Partial<Vehicle> = {};
  ownerForm: Partial<Owner> = {};
  driverForm: Partial<Driver> = {};
  companyForm: Partial<Company> = {};
  siteForm: Partial<Site> = {};
  payForm: Partial<CompanyPayment> = { month: '2026-07', paymentDate: '2026-07-08' };
  expForm: Partial<Expense> = { date: '2026-07-08', month: '2026-07' };

  // --- Filters ---
  filterMonth: string = '';

  // --- Settings Models ---
  newCompName = '';
  newCompTerms = 'Net 30';
  newSiteName = '';
  newSiteLocation = '';
  taxRate = 5;
  commissionRate = 15;

  // --- Settlement Views State ---
  selectedMonth = '2026-07';
  selectedVehicle = '';
  selectedOwner = '';
  selectedDriver = '';
  selectedCompany = '';
  invoiceTerms = 'Due in 30 days';
  printNotice = false;

  // --- Constants for Templates ---
  EXPENSE_TYPES = EXPENSE_TYPES;
  FUEL_TYPES = FUEL_TYPES;
  TRANSMISSION_TYPES = TRANSMISSION_TYPES;
  VEHICLE_TYPES = VEHICLE_TYPES;
  VEHICLE_STATUSES = VEHICLE_STATUSES;
  vehicleFilters: ('all' | 'running' | 'idle' | 'new')[] = ['all', 'running', 'idle', 'new'];

  ngOnInit() {
    // Subscribe to database streams
    this.dbService.vehicles$.subscribe((data) => {
      this.vehicles = data;
      if (data.length && !this.selectedVehicle) {
        this.selectedVehicle = data[0].registrationNumber;
        this.selectedCompany = data[0].company;
      }
    });
    this.dbService.owners$.subscribe((data) => {
      this.owners = data;
      if (data.length && !this.selectedOwner) this.selectedOwner = data[0].id;
    });
    this.dbService.drivers$.subscribe((data) => {
      this.drivers = data;
      if (data.length && !this.selectedDriver) this.selectedDriver = data[0].id;
    });
    this.dbService.companies$.subscribe((data) => (this.companies = data));
    this.dbService.sites$.subscribe((data) => (this.sites = data));
    this.dbService.billing$.subscribe((data) => (this.payments = data));
    this.dbService.expenses$.subscribe((data) => (this.expenses = data));
  }

  // --- Date/Currency Helpers ---
  formatDate(date: string | null | undefined): string {
    return formatDate(date);
  }

  toInputDateFormat(date: string | null | undefined): string {
    return toInputDateFormat(date);
  }

  formatMonth(month: string | null | undefined): string {
    return formatMonth(month);
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  }

  // --- Ledger Calculation Helpers ---
  getVehicleRevenue(regNum: string): number {
    return this.payments
      .filter((p) => p.vehicleNumber === regNum)
      .reduce((sum, p) => sum + p.amountReceived, 0);
  }

  getVehicleExpenses(regNum: string): number {
    return this.expenses
      .filter((e) => e.vehicleNumber === regNum)
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getOwnerRevenue(ownerId: string): number {
    const regs = this.vehicles
      .filter((v) => v.ownerId === ownerId)
      .map((v) => v.registrationNumber);
    return this.payments
      .filter((p) => regs.includes(p.vehicleNumber))
      .reduce((sum, p) => sum + p.amountReceived, 0);
  }

  getOwnerDeduction(ownerId: string): number {
    return this.getOwnerRevenue(ownerId) * (this.commissionRate / 100);
  }

  getOwnerNetPayable(ownerId: string): number {
    return this.getOwnerRevenue(ownerId) * (1 - this.commissionRate / 100);
  }

  // --- Navigation Router ---
  handleNavigate(route: string, filter?: 'all' | 'running' | 'idle' | 'new') {
    if (filter) {
      this.vehicleFilter = filter;
    } else if (route === 'Vehicle Master') {
      this.vehicleFilter = 'all';
    }

    switch (route) {
      case 'Dashboard':
        this.activeTab = 'Dashboard';
        break;
      case 'Vehicle Master':
      case 'Owner Master':
      case 'Driver Master':
      case 'Company Master':
      case 'Site Master':
        this.activeTab = 'Registers';
        this.activeSubTab = route;
        break;
      case 'Company Payments':
      case 'Expense Entry':
        this.activeTab = 'Transactions';
        this.activeSubTab = route;
        break;
      case 'Vehicle Ledger':
      case 'Owner Ledger':
      case 'Driver Ledger':
      case 'Vehicle History':
        this.activeTab = 'Ledgers';
        this.activeSubTab = route === 'Vehicle History' ? 'Vehicle Ledger' : route;
        break;
      case 'Monthly Settlement':
      case 'Owner Statement':
      case 'Driver Statement':
      case 'Invoice':
      case 'Payment Voucher':
        this.activeTab = 'Settlement';
        this.activeSubTab = route;
        break;
      case 'Profit & Loss':
      case 'Reports':
        this.activeTab = 'Reports';
        break;
      case 'Settings':
        this.activeTab = 'Settings';
        break;
      default:
        if (['Registers', 'Transactions', 'Ledgers', 'Settlement', 'VBA Export'].includes(route)) {
          this.activeTab = route as any;
          if (route === 'Registers') this.activeSubTab = 'Vehicle Master';
          else if (route === 'Transactions') this.activeSubTab = 'Company Payments';
          else if (route === 'Ledgers') this.activeSubTab = 'Vehicle Ledger';
          else if (route === 'Settlement') this.activeSubTab = 'Monthly Settlement';
        }
        break;
    }
    this.resetForms();
  }

  resetForms() {
    this.vehicleForm = {};
    this.ownerForm = {};
    this.driverForm = {};
    this.companyForm = {};
    this.siteForm = {};
    this.payForm = { month: '2026-07', paymentDate: '2026-07-08' };
    this.expForm = { date: '2026-07-08', month: '2026-07' };
    this.editingId = null;
    this.isAdding = false;
    this.formError = null;
  }

  // --- Database seeding ---
  handleForceRefresh() {
    if (confirm('Are you sure you want to reset and seed the database with initial sample data?')) {
      this.dbService.seedDatabase().subscribe({
        next: () => alert('Database successfully seeded!'),
        error: (err) => console.error('Seeding failed:', err),
      });
    }
  }

  handleClearDatabase() {
    if (confirm('Are you sure you want to clear all data in the database? This will delete all vehicles, owners, drivers, clients, sites, billing and expense logs, starting a fresh empty application.')) {
      this.dbService.clearDatabase().subscribe({
        next: () => {
          this.resetForms();
          this.selectedVehicle = '';
          this.selectedOwner = '';
          this.selectedDriver = '';
          this.selectedCompany = '';
          alert('Database successfully cleared! You can now start feeding your own data.');
        },
        error: (err) => console.error('Clearing failed:', err),
      });
    }
  }

  // --- CRUD Save Operations ---
  handleSaveVehicle(e: Event) {
    e.preventDefault();
    this.formError = null;

    if (!this.vehicleForm.registrationNumber || !this.vehicleForm.model || !this.vehicleForm.ownerId || !this.vehicleForm.driverId) {
      this.formError = 'Registration Number, Model, Owner, and Driver are mandatory fields.';
      return;
    }

    const cleanReg = this.vehicleForm.registrationNumber.trim().toUpperCase();
    const isDuplicate = this.vehicles.some(
      (v) => v.registrationNumber.toUpperCase() === cleanReg && v.id !== this.vehicleForm.id
    );

    if (isDuplicate) {
      this.formError = `Vehicle Registration Number "${cleanReg}" is already registered.`;
      return;
    }

    const matchedOwner = this.owners.find((o) => o.id === this.vehicleForm.ownerId);
    const matchedDriver = this.drivers.find((d) => d.id === this.vehicleForm.driverId);

    const vehicleRecord: Vehicle = {
      id: this.vehicleForm.id || `VEH${(this.vehicles.length + 1).toString().padStart(3, '0')}`,
      registrationNumber: cleanReg,
      model: this.vehicleForm.model,
      manufacturer: this.vehicleForm.manufacturer || 'Toyota',
      year: Number(this.vehicleForm.year) || 2022,
      fuelType: this.vehicleForm.fuelType || 'Diesel',
      transmission: this.vehicleForm.transmission || 'Manual',
      vehicleType: this.vehicleForm.vehicleType || 'Sedan',
      ownerId: this.vehicleForm.ownerId,
      ownerName: matchedOwner ? matchedOwner.name : 'Unknown Owner',
      driverId: this.vehicleForm.driverId,
      driverName: matchedDriver ? matchedDriver.name : 'Unknown Driver',
      company: this.vehicleForm.company || '',
      site: this.vehicleForm.site || '',
      joiningDate: this.vehicleForm.joiningDate || '2026-07-08',
      status: this.vehicleForm.status || 'Active',
      emiAmount: Number(this.vehicleForm.emiAmount) || 0,
      emiDueDate: this.vehicleForm.emiDueDate || '',
      insuranceExpiry: this.vehicleForm.insuranceExpiry || '',
      permitExpiry: this.vehicleForm.permitExpiry || '',
      fcExpiry: this.vehicleForm.fcExpiry || '',
      pollutionExpiry: this.vehicleForm.pollutionExpiry || '',
      fastagNumber: this.vehicleForm.fastagNumber || '',
      remarks: this.vehicleForm.remarks || '',
    };

    this.dbService.saveVehicle(vehicleRecord).subscribe({
      next: () => this.resetForms(),
      error: (err) => (this.formError = 'Failed to save vehicle: ' + err.message),
    });
  }

  handleSaveOwner(e: Event) {
    e.preventDefault();
    this.formError = null;

    if (!this.ownerForm.name || !this.ownerForm.phone) {
      this.formError = 'Owner Name and Phone Number are mandatory fields.';
      return;
    }

    const ownerRecord: Owner = {
      id: this.ownerForm.id || `OWN${(this.owners.length + 1).toString().padStart(2, '0')}`,
      name: this.ownerForm.name,
      phone: this.ownerForm.phone,
      email: this.ownerForm.email || '',
      address: this.ownerForm.address || '',
      bankName: this.ownerForm.bankName || '',
      accountNumber: this.ownerForm.accountNumber || '',
      ifsc: this.ownerForm.ifsc || '',
      upiId: this.ownerForm.upiId || '',
      pan: this.ownerForm.pan || '',
      aadhaar: this.ownerForm.aadhaar || '',
      remarks: this.ownerForm.remarks || '',
    };

    this.dbService.saveOwner(ownerRecord).subscribe({
      next: () => this.resetForms(),
      error: (err) => (this.formError = 'Failed to save owner: ' + err.message),
    });
  }

  handleSaveDriver(e: Event) {
    e.preventDefault();
    this.formError = null;

    if (!this.driverForm.name || !this.driverForm.phone || !this.driverForm.licenceNumber) {
      this.formError = 'Driver Name, Phone, and Licence Number are mandatory.';
      return;
    }

    const driverRecord: Driver = {
      id: this.driverForm.id || `DRV${(this.drivers.length + 1).toString().padStart(2, '0')}`,
      name: this.driverForm.name,
      phone: this.driverForm.phone,
      address: this.driverForm.address || '',
      badgeNumber: this.driverForm.badgeNumber || '',
      badgeExpiry: this.driverForm.badgeExpiry || '',
      licenceNumber: this.driverForm.licenceNumber || '',
      licenceExpiry: this.driverForm.licenceExpiry || '',
      aadhaar: this.driverForm.aadhaar || '',
      pan: this.driverForm.pan || '',
      emergencyContact: this.driverForm.emergencyContact || '',
      salary: Number(this.driverForm.salary) || 0,
      joiningDate: this.driverForm.joiningDate || '2026-07-08',
      status: this.driverForm.status || 'Active',
    };

    this.dbService.saveDriver(driverRecord).subscribe({
      next: () => this.resetForms(),
      error: (err) => (this.formError = 'Failed to save driver: ' + err.message),
    });
  }

  handleSaveCompany(e: Event) {
    e.preventDefault();
    this.formError = null;

    if (!this.companyForm.name) {
      this.formError = 'Company Name is mandatory.';
      return;
    }

    const companyRecord: Company = {
      name: this.companyForm.name,
      billingCycle: this.companyForm.billingCycle || 'Monthly',
      paymentTerms: this.companyForm.paymentTerms || 'Net 30',
      contactPerson: this.companyForm.contactPerson || '',
      phone: this.companyForm.phone || '',
      email: this.companyForm.email || '',
      address: this.companyForm.address || '',
    };

    this.dbService.saveCompany(companyRecord).subscribe({
      next: () => this.resetForms(),
      error: (err) => (this.formError = 'Failed to save company: ' + err.message),
    });
  }

  handleSaveSite(e: Event) {
    e.preventDefault();
    this.formError = null;

    if (!this.siteForm.name || !this.siteForm.companyName) {
      this.formError = 'Site Name and Associated Company are mandatory.';
      return;
    }

    const siteRecord: Site = {
      id: this.siteForm.id || `S${(this.sites.length + 1).toString().padStart(2, '0')}`,
      name: this.siteForm.name,
      companyName: this.siteForm.companyName,
      location: this.siteForm.location || '',
      contactPerson: this.siteForm.contactPerson || '',
      phone: this.siteForm.phone || '',
      remarks: this.siteForm.remarks || '',
    };

    this.dbService.saveSite(siteRecord).subscribe({
      next: () => this.resetForms(),
      error: (err) => (this.formError = 'Failed to save site: ' + err.message),
    });
  }

  handleSaveBilling(e: Event) {
    e.preventDefault();
    this.formError = null;

    if (!this.payForm.vehicleNumber || !this.payForm.amountReceived || !this.payForm.invoiceNumber) {
      this.formError = 'Vehicle Number, Invoice Number, and Amount Received are required.';
      return;
    }

    const matchedVeh = this.vehicles.find((v) => v.registrationNumber === this.payForm.vehicleNumber);
    const txDate = this.payForm.paymentDate || '2026-07-08';
    const txMonth = this.payForm.month || txDate.substring(0, 7);

    const newPayment: CompanyPayment = {
      id: this.payForm.id || `PAY-${Date.now()}`,
      month: txMonth,
      vehicleNumber: this.payForm.vehicleNumber,
      company: matchedVeh ? matchedVeh.company : 'Direct Client',
      invoiceNumber: this.payForm.invoiceNumber,
      paymentDate: txDate,
      amountReceived: Number(this.payForm.amountReceived),
      remarks: this.payForm.remarks || '',
    };

    this.dbService.saveBilling(newPayment).subscribe({
      next: () => this.resetForms(),
      error: (err) => (this.formError = 'Failed to save payment: ' + err.message),
    });
  }

  handleSaveExpense(e: Event) {
    e.preventDefault();
    this.formError = null;

    if (!this.expForm.vehicleNumber || !this.expForm.amount || !this.expForm.expenseType) {
      this.formError = 'Vehicle Number, Expense Type, and Amount are required fields.';
      return;
    }

    const txDate = this.expForm.date || '2026-07-08';
    const txMonth = txDate.substring(0, 7);

    const newExpense: Expense = {
      id: this.expForm.id || `EXP-${Date.now()}`,
      date: txDate,
      month: txMonth,
      vehicleNumber: this.expForm.vehicleNumber,
      expenseType: this.expForm.expenseType,
      amount: Number(this.expForm.amount),
      remarks: this.expForm.remarks || '',
    };

    this.dbService.saveExpense(newExpense).subscribe({
      next: () => this.resetForms(),
      error: (err) => (this.formError = 'Failed to save expense: ' + err.message),
    });
  }

  // --- Deletion Handlers ---
  triggerDelete(id: string, type: string, title: string) {
    this.deleteCandidate = { id, type, title };
  }

  confirmDelete() {
    if (!this.deleteCandidate) return;
    const { id, type } = this.deleteCandidate;

    let obs: Observable<any>;
    switch (type) {
      case 'vehicle': obs = this.dbService.deleteVehicle(id); break;
      case 'owner': obs = this.dbService.deleteOwner(id); break;
      case 'driver': obs = this.dbService.deleteDriver(id); break;
      case 'company': obs = this.dbService.deleteCompany(id); break;
      case 'site': obs = this.dbService.deleteSite(id); break;
      case 'payment': obs = this.dbService.deleteBilling(id); break;
      case 'expense': obs = this.dbService.deleteExpense(id); break;
      default: return;
    }

    obs.subscribe({
      next: () => (this.deleteCandidate = null),
      error: (err: any) => alert('Delete failed: ' + err.message),
    });
  }

  // --- Editing Setup ---
  startEdit(item: any, type: string) {
    this.resetForms();
    this.editingId = type === 'company' ? item.name : item.id;
    
    switch (type) {
      case 'vehicle': this.vehicleForm = { ...item }; break;
      case 'owner': this.ownerForm = { ...item }; break;
      case 'driver': this.driverForm = { ...item }; break;
      case 'company': this.companyForm = { ...item }; break;
      case 'site': this.siteForm = { ...item }; break;
      case 'payment': this.payForm = { ...item }; this.isAdding = true; break;
      case 'expense': this.expForm = { ...item }; this.isAdding = true; break;
    }
  }

  // --- Dynamic Dashboard KPIs ---
  get totalVehicles() { return this.vehicles.length; }
  get runningVehicles() { return this.vehicles.filter((v) => v.status === 'Active').length; }
  get idleVehicles() { return this.totalVehicles - this.runningVehicles; }
  get newVehiclesThisMonth() {
    const currentMonth = '2026-07';
    return this.vehicles.filter((v) => v.joiningDate && v.joiningDate.startsWith(currentMonth)).length;
  }
  get totalBilling() { return this.payments.reduce((acc, p) => acc + p.amountReceived, 0); }
  get totalExpenses() { return this.expenses.reduce((acc, e) => acc + e.amount, 0); }
  get netProfit() { return this.totalBilling - this.totalExpenses; }
  get pendingOwnerPayments() { return Math.max(0, this.totalBilling * 0.85 - this.totalExpenses * 0.4); }
  get pendingDriverSalary() {
    const currentMonth = '2026-07';
    const activeDriversSalaryTotal = this.vehicles
      .filter((v) => v.status === 'Active')
      .reduce((sum, v) => sum + 22000, 0);
    const loggedDriverSalariesThisMonth = this.expenses
      .filter((e) => e.month === currentMonth && e.expenseType === 'Driver Salary')
      .reduce((sum, e) => sum + e.amount, 0);
    return Math.max(0, activeDriversSalaryTotal - loggedDriverSalariesThisMonth);
  }

  // --- Filtered Master Registers ---
  get filteredVehicles() {
    return this.vehicles.filter((v) => {
      const matchSearch =
        v.registrationNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.ownerName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.driverName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        v.company.toLowerCase().includes(this.searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (this.vehicleFilter === 'running') return v.status === 'Active';
      if (this.vehicleFilter === 'idle') return v.status !== 'Active';
      if (this.vehicleFilter === 'new') return v.joiningDate?.startsWith('2026-07');
      return true;
    });
  }

  get filteredOwners() {
    return this.owners.filter(
      (o) =>
        o.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        o.phone.includes(this.searchQuery)
    );
  }

  get filteredDrivers() {
    return this.drivers.filter((d) => d.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  get filteredCompanies() {
    return this.companies.filter((c) => c.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  get filteredSites() {
    return this.sites.filter((s) => s.name.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  get filteredPayments() {
    return this.payments.filter((p) => {
      const matchSearch =
        p.vehicleNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.company.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchMonth = this.filterMonth ? p.month === this.filterMonth : true;
      return matchSearch && matchMonth;
    });
  }

  get filteredExpenses() {
    return this.expenses.filter((e) => {
      const matchSearch =
        e.vehicleNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        e.expenseType.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchMonth = this.filterMonth ? e.month === this.filterMonth : true;
      return matchSearch && matchMonth;
    });
  }

  // --- Dynamic Months List ---
  get distinctMonths() {
    const list = new Set(['2026-06', '2026-07']);
    this.payments.forEach((p) => list.add(p.month));
    this.expenses.forEach((e) => list.add(e.month));
    return Array.from(list).sort().reverse();
  }

  get distinctCompanies() {
    const list = new Set<string>();
    this.vehicles.forEach((v) => { if (v.company) list.add(v.company); });
    return Array.from(list);
  }

  // --- Dynamic Expiry Styling ---
  getVehicleExpiryStatus(v: Vehicle) {
    if (v.status === 'Inactive') return { label: 'Inactive', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    
    const getDaysDiff = (dateStr: string) => {
      if (!dateStr) return 9999;
      const target = new Date(dateStr);
      const today = new Date('2026-07-08');
      const diffTime = target.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const emiDiff = getDaysDiff(v.emiDueDate);
    const insDiff = getDaysDiff(v.insuranceExpiry);
    const perDiff = getDaysDiff(v.permitExpiry);
    const fcDiff = getDaysDiff(v.fcExpiry);

    if (emiDiff < 0) return { label: 'Overdue EMI', color: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' };
    if (insDiff >= 0 && insDiff <= 30) return { label: 'Insurance Expiring', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    if (perDiff >= 0 && perDiff <= 30) return { label: 'Permit Expiring', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (fcDiff >= 0 && fcDiff <= 30) return { label: 'FC Expiring', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    return { label: 'Active', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }

  // --- Report Charts Metrics ---
  get monthlyTrendsData() {
    return this.distinctMonths.slice().reverse().map((m) => {
      const income = this.payments.filter((p) => p.month === m).reduce((sum, p) => sum + p.amountReceived, 0);
      const cost = this.expenses.filter((e) => e.month === m).reduce((sum, e) => sum + e.amount, 0);
      return {
        month: m,
        monthLabel: this.formatMonth(m),
        Revenue: income,
        Expenses: cost,
        Profit: income - cost,
      };
    });
  }

  get companyRevenueData() {
    const map: { [key: string]: number } = {};
    this.payments.forEach((p) => {
      map[p.company] = (map[p.company] || 0) + p.amountReceived;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }

  get expenseBreakdownData() {
    const map: { [key: string]: number } = {};
    this.expenses.forEach((e) => {
      map[e.expenseType] = (map[e.expenseType] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  // --- Settlements & Invoices Computations ---
  getMonthlySettlementData() {
    return this.vehicles.map((v) => {
      const billing = this.payments
        .filter((p) => p.vehicleNumber === v.registrationNumber && p.month === this.selectedMonth)
        .reduce((sum, p) => sum + p.amountReceived, 0);

      const vehicleExpenses = this.expenses.filter(
        (e) => e.vehicleNumber === v.registrationNumber && e.month === this.selectedMonth
      );

      const cng = vehicleExpenses.filter((e) => e.expenseType === 'CNG').reduce((sum, e) => sum + e.amount, 0);
      const fuel = vehicleExpenses.filter((e) => e.expenseType === 'Fuel').reduce((sum, e) => sum + e.amount, 0);
      const emi = vehicleExpenses.filter((e) => e.expenseType === 'EMI').reduce((sum, e) => sum + e.amount, 0);
      const fastag = vehicleExpenses.filter((e) => e.expenseType === 'FASTag').reduce((sum, e) => sum + e.amount, 0);
      const advance = vehicleExpenses
        .filter((e) => e.expenseType === 'Advance' || e.expenseType === 'Driver Advance')
        .reduce((sum, e) => sum + e.amount, 0);
      const repair = vehicleExpenses.filter((e) => e.expenseType === 'Repair').reduce((sum, e) => sum + e.amount, 0);
      const service = vehicleExpenses.filter((e) => e.expenseType === 'Service').reduce((sum, e) => sum + e.amount, 0);
      const penalty = vehicleExpenses.filter((e) => e.expenseType === 'Penalty').reduce((sum, e) => sum + e.amount, 0);
      const other = vehicleExpenses
        .filter((e) => !['CNG', 'Fuel', 'EMI', 'FASTag', 'Advance', 'Driver Advance', 'Repair', 'Service', 'Penalty'].includes(e.expenseType))
        .reduce((sum, e) => sum + e.amount, 0);

      const totalDeductions = cng + fuel + emi + fastag + advance + repair + service + penalty + other;
      const netPayable = Math.max(0, billing - totalDeductions);

      return {
        vehicle: v.registrationNumber,
        owner: v.ownerName,
        billing,
        totalDeductions,
        netPayable,
        cng, fuel, emi, fastag, advance, repair, service, penalty, other,
      };
    });
  }

  getOwnerStatementData() {
    const owner = this.owners.find((o) => o.id === this.selectedOwner);
    if (!owner) return null;

    const ownerVehs = this.vehicles.filter((v) => v.ownerId === this.selectedOwner);
    const regs = ownerVehs.map((v) => v.registrationNumber);

    const billing = this.payments
      .filter((p) => regs.includes(p.vehicleNumber) && p.month === this.selectedMonth)
      .reduce((sum, p) => sum + p.amountReceived, 0);

    const ownerExps = this.expenses.filter(
      (e) => regs.includes(e.vehicleNumber) && e.month === this.selectedMonth
    );

    const cng = ownerExps.filter((e) => e.expenseType === 'CNG').reduce((sum, e) => sum + e.amount, 0);
    const emi = ownerExps.filter((e) => e.expenseType === 'EMI').reduce((sum, e) => sum + e.amount, 0);
    const fastag = ownerExps.filter((e) => e.expenseType === 'FASTag').reduce((sum, e) => sum + e.amount, 0);
    const advance = ownerExps
      .filter((e) => e.expenseType === 'Advance' || e.expenseType === 'Driver Advance')
      .reduce((sum, e) => sum + e.amount, 0);
    const service = ownerExps.filter((e) => e.expenseType === 'Service' || e.expenseType === 'Repair').reduce((sum, e) => sum + e.amount, 0);
    const penalty = ownerExps.filter((e) => e.expenseType === 'Penalty').reduce((sum, e) => sum + e.amount, 0);

    const totalDeductions = cng + emi + fastag + advance + service + penalty;
    return {
      owner,
      vehicles: ownerVehs,
      billing,
      deductions: { cng, emi, fastag, advance, service, penalty },
      totalDeductions,
      netPayable: Math.max(0, billing - totalDeductions),
    };
  }

  getDriverStatementData() {
    const driver = this.drivers.find((d) => d.id === this.selectedDriver);
    if (!driver) return null;

    const driverVeh = this.vehicles.find((v) => v.driverId === this.selectedDriver);
    const reg = driverVeh ? driverVeh.registrationNumber : '';

    const driverExps = this.expenses.filter(
      (e) => (reg ? e.vehicleNumber === reg : true) && e.month === this.selectedMonth
    );

    const baseSalary = driverExps.filter((e) => e.expenseType === 'Driver Salary').reduce((sum, e) => sum + e.amount, 0) || driver.salary;
    const incentive = driverExps.filter((e) => e.expenseType === 'Advance' && e.remarks.toLowerCase().includes('incentive')).reduce((sum, e) => sum + e.amount, 0) || 3000;
    const advance = driverExps.filter((e) => e.expenseType === 'Driver Advance').reduce((sum, e) => sum + e.amount, 0);
    const penalty = driverExps.filter((e) => e.expenseType === 'Penalty').reduce((sum, e) => sum + e.amount, 0);

    return {
      driver,
      vehicle: driverVeh,
      baseSalary,
      incentive,
      advance,
      penalty,
      netSalary: baseSalary + incentive - advance - penalty,
    };
  }

  getInvoiceData() {
    const matchingVehs = this.vehicles.filter((v) => v.company === this.selectedCompany);
    const regs = matchingVehs.map((v) => v.registrationNumber);

    const items = this.payments.filter(
      (p) => regs.includes(p.vehicleNumber) && p.month === this.selectedMonth
    );

    const subtotal = items.reduce((sum, p) => sum + p.amountReceived, 0);
    const tax = subtotal * (this.taxRate / 100);
    const total = subtotal + tax;

    return {
      companyName: this.selectedCompany,
      vehiclesCount: matchingVehs.length,
      items,
      subtotal,
      tax,
      total,
      invoiceNum: `E7-INV-${this.selectedMonth.replace(/-/g, '')}-${this.selectedCompany.substring(0, 3).toUpperCase()}`,
    };
  }

  // --- Printing Trigger ---
  handlePrint() {
    window.print();
  }
}
