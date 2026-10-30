import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";

interface PayrollExpense {
    id: string;
    category: string;
    concept: string;
    monthlyAmount: number;
    notes: string;
}

interface PayrollRow {
    id: string;
    employeeName: string;
    position: string;
    monthlyHours: number;
    baseSalary: number;
    transportAllowance: number;
    fixedBonus: number;
    overtimeAndSurcharges: number;
    otherEarnings: number;
    prestationalLoadPercent: number;
    expenses: PayrollExpense[];
}

@Component({
    selector: "app-company-hr-compensation",
    standalone: true,
    imports: [RouterLink, FormsModule],
    template: `
        <div class="container-fluid py-3">
            <div class="row gx-3 gx-lg-4 align-items-center page-title">
                <div class="col-12 col-sm-auto text-sm-end">
                    <button class="btn btn-outline-secondary me-2" type="button" (click)="restoreDefaults()">Restaurar base</button>
                    <a class="btn btn-outline-secondary me-2" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-compensation' }">Ver ficha</a>
                    <button class="btn btn-theme" type="button" (click)="saveMockPayroll()">Guardar liquidacion mock</button>
                </div>
            </div>

            <nav aria-label="breadcrumb" class="breadcrumb-theme mt-3 rounded">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item bi"><a routerLink="/app/dashboard"><i class="bi bi-house-door me-2"></i>AdminUX</a></li>
                    <li class="breadcrumb-item bi"><a routerLink="/app/company-hr-dashboard">Recursos Humanos</a></li>
                    <li class="breadcrumb-item bi active" aria-current="page">Nomina y compensacion</li>
                </ol>
            </nav>
        </div>

        <div class="container mt-3" id="main-content">
            <div class="card adminuiux-card mb-3">
                <div class="card-body">
                    <div class="row gx-3 gy-3 align-items-end">
                        <div class="col-12 col-md-2">
                            <label class="form-label">Ano de liquidacion</label>
                            <input class="form-control" type="number" min="2024" [(ngModel)]="periodYear" />
                        </div>
                        <div class="col-12 col-md-2">
                            <label class="form-label">Mes</label>
                            <select class="form-select" [(ngModel)]="periodMonth">
                                @for (month of monthOptions; track month.value) {
                                    <option [value]="month.value">{{ month.label }}</option>
                                }
                            </select>
                        </div>
                        <div class="col-12 col-md-3">
                            <label class="form-label">Carga prestacional referencia (%)</label>
                            <input class="form-control" type="number" min="0" max="100" step="0.1" [(ngModel)]="referencePrestationalPercent" />
                        </div>
                        <div class="col-12 col-md-2 text-md-end">
                            <button class="btn btn-outline-theme w-100" type="button" (click)="applyReferencePercentToAll()">Aplicar % a todos</button>
                        </div>
                        <div class="col-12 col-md-3">
                            <div class="alert alert-light border mb-0 py-2">
                                El detalle de nomina y gastos asociados se administra por colaborador en el modal.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4 mb-3">
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-xl-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Devengado total</p>
                            <h5 class="mb-0">{{ asCurrency(totalEarnedPayroll) }}</h5>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-xl-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Total carga prestacional</p>
                            <h5 class="mb-0">{{ asCurrency(totalPrestationalLoad) }}</h5>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-xl-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Gastos asociados</p>
                            <h5 class="mb-0">{{ asCurrency(totalAssociatedExpenses) }}</h5>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6 col-xl-3 mb-3 mb-xl-0">
                    <div class="card adminuiux-card h-100">
                        <div class="card-body">
                            <p class="small text-secondary mb-1">Costo integral neto</p>
                            <h5 class="mb-0">{{ asCurrency(totalNetPayrollCost) }}</h5>
                        </div>
                    </div>
                </div>
            </div>

            @if (message) {
                <div class="alert border mb-3" [class.alert-success]="messageType === 'success'" [class.alert-warning]="messageType === 'warning'">{{ message }}</div>
            }

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Liquidacion por colaborador</h6>
                    <p class="text-secondary small mb-0">Resumen del periodo. Usa Detalle para editar nomina y gastos asociados.</p>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Cargo</th>
                                    <th>Devengado mensual</th>
                                    <th>Total carga prestacional</th>
                                    <th>Gastos asociados</th>
                                    <th>Costo integral neto</th>
                                    <th class="text-end">Ficha</th>
                                    <th class="text-end">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                @for (row of payrollRows; track row.id) {
                                    <tr>
                                        <td>{{ row.employeeName }}</td>
                                        <td>{{ row.position }}</td>
                                        <td>{{ asCurrency(monthlyEarned(row)) }}</td>
                                        <td>
                                            <strong>{{ asCurrency(prestationalLoadTotal(row)) }}</strong>
                                        </td>
                                        <td>{{ asCurrency(associatedExpensesTotal(row)) }}</td>
                                        <td>
                                            <strong>{{ asCurrency(netIntegralMonthlyCost(row)) }}</strong>
                                        </td>
                                        <td class="text-end">
                                            <a class="btn btn-link btn-sm" routerLink="/app/profile-professional" [queryParams]="{ source: 'hr-compensation', employeeId: row.id }"><i class="bi bi-eye"></i></a>
                                        </td>
                                        <td class="text-end">
                                            <button class="btn btn-sm btn-outline-theme" type="button" (click)="openPayrollDetail(row)">Detalle</button>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th colspan="3" class="text-end">Totales del periodo {{ periodMonth }}/{{ periodYear }}</th>
                                    <th>{{ asCurrency(totalPrestationalLoad) }}</th>
                                    <th>{{ asCurrency(totalAssociatedExpenses) }}</th>
                                    <th>{{ asCurrency(totalNetPayrollCost) }}</th>
                                    <th colspan="2"></th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            @if (editingDraft) {
                <div class="compensation-modal-backdrop" (click)="closePayrollDetail()"></div>
                <div class="compensation-modal card adminuiux-card shadow-lg" role="dialog" aria-modal="true" aria-label="Detalle de nomina del colaborador">
                    <div class="card-header d-flex align-items-start justify-content-between">
                        <div>
                            <h6 class="mb-1">Detalle de nomina - {{ editingDraft.employeeName }}</h6>
                            <p class="text-secondary small mb-0">En este modal puedes editar liquidacion base y asociar gastos al colaborador.</p>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary" type="button" (click)="closePayrollDetail()"><i class="bi bi-x-lg"></i></button>
                    </div>
                    <div class="card-body">
                        <div class="row gx-3 gy-3 mb-3">
                            <div class="col-12 col-md-4">
                                <label class="form-label">Horas mes</label>
                                <input class="form-control" type="number" min="1" [(ngModel)]="editingDraft.monthlyHours" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Salario base</label>
                                <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="editingDraft.baseSalary" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Aux. transporte</label>
                                <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="editingDraft.transportAllowance" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Bonificacion fija</label>
                                <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="editingDraft.fixedBonus" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Recargos y extras</label>
                                <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="editingDraft.overtimeAndSurcharges" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">Otros devengados</label>
                                <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="editingDraft.otherEarnings" />
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="form-label">% carga prestacional</label>
                                <input class="form-control" type="number" min="0" max="100" step="0.1" [(ngModel)]="editingDraft.prestationalLoadPercent" />
                            </div>
                            <div class="col-12 col-md-4 d-flex align-items-end">
                                <button class="btn btn-outline-theme w-100" type="button" (click)="applyReferencePercentToEditing()">Usar % referencia</button>
                            </div>
                        </div>

                        <div class="row gx-3 gx-lg-4 mb-3">
                            <div class="col-6 col-md-3">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-body py-2">
                                        <p class="small text-secondary mb-1">Devengado</p>
                                        <p class="mb-0 fw-semibold">{{ asCurrency(monthlyEarned(editingDraft)) }}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6 col-md-3">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-body py-2">
                                        <p class="small text-secondary mb-1">Carga prestacional</p>
                                        <p class="mb-0 fw-semibold">{{ asCurrency(prestationalLoadTotal(editingDraft)) }}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6 col-md-3">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-body py-2">
                                        <p class="small text-secondary mb-1">Gastos asociados</p>
                                        <p class="mb-0 fw-semibold">{{ asCurrency(associatedExpensesTotal(editingDraft)) }}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6 col-md-3">
                                <div class="card adminuiux-card h-100">
                                    <div class="card-body py-2">
                                        <p class="small text-secondary mb-1">Costo neto</p>
                                        <p class="mb-0 fw-semibold">{{ asCurrency(netIntegralMonthlyCost(editingDraft)) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card adminuiux-card">
                            <div class="card-header">
                                <h6 class="mb-0">Gastos asociados al empleado</h6>
                                <p class="text-secondary small mb-0">Adelantos, descuentos por dano, prestamos u otros descuentos mensuales.</p>
                            </div>
                            <div class="card-body">
                                <div class="row gx-3 gy-3 align-items-end mb-3">
                                    <div class="col-12 col-md-3">
                                        <label class="form-label">Categoria</label>
                                        <select class="form-select" [(ngModel)]="draftExpenseCategory">
                                            @for (category of expenseCategories; track category) {
                                                <option [value]="category">{{ category }}</option>
                                            }
                                        </select>
                                    </div>
                                    <div class="col-12 col-md-3">
                                        <label class="form-label">Concepto</label>
                                        <input class="form-control" type="text" [(ngModel)]="draftExpenseConcept" placeholder="Ej: Adelanto de nomina" />
                                    </div>
                                    <div class="col-12 col-md-2">
                                        <label class="form-label">Valor mensual</label>
                                        <input class="form-control" type="number" min="0" step="1000" [(ngModel)]="draftExpenseMonthlyAmount" />
                                    </div>
                                    <div class="col-12 col-md-3">
                                        <label class="form-label">Observacion</label>
                                        <input class="form-control" type="text" [(ngModel)]="draftExpenseNotes" placeholder="Opcional" />
                                    </div>
                                    <div class="col-12 col-md-1 text-md-end">
                                        <button class="btn btn-outline-theme w-100" type="button" (click)="addExpenseToEditing()">+</button>
                                    </div>
                                </div>

                                <div class="table-responsive">
                                    <table class="table align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Categoria</th>
                                                <th>Concepto</th>
                                                <th>Valor mensual</th>
                                                <th>Observacion</th>
                                                <th class="text-end">Accion</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @for (expense of editingDraft.expenses; track expense.id) {
                                                <tr>
                                                    <td>{{ expense.category }}</td>
                                                    <td>{{ expense.concept }}</td>
                                                    <td>{{ asCurrency(expense.monthlyAmount) }}</td>
                                                    <td>{{ expense.notes || '--' }}</td>
                                                    <td class="text-end">
                                                        <button class="btn btn-link text-danger btn-sm" type="button" (click)="removeExpenseFromEditing(expense.id)"><i class="bi bi-trash"></i></button>
                                                    </td>
                                                </tr>
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-end gap-2">
                        <button class="btn btn-outline-secondary" type="button" (click)="closePayrollDetail()">Cancelar</button>
                        <button class="btn btn-theme" type="button" (click)="savePayrollDetail()">Guardar cambios</button>
                    </div>
                </div>
            }

            <div class="card adminuiux-card mb-3 mb-lg-4">
                <div class="card-header">
                    <h6 class="mb-0">Como se calcula</h6>
                </div>
                <div class="card-body">
                    <p class="mb-2 text-secondary">1. Devengado mensual = Salario base + Auxilio + Bonificacion + Recargos + Otros.</p>
                    <p class="mb-2 text-secondary">2. Total carga prestacional = Devengado mensual x (% carga prestacional / 100).</p>
                    <p class="mb-2 text-secondary">3. Costo integral bruto = Devengado mensual + Total carga prestacional.</p>
                    <p class="mb-0 text-secondary">4. Costo integral neto = Costo integral bruto - Gastos asociados del colaborador.</p>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .compensation-modal-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.45);
                z-index: 1040;
            }

            .compensation-modal {
                position: fixed;
                top: 4vh;
                left: 50%;
                transform: translateX(-50%);
                width: min(1100px, 95vw);
                max-height: 92vh;
                z-index: 1050;
                overflow: hidden;
            }

            .compensation-modal .card-body {
                overflow: auto;
                max-height: calc(92vh - 130px);
            }
        `,
    ],
})
export class CompanyHrCompensationComponent implements OnInit {
    private readonly storageKey = "lars.hr.compensation.payrollRows";

    periodYear = new Date().getFullYear();
    periodMonth = new Date().getMonth() + 1;
    referencePrestationalPercent = 51.2;
    message = "";
    messageType: "success" | "warning" = "success";

    readonly expenseCategories = ["Adelanto salarial", "Descuento por dano", "Prestamo", "Otro descuento"];

    editingDraft: PayrollRow | null = null;
    draftExpenseCategory = this.expenseCategories[0];
    draftExpenseConcept = "";
    draftExpenseMonthlyAmount = 0;
    draftExpenseNotes = "";

    readonly monthOptions = [
        { value: 1, label: "Enero" },
        { value: 2, label: "Febrero" },
        { value: 3, label: "Marzo" },
        { value: 4, label: "Abril" },
        { value: 5, label: "Mayo" },
        { value: 6, label: "Junio" },
        { value: 7, label: "Julio" },
        { value: 8, label: "Agosto" },
        { value: 9, label: "Septiembre" },
        { value: 10, label: "Octubre" },
        { value: 11, label: "Noviembre" },
        { value: 12, label: "Diciembre" },
    ];

    payrollRows: PayrollRow[] = this.createDefaultRows();

    ngOnInit(): void {
        this.restoreFromStorage();
    }

    get totalEarnedPayroll(): number {
        return this.payrollRows.reduce((acc, row) => acc + this.monthlyEarned(row), 0);
    }

    get totalPrestationalLoad(): number {
        return this.payrollRows.reduce((acc, row) => acc + this.prestationalLoadTotal(row), 0);
    }

    get totalIntegralPayrollCost(): number {
        return this.totalEarnedPayroll + this.totalPrestationalLoad;
    }

    get totalAssociatedExpenses(): number {
        return this.payrollRows.reduce((acc, row) => acc + this.associatedExpensesTotal(row), 0);
    }

    get totalNetPayrollCost(): number {
        return this.payrollRows.reduce((acc, row) => acc + this.netIntegralMonthlyCost(row), 0);
    }

    get averageHourlyRate(): number {
        if (!this.payrollRows.length) {
            return 0;
        }

        const sum = this.payrollRows.reduce((acc, row) => acc + this.hourlyRate(row), 0);
        return sum / this.payrollRows.length;
    }

    monthlyEarned(row: PayrollRow): number {
        return this.sanitizeNumber(row.baseSalary) + this.sanitizeNumber(row.transportAllowance) + this.sanitizeNumber(row.fixedBonus) + this.sanitizeNumber(row.overtimeAndSurcharges) + this.sanitizeNumber(row.otherEarnings);
    }

    prestationalLoadTotal(row: PayrollRow): number {
        return this.monthlyEarned(row) * (this.sanitizeNumber(row.prestationalLoadPercent) / 100);
    }

    integralMonthlyCost(row: PayrollRow): number {
        return this.monthlyEarned(row) + this.prestationalLoadTotal(row);
    }

    associatedExpensesTotal(row: PayrollRow): number {
        return row.expenses.reduce((acc, expense) => acc + this.sanitizeNumber(expense.monthlyAmount), 0);
    }

    netIntegralMonthlyCost(row: PayrollRow): number {
        return Math.max(this.integralMonthlyCost(row) - this.associatedExpensesTotal(row), 0);
    }

    hourlyRate(row: PayrollRow): number {
        const hours = this.sanitizeNumber(row.monthlyHours);
        if (hours <= 0) {
            return 0;
        }

        return this.monthlyEarned(row) / hours;
    }

    applyReferencePercentToAll(): void {
        this.payrollRows = this.payrollRows.map((row) => ({
            ...row,
            prestationalLoadPercent: this.sanitizeNumber(this.referencePrestationalPercent),
        }));

        this.message = "Porcentaje de carga prestacional aplicado a todos los colaboradores.";
        this.messageType = "success";
    }

    openPayrollDetail(row: PayrollRow): void {
        this.editingDraft = this.cloneRow(row);
        this.resetExpenseDraft();
    }

    closePayrollDetail(): void {
        this.editingDraft = null;
        this.resetExpenseDraft();
    }

    applyReferencePercentToEditing(): void {
        if (!this.editingDraft) {
            return;
        }

        this.editingDraft.prestationalLoadPercent = this.sanitizeNumber(this.referencePrestationalPercent);
    }

    addExpenseToEditing(): void {
        if (!this.editingDraft) {
            return;
        }

        const concept = this.draftExpenseConcept.trim();
        const amount = this.sanitizeNumber(this.draftExpenseMonthlyAmount);

        if (!concept || amount <= 0) {
            this.message = "Para agregar un gasto debes ingresar concepto y valor mensual mayor a cero.";
            this.messageType = "warning";
            return;
        }

        this.editingDraft.expenses.unshift({
            id: this.buildId("expense"),
            category: this.draftExpenseCategory,
            concept,
            monthlyAmount: amount,
            notes: this.draftExpenseNotes.trim(),
        });

        this.resetExpenseDraft();
    }

    removeExpenseFromEditing(expenseId: string): void {
        if (!this.editingDraft) {
            return;
        }

        this.editingDraft.expenses = this.editingDraft.expenses.filter((expense) => expense.id !== expenseId);
    }

    savePayrollDetail(): void {
        if (!this.editingDraft) {
            return;
        }

        const index = this.payrollRows.findIndex((row) => row.id === this.editingDraft?.id);
        if (index === -1) {
            this.message = "No fue posible guardar el detalle del colaborador.";
            this.messageType = "warning";
            this.closePayrollDetail();
            return;
        }

        this.payrollRows[index] = this.cloneRow(this.editingDraft);
        this.message = `Detalle de nomina actualizado para ${this.editingDraft.employeeName}.`;
        this.messageType = "success";
        this.closePayrollDetail();
    }

    saveMockPayroll(): void {
        this.persistPayrollRows();
        this.message = `Liquidacion mock guardada para ${this.periodMonth}/${this.periodYear}.`;
        this.messageType = "success";
    }

    restoreDefaults(): void {
        this.payrollRows = this.createDefaultRows();
        this.closePayrollDetail();
        this.message = "Se restauraron los valores base del periodo.";
        this.messageType = "success";

        if (typeof window !== "undefined") {
            window.localStorage.removeItem(this.storageKey);
        }
    }

    asCurrency(value: number): string {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
        }).format(this.sanitizeNumber(value));
    }

    private createDefaultRows(): PayrollRow[] {
        return [
            {
                id: "emp-001",
                employeeName: "Ludwig Angarita",
                position: "Coordinador SST",
                monthlyHours: 192,
                baseSalary: 5200000,
                transportAllowance: 200000,
                fixedBonus: 350000,
                overtimeAndSurcharges: 180000,
                otherEarnings: 0,
                prestationalLoadPercent: 51.2,
                expenses: [
                    {
                        id: "exp-001-1",
                        category: "Adelanto salarial",
                        concept: "Adelanto quincenal",
                        monthlyAmount: 250000,
                        notes: "Descuento en 2 cuotas",
                    },
                ],
            },
            {
                id: "emp-002",
                employeeName: "Danny Ramirez",
                position: "Tecnico soporte",
                monthlyHours: 208,
                baseSalary: 3400000,
                transportAllowance: 200000,
                fixedBonus: 160000,
                overtimeAndSurcharges: 420000,
                otherEarnings: 60000,
                prestationalLoadPercent: 49.8,
                expenses: [
                    {
                        id: "exp-002-1",
                        category: "Descuento por dano",
                        concept: "Reposicion herramienta",
                        monthlyAmount: 180000,
                        notes: "Cuota 1 de 3",
                    },
                ],
            },
            {
                id: "emp-003",
                employeeName: "Elkin Ramirez",
                position: "Tecnico campo",
                monthlyHours: 200,
                baseSalary: 3250000,
                transportAllowance: 200000,
                fixedBonus: 120000,
                overtimeAndSurcharges: 250000,
                otherEarnings: 40000,
                prestationalLoadPercent: 49.8,
                expenses: [],
            },
        ];
    }

    private restoreFromStorage(): void {
        if (typeof window === "undefined") {
            return;
        }

        const rawData = window.localStorage.getItem(this.storageKey);
        if (!rawData) {
            return;
        }

        try {
            const parsed = JSON.parse(rawData) as Array<Partial<PayrollRow>>;
            if (Array.isArray(parsed) && parsed.length) {
                this.payrollRows = parsed.map((row, index) => this.normalizeRow(row, index));
            }
        } catch {
            this.payrollRows = this.createDefaultRows();
        }
    }

    private normalizeRow(row: Partial<PayrollRow>, index: number): PayrollRow {
        const expenses = Array.isArray(row.expenses)
            ? row.expenses
                  .map((expense, expenseIndex) => this.normalizeExpense(expense, index, expenseIndex))
                  .filter((expense) => this.sanitizeNumber(expense.monthlyAmount) > 0)
            : [];

        return {
            id: typeof row.id === "string" && row.id ? row.id : `emp-${index + 1}`,
            employeeName: typeof row.employeeName === "string" && row.employeeName ? row.employeeName : `Empleado ${index + 1}`,
            position: typeof row.position === "string" && row.position ? row.position : "Sin cargo",
            monthlyHours: this.sanitizeNumber(row.monthlyHours),
            baseSalary: this.sanitizeNumber(row.baseSalary),
            transportAllowance: this.sanitizeNumber(row.transportAllowance),
            fixedBonus: this.sanitizeNumber(row.fixedBonus),
            overtimeAndSurcharges: this.sanitizeNumber(row.overtimeAndSurcharges),
            otherEarnings: this.sanitizeNumber(row.otherEarnings),
            prestationalLoadPercent: this.sanitizeNumber(row.prestationalLoadPercent),
            expenses,
        };
    }

    private normalizeExpense(expense: Partial<PayrollExpense>, rowIndex: number, expenseIndex: number): PayrollExpense {
        return {
            id: typeof expense.id === "string" && expense.id ? expense.id : `exp-${rowIndex + 1}-${expenseIndex + 1}`,
            category: typeof expense.category === "string" && expense.category ? expense.category : "Otro descuento",
            concept: typeof expense.concept === "string" && expense.concept ? expense.concept : "Gasto asociado",
            monthlyAmount: this.sanitizeNumber(expense.monthlyAmount),
            notes: typeof expense.notes === "string" ? expense.notes : "",
        };
    }

    private persistPayrollRows(): void {
        if (typeof window === "undefined") {
            return;
        }

        window.localStorage.setItem(this.storageKey, JSON.stringify(this.payrollRows));
    }

    private cloneRow(row: PayrollRow): PayrollRow {
        return {
            ...row,
            expenses: row.expenses.map((expense) => ({ ...expense })),
        };
    }

    private resetExpenseDraft(): void {
        this.draftExpenseCategory = this.expenseCategories[0];
        this.draftExpenseConcept = "";
        this.draftExpenseMonthlyAmount = 0;
        this.draftExpenseNotes = "";
    }

    private buildId(prefix: string): string {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    }

    private sanitizeNumber(value: unknown): number {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) {
            return 0;
        }

        return parsed;
    }
}
