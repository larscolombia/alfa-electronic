import { EmployeeRow } from "../../../services/hr-api.service";
import { splitEmployeeFullName } from "./profile-professional-hr-create.util";

export interface HrEmployeeFormValues {
    firstName: string;
    lastName: string;
    position: string;
    serviceUnit: string;
    manager: string;
    employmentStatus: string;
    email: string;
    /** N° Documento (campo editable del formulario). */
    employeeId: string;
    /** ID de sistema del empleado (FK, no editable). */
    employeeNumber: string;
    accessUser: string;
    treatment: string;
    greeting: string;
    userName: string;
    initials: string;
    emailPassword: string;
    roleType: string;
    assignedScheduleId: string;
    hourlyRate: number;
    emergencyContact: string;
    emergencyRelationship: string;
    allergies: string;
    bloodType: string;
    eps: string;
    compensationFund: string;
    hireDate: string;
    terminationDate: string;
    birthday: string;
    terminationReason: string;
    residentialAddress: string;
    gender: string;
    registrationTermsAccepted: boolean;
    registrationPrivacyAccepted: boolean;
    photoData: string;
}

function computeInitials(firstName: string, lastName: string): string {
    const firstInitial = firstName.trim().charAt(0);
    const lastInitial = lastName.trim().charAt(0);
    return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function mapEmployeeToFormValues(employee: EmployeeRow): HrEmployeeFormValues {
    const fallbackName = splitEmployeeFullName(employee.name ?? "");
    const firstName = employee.firstName || fallbackName.firstName;
    const lastName = employee.lastName || fallbackName.lastName;
    return {
        firstName,
        lastName,
        position: employee.role ?? "",
        serviceUnit: employee.department ?? "",
        manager: employee.manager ?? "",
        employmentStatus: employee.status ?? "Activo",
        email: employee.email ?? "",
        employeeId: employee.documentNumber ?? "",
        employeeNumber: employee.id ?? "",
        accessUser: employee.accessUser || (employee.email ?? ""),
        treatment: employee.treatment ?? "",
        greeting: employee.greeting ?? "",
        userName: employee.userName || (employee.email ?? ""),
        initials: employee.initials || computeInitials(firstName, lastName),
        emailPassword: employee.emailPassword ?? "",
        roleType: employee.roleType ?? "",
        assignedScheduleId: employee.assignedScheduleId ?? "",
        hourlyRate: Number(employee.hourlyRate) || 0,
        emergencyContact: employee.emergencyContact ?? "",
        emergencyRelationship: employee.emergencyRelationship ?? "",
        allergies: employee.allergies ?? "",
        bloodType: employee.bloodType ?? "",
        eps: employee.eps ?? "",
        compensationFund: employee.compensationFund ?? "",
        hireDate: employee.hireDate ?? "",
        terminationDate: employee.terminationDate ?? "",
        birthday: employee.birthday ?? "",
        terminationReason: employee.terminationReason ?? "",
        residentialAddress: employee.residentialAddress ?? "",
        gender: employee.gender ?? "",
        registrationTermsAccepted: !!employee.registrationTermsAccepted,
        registrationPrivacyAccepted: !!employee.registrationPrivacyAccepted,
        photoData: employee.photoData ?? "",
    };
}
