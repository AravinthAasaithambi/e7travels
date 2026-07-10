import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Vehicle, Owner, Driver, Company, Site, CompanyPayment, Expense } from '../types';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private apiUrl = 'http://127.0.0.1:5000/api';

  // --- BehaviorSubjects for reactive data ---
  private vehiclesSub = new BehaviorSubject<Vehicle[]>([]);
  private ownersSub = new BehaviorSubject<Owner[]>([]);
  private driversSub = new BehaviorSubject<Driver[]>([]);
  private companiesSub = new BehaviorSubject<Company[]>([]);
  private sitesSub = new BehaviorSubject<Site[]>([]);
  private billingSub = new BehaviorSubject<CompanyPayment[]>([]);
  private expensesSub = new BehaviorSubject<Expense[]>([]);

  // --- Public Observables ---
  public vehicles$ = this.vehiclesSub.asObservable();
  public owners$ = this.ownersSub.asObservable();
  public drivers$ = this.driversSub.asObservable();
  public companies$ = this.companiesSub.asObservable();
  public sites$ = this.sitesSub.asObservable();
  public billing$ = this.billingSub.asObservable();
  public expenses$ = this.expensesSub.asObservable();

  constructor(private http: HttpClient) {
    // Automatically load all tables on service initialization
    this.refreshAll();
  }

  // Refresh all collections from the backend
  public refreshAll() {
    this.fetchVehicles().subscribe();
    this.fetchOwners().subscribe();
    this.fetchDrivers().subscribe();
    this.fetchCompanies().subscribe();
    this.fetchSites().subscribe();
    this.fetchBilling().subscribe();
    this.fetchExpenses().subscribe();
  }

  // --- Seeding ---
  public seedDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seed`, {}).pipe(
      tap((res) => {
        if (res && res.data) {
          const d = res.data;
          this.vehiclesSub.next(d.vehicles || []);
          this.ownersSub.next(d.owners || []);
          this.driversSub.next(d.drivers || []);
          this.companiesSub.next(d.companies || []);
          this.sitesSub.next(d.sites || []);
          this.billingSub.next(d.billing || []);
          this.expensesSub.next(d.expenses || []);
        }
      })
    );
  }

  // --- Clearing ---
  public clearDatabase(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clear`, {}).pipe(
      tap((res) => {
        if (res && res.data) {
          const d = res.data;
          this.vehiclesSub.next(d.vehicles || []);
          this.ownersSub.next(d.owners || []);
          this.driversSub.next(d.drivers || []);
          this.companiesSub.next(d.companies || []);
          this.sitesSub.next(d.sites || []);
          this.billingSub.next(d.billing || []);
          this.expensesSub.next(d.expenses || []);
        }
      })
    );
  }

  // --- VEHICLES CRUD ---
  public fetchVehicles(): Observable<Vehicle[]> {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles`).pipe(
      tap((data) => this.vehiclesSub.next(data))
    );
  }

  public saveVehicle(item: Vehicle): Observable<Vehicle> {
    return this.http.post<Vehicle>(`${this.apiUrl}/vehicles`, item).pipe(
      tap(() => this.fetchVehicles().subscribe())
    );
  }

  public deleteVehicle(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/vehicles/${id}`).pipe(
      tap(() => this.fetchVehicles().subscribe())
    );
  }

  // --- OWNERS CRUD ---
  public fetchOwners(): Observable<Owner[]> {
    return this.http.get<Owner[]>(`${this.apiUrl}/owners`).pipe(
      tap((data) => this.ownersSub.next(data))
    );
  }

  public saveOwner(item: Owner): Observable<Owner> {
    return this.http.post<Owner>(`${this.apiUrl}/owners`, item).pipe(
      tap(() => this.fetchOwners().subscribe())
    );
  }

  public deleteOwner(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/owners/${id}`).pipe(
      tap(() => this.fetchOwners().subscribe())
    );
  }

  // --- DRIVERS CRUD ---
  public fetchDrivers(): Observable<Driver[]> {
    return this.http.get<Driver[]>(`${this.apiUrl}/drivers`).pipe(
      tap((data) => this.driversSub.next(data))
    );
  }

  public saveDriver(item: Driver): Observable<Driver> {
    return this.http.post<Driver>(`${this.apiUrl}/drivers`, item).pipe(
      tap(() => this.fetchDrivers().subscribe())
    );
  }

  public deleteDriver(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/drivers/${id}`).pipe(
      tap(() => this.fetchDrivers().subscribe())
    );
  }

  // --- COMPANIES CRUD ---
  public fetchCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.apiUrl}/companies`).pipe(
      tap((data) => this.companiesSub.next(data))
    );
  }

  public saveCompany(item: Company): Observable<Company> {
    return this.http.post<Company>(`${this.apiUrl}/companies`, item).pipe(
      tap(() => this.fetchCompanies().subscribe())
    );
  }

  public deleteCompany(name: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/companies/${name}`).pipe(
      tap(() => this.fetchCompanies().subscribe())
    );
  }

  // --- SITES CRUD ---
  public fetchSites(): Observable<Site[]> {
    return this.http.get<Site[]>(`${this.apiUrl}/sites`).pipe(
      tap((data) => this.sitesSub.next(data))
    );
  }

  public saveSite(item: Site): Observable<Site> {
    return this.http.post<Site>(`${this.apiUrl}/sites`, item).pipe(
      tap(() => this.fetchSites().subscribe())
    );
  }

  public deleteSite(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/sites/${id}`).pipe(
      tap(() => this.fetchSites().subscribe())
    );
  }

  // --- BILLING CRUD ---
  public fetchBilling(): Observable<CompanyPayment[]> {
    return this.http.get<CompanyPayment[]>(`${this.apiUrl}/billing`).pipe(
      tap((data) => this.billingSub.next(data))
    );
  }

  public saveBilling(item: CompanyPayment): Observable<CompanyPayment> {
    return this.http.post<CompanyPayment>(`${this.apiUrl}/billing`, item).pipe(
      tap(() => this.fetchBilling().subscribe())
    );
  }

  public deleteBilling(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/billing/${id}`).pipe(
      tap(() => this.fetchBilling().subscribe())
    );
  }

  // --- EXPENSES CRUD ---
  public fetchExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/expenses`).pipe(
      tap((data) => this.expensesSub.next(data))
    );
  }

  public saveExpense(item: Expense): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/expenses`, item).pipe(
      tap(() => this.fetchExpenses().subscribe())
    );
  }

  public deleteExpense(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/expenses/${id}`).pipe(
      tap(() => this.fetchExpenses().subscribe())
    );
  }
}
