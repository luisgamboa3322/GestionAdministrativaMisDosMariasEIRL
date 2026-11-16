export type Route =
  | "dashboard"
  | "files"
  | "inbox"
  | "vehicles"
  | "workers"
  | "companies"
  | "suppliers"
  | "manifests"
  | "invoices"
  | "expirations"
  | "audits"
  | "favorites"
  | "trash"
  | "settings";

export type DemoFile = {
  id: number;
  name: string;
  type: "pdf" | "sheet" | "image" | "doc" | "zip";
  size: string;
  modified: string;
  category: string;
  parent: number | null;
  vehicle?: string;
  worker?: string;
  supplier?: string;
  company?: string;
  issuedDate?: string;
  expirationDate?: string;
  versions?: DocumentVersion[];
  favorite?: boolean;
  status?: "Vigente" | "Por vencer" | "Vencido" | "Por organizar";
  isPersisted?: boolean;
  mimeType?: string;
};

export type AuthUser = {
  id: number;
  organization_id: number;
  full_name: string;
  email: string;
  role: string;
};

export type AuthSession = {
  user: AuthUser;
  organization: {
    id: number;
    legal_name: string;
  };
};

export type DocumentVersion = {
  id: number;
  label: string;
  date: string;
  size: string;
  current: boolean;
};

export type CategorySetting = {
  id: number;
  name: string;
  type: string;
  location: string;
  requiresExpiration: boolean;
  description: string;
  color: string;
};

export type TemplateSetting = {
  id: number;
  name: string;
  kind: "Unidad" | "Trabajador" | "Auditoría";
  items: string[];
  active: boolean;
};

export type TrashEntry = {
  id: number;
  name: string;
  kind: "Archivo" | "Carpeta";
  deletedAt: string;
  files: DemoFile[];
  folders: DemoFolder[];
};

export type DemoFolder = {
  id: number;
  name: string;
  parent: number | null;
  modified: string;
  color: string;
};

export type InboxItem = DemoFile & { source: string };

export type VehiclePhotoItem = {
  id: number;
  url: string;
  isCover: boolean;
};

export type Vehicle = {
  id: number;
  code: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  capacity: string;
  type: string;
  status: "Operativa" | "En mantenimiento" | "Inactiva";
  notes: string;
  cover: string;
  photos: string[];
  folderId: number;
  photoItems?: VehiclePhotoItem[];
  isPersisted?: boolean;
};

export type Worker = {
  id: number;
  code: string;
  name: string;
  role: string;
  status: "Activo" | "En descanso" | "Inactivo";
  phone: string;
  email: string;
  initials: string;
  folderId: number;
  isPersisted?: boolean;
};

export type BusinessRecord = {
  id: number;
  name: string;
  legalName: string;
  kind: string;
  contact: string;
  phone: string;
  email: string;
  updated: string;
  folderId: number;
  isPersisted?: boolean;
};

export type ManifestRecord = {
  id: number;
  number: string;
  date: string;
  vehicle: string;
  company: string;
  service: string;
  period: string;
  fileName: string;
};

export type InvoiceRecord = {
  id: number;
  number: string;
  company: string;
  date: string;
  amount: number;
  currency: "PEN" | "USD";
  status: "Pagada" | "Pendiente" | "Vencida";
  fileName: string;
};

export type RequirementScope = "Unidad" | "Trabajador" | "Empresa" | "Periodo";

export type AuditRequirement = {
  id: string;
  label: string;
  scope: RequirementScope;
  custom?: boolean;
};

export type AuditExportItem = {
  id: number;
  filename: string;
  includedCount: number;
  missingCount: number;
  downloadUrl: string;
  createdAt: string;
};

export type AuditRecord = {
  id: number;
  name: string;
  companyId: number;
  requestDate: string;
  deadline: string;
  period: string;
  description: string;
  notes: string;
  status: "Borrador" | "Activa" | "Pendiente" | "Completada";
  vehicleIds: number[];
  workerIds: number[];
  requirements: AuditRequirement[];
  manuallyReviewed: string[];
  excludedEvidence: string[];
  updated: string;
  exports?: AuditExportItem[];
  isPersisted?: boolean;
};

export type AuditEvidence = {
  id: string;
  requirementId: string;
  requirement: string;
  scope: RequirementScope;
  target: string;
  status:
    | "Disponible"
    | "Faltante"
    | "Vencido"
    | "Sin fecha de vencimiento"
    | "Pendiente de revisión";
  name?: string;
  expirationDate?: string;
  version?: string;
  file?: DemoFile;
  source?: "Documento" | "Manifiesto" | "Factura";
};
