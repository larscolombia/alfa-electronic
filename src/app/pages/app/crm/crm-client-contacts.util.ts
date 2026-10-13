import { ClientContactRecord, UpsertClientContactRequest } from "../../../services/crm-clients-api.service";
import { CrmProspectContact } from "../../../services/crm-prospects-api.service";

export const CONTACT_EMAIL_PATTERN = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
export const EMPTY_CONTACT_FORM: UpsertClientContactRequest = { name: "", role: "", email: "", phone: "", notes: "" };

export interface ContactPayloadResult {
    payload: UpsertClientContactRequest | null;
    error: string;
}

export function buildContactPayload(form: UpsertClientContactRequest): ContactPayloadResult {
    const payload: UpsertClientContactRequest = {
        name: form.name.trim(),
        role: form.role.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
    };
    if (!payload.name) {
        return { payload: null, error: "El nombre del contacto es obligatorio." };
    }
    if (payload.email && !CONTACT_EMAIL_PATTERN.test(payload.email)) {
        return { payload: null, error: "El correo no tiene un formato valido." };
    }
    return { payload, error: "" };
}

export type ClientContactSource = "client" | "prospect";

export interface UnifiedClientContact {
    id: string;
    source: ClientContactSource;
    prospectId: string;
    name: string;
    role: string;
    email: string;
    phone: string;
    notes: string;
}

export function contactDedupeKey(name: string, email: string): string {
    return `${name.trim().toLowerCase()}|${email.trim().toLowerCase()}`;
}

export function mergeClientContacts(
    clientContacts: ClientContactRecord[],
    prospectContacts: CrmProspectContact[],
): UnifiedClientContact[] {
    const rows: UnifiedClientContact[] = [];
    const seen = new Set<string>();

    for (const c of clientContacts) {
        const key = contactDedupeKey(c.name, c.email);
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
            id: c.id,
            source: "client",
            prospectId: "",
            name: c.name,
            role: c.role,
            email: c.email,
            phone: c.phone,
            notes: c.notes,
        });
    }

    for (const c of prospectContacts) {
        const key = contactDedupeKey(c.name, c.email);
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
            id: c.id,
            source: "prospect",
            prospectId: c.prospectId,
            name: c.name,
            role: c.role,
            email: c.email,
            phone: c.phone,
            notes: c.notes,
        });
    }

    return rows;
}
