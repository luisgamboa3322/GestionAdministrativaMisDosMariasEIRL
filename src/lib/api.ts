import type {
  AuditExportItem,
  AuditRecord,
  AuditRequirement,
  AuthSession,
  BusinessRecord,
  CategorySetting,
  DemoFile,
  DemoFolder,
  DocumentVersion,
  InboxItem,
  InvoiceRecord,
  ManifestRecord,
  RequirementScope,
  TemplateSetting,
  Vehicle,
  Worker,
} from "@/types";
import { photos as demoPhotos } from "@/data/demo";
import { daysUntil } from "@/utils/dates";

export type ApiFolder = {
  id: number;
  organization_id: number;
  parent_id: number | null;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type ApiDocumentVersion = {
  id: number;
  document_id: number;
  version_number: number;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  checksum: string;
  is_current: boolean;
  uploaded_at: string;
};

export type ApiDocument = {
  id: number;
  organization_id: number;
  folder_id: number | null;
  category: string;
  name: string;
  description: string | null;
  related_vehicle_id: number | null;
  related_worker_id: number | null;
  related_company_id: number | null;
  tags: string | null;
  is_favorite: boolean;
  is_inbox: boolean;
  inbox_source: string | null;
  issued_at: string | null;
  expires_at: string | null;
  created_at: string;
  deleted_at: string | null;
  current_version: ApiDocumentVersion | null;
  versions: ApiDocumentVersion[];
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
  });

  if (!response.ok) {
    let detail = `Error HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload?.detail) detail = payload.detail;
    } catch {
      // Ignore non-JSON error bodies
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferFileKind(mimeType: string, filename: string): DemoFile["type"] {
  const lower = filename.toLowerCase();
  if (mimeType.includes("spreadsheet") || lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) {
    return "sheet";
  }
  if (mimeType.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(lower)) {
    return "image";
  }
  if (mimeType.includes("zip") || lower.endsWith(".zip")) {
    return "zip";
  }
  if (mimeType.includes("word") || /\.(docx?|txt)$/.test(lower)) {
    return "doc";
  }
  return "pdf";
}

function formatDateLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function computeStatus(expiresAt: string | null, isInbox: boolean): DemoFile["status"] {
  if (isInbox) return "Por organizar";
  if (!expiresAt) return "Vigente";
  const diff = daysUntil(expiresAt, new Date());
  if (diff === null) return "Vigente";
  if (diff < 0) return "Vencido";
  if (diff <= 30) return "Por vencer";
  return "Vigente";
}

export function mapApiFolder(folder: ApiFolder): DemoFolder {
  return {
    id: folder.id,
    name: folder.name,
    parent: folder.parent_id,
    modified: formatDateLabel(folder.created_at),
    color: folder.color,
  };
}

export type ApiVehiclePhoto = {
  id: number;
  vehicle_id: number;
  description: string | null;
  is_cover: boolean;
  url: string;
  created_at: string;
};

export type ApiVehicle = {
  id: number;
  organization_id: number;
  folder_id: number | null;
  plate: string;
  internal_code: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  vehicle_type: string;
  status: string;
  notes: string | null;
  created_at: string;
  photos: ApiVehiclePhoto[];
};

export function mapApiVehicle(v: ApiVehicle): Vehicle {
  const ordered = [...v.photos].sort((a, b) => Number(b.is_cover) - Number(a.is_cover));
  const coverPhoto = ordered.find((p) => p.is_cover) || ordered[0];
  const urls = ordered.map((p) => p.url);
  const status: Vehicle["status"] =
    v.status === "En mantenimiento" || v.status === "Inactiva" ? v.status : "Operativa";

  return {
    id: v.id,
    code: v.internal_code,
    plate: v.plate,
    brand: v.brand,
    model: v.model,
    year: String(v.year),
    capacity: String(v.capacity),
    type: v.vehicle_type,
    status,
    notes: v.notes || "",
    cover: coverPhoto?.url || demoPhotos.bus1,
    photos: urls.length ? urls : [demoPhotos.bus1],
    folderId: v.folder_id ?? 0,
    photoItems: ordered.map((p) => ({ id: p.id, url: p.url, isCover: p.is_cover })),
    isPersisted: true,
  };
}

export function mapApiDocument(
  doc: ApiDocument,
  vehiclePlateById?: Map<number, string>,
  workerNameById?: Map<number, string>,
  companyNameById?: Map<number, string>,
): DemoFile {
  const current = doc.current_version;
  const versions: DocumentVersion[] = doc.versions.map((v) => ({
    id: v.id,
    label: `${v.version_number}.0`,
    date: formatDateLabel(v.uploaded_at),
    size: formatBytes(v.byte_size),
    current: v.is_current,
  }));

  return {
    id: doc.id,
    name: doc.name,
    type: inferFileKind(current?.mime_type || "", current?.original_filename || doc.name),
    size: current ? formatBytes(current.byte_size) : "0 KB",
    modified: formatDateLabel(current?.uploaded_at || doc.created_at),
    category: doc.category,
    parent: doc.folder_id,
    vehicle:
      doc.related_vehicle_id && vehiclePlateById
        ? vehiclePlateById.get(doc.related_vehicle_id)
        : undefined,
    worker:
      doc.related_worker_id && workerNameById
        ? workerNameById.get(doc.related_worker_id)
        : undefined,
    company:
      doc.related_company_id && companyNameById
        ? companyNameById.get(doc.related_company_id)
        : undefined,
    issuedDate: doc.issued_at || undefined,
    expirationDate: doc.expires_at || undefined,
    favorite: doc.is_favorite,
    status: computeStatus(doc.expires_at, doc.is_inbox),
    versions,
    isPersisted: true,
    mimeType: current?.mime_type,
  };
}

export function mapApiInboxItem(
  doc: ApiDocument,
  vehiclePlateById?: Map<number, string>,
  workerNameById?: Map<number, string>,
  companyNameById?: Map<number, string>,
): InboxItem {
  return {
    ...mapApiDocument(doc, vehiclePlateById, workerNameById, companyNameById),
    source: doc.inbox_source || "Carga directa",
  };
}

export async function getMeApi(): Promise<AuthSession> {
  return apiRequest<AuthSession>("/api/v1/auth/me");
}

export async function loginApi(email: string, password: string): Promise<AuthSession> {
  return apiRequest<AuthSession>("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutApi(): Promise<void> {
  await apiRequest<{ message: string }>("/api/v1/auth/logout", { method: "POST" });
}

export async function listFoldersApi(includeDeleted = false): Promise<ApiFolder[]> {
  return apiRequest<ApiFolder[]>(`/api/v1/folders?include_deleted=${includeDeleted}`);
}

export async function createFolderApi(payload: {
  name: string;
  parent_id: number | null;
  color: string;
}): Promise<ApiFolder> {
  return apiRequest<ApiFolder>("/api/v1/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateFolderApi(
  folderId: number,
  payload: { name?: string; parent_id?: number | null; move_to_root?: boolean },
): Promise<ApiFolder> {
  return apiRequest<ApiFolder>(`/api/v1/folders/${folderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteFolderApi(folderId: number, permanent = false): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/folders/${folderId}?permanent=${permanent}`, {
    method: "DELETE",
  });
}

export async function restoreFolderApi(folderId: number): Promise<ApiFolder> {
  return apiRequest<ApiFolder>(`/api/v1/folders/${folderId}/restore`, { method: "POST" });
}

export async function listDocumentsApi(params?: {
  includeDeleted?: boolean;
  inboxOnly?: boolean;
}): Promise<ApiDocument[]> {
  const search = new URLSearchParams();
  if (params?.includeDeleted) search.set("include_deleted", "true");
  if (params?.inboxOnly !== undefined) search.set("inbox_only", String(params.inboxOnly));
  const query = search.toString();
  return apiRequest<ApiDocument[]>(`/api/v1/documents${query ? `?${query}` : ""}`);
}

export async function uploadDocumentApi(formData: FormData): Promise<ApiDocument> {
  return apiRequest<ApiDocument>("/api/v1/documents/upload", {
    method: "POST",
    body: formData,
  });
}

export async function updateDocumentApi(
  documentId: number,
  payload: {
    name?: string;
    folder_id?: number | null;
    move_to_root?: boolean;
    category?: string;
    related_vehicle_id?: number | null;
    is_favorite?: boolean;
    is_inbox?: boolean;
  },
): Promise<ApiDocument> {
  return apiRequest<ApiDocument>(`/api/v1/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteDocumentApi(documentId: number, permanent = false): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/documents/${documentId}?permanent=${permanent}`, {
    method: "DELETE",
  });
}

export async function restoreDocumentApi(documentId: number): Promise<ApiDocument> {
  return apiRequest<ApiDocument>(`/api/v1/documents/${documentId}/restore`, { method: "POST" });
}

export async function uploadDocumentVersionApi(
  documentId: number,
  formData: FormData,
): Promise<ApiDocument> {
  return apiRequest<ApiDocument>(`/api/v1/documents/${documentId}/versions`, {
    method: "POST",
    body: formData,
  });
}

export function documentDownloadUrl(
  documentId: number,
  options?: { inline?: boolean; versionId?: number },
): string {
  const params = new URLSearchParams();
  if (options?.inline) params.set("inline", "true");
  if (options?.versionId) params.set("version_id", String(options.versionId));
  const qs = params.toString();
  return `/api/v1/documents/${documentId}/download${qs ? `?${qs}` : ""}`;
}

export async function listVehiclesApi(): Promise<ApiVehicle[]> {
  return apiRequest<ApiVehicle[]>("/api/v1/vehicles");
}

export async function createVehicleApi(payload: {
  plate: string;
  internal_code: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  vehicle_type: string;
  status: string;
  notes?: string;
  template_categories: string[];
}): Promise<ApiVehicle> {
  return apiRequest<ApiVehicle>("/api/v1/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateVehicleApi(
  vehicleId: number,
  payload: {
    plate?: string;
    internal_code?: string;
    brand?: string;
    model?: string;
    year?: number;
    capacity?: number;
    vehicle_type?: string;
    status?: string;
    notes?: string;
  },
): Promise<ApiVehicle> {
  return apiRequest<ApiVehicle>(`/api/v1/vehicles/${vehicleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function uploadVehiclePhotoApi(
  vehicleId: number,
  file: globalThis.File,
  isCover = false,
): Promise<ApiVehiclePhoto> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("is_cover", String(isCover));
  return apiRequest<ApiVehiclePhoto>(`/api/v1/vehicles/${vehicleId}/photos`, {
    method: "POST",
    body: formData,
  });
}

export async function setVehicleCoverPhotoApi(
  vehicleId: number,
  photoId: number,
): Promise<ApiVehicle> {
  return apiRequest<ApiVehicle>(`/api/v1/vehicles/${vehicleId}/photos/${photoId}/cover`, {
    method: "PATCH",
  });
}

export async function deleteVehiclePhotoApi(
  vehicleId: number,
  photoId: number,
): Promise<ApiVehicle> {
  return apiRequest<ApiVehicle>(`/api/v1/vehicles/${vehicleId}/photos/${photoId}`, {
    method: "DELETE",
  });
}

export type ApiAuditRequirement = {
  id: string;
  label: string;
  scope: string;
  custom: boolean;
};

export type ApiAuditExport = {
  id: number;
  audit_id: number;
  filename: string;
  included_count: number;
  missing_count: number;
  download_url: string;
  created_at: string;
};

export type ApiAudit = {
  id: number;
  organization_id: number;
  company_id: number | null;
  name: string;
  request_date: string;
  deadline: string;
  period: string;
  description: string | null;
  notes: string | null;
  status: string;
  vehicle_ids: number[];
  worker_ids: number[];
  requirements: ApiAuditRequirement[];
  manually_reviewed: string[];
  excluded_evidence: string[];
  exports: ApiAuditExport[];
  created_at: string;
};

export function mapApiAuditExport(exp: ApiAuditExport): AuditExportItem {
  return {
    id: exp.id,
    filename: exp.filename,
    includedCount: exp.included_count,
    missingCount: exp.missing_count,
    downloadUrl: exp.download_url,
    createdAt: formatDateLabel(exp.created_at),
  };
}

export function mapApiAudit(a: ApiAudit): AuditRecord {
  const validStatus: AuditRecord["status"] =
    a.status === "Borrador" || a.status === "Pendiente" || a.status === "Completada"
      ? a.status
      : "Activa";
  const requirements: AuditRequirement[] = a.requirements.map((r) => ({
    id: r.id,
    label: r.label,
    scope: (["Unidad", "Trabajador", "Empresa", "Periodo"].includes(r.scope)
      ? r.scope
      : "Unidad") as RequirementScope,
    custom: r.custom,
  }));
  return {
    id: a.id,
    name: a.name,
    companyId: a.company_id ?? 1,
    requestDate: a.request_date,
    deadline: a.deadline,
    period: a.period,
    description: a.description || "",
    notes: a.notes || "",
    status: validStatus,
    vehicleIds: a.vehicle_ids,
    workerIds: a.worker_ids,
    requirements,
    manuallyReviewed: a.manually_reviewed,
    excludedEvidence: a.excluded_evidence,
    updated: formatDateLabel(a.created_at),
    exports: a.exports.map(mapApiAuditExport),
    isPersisted: true,
  };
}

export async function listAuditsApi(): Promise<ApiAudit[]> {
  return apiRequest<ApiAudit[]>("/api/v1/audits");
}

export async function createAuditApi(payload: {
  name: string;
  company_id: number | null;
  request_date: string;
  deadline: string;
  period: string;
  description?: string;
  notes?: string;
  status: string;
  vehicle_ids: number[];
  worker_ids: number[];
  requirements: ApiAuditRequirement[];
}): Promise<ApiAudit> {
  return apiRequest<ApiAudit>("/api/v1/audits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateAuditApi(
  auditId: number,
  payload: {
    name?: string;
    status?: string;
    description?: string;
    notes?: string;
    vehicle_ids?: number[];
    worker_ids?: number[];
    requirements?: ApiAuditRequirement[];
    manually_reviewed?: string[];
    excluded_evidence?: string[];
  },
): Promise<ApiAudit> {
  return apiRequest<ApiAudit>(`/api/v1/audits/${auditId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function generateAuditExportApi(auditId: number): Promise<ApiAuditExport> {
  return apiRequest<ApiAuditExport>(`/api/v1/audits/${auditId}/exports`, {
    method: "POST",
  });
}

export type ApiWorker = {
  id: number;
  organization_id: number;
  folder_id: number | null;
  code: string;
  name: string;
  role: string;
  status: string;
  phone: string | null;
  email: string | null;
  initials: string;
  created_at: string;
};

export type ApiCompany = {
  id: number;
  organization_id: number;
  folder_id: number | null;
  mode: "company" | "supplier";
  name: string;
  legal_name: string;
  kind: string;
  contact: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export type ApiManifest = {
  id: number;
  organization_id: number;
  number: string;
  date: string;
  vehicle: string;
  company: string;
  service: string;
  period: string;
  file_name: string;
  document_id: number | null;
  created_at: string;
};

export type ApiInvoice = {
  id: number;
  organization_id: number;
  number: string;
  company: string;
  date: string;
  amount: number;
  currency: "PEN" | "USD";
  status: string;
  file_name: string;
  document_id: number | null;
  created_at: string;
};

export function mapApiWorker(w: ApiWorker): Worker {
  const status: Worker["status"] =
    w.status === "En descanso" || w.status === "Inactivo" ? w.status : "Activo";
  return {
    id: w.id,
    code: w.code,
    name: w.name,
    role: w.role,
    status,
    phone: w.phone || "",
    email: w.email || "",
    initials: w.initials,
    folderId: w.folder_id ?? 0,
    isPersisted: true,
  };
}

export function mapApiCompany(c: ApiCompany): BusinessRecord {
  return {
    id: c.id,
    name: c.name,
    legalName: c.legal_name,
    kind: c.kind,
    contact: c.contact || "",
    phone: c.phone || "",
    email: c.email || "",
    updated: formatDateLabel(c.created_at),
    folderId: c.folder_id ?? 0,
    isPersisted: true,
  };
}

export function mapApiManifest(m: ApiManifest): ManifestRecord {
  return {
    id: m.id,
    number: m.number,
    date: m.date,
    vehicle: m.vehicle,
    company: m.company,
    service: m.service,
    period: m.period,
    fileName: m.file_name,
  };
}

export function mapApiInvoice(inv: ApiInvoice): InvoiceRecord {
  const status: InvoiceRecord["status"] =
    inv.status === "Pagada" || inv.status === "Vencida" ? inv.status : "Pendiente";
  return {
    id: inv.id,
    number: inv.number,
    company: inv.company,
    date: inv.date,
    amount: inv.amount,
    currency: inv.currency === "USD" ? "USD" : "PEN",
    status,
    fileName: inv.file_name,
  };
}

export async function listWorkersApi(): Promise<ApiWorker[]> {
  return apiRequest<ApiWorker[]>("/api/v1/workers");
}

export async function createWorkerApi(payload: {
  code: string;
  name: string;
  role: string;
  status: string;
  phone?: string;
  email?: string;
  template_categories: string[];
}): Promise<ApiWorker> {
  return apiRequest<ApiWorker>("/api/v1/workers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listCompaniesApi(mode?: "company" | "supplier"): Promise<ApiCompany[]> {
  return apiRequest<ApiCompany[]>(`/api/v1/companies${mode ? `?mode=${mode}` : ""}`);
}

export async function createCompanyApi(payload: {
  mode: "company" | "supplier";
  name: string;
  legal_name: string;
  kind: string;
  contact?: string;
  phone?: string;
  email?: string;
}): Promise<ApiCompany> {
  return apiRequest<ApiCompany>("/api/v1/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateCompanyApi(
  companyId: number,
  payload: {
    name?: string;
    legal_name?: string;
    kind?: string;
    contact?: string;
    phone?: string;
    email?: string;
  },
): Promise<ApiCompany> {
  return apiRequest<ApiCompany>(`/api/v1/companies/${companyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listManifestsApi(): Promise<ApiManifest[]> {
  return apiRequest<ApiManifest[]>("/api/v1/manifests");
}

export async function createManifestApi(payload: {
  number: string;
  service_date: string;
  vehicle_plate?: string;
  company_name?: string;
  service: string;
  period: string;
  document_id?: number;
  file_name?: string;
}): Promise<ApiManifest> {
  return apiRequest<ApiManifest>("/api/v1/manifests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listInvoicesApi(): Promise<ApiInvoice[]> {
  return apiRequest<ApiInvoice[]>("/api/v1/invoices");
}

export async function createInvoiceApi(payload: {
  number: string;
  company_name: string;
  issued_date: string;
  amount: number;
  currency: "PEN" | "USD";
  status: string;
  document_id?: number;
  file_name?: string;
}): Promise<ApiInvoice> {
  return apiRequest<ApiInvoice>("/api/v1/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listCategoriesApi(): Promise<CategorySetting[]> {
  return apiRequest<CategorySetting[]>("/api/v1/settings/categories");
}

export async function createCategoryApi(payload: {
  name: string;
  type: string;
  requires_expiration: boolean;
  description: string;
  color: string;
}): Promise<CategorySetting> {
  return apiRequest<CategorySetting>("/api/v1/settings/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteCategoryApi(categoryId: number): Promise<void> {
  await apiRequest<{ message: string }>(`/api/v1/settings/categories/${categoryId}`, {
    method: "DELETE",
  });
}

export async function listTemplatesApi(): Promise<TemplateSetting[]> {
  return apiRequest<TemplateSetting[]>("/api/v1/settings/templates");
}

export async function createTemplateApi(payload: {
  name: string;
  kind: TemplateSetting["kind"];
  items: string[];
}): Promise<TemplateSetting> {
  return apiRequest<TemplateSetting>("/api/v1/settings/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function toggleTemplateApi(templateId: number): Promise<TemplateSetting> {
  return apiRequest<TemplateSetting>(`/api/v1/settings/templates/${templateId}/toggle`, {
    method: "PATCH",
  });
}

export type ApiNotification = {
  id: number;
  document_id: number | null;
  notification_type: string;
  message: string;
  scheduled_for: string;
  delivered_at: string | null;
};

export async function listNotificationsApi(): Promise<ApiNotification[]> {
  return apiRequest<ApiNotification[]>("/api/v1/notifications");
}

export async function checkNotificationsApi(): Promise<{
  created_count: number;
  total_unread: number;
}> {
  return apiRequest<{ created_count: number; total_unread: number }>(
    "/api/v1/notifications/check",
    { method: "POST" },
  );
}

export async function markNotificationReadApi(id: number): Promise<ApiNotification> {
  return apiRequest<ApiNotification>(`/api/v1/notifications/${id}/read`, {
    method: "PATCH",
  });
}
