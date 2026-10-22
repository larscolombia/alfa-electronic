import { CreateEmployeeRequest } from "../../../services/hr-api.service";

export interface EmployeeProfileSnapshot {
    firstName: string;
    lastName: string;
    accessUser: string;
    treatment: string;
    greeting: string;
    userName: string;
    initials: string;
    email: string;
    emailPassword: string;
    /** Contraseña de ACCESO a la plataforma (bcrypt en users). Obligatoria al crear. */
    password: string;
    /** Rol ACL de la cuenta de login (users.role), distinto del cargo de RRHH. */
    accessRole: string;
    roleType: string;
    position: string;
    serviceUnit: string;
    manager: string;
    assignedScheduleId: string;
    hourlyRate: number;
    employmentStatus: string;
    employeeId: string;
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

export function splitEmployeeFullName(name: string): { firstName: string; lastName: string } {
    const normalized = name.trim().replace(/\s+/g, " ");
    if (!normalized) {
        return { firstName: "", lastName: "" };
    }
    const firstSpace = normalized.indexOf(" ");
    if (firstSpace === -1) {
        return { firstName: normalized, lastName: "" };
    }
    return {
        firstName: normalized.slice(0, firstSpace),
        lastName: normalized.slice(firstSpace + 1),
    };
}

export function buildCreateEmployeeRequest(profile: EmployeeProfileSnapshot): CreateEmployeeRequest {
    const firstName = profile.firstName.trim();
    const lastName = profile.lastName.trim();
    return {
        name: `${firstName} ${lastName}`.trim().replace(/\s+/g, " "),
        role: profile.position.trim(),
        department: profile.serviceUnit.trim(),
        manager: profile.manager.trim(),
        status: profile.employmentStatus.trim() || "Activo",
        documentNumber: profile.employeeId.trim(),
        email: profile.email.trim(),
        fileComplete: profile.registrationTermsAccepted && profile.registrationPrivacyAccepted,
        password: profile.password,
        accessRole: profile.accessRole.trim(),
        firstName,
        lastName,
        accessUser: profile.accessUser.trim(),
        treatment: profile.treatment.trim(),
        greeting: profile.greeting.trim(),
        userName: profile.userName.trim(),
        initials: profile.initials.trim(),
        emailPassword: profile.emailPassword,
        roleType: profile.roleType.trim(),
        assignedScheduleId: profile.assignedScheduleId.trim(),
        hourlyRate: Number(profile.hourlyRate) || 0,
        emergencyContact: profile.emergencyContact.trim(),
        emergencyRelationship: profile.emergencyRelationship.trim(),
        allergies: profile.allergies.trim(),
        bloodType: profile.bloodType.trim(),
        eps: profile.eps.trim(),
        compensationFund: profile.compensationFund.trim(),
        hireDate: profile.hireDate || "",
        terminationDate: profile.terminationDate || "",
        birthday: profile.birthday || "",
        terminationReason: profile.terminationReason.trim(),
        residentialAddress: profile.residentialAddress.trim(),
        gender: profile.gender.trim(),
        registrationTermsAccepted: profile.registrationTermsAccepted,
        registrationPrivacyAccepted: profile.registrationPrivacyAccepted,
        photoData: profile.photoData || "",
    };
}
