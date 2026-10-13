import * as exifr from "exifr";

import { ProspectEquipmentEvidencePhoto } from "./crm-prospect-equipment.store";

type ParsedExif = {
    DateTimeOriginal?: Date | string;
    CreateDate?: Date | string;
    ModifyDate?: Date | string;
    Make?: string;
    Model?: string;
    latitude?: number;
    longitude?: number;
};

export async function buildEvidencePhotosFromFiles(files: File[]): Promise<ProspectEquipmentEvidencePhoto[]> {
    return Promise.all(files.map((file) => buildEvidencePhoto(file)));
}

async function buildEvidencePhoto(file: File): Promise<ProspectEquipmentEvidencePhoto> {
    const [thumbnail, sha256, exif] = await Promise.all([createThumbnail(file), computeSha256(file), parseExif(file)]);
    const capturedAt = coerceCapturedAt(exif, file.lastModified);

    return {
        id: buildId("evidence"),
        evidenceType: "general",
        notes: "",
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
        sizeBytes: file.size,
        width: thumbnail.width,
        height: thumbnail.height,
        capturedAt: capturedAt.value,
        capturedAtSource: capturedAt.source,
        selectedAt: new Date().toISOString(),
        deviceMake: (exif?.Make ?? "").trim(),
        deviceModel: (exif?.Model ?? "").trim(),
        latitude: typeof exif?.latitude === "number" ? exif.latitude : null,
        longitude: typeof exif?.longitude === "number" ? exif.longitude : null,
        gpsAvailable: typeof exif?.latitude === "number" && typeof exif?.longitude === "number",
        sha256,
        thumbnailDataUrl: thumbnail.dataUrl,
        backendSyncStatus: "frontend-only",
    };
}

async function parseExif(file: File): Promise<ParsedExif | null> {
    try {
        return (await exifr.parse(file, {
            exif: true,
            gps: true,
            tiff: true,
            pick: ["DateTimeOriginal", "CreateDate", "ModifyDate", "Make", "Model", "latitude", "longitude"],
        })) as ParsedExif | null;
    } catch {
        return null;
    }
}

async function createThumbnail(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
    const image = await loadImage(file);
    const maxSide = 360;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const targetWidth = Math.max(1, Math.round(image.width * scale));
    const targetHeight = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas 2D context unavailable");
    }

    context.drawImage(image.element, 0, 0, targetWidth, targetHeight);

    return {
        dataUrl: canvas.toDataURL("image/jpeg", 0.82),
        width: image.width,
        height: image.height,
    };
}

async function loadImage(file: File): Promise<{ width: number; height: number; element: HTMLImageElement }> {
    const objectUrl = URL.createObjectURL(file);

    try {
        const element = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error("Unable to load image"));
            image.src = objectUrl;
        });

        return {
            width: element.naturalWidth || element.width,
            height: element.naturalHeight || element.height,
            element,
        };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function computeSha256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function coerceCapturedAt(exif: ParsedExif | null, lastModified: number): { value: string; source: "exif" | "file-last-modified" } {
    const exifCandidate = coerceDate(exif?.DateTimeOriginal) ?? coerceDate(exif?.CreateDate) ?? coerceDate(exif?.ModifyDate);
    if (exifCandidate) {
        return { value: exifCandidate.toISOString(), source: "exif" };
    }

    return { value: new Date(lastModified).toISOString(), source: "file-last-modified" };
}

function coerceDate(value: Date | string | undefined): Date | null {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function buildId(prefix: string): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}