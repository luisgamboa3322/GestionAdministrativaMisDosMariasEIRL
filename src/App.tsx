import {
  FormEvent,
  ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpenCheck,
  CheckCircle2,
  Building2,
  Bus,
  Camera,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudUpload,
  Copy,
  CreditCard,
  Download,
  Edit3,
  Eye,
  EyeOff,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Files,
  Folder,
  FolderHeart,
  FolderPlus,
  FileCheck2,
  Grid2X2,
  Images,
  HardDrive,
  Home,
  Inbox,
  LayoutGrid,
  List,
  Mail,
  Menu,
  MoreHorizontal,
  MoveRight,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Phone,
  ReceiptText,
  Save,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tags,
  Trash2,
  History,
  RotateCcw,
  Upload,
  UserPlus,
  UserRound,
  Users,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

type Route =
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

type DemoFile = {
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
};

type DocumentVersion = {
  id: number;
  label: string;
  date: string;
  size: string;
  current: boolean;
};

type CategorySetting = {
  id: number;
  name: string;
  type: string;
  location: string;
  requiresExpiration: boolean;
  description: string;
  color: string;
};

type TemplateSetting = {
  id: number;
  name: string;
  kind: "Unidad" | "Trabajador" | "Auditoría";
  items: string[];
  active: boolean;
};

type TrashEntry = {
  id: number;
  name: string;
  kind: "Archivo" | "Carpeta";
  deletedAt: string;
  files: DemoFile[];
  folders: DemoFolder[];
};

type DemoFolder = {
  id: number;
  name: string;
  parent: number | null;
  modified: string;
  color: string;
};

type InboxItem = DemoFile & { source: string };

type Vehicle = {
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
};

type Worker = {
  id: number;
  code: string;
  name: string;
  role: string;
  status: "Activo" | "En descanso" | "Inactivo";
  phone: string;
  email: string;
  initials: string;
  folderId: number;
};

type BusinessRecord = {
  id: number;
  name: string;
  legalName: string;
  kind: string;
  contact: string;
  phone: string;
  email: string;
  updated: string;
  folderId: number;
};

type ManifestRecord = {
  id: number;
  number: string;
  date: string;
  vehicle: string;
  company: string;
  service: string;
  period: string;
  fileName: string;
};

type InvoiceRecord = {
  id: number;
  number: string;
  company: string;
  date: string;
  amount: number;
  currency: "PEN" | "USD";
  status: "Pagada" | "Pendiente" | "Vencida";
  fileName: string;
};

type RequirementScope = "Unidad" | "Trabajador" | "Empresa" | "Periodo";

type AuditRequirement = {
  id: string;
  label: string;
  scope: RequirementScope;
  custom?: boolean;
};

type AuditRecord = {
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
};

type AuditEvidence = {
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

const auditRequirementCatalog: AuditRequirement[] = [
  { id: "soat", label: "SOAT", scope: "Unidad" },
  { id: "str", label: "STR", scope: "Unidad" },
  { id: "polizas", label: "Pólizas", scope: "Unidad" },
  { id: "gps", label: "GPS", scope: "Unidad" },
  { id: "revision", label: "Revisión técnica", scope: "Unidad" },
  { id: "certificados", label: "Certificados", scope: "Unidad" },
  { id: "permisos", label: "Permisos", scope: "Unidad" },
  { id: "contratos", label: "Contratos", scope: "Empresa" },
  { id: "trabajadores", label: "Documentos de trabajadores", scope: "Trabajador" },
  { id: "manifiestos", label: "Manifiestos", scope: "Periodo" },
  { id: "facturas", label: "Facturas", scope: "Empresa" },
  { id: "otros", label: "Otros documentos", scope: "Empresa" },
];

const photos = {
  hero: "https://images.unsplash.com/photo-1557223562-6c77ef16210f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1600",
  bus1: "https://images.unsplash.com/photo-1546347930-c3a16cd9ff0a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=700",
  bus2: "https://images.unsplash.com/photo-1578952494238-f437ca0b9561?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=700",
  bus3: "https://images.unsplash.com/photo-1660172177229-74d573a9836f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=700",
};

const dossierCategories = [
  "SOAT",
  "STR",
  "Pólizas",
  "GPS",
  "Certificados",
  "Revisión técnica",
  "Tarjeta de propiedad",
  "Permisos",
  "Contratos",
  "Otros",
];

const initialCategories: CategorySetting[] = [
  {
    id: 1,
    name: "SOAT",
    type: "Vehicular",
    location: "Unidades",
    requiresExpiration: true,
    description: "Seguro obligatorio de la unidad.",
    color: "emerald",
  },
  {
    id: 2,
    name: "Revisión técnica",
    type: "Vehicular",
    location: "Unidades",
    requiresExpiration: true,
    description: "Certificado de inspección técnica.",
    color: "amber",
  },
  {
    id: 3,
    name: "Pólizas",
    type: "Vehicular",
    location: "Unidades",
    requiresExpiration: true,
    description: "Pólizas y coberturas relacionadas.",
    color: "blue",
  },
  {
    id: 4,
    name: "Licencias",
    type: "Laboral",
    location: "Trabajadores",
    requiresExpiration: true,
    description: "Licencias profesionales del personal.",
    color: "violet",
  },
  {
    id: 5,
    name: "Contratos",
    type: "Empresarial",
    location: "General",
    requiresExpiration: false,
    description: "Contratos de servicio y laborales.",
    color: "teal",
  },
  {
    id: 6,
    name: "Facturas",
    type: "Financiero",
    location: "Facturas",
    requiresExpiration: false,
    description: "Documentos de facturación demostrativos.",
    color: "amber",
  },
  {
    id: 7,
    name: "Documento general",
    type: "General",
    location: "Mis archivos",
    requiresExpiration: false,
    description: "Categoría flexible para archivos diversos.",
    color: "emerald",
  },
];

const initialTemplates: TemplateSetting[] = [
  {
    id: 11,
    name: "Transporte de personal",
    kind: "Unidad",
    items: dossierCategories,
    active: true,
  },
  {
    id: 12,
    name: "Expediente básico de unidad",
    kind: "Unidad",
    items: ["SOAT", "Revisión técnica", "Tarjeta de propiedad", "Otros"],
    active: true,
  },
  {
    id: 21,
    name: "Expediente de conductor",
    kind: "Trabajador",
    items: ["Licencias", "Contratos", "Certificados", "Otros"],
    active: true,
  },
  {
    id: 31,
    name: "Auditoría vehicular estándar",
    kind: "Auditoría",
    items: ["soat", "str", "polizas", "revision", "permisos"],
    active: true,
  },
  {
    id: 32,
    name: "Auditoría integral",
    kind: "Auditoría",
    items: ["soat", "polizas", "revision", "trabajadores", "manifiestos", "facturas", "contratos"],
    active: true,
  },
];

const initialFolders: DemoFolder[] = [
  { id: 1, name: "Unidades", parent: null, modified: "Hoy, 09:42", color: "emerald" },
  { id: 2, name: "Trabajadores", parent: null, modified: "Ayer, 16:18", color: "teal" },
  { id: 3, name: "Contratos", parent: null, modified: "12 jun 2025", color: "blue" },
  { id: 4, name: "Facturas 2025", parent: null, modified: "10 jun 2025", color: "amber" },
  { id: 5, name: "T3X-456", parent: 1, modified: "Hoy, 09:42", color: "emerald" },
  { id: 6, name: "SOAT", parent: 5, modified: "Ayer, 11:20", color: "teal" },
  { id: 7, name: "STR", parent: 5, modified: "12 jun 2025", color: "blue" },
  { id: 8, name: "Pólizas", parent: 5, modified: "08 jun 2025", color: "amber" },
  { id: 9, name: "GPS", parent: 5, modified: "05 jun 2025", color: "violet" },
  { id: 10, name: "Certificados", parent: 5, modified: "02 jun 2025", color: "emerald" },
  { id: 11, name: "Revisión técnica", parent: 5, modified: "30 may 2025", color: "teal" },
  { id: 12, name: "Tarjeta de propiedad", parent: 5, modified: "28 may 2025", color: "blue" },
  { id: 13, name: "Permisos", parent: 5, modified: "24 may 2025", color: "amber" },
  { id: 14, name: "Contratos", parent: 5, modified: "20 may 2025", color: "violet" },
  { id: 15, name: "Otros", parent: 5, modified: "18 may 2025", color: "emerald" },
  { id: 16, name: "B8M-218", parent: 1, modified: "Ayer, 16:18", color: "emerald" },
  ...dossierCategories.map((name, index) => ({
    id: 1601 + index,
    name,
    parent: 16,
    modified: "Ayer, 16:18",
    color: ["emerald", "teal", "blue", "amber", "violet"][index % 5],
  })),
  { id: 18, name: "F2R-930", parent: 1, modified: "10 jun 2025", color: "emerald" },
  ...dossierCategories.map((name, index) => ({
    id: 1801 + index,
    name,
    parent: 18,
    modified: "10 jun 2025",
    color: ["emerald", "teal", "blue", "amber", "violet"][index % 5],
  })),
  { id: 2100, name: "Juan Carlos Rojas", parent: 2, modified: "12 jun 2025", color: "teal" },
  { id: 2101, name: "Licencias", parent: 2100, modified: "12 jun 2025", color: "blue" },
  { id: 2102, name: "Contratos", parent: 2100, modified: "08 jun 2025", color: "amber" },
  { id: 2103, name: "Certificados", parent: 2100, modified: "04 jun 2025", color: "emerald" },
  { id: 2200, name: "María Elena Torres", parent: 2, modified: "10 jun 2025", color: "teal" },
  ...["Licencias", "Contratos", "Certificados", "Otros"].map((name, index) => ({
    id: 2201 + index,
    name,
    parent: 2200,
    modified: "10 jun 2025",
    color: ["blue", "amber", "emerald", "violet"][index],
  })),
  { id: 2300, name: "Luis Alberto Quispe", parent: 2, modified: "08 jun 2025", color: "teal" },
  ...["Licencias", "Contratos", "Certificados", "Otros"].map((name, index) => ({
    id: 2301 + index,
    name,
    parent: 2300,
    modified: "08 jun 2025",
    color: ["blue", "amber", "emerald", "violet"][index],
  })),
  { id: 2400, name: "Rosa Milagros Peña", parent: 2, modified: "06 jun 2025", color: "teal" },
  ...["Licencias", "Contratos", "Certificados", "Otros"].map((name, index) => ({
    id: 2401 + index,
    name,
    parent: 2400,
    modified: "06 jun 2025",
    color: ["blue", "amber", "emerald", "violet"][index],
  })),
  { id: 30, name: "Proveedores", parent: null, modified: "Hoy, 09:20", color: "amber" },
  { id: 31, name: "Empresas contratantes", parent: null, modified: "Hoy, 08:40", color: "blue" },
  { id: 5001, name: "Repuestos del Sur", parent: 30, modified: "Hoy, 09:20", color: "amber" },
  {
    id: 5002,
    name: "Servicios Mecánicos Lima",
    parent: 30,
    modified: "12 jun 2025",
    color: "amber",
  },
  { id: 5003, name: "Seguros Horizonte", parent: 30, modified: "08 jun 2025", color: "amber" },
  { id: 6001, name: "Andina Mining", parent: 31, modified: "Hoy, 08:40", color: "blue" },
  {
    id: 6002,
    name: "Agroindustrial Valle",
    parent: 31,
    modified: "11 jun 2025",
    color: "blue",
  },
  {
    id: 6003,
    name: "Constructora Pacífico",
    parent: 31,
    modified: "03 jun 2025",
    color: "blue",
  },
];

const initialFiles: DemoFile[] = [
  {
    id: 101,
    name: "SOAT_T3X-456_2025.pdf",
    type: "pdf",
    size: "2.4 MB",
    modified: "Hoy, 09:42",
    category: "SOAT",
    parent: 6,
    vehicle: "T3X-456",
    status: "Vigente",
    issuedDate: "2025-03-15",
    expirationDate: "2026-03-15",
    versions: [
      { id: 1011, label: "2.0", date: "Hoy, 09:42", size: "2.4 MB", current: true },
      { id: 1010, label: "1.0", date: "15 mar 2025", size: "2.1 MB", current: false },
    ],
    favorite: true,
  },
  {
    id: 102,
    name: "Revisión técnica_B8M-218.pdf",
    type: "pdf",
    size: "1.8 MB",
    modified: "Ayer, 16:18",
    category: "Revisión técnica",
    parent: 1606,
    vehicle: "B8M-218",
    status: "Por vencer",
    issuedDate: "2024-06-24",
    expirationDate: "2025-06-24",
  },
  {
    id: 103,
    name: "Control_facturas_junio.xlsx",
    type: "sheet",
    size: "846 KB",
    modified: "12 jun 2025",
    category: "Facturas",
    parent: null,
    status: "Vigente",
  },
  {
    id: 104,
    name: "Fotografía_unidad_F2R-930.jpg",
    type: "image",
    size: "3.1 MB",
    modified: "10 jun 2025",
    category: "Fotografías",
    parent: 18,
    vehicle: "F2R-930",
    status: "Vigente",
  },
  {
    id: 105,
    name: "Póliza_responsabilidad_civil.pdf",
    type: "pdf",
    size: "4.7 MB",
    modified: "08 jun 2025",
    category: "Pólizas",
    parent: 8,
    vehicle: "T3X-456",
    status: "Vencido",
    issuedDate: "2024-06-12",
    expirationDate: "2025-06-12",
    versions: [{ id: 1051, label: "1.0", date: "08 jun 2025", size: "4.7 MB", current: true }],
  },
  {
    id: 106,
    name: "Licencia_conducir_Juan_Rojas.pdf",
    type: "pdf",
    size: "1.1 MB",
    modified: "12 jun 2025",
    category: "Licencias",
    parent: 2101,
    worker: "Juan Carlos Rojas",
    status: "Por vencer",
    issuedDate: "2023-07-05",
    expirationDate: "2025-07-05",
  },
  {
    id: 107,
    name: "Contrato_Juan_Rojas_2025.pdf",
    type: "pdf",
    size: "980 KB",
    modified: "08 jun 2025",
    category: "Contratos",
    parent: 2102,
    worker: "Juan Carlos Rojas",
    status: "Vigente",
    issuedDate: "2025-01-02",
    expirationDate: "2025-12-31",
  },
  {
    id: 108,
    name: "Contrato_servicio_Andina_Mining.pdf",
    type: "pdf",
    size: "3.6 MB",
    modified: "06 jun 2025",
    category: "Contratos",
    parent: 3,
    company: "Andina Mining S.A.C.",
    status: "Vigente",
    issuedDate: "2025-01-15",
    expirationDate: "2026-01-15",
  },
];

const initialVehicles: Vehicle[] = [
  {
    id: 301,
    code: "UN-001",
    plate: "T3X-456",
    brand: "Mercedes-Benz",
    model: "OF 1721",
    year: "2022",
    capacity: "42",
    type: "Bus de personal",
    status: "Operativa",
    notes: "Unidad asignada a servicios corporativos.",
    cover: photos.bus1,
    photos: [photos.bus1, photos.bus2],
    folderId: 5,
  },
  {
    id: 302,
    code: "UN-002",
    plate: "B8M-218",
    brand: "Volvo",
    model: "B270F",
    year: "2021",
    capacity: "45",
    type: "Bus de personal",
    status: "Operativa",
    notes: "Próxima revisión técnica programada.",
    cover: photos.bus2,
    photos: [photos.bus2],
    folderId: 16,
  },
  {
    id: 303,
    code: "UN-003",
    plate: "F2R-930",
    brand: "Scania",
    model: "K310",
    year: "2020",
    capacity: "48",
    type: "Bus de personal",
    status: "En mantenimiento",
    notes: "Mantenimiento preventivo en curso.",
    cover: photos.bus3,
    photos: [photos.bus3],
    folderId: 18,
  },
];

const initialWorkers: Worker[] = [
  {
    id: 401,
    code: "TR-001",
    name: "Juan Carlos Rojas",
    role: "Conductor principal",
    status: "Activo",
    phone: "+51 987 234 610",
    email: "juan.rojas@demo.pe",
    initials: "JR",
    folderId: 2100,
  },
  {
    id: 402,
    code: "TR-002",
    name: "María Elena Torres",
    role: "Conductora",
    status: "Activo",
    phone: "+51 986 104 223",
    email: "maria.torres@demo.pe",
    initials: "MT",
    folderId: 2200,
  },
  {
    id: 403,
    code: "TR-003",
    name: "Luis Alberto Quispe",
    role: "Supervisor de ruta",
    status: "En descanso",
    phone: "+51 981 442 908",
    email: "luis.quispe@demo.pe",
    initials: "LQ",
    folderId: 2300,
  },
  {
    id: 404,
    code: "TR-004",
    name: "Rosa Milagros Peña",
    role: "Coordinadora de operaciones",
    status: "Activo",
    phone: "+51 984 331 762",
    email: "rosa.pena@demo.pe",
    initials: "RP",
    folderId: 2400,
  },
];

const initialSuppliers: BusinessRecord[] = [
  {
    id: 501,
    name: "Repuestos del Sur",
    legalName: "Repuestos del Sur S.A.C.",
    kind: "Repuestos",
    contact: "Carlos Paredes",
    phone: "+51 954 220 841",
    email: "ventas@repuestos-demo.pe",
    updated: "Hoy, 09:20",
    folderId: 5001,
  },
  {
    id: 502,
    name: "Servicios Mecánicos Lima",
    legalName: "Servicios Mecánicos Lima E.I.R.L.",
    kind: "Mantenimiento",
    contact: "Ana Valdivia",
    phone: "+51 944 118 320",
    email: "contacto@mecanica-demo.pe",
    updated: "12 jun 2025",
    folderId: 5002,
  },
  {
    id: 503,
    name: "Seguros Horizonte",
    legalName: "Corredores Horizonte S.A.C.",
    kind: "Seguros",
    contact: "Miguel Salazar",
    phone: "+51 932 551 090",
    email: "polizas@horizonte-demo.pe",
    updated: "08 jun 2025",
    folderId: 5003,
  },
];

const initialCompanies: BusinessRecord[] = [
  {
    id: 601,
    name: "Andina Mining",
    legalName: "Andina Mining S.A.C.",
    kind: "Minería",
    contact: "Paola Medina",
    phone: "+51 970 442 110",
    email: "operaciones@andina-demo.pe",
    updated: "Hoy, 08:40",
    folderId: 6001,
  },
  {
    id: 602,
    name: "Agroindustrial Valle",
    legalName: "Agroindustrial Valle S.A.",
    kind: "Agroindustria",
    contact: "Diego Luna",
    phone: "+51 965 113 772",
    email: "servicios@valle-demo.pe",
    updated: "11 jun 2025",
    folderId: 6002,
  },
  {
    id: 603,
    name: "Constructora Pacífico",
    legalName: "Constructora del Pacífico S.R.L.",
    kind: "Construcción",
    contact: "Lucía Campos",
    phone: "+51 951 872 300",
    email: "logistica@pacifico-demo.pe",
    updated: "03 jun 2025",
    folderId: 6003,
  },
];

const initialManifests: ManifestRecord[] = [
  {
    id: 701,
    number: "MAN-2025-0618",
    date: "2025-06-18",
    vehicle: "T3X-456",
    company: "Andina Mining",
    service: "Traslado de personal",
    period: "Junio 2025",
    fileName: "Manifiesto_18-06_T3X-456.pdf",
  },
  {
    id: 702,
    number: "MAN-2025-0617",
    date: "2025-06-17",
    vehicle: "B8M-218",
    company: "Agroindustrial Valle",
    service: "Ruta planta",
    period: "Junio 2025",
    fileName: "Manifiesto_17-06_B8M-218.pdf",
  },
  {
    id: 703,
    number: "MAN-2025-0612",
    date: "2025-06-12",
    vehicle: "F2R-930",
    company: "Andina Mining",
    service: "Traslado de personal",
    period: "Junio 2025",
    fileName: "Manifiesto_12-06_F2R-930.pdf",
  },
];

const initialInvoices: InvoiceRecord[] = [
  {
    id: 801,
    number: "F001-00482",
    company: "Andina Mining S.A.C.",
    date: "2025-06-15",
    amount: 12800,
    currency: "PEN",
    status: "Pagada",
    fileName: "F001-00482.pdf",
  },
  {
    id: 802,
    number: "F001-00483",
    company: "Agroindustrial Valle S.A.",
    date: "2025-06-18",
    amount: 8450,
    currency: "PEN",
    status: "Pendiente",
    fileName: "F001-00483.pdf",
  },
  {
    id: 803,
    number: "F001-00471",
    company: "Constructora del Pacífico S.R.L.",
    date: "2025-05-30",
    amount: 3960,
    currency: "USD",
    status: "Vencida",
    fileName: "F001-00471.pdf",
  },
];

const initialAudits: AuditRecord[] = [
  {
    id: 901,
    name: "Auditoría documental Andina — Junio",
    companyId: 601,
    requestDate: "2025-06-12",
    deadline: "2025-06-28",
    period: "Junio 2025",
    description: "Revisión periódica de unidades asignadas al servicio.",
    notes: "Validar vigencia antes de presentar.",
    status: "Activa",
    vehicleIds: [301, 302],
    workerIds: [401],
    requirements: auditRequirementCatalog.filter((item) =>
      ["soat", "str", "polizas", "revision", "trabajadores", "manifiestos"].includes(item.id),
    ),
    manuallyReviewed: [],
    excludedEvidence: [],
    updated: "Hoy, 10:10",
  },
  {
    id: 902,
    name: "Revisión contractual Agroindustrial Valle",
    companyId: 602,
    requestDate: "2025-06-05",
    deadline: "2025-07-10",
    period: "Junio 2025",
    description: "Control de contratos, manifiestos y documentos de transporte.",
    notes: "",
    status: "Pendiente",
    vehicleIds: [302],
    workerIds: [402, 403],
    requirements: auditRequirementCatalog.filter((item) =>
      ["soat", "revision", "contratos", "trabajadores", "manifiestos"].includes(item.id),
    ),
    manuallyReviewed: [],
    excludedEvidence: [],
    updated: "Ayer, 16:20",
  },
  {
    id: 903,
    name: "Expediente anual Constructora Pacífico",
    companyId: 603,
    requestDate: "2025-05-10",
    deadline: "2025-05-30",
    period: "Mayo 2025",
    description: "Expediente anual de servicio.",
    notes: "Cierre demostrativo.",
    status: "Completada",
    vehicleIds: [301],
    workerIds: [],
    requirements: auditRequirementCatalog.filter((item) =>
      ["soat", "polizas", "contratos", "facturas"].includes(item.id),
    ),
    manuallyReviewed: [],
    excludedEvidence: [],
    updated: "30 may 2025",
  },
];

const initialTrash: TrashEntry[] = [
  {
    id: 9901,
    name: "Cotización_mantenimiento_antigua.pdf",
    kind: "Archivo",
    deletedAt: "18 jun 2025, 15:30",
    folders: [],
    files: [
      {
        id: 9901,
        name: "Cotización_mantenimiento_antigua.pdf",
        type: "pdf",
        size: "640 KB",
        modified: "02 may 2025",
        category: "Documento general",
        parent: null,
        status: "Vigente",
      },
    ],
  },
];

const initialInbox: InboxItem[] = [
  {
    id: 201,
    name: "documento_wa_1406.pdf",
    type: "pdf",
    size: "1.2 MB",
    modified: "Hoy, 10:32",
    category: "Sin categoría",
    parent: null,
    source: "WhatsApp",
    status: "Por organizar",
  },
  {
    id: 202,
    name: "factura_proveedor_00842.pdf",
    type: "pdf",
    size: "720 KB",
    modified: "Hoy, 08:15",
    category: "Sin categoría",
    parent: null,
    source: "Correo",
    status: "Por organizar",
  },
  {
    id: 203,
    name: "foto_documento_unidad.jpg",
    type: "image",
    size: "2.8 MB",
    modified: "Ayer, 18:42",
    category: "Sin categoría",
    parent: null,
    source: "Carga manual",
    status: "Por organizar",
  },
];

const nav: { id: Route; label: string; icon: LucideIcon; group?: boolean; badge?: number }[] = [
  { id: "dashboard", label: "Inicio", icon: Home },
  { id: "files", label: "Mis archivos", icon: Folder },
  { id: "inbox", label: "Bandeja documental", icon: Inbox, badge: 3 },
  { id: "vehicles", label: "Mis unidades", icon: Bus, group: true },
  { id: "workers", label: "Trabajadores", icon: Users },
  { id: "companies", label: "Empresas", icon: Building2 },
  { id: "suppliers", label: "Proveedores", icon: Archive },
  { id: "manifests", label: "Manifiestos", icon: Files, group: true },
  { id: "invoices", label: "Facturas", icon: ReceiptText },
  { id: "expirations", label: "Vencimientos", icon: CalendarClock, badge: 7 },
  { id: "audits", label: "Auditorías", icon: BookOpenCheck },
  { id: "favorites", label: "Favoritos", icon: Star, group: true },
  { id: "trash", label: "Papelera", icon: Trash2 },
  { id: "settings", label: "Configuración", icon: Settings },
];

const routeNames: Record<Route, string> = Object.fromEntries(
  nav.map((item) => [item.id, item.label]),
) as Record<Route, string>;

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <span>MM</span>
      </div>
      {!compact && (
        <div>
          <strong>Mis Dos Marías</strong>
          <small>Document Manager</small>
        </div>
      )}
    </div>
  );
}

function Button({
  children,
  variant = "primary",
  icon: Icon,
  className = "",
  ...props
}: {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: LucideIcon;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {Icon && <Icon size={17} />}
      {children}
    </button>
  );
}

function Badge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(" ", "-");
  return (
    <span className={`badge badge-${key}`}>
      <span />
      {status}
    </span>
  );
}

function FileIcon({ type, size = 20 }: { type: DemoFile["type"]; size?: number }) {
  const Icon =
    type === "sheet"
      ? FileSpreadsheet
      : type === "image"
        ? FileImage
        : type === "zip"
          ? FileArchive
          : type === "doc"
            ? FileText
            : File;
  return (
    <span className={`file-icon file-${type}`}>
      <Icon size={size} />
    </span>
  );
}

function Login({ onEnter }: { onEnter: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    setError("Este es un prototipo. Utiliza el acceso de demostración.");
  }
  return (
    <main className="login-page">
      <section className="login-form-wrap">
        <div className="login-form-inner">
          <Logo />
          <div className="login-copy">
            <span className="eyebrow">
              <ShieldCheck size={15} /> Espacio documental privado
            </span>
            <h1>Bienvenido de nuevo</h1>
            <p>Organiza tu empresa y encuentra cada documento cuando lo necesites.</p>
          </div>
          <form onSubmit={submit} className="login-form">
            <label>
              Correo electrónico
              <input type="email" placeholder="gerencia@misdosmarias.pe" />
            </label>
            <label>
              Contraseña
              <span className="input-with-action">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <div className="login-options">
              <label className="check-label">
                <input type="checkbox" /> Recordar sesión
              </label>
              <button type="button">¿Olvidaste tu contraseña?</button>
            </div>
            {error && (
              <p className="form-note error">
                <AlertCircle size={15} />
                {error}
              </p>
            )}
            <Button type="submit">Iniciar sesión</Button>
          </form>
          <div className="demo-access">
            <div>
              <Sparkles size={18} />
              <span>
                <strong>Modo demostración</strong>
                <small>Explora el producto con datos ficticios.</small>
              </span>
            </div>
            <Button variant="secondary" onClick={onEnter}>
              Entrar al prototipo <ArrowRight size={16} />
            </Button>
          </div>
          <p className="privacy-note">
            Prototipo UI/UX · No almacena credenciales ni documentos reales.
          </p>
        </div>
      </section>
      <section className="login-visual">
        <img src={photos.hero} alt="Bus de transporte de personal en carretera" />
        <div className="login-overlay" />
        <div className="visual-copy">
          <span>Control documental empresarial</span>
          <h2>
            Todo lo importante,
            <br />
            siempre en orden.
          </h2>
          <p>
            Un espacio diseñado para que tu flota, documentos y próximas auditorías estén bajo
            control.
          </p>
          <div className="visual-proof">
            <div>
              <Check size={16} />
              <span>
                <strong>Centralizado</strong>
                <small>Un solo lugar para tu empresa</small>
              </span>
            </div>
            <div>
              <Check size={16} />
              <span>
                <strong>Preparado</strong>
                <small>Documentación lista para auditar</small>
              </span>
            </div>
          </div>
        </div>
        <span className="photo-credit">Foto: Hobi industri / Unsplash</span>
      </section>
    </main>
  );
}

function Sidebar({
  route,
  collapsed,
  mobileOpen,
  onRoute,
  onCollapse,
  onClose,
}: {
  route: Route;
  collapsed: boolean;
  mobileOpen: boolean;
  onRoute: (r: Route) => void;
  onCollapse: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            aria-label="Cerrar menú"
            className="sidebar-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-head">
          <Logo compact={collapsed} />
          <button
            className="icon-button sidebar-close-mobile"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Navegación principal">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {item.group && !collapsed && <span className="nav-divider" />}
                <button
                  title={collapsed ? item.label : undefined}
                  className={`nav-item ${route === item.id ? "active" : ""}`}
                  aria-current={route === item.id ? "page" : undefined}
                  onClick={() => {
                    onRoute(item.id);
                    onClose();
                  }}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  {item.badge && <b>{item.id === "inbox" ? item.badge : item.badge}</b>}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          {!collapsed && (
            <div className="storage">
              <div>
                <HardDrive size={16} />
                <span>Espacio de demostración</span>
              </div>
              <div className="storage-bar">
                <i />
              </div>
              <small>Datos ficticios · Sin almacenamiento real</small>
            </div>
          )}
          <button
            className="collapse-button"
            onClick={onCollapse}
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            <span>Contraer menú</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function Topbar({
  route,
  onMenu,
  onUpload,
  onSearch,
  onNotifications,
  onAccount,
}: {
  route: Route;
  onMenu: () => void;
  onUpload: () => void;
  onSearch: () => void;
  onNotifications: () => void;
  onAccount: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button menu-button" onClick={onMenu} aria-label="Abrir menú">
          <Menu size={21} />
        </button>
        <div className="breadcrumbs">
          <span>Mis Dos Marías Docs</span>
          <ChevronRight size={14} />
          <strong>{routeNames[route]}</strong>
        </div>
      </div>
      <div className="topbar-actions">
        <button className="search-trigger" onClick={onSearch}>
          <Search size={17} />
          <span>Buscar documentos, unidades...</span>
          <kbd>⌘ K</kbd>
        </button>
        <Button icon={Upload} onClick={onUpload} className="top-upload">
          Subir archivo
        </Button>
        <button
          className="icon-button notification-button"
          aria-label="Abrir centro de vencimientos"
          onClick={onNotifications}
        >
          <Bell size={19} />
          <i />
        </button>
        <button
          className="profile-button"
          onClick={onAccount}
          aria-label="Abrir configuración de cuenta"
        >
          <span>JM</span>
          <div>
            <strong>José Mendoza</strong>
            <small>Gerente general</small>
          </div>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "green",
  onClick,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className={`stat-icon tone-${tone}`}>
        <Icon size={20} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      {onClick && <ArrowRight className="stat-arrow" size={16} />}
    </>
  );
  if (!onClick) return <div className="stat-card">{content}</div>;
  return (
    <button className="stat-card" onClick={onClick}>
      {content}
    </button>
  );
}

function Dashboard({
  files,
  vehicles,
  auditCount,
  inboxCount,
  goTo,
  onUpload,
  onNewFolder,
  onRegisterVehicle,
  onNewAudit,
  onPreview,
}: {
  files: DemoFile[];
  vehicles: Vehicle[];
  auditCount: number;
  inboxCount: number;
  goTo: (r: Route) => void;
  onUpload: () => void;
  onNewFolder: () => void;
  onRegisterVehicle: () => void;
  onNewAudit: () => void;
  onPreview: (f: DemoFile) => void;
}) {
  return (
    <motion.div className="page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <PageHeader
        eyebrow="Viernes, 20 de junio"
        title="Buenos días, José"
        description="Gestiona los documentos de tu empresa desde un solo lugar."
        actions={
          <span className="demo-pill">
            <Sparkles size={14} /> Datos de demostración
          </span>
        }
      />
      <section className="stats-grid">
        <StatCard
          label="Unidades registradas"
          value={String(vehicles.length)}
          note={`${vehicles.filter((vehicle) => vehicle.status === "Operativa").length} unidades operativas`}
          icon={Bus}
          onClick={() => goTo("vehicles")}
        />
        <StatCard
          label="Documentos almacenados"
          value={String(files.length + 241)}
          note="+18 este mes"
          icon={Files}
          tone="blue"
          onClick={() => goTo("files")}
        />
        <StatCard
          label="Próximos a vencer"
          value="7"
          note="En los próximos 30 días"
          icon={Clock3}
          tone="amber"
          onClick={() => goTo("expirations")}
        />
        <StatCard
          label="Documentos vencidos"
          value="3"
          note="Requieren atención"
          icon={AlertCircle}
          tone="red"
        />
        <StatCard
          label="Archivos por organizar"
          value={String(inboxCount)}
          note="En la bandeja documental"
          icon={Inbox}
          tone="violet"
          onClick={() => goTo("inbox")}
        />
        <StatCard
          label="Auditorías pendientes"
          value={String(auditCount)}
          note="En preparación o pendientes"
          icon={BookOpenCheck}
          tone="teal"
          onClick={() => goTo("audits")}
        />
      </section>
      <section className="quick-section">
        <div className="section-title">
          <div>
            <h2>Acciones rápidas</h2>
            <p>Lo que necesitas, a un clic.</p>
          </div>
        </div>
        <div className="quick-grid">
          <button onClick={onUpload}>
            <span>
              <Upload size={19} />
            </span>
            <div>
              <strong>Subir documento</strong>
              <small>PDF, Word, Excel o imagen</small>
            </div>
            <ChevronRight size={17} />
          </button>
          <button onClick={onNewFolder}>
            <span>
              <FolderPlus size={19} />
            </span>
            <div>
              <strong>Nueva carpeta</strong>
              <small>Organiza tu documentación</small>
            </div>
            <ChevronRight size={17} />
          </button>
          <button onClick={onRegisterVehicle}>
            <span>
              <Bus size={19} />
            </span>
            <div>
              <strong>Registrar unidad</strong>
              <small>Crea su expediente digital</small>
            </div>
            <ChevronRight size={17} />
          </button>
          <button onClick={onNewAudit}>
            <span>
              <BookOpenCheck size={19} />
            </span>
            <div>
              <strong>Preparar auditoría</strong>
              <small>Reúne los documentos</small>
            </div>
            <ChevronRight size={17} />
          </button>
        </div>
      </section>
      <section className="dashboard-columns">
        <div className="card recent-card">
          <div className="card-head">
            <div>
              <h2>Documentos recientes</h2>
              <p>Últimos archivos añadidos o modificados</p>
            </div>
            <button onClick={() => goTo("files")}>
              Ver todos <ArrowRight size={15} />
            </button>
          </div>
          <div className="document-list">
            {files.slice(0, 4).map((file) => (
              <button key={file.id} className="document-row" onClick={() => onPreview(file)}>
                <FileIcon type={file.type} />
                <div className="doc-main">
                  <strong>{file.name}</strong>
                  <small>
                    {file.category} · {file.vehicle || "General"}
                  </small>
                </div>
                <span className="doc-date">{file.modified}</span>
                {file.status && <Badge status={file.status} />}
                <MoreHorizontal size={18} />
              </button>
            ))}
          </div>
        </div>
        <div className="card alert-card">
          <div className="card-head">
            <div>
              <h2>Centro de alertas</h2>
              <p>Próximos vencimientos</p>
            </div>
            <span className="alert-count">7</span>
          </div>
          <div className="alert-item">
            <div className="date-tile">
              <strong>24</strong>
              <small>JUN</small>
            </div>
            <div>
              <strong>Revisión técnica · B8M-218</strong>
              <span>Vence en 4 días</span>
            </div>
            <ChevronRight size={17} />
          </div>
          <div className="alert-item">
            <div className="date-tile">
              <strong>28</strong>
              <small>JUN</small>
            </div>
            <div>
              <strong>SOAT · F2R-930</strong>
              <span>Vence en 8 días</span>
            </div>
            <ChevronRight size={17} />
          </div>
          <button className="card-link" onClick={() => goTo("expirations")}>
            Revisar todos los vencimientos <ArrowRight size={15} />
          </button>
        </div>
      </section>
      <section className="dashboard-columns lower">
        <div className="card fleet-card">
          <div className="card-head">
            <div>
              <h2>Resumen de flota</h2>
              <p>Estado documental por unidad</p>
            </div>
            <button onClick={() => goTo("vehicles")}>
              Ver flota <ArrowRight size={15} />
            </button>
          </div>
          <div className="fleet-list">
            {vehicles.slice(0, 3).map((vehicle, i) => (
              <button className="fleet-item" key={vehicle.id} onClick={() => goTo("vehicles")}>
                <img src={vehicle.cover} alt={`Unidad ${vehicle.plate}`} />
                <div>
                  <strong>{vehicle.plate}</strong>
                  <small>
                    {vehicle.brand} · {vehicle.code}
                  </small>
                </div>
                <span className={i === 0 ? "good" : "warning"}>
                  {vehicle.status === "Operativa" ? "Al día" : vehicle.status}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="card activity-card">
          <div className="card-head">
            <div>
              <h2>Actividad reciente</h2>
              <p>Movimientos en el espacio documental</p>
            </div>
          </div>
          <div className="timeline">
            <div>
              <i>
                <Upload size={14} />
              </i>
              <p>
                <strong>Subiste “SOAT_T3X-456_2025.pdf”</strong>
                <span>Hace 24 minutos · Mis archivos</span>
              </p>
            </div>
            <div>
              <i>
                <FolderPlus size={14} />
              </i>
              <p>
                <strong>Creaste la carpeta “Facturas 2025”</strong>
                <span>Ayer, 16:18 · Documentos</span>
              </p>
            </div>
            <div>
              <i>
                <Check size={14} />
              </i>
              <p>
                <strong>Organizaste 3 documentos</strong>
                <span>12 jun, 10:04 · Bandeja documental</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

function FileExplorer({
  folders,
  files,
  currentFolder,
  setCurrentFolder,
  onNewFolder,
  onUpload,
  onPreview,
  onFavorite,
  onTrashFile,
  onTrashFolder,
  view,
  setView,
}: {
  folders: DemoFolder[];
  files: DemoFile[];
  currentFolder: number | null;
  setCurrentFolder: (id: number | null) => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onPreview: (f: DemoFile) => void;
  onFavorite: (id: number) => void;
  onTrashFile: (id: number) => void;
  onTrashFolder: (id: number) => void;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
}) {
  const [query, setQuery] = useState("");
  const current = folders.find((f) => f.id === currentFolder);
  const visibleFolders = folders.filter(
    (f) => f.parent === currentFolder && f.name.toLowerCase().includes(query.toLowerCase()),
  );
  const visibleFiles = files.filter(
    (f) => f.parent === currentFolder && f.name.toLowerCase().includes(query.toLowerCase()),
  );
  const crumbs = useMemo(() => {
    const result: DemoFolder[] = [];
    let id = currentFolder;
    while (id) {
      const folder = folders.find((f) => f.id === id);
      if (!folder) break;
      result.unshift(folder);
      id = folder.parent;
    }
    return result;
  }, [currentFolder, folders]);
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={current?.name || "Mis archivos"}
        description="Organiza carpetas y documentos en tu espacio de demostración."
        actions={
          <>
            <Button variant="secondary" icon={FolderPlus} onClick={onNewFolder}>
              Nueva carpeta
            </Button>
            <Button icon={Upload} onClick={onUpload}>
              Subir archivo
            </Button>
          </>
        }
      />
      <div className="explorer-toolbar">
        <div className="folder-breadcrumbs">
          <button onClick={() => setCurrentFolder(null)}>
            <Home size={15} /> Mis archivos
          </button>
          {crumbs.map((f) => (
            <span key={f.id}>
              <ChevronRight size={14} />
              <button onClick={() => setCurrentFolder(f.id)}>{f.name}</button>
            </span>
          ))}
        </div>
        <div className="toolbar-row">
          <label className="inline-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en esta carpeta"
            />
          </label>
          <Button variant="secondary" icon={SlidersHorizontal}>
            Filtrar
          </Button>
          <select className="select-control" aria-label="Ordenar">
            <option>Última modificación</option>
            <option>Nombre A–Z</option>
            <option>Tipo de archivo</option>
          </select>
          <div className="view-switch">
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
              aria-label="Vista de cuadrícula"
            >
              <Grid2X2 size={17} />
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
              aria-label="Vista de lista"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
      {visibleFolders.length > 0 || visibleFiles.length > 0 ? (
        <>
          {visibleFolders.length > 0 && (
            <section className="file-section">
              <div className="section-title compact">
                <h2>
                  Carpetas <span>{visibleFolders.length}</span>
                </h2>
              </div>
              <div className={view === "grid" ? "folder-grid" : "file-list-view"}>
                {visibleFolders.map((folder) => (
                  <button
                    className="folder-card"
                    key={folder.id}
                    onDoubleClick={() => setCurrentFolder(folder.id)}
                    onClick={() => setCurrentFolder(folder.id)}
                  >
                    <span className={`folder-icon folder-${folder.color}`}>
                      <Folder size={23} fill="currentColor" />
                    </span>
                    <div>
                      <strong>{folder.name}</strong>
                      <small>
                        {folders.filter((f) => f.parent === folder.id).length +
                          files.filter((f) => f.parent === folder.id).length}{" "}
                        elementos · {folder.modified}
                      </small>
                    </div>
                    <span
                      className="folder-trash-action"
                      role="button"
                      tabIndex={0}
                      title="Mover a papelera"
                      onClick={(event) => {
                        event.stopPropagation();
                        onTrashFolder(folder.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {visibleFiles.length > 0 && (
            <section className="file-section">
              <div className="section-title compact">
                <h2>
                  Archivos <span>{visibleFiles.length}</span>
                </h2>
              </div>
              <div className={view === "grid" ? "files-grid" : "file-list-view"}>
                {visibleFiles.map((file) => (
                  <article
                    className="file-card"
                    key={file.id}
                    onDoubleClick={() => onPreview(file)}
                  >
                    <div className="file-preview">
                      <FileIcon type={file.type} size={28} />
                      {file.favorite && (
                        <Star className="favorite-star" size={16} fill="currentColor" />
                      )}
                    </div>
                    <div className="file-card-body">
                      <div>
                        <strong title={file.name}>{file.name}</strong>
                        <small>
                          {file.size} · {file.modified}
                        </small>
                      </div>
                      <span className="file-quick-actions">
                        <button onClick={() => onFavorite(file.id)} aria-label="Alternar favorito">
                          <Star size={15} fill={file.favorite ? "currentColor" : "none"} />
                        </button>
                        <button onClick={() => onTrashFile(file.id)} aria-label="Mover a papelera">
                          <Trash2 size={15} />
                        </button>
                      </span>
                    </div>
                    <span className="category-tag">{file.category}</span>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <EmptyState
          icon={Folder}
          title={query ? "Sin resultados" : "Esta carpeta está vacía"}
          text={
            query
              ? `No encontramos archivos que coincidan con “${query}”.`
              : "Sube un documento o crea una subcarpeta para comenzar."
          }
          action={
            !query && (
              <Button icon={Upload} onClick={onUpload}>
                Subir documento
              </Button>
            )
          }
        />
      )}
    </motion.div>
  );
}

function InboxPage({
  items,
  onSelect,
  selectedIds,
  toggleSelect,
}: {
  items: InboxItem[];
  onSelect: (f: InboxItem) => void;
  selectedIds: number[];
  toggleSelect: (id: number) => void;
}) {
  const [showInfo, setShowInfo] = useState(true);
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Bandeja documental"
        title="Archivos por organizar"
        description="Clasifica rápidamente documentos recibidos de WhatsApp, correo o proveedores."
        actions={
          <span className="demo-pill">
            <Inbox size={14} /> {items.length} pendientes
          </span>
        }
      />
      {showInfo && (
        <div className="inbox-info">
          <span>
            <Sparkles size={17} />
          </span>
          <div>
            <strong>Este es un flujo de demostración</strong>
            <p>
              Los archivos son ficticios. Al organizarlos se moverán durante esta sesión, sin
              almacenamiento permanente.
            </p>
          </div>
          <button onClick={() => setShowInfo(false)}>Entendido</button>
        </div>
      )}
      <div className="inbox-toolbar">
        <div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={items.length > 0 && selectedIds.length === items.length}
              onChange={() =>
                items.forEach((item) => {
                  const allSelected = selectedIds.length === items.length;
                  if (allSelected || !selectedIds.includes(item.id)) toggleSelect(item.id);
                })
              }
            />{" "}
            Seleccionar todo
          </label>
          {selectedIds.length > 0 && <span>{selectedIds.length} seleccionados</span>}
        </div>
        <div>
          <Button
            variant="secondary"
            icon={SlidersHorizontal}
            disabled
            title="Sin filtros adicionales"
          >
            Filtrar
          </Button>
          <select className="select-control">
            <option>Más recientes</option>
          </select>
        </div>
      </div>
      {items.length ? (
        <div className="inbox-grid">
          {items.map((file) => (
            <article
              className={`inbox-card ${selectedIds.includes(file.id) ? "selected" : ""}`}
              key={file.id}
            >
              <label className="card-check">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(file.id)}
                  onChange={() => toggleSelect(file.id)}
                />
              </label>
              <div className="inbox-preview">
                <FileIcon type={file.type} size={34} />
                <span>{file.type.toUpperCase()}</span>
              </div>
              <div className="inbox-card-body">
                <div>
                  <strong>{file.name}</strong>
                  <small>
                    {file.size} · {file.modified}
                  </small>
                </div>
                <span className="source-tag">{file.source}</span>
                <Button onClick={() => onSelect(file)}>
                  Organizar archivo <ArrowRight size={15} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Check}
          title="Bandeja organizada"
          text="No quedan archivos pendientes. Los documentos clasificados ya aparecen en Mis archivos."
        />
      )}
    </motion.div>
  );
}

function VehiclesPage({
  vehicles,
  files,
  onRegister,
  onOpen,
}: {
  vehicles: Vehicle[];
  files: DemoFile[];
  onRegister: () => void;
  onOpen: (vehicle: Vehicle) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todas");
  const [view, setView] = useState<"grid" | "list">("grid");
  const filtered = vehicles.filter(
    (vehicle) =>
      (status === "Todas" || vehicle.status === status) &&
      `${vehicle.plate} ${vehicle.code} ${vehicle.brand} ${vehicle.model}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Gestión de flota"
        title="Mis unidades"
        description="Consulta el estado documental y el expediente digital de cada vehículo."
        actions={
          <Button icon={Plus} onClick={onRegister}>
            Registrar unidad
          </Button>
        }
      />
      <div className="vehicle-summary">
        <div>
          <span>
            <Bus size={18} />
          </span>
          <p>
            <strong>{vehicles.length}</strong>
            <small>Unidades registradas</small>
          </p>
        </div>
        <div>
          <span className="success">
            <Check size={18} />
          </span>
          <p>
            <strong>{vehicles.filter((v) => v.status === "Operativa").length}</strong>
            <small>Operativas</small>
          </p>
        </div>
        <div>
          <span className="warning">
            <Clock3 size={18} />
          </span>
          <p>
            <strong>{files.filter((file) => file.status === "Por vencer").length}</strong>
            <small>Documentos por vencer</small>
          </p>
        </div>
        <div>
          <span className="danger">
            <AlertCircle size={18} />
          </span>
          <p>
            <strong>{files.filter((file) => file.status === "Vencido").length}</strong>
            <small>Documentos vencidos</small>
          </p>
        </div>
      </div>
      <div className="vehicle-toolbar">
        <label className="inline-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por placa, código, marca o modelo"
          />
        </label>
        <select
          className="select-control"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filtrar por estado"
        >
          <option>Todas</option>
          <option>Operativa</option>
          <option>En mantenimiento</option>
          <option>Inactiva</option>
        </select>
        <div className="view-switch">
          <button
            className={view === "grid" ? "active" : ""}
            onClick={() => setView("grid")}
            aria-label="Vista de cuadrícula"
          >
            <Grid2X2 size={17} />
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
            aria-label="Vista de lista"
          >
            <List size={18} />
          </button>
        </div>
      </div>
      {filtered.length ? (
        <div className={`vehicle-grid ${view === "list" ? "vehicle-list" : ""}`}>
          {filtered.map((vehicle) => {
            const docs = files.filter((file) => file.vehicle === vehicle.plate);
            const pending = docs.filter(
              (file) => file.status === "Vencido" || file.status === "Por vencer",
            ).length;
            return (
              <article className="vehicle-card" key={vehicle.id}>
                <button className="vehicle-photo" onClick={() => onOpen(vehicle)}>
                  <img src={vehicle.cover} alt={`Bus ${vehicle.plate}`} />
                  <span
                    className={`vehicle-status status-${vehicle.status.toLowerCase().replace(/ /g, "-")}`}
                  >
                    {vehicle.status}
                  </span>
                  <small>Foto de demostración</small>
                </button>
                <div className="vehicle-card-body">
                  <div className="vehicle-card-title">
                    <div>
                      <strong>{vehicle.plate}</strong>
                      <span>{vehicle.code}</span>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Abrir ficha de ${vehicle.plate}`}
                      onClick={() => onOpen(vehicle)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  <p>
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                  </p>
                  <dl>
                    <div>
                      <dt>Capacidad</dt>
                      <dd>{vehicle.capacity} pasajeros</dd>
                    </div>
                    <div>
                      <dt>Documentos</dt>
                      <dd>{docs.length || "Sin archivos"}</dd>
                    </div>
                  </dl>
                  <div className={`vehicle-doc-state ${pending ? "needs-attention" : ""}`}>
                    {pending ? <AlertCircle size={15} /> : <ShieldCheck size={15} />}
                    <span>
                      <strong>
                        {pending ? `${pending} requieren atención` : "Expediente al día"}
                      </strong>
                      <small>{vehicle.folderId ? "Expediente creado" : "Sin expediente"}</small>
                    </span>
                  </div>
                  <Button variant="secondary" onClick={() => onOpen(vehicle)}>
                    Ver ficha digital <ArrowRight size={15} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bus}
          title={query ? "No encontramos unidades" : "Aún no hay unidades"}
          text={
            query
              ? `No hay placas o códigos que coincidan con “${query}”.`
              : "Registra el primer vehículo para crear su expediente digital."
          }
          action={
            !query && (
              <Button icon={Plus} onClick={onRegister}>
                Registrar unidad
              </Button>
            )
          }
        />
      )}
    </motion.div>
  );
}

function VehicleFormPage({
  onBack,
  onCreate,
  existingPlates,
  templates,
}: {
  onBack: () => void;
  onCreate: (vehicle: Omit<Vehicle, "id" | "folderId">, categories: string[]) => void;
  existingPlates: string[];
  templates: TemplateSetting[];
}) {
  const photoInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    code: "",
    plate: "",
    brand: "",
    model: "",
    year: "2025",
    capacity: "",
    type: "Bus de personal",
    status: "Operativa" as Vehicle["status"],
    notes: "",
  });
  const [photosList, setPhotosList] = useState<string[]>([]);
  const unitTemplates = templates.filter((item) => item.kind === "Unidad" && item.active);
  const [template, setTemplate] = useState(String(unitTemplates[0]?.id || "none"));
  const selectedTemplate = unitTemplates.find((item) => String(item.id) === template);
  const [errors, setErrors] = useState<Record<string, string>>({});
  function update(key: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  }
  function addPhotos(selected?: FileList | null) {
    if (!selected?.length) return;
    const localPhotos = Array.from(selected).map((file) => URL.createObjectURL(file));
    setPhotosList((previous) => [...previous, ...localPhotos].slice(0, 6));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.code.trim()) nextErrors.code = "Ingresa el código interno.";
    if (!form.plate.trim()) nextErrors.plate = "Ingresa la placa.";
    if (existingPlates.includes(form.plate.trim().toUpperCase()))
      nextErrors.plate = "Esta placa ya está registrada.";
    if (!form.brand.trim()) nextErrors.brand = "Ingresa la marca.";
    if (!form.model.trim()) nextErrors.model = "Ingresa el modelo.";
    if (!form.capacity || Number(form.capacity) < 1)
      nextErrors.capacity = "Ingresa una capacidad válida.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const cover = photosList[0] || photos.bus1;
    onCreate(
      {
        ...form,
        code: form.code.trim().toUpperCase(),
        plate: form.plate.trim().toUpperCase(),
        cover,
        photos: photosList.length ? photosList : [cover],
      },
      selectedTemplate?.items || [],
    );
  }
  return (
    <motion.div className="page" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Volver a Mis unidades
      </button>
      <PageHeader
        eyebrow="Nueva unidad"
        title="Registrar unidad"
        description="Completa los datos y prepara su expediente documental automático."
        actions={
          <span className="demo-pill">
            <Sparkles size={14} /> Datos de demostración
          </span>
        }
      />
      <form className="vehicle-form-layout" onSubmit={submit}>
        <div className="vehicle-form-main">
          <section className="form-section-card">
            <div className="form-section-head">
              <span>01</span>
              <div>
                <h2>Información de la unidad</h2>
                <p>Datos de identificación y operación.</p>
              </div>
            </div>
            <div className="vehicle-fields">
              <label>
                Código interno
                <input
                  value={form.code}
                  onChange={(event) => update("code", event.target.value)}
                  placeholder="Ej. UN-004"
                  className={errors.code ? "invalid" : ""}
                />
                {errors.code && <small className="field-error">{errors.code}</small>}
              </label>
              <label>
                Placa
                <input
                  value={form.plate}
                  onChange={(event) => update("plate", event.target.value)}
                  placeholder="Ej. A1B-234"
                  className={errors.plate ? "invalid" : ""}
                />
                {errors.plate && <small className="field-error">{errors.plate}</small>}
              </label>
              <label>
                Marca
                <input
                  value={form.brand}
                  onChange={(event) => update("brand", event.target.value)}
                  placeholder="Ej. Mercedes-Benz"
                  className={errors.brand ? "invalid" : ""}
                />
                {errors.brand && <small className="field-error">{errors.brand}</small>}
              </label>
              <label>
                Modelo
                <input
                  value={form.model}
                  onChange={(event) => update("model", event.target.value)}
                  placeholder="Ej. OF 1721"
                  className={errors.model ? "invalid" : ""}
                />
                {errors.model && <small className="field-error">{errors.model}</small>}
              </label>
              <label>
                Año
                <input
                  type="number"
                  min="1990"
                  max="2030"
                  value={form.year}
                  onChange={(event) => update("year", event.target.value)}
                />
              </label>
              <label>
                Capacidad
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(event) => update("capacity", event.target.value)}
                  placeholder="Ej. 42"
                  className={errors.capacity ? "invalid" : ""}
                />
                {errors.capacity && <small className="field-error">{errors.capacity}</small>}
              </label>
              <label>
                Tipo de unidad
                <select value={form.type} onChange={(event) => update("type", event.target.value)}>
                  <option>Bus de personal</option>
                  <option>Minibús</option>
                  <option>Van</option>
                  <option>Camioneta</option>
                </select>
              </label>
              <label>
                Estado
                <select
                  value={form.status}
                  onChange={(event) => update("status", event.target.value)}
                >
                  <option>Operativa</option>
                  <option>En mantenimiento</option>
                  <option>Inactiva</option>
                </select>
              </label>
              <label className="field-full">
                Observaciones <span className="optional">(opcional)</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  placeholder="Añade información complementaria de la unidad"
                />
              </label>
            </div>
          </section>
          <section className="form-section-card">
            <div className="form-section-head">
              <span>02</span>
              <div>
                <h2>Fotografías</h2>
                <p>Añade una portada y hasta cinco vistas adicionales.</p>
              </div>
            </div>
            <div className="vehicle-photo-uploader">
              <button type="button" onClick={() => photoInput.current?.click()}>
                <Camera size={24} />
                <strong>
                  {photosList.length ? "Añadir más fotografías" : "Seleccionar fotografías"}
                </strong>
                <small>JPG o PNG · Uso local durante esta sesión</small>
              </button>
              <input
                ref={photoInput}
                hidden
                multiple
                type="file"
                accept="image/jpeg,image/png"
                onChange={(event) => addPhotos(event.target.files)}
              />
              {photosList.length > 0 && (
                <div className="vehicle-photo-previews">
                  {photosList.map((photo, index) => (
                    <div key={photo}>
                      <img src={photo} alt={`Vista ${index + 1} de la nueva unidad`} />
                      {index === 0 && <span>Portada</span>}
                      <button
                        type="button"
                        aria-label="Eliminar fotografía"
                        onClick={() =>
                          setPhotosList((previous) => previous.filter((item) => item !== photo))
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
          <section className="form-section-card">
            <div className="form-section-head">
              <span>03</span>
              <div>
                <h2>Plantilla documental</h2>
                <p>Define la estructura inicial del expediente.</p>
              </div>
            </div>
            <div className="template-options">
              {[
                ...unitTemplates.map((item) => ({
                  value: String(item.id),
                  name: item.name,
                  count: item.items.length,
                })),
                { value: "none", name: "Sin plantilla", count: 0 },
              ].map((option) => (
                <label className={template === option.value ? "selected" : ""} key={option.value}>
                  <input
                    type="radio"
                    name="template"
                    checked={template === option.value}
                    onChange={() => setTemplate(option.value)}
                  />
                  <span>
                    <strong>{option.name}</strong>
                    <small>
                      {option.value === "none"
                        ? "Crea únicamente la carpeta principal de la unidad."
                        : `Crea ${option.count} categorías configuradas.`}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            {selectedTemplate && (
              <div className="template-preview">
                <div>
                  <Folder size={18} />
                  <strong>{form.plate.toUpperCase() || "PLACA DE LA UNIDAD"}</strong>
                  <span>{selectedTemplate.items.length} carpetas automáticas</span>
                </div>
                <ul>
                  {selectedTemplate.items.map((category) => (
                    <li key={category}>
                      <Folder size={14} /> {category}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
        <aside className="vehicle-form-aside">
          <h3>Antes de registrar</h3>
          <p>Revisa que la placa y el código sean correctos. Podrás editar el resto después.</p>
          <div>
            <Check size={15} />
            <span>La unidad aparecerá en Mis unidades.</span>
          </div>
          <div>
            <Check size={15} />
            <span>El expediente se añadirá a Mis archivos.</span>
          </div>
          <div>
            <ShieldCheck size={15} />
            <span>Solo se guardan datos durante esta sesión.</span>
          </div>
          <Button type="submit" icon={Bus}>
            Crear unidad
          </Button>
          <Button type="button" variant="secondary" onClick={onBack}>
            Cancelar
          </Button>
        </aside>
      </form>
    </motion.div>
  );
}

function VehicleProfilePage({
  vehicle,
  files,
  onBack,
  onEdit,
  onDossier,
  onUploadDocument,
  onPreview,
  onUpdate,
}: {
  vehicle: Vehicle;
  files: DemoFile[];
  onBack: () => void;
  onEdit: () => void;
  onDossier: () => void;
  onUploadDocument: () => void;
  onPreview: (file: DemoFile) => void;
  onUpdate: (patch: Partial<Vehicle>) => void;
}) {
  const [tab, setTab] = useState("Resumen");
  const photoInput = useRef<HTMLInputElement>(null);
  const documents = files.filter((file) => file.vehicle === vehicle.plate);
  const addPhotos = (selected?: FileList | null) => {
    if (!selected?.length) return;
    const added = Array.from(selected).map((file) => URL.createObjectURL(file));
    onUpdate({ photos: [...vehicle.photos, ...added].slice(0, 8) });
  };
  return (
    <motion.div
      className="page vehicle-profile-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Volver a Mis unidades
      </button>
      <section className="vehicle-hero">
        <img src={vehicle.cover} alt={`Bus ${vehicle.plate}`} />
        <div className="vehicle-hero-overlay" />
        <div className="vehicle-hero-copy">
          <Badge status={vehicle.status} />
          <span>{vehicle.code}</span>
          <h1>{vehicle.plate}</h1>
          <p>
            {vehicle.brand} {vehicle.model} · {vehicle.year}
          </p>
        </div>
        <div className="vehicle-hero-actions">
          <Button variant="secondary" icon={Edit3} onClick={onEdit}>
            Editar
          </Button>
          <Button variant="secondary" icon={Camera} onClick={() => photoInput.current?.click()}>
            Añadir foto
          </Button>
          <Button icon={Upload} onClick={onUploadDocument}>
            Agregar documento
          </Button>
          <input
            ref={photoInput}
            hidden
            multiple
            type="file"
            accept="image/*"
            onChange={(event) => addPhotos(event.target.files)}
          />
        </div>
      </section>
      <div className="profile-tabs" role="tablist">
        {["Resumen", "Documentos", "Fotografías", "Vencimientos", "Historial"].map((item) => (
          <button
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            key={item}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "Resumen" && (
        <div className="profile-grid">
          <section className="card vehicle-data-card">
            <div className="card-head">
              <div>
                <h2>Información de la unidad</h2>
                <p>Datos registrados en el prototipo</p>
              </div>
              <button onClick={onEdit}>
                Editar <Edit3 size={14} />
              </button>
            </div>
            <dl>
              <div>
                <dt>Código interno</dt>
                <dd>{vehicle.code}</dd>
              </div>
              <div>
                <dt>Marca</dt>
                <dd>{vehicle.brand}</dd>
              </div>
              <div>
                <dt>Modelo</dt>
                <dd>{vehicle.model}</dd>
              </div>
              <div>
                <dt>Año</dt>
                <dd>{vehicle.year}</dd>
              </div>
              <div>
                <dt>Capacidad</dt>
                <dd>{vehicle.capacity} pasajeros</dd>
              </div>
              <div>
                <dt>Tipo</dt>
                <dd>{vehicle.type}</dd>
              </div>
            </dl>
            <div className="vehicle-notes">
              <span>Observaciones</span>
              <p>{vehicle.notes || "Sin observaciones registradas."}</p>
            </div>
          </section>
          <aside className="card dossier-access-card">
            <span>
              <Folder size={23} />
            </span>
            <div>
              <small>Expediente documental</small>
              <h2>{vehicle.plate}</h2>
              <p>
                {documents.length} documentos vinculados · {dossierCategories.length} categorías
              </p>
            </div>
            <Button onClick={onDossier}>
              Ver expediente <ArrowRight size={15} />
            </Button>
          </aside>
          <section className="card vehicle-gallery-card">
            <div className="card-head">
              <div>
                <h2>Galería de la unidad</h2>
                <p>{vehicle.photos.length} fotografías en esta sesión</p>
              </div>
              <button onClick={() => setTab("Fotografías")}>
                Ver galería <ArrowRight size={14} />
              </button>
            </div>
            <div className="vehicle-gallery-strip">
              {vehicle.photos.slice(0, 4).map((photo, index) => (
                <button key={photo} onClick={() => onUpdate({ cover: photo })}>
                  <img src={photo} alt={`Vista ${index + 1} de ${vehicle.plate}`} />
                  {photo === vehicle.cover && <span>Portada</span>}
                </button>
              ))}
              {!vehicle.photos.length && (
                <EmptyState
                  icon={Images}
                  title="Sin fotografías"
                  text="Añade imágenes para crear la galería de esta unidad."
                />
              )}
            </div>
          </section>
          <section className="card vehicle-documents-card">
            <div className="card-head">
              <div>
                <h2>Documentos recientes</h2>
                <p>Archivos vinculados a la placa</p>
              </div>
              <button onClick={() => setTab("Documentos")}>
                Ver todos <ArrowRight size={14} />
              </button>
            </div>
            {documents.length ? (
              documents.slice(0, 3).map((file) => (
                <button className="document-row" key={file.id} onClick={() => onPreview(file)}>
                  <FileIcon type={file.type} />
                  <div className="doc-main">
                    <strong>{file.name}</strong>
                    <small>{file.category}</small>
                  </div>
                  <span className="doc-date">{file.modified}</span>
                  {file.status && <Badge status={file.status} />}
                  <ChevronRight size={16} />
                </button>
              ))
            ) : (
              <EmptyState
                icon={File}
                title="Sin documentos"
                text="Agrega el primer archivo al expediente de esta unidad."
                action={
                  <Button icon={Upload} onClick={onUploadDocument}>
                    Agregar documento
                  </Button>
                }
              />
            )}
          </section>
        </div>
      )}
      {tab === "Documentos" && (
        <section className="card profile-tab-card">
          <div className="card-head">
            <div>
              <h2>Documentos de {vehicle.plate}</h2>
              <p>Archivos asociados a esta unidad</p>
            </div>
            <Button icon={Upload} onClick={onUploadDocument}>
              Agregar
            </Button>
          </div>
          {documents.length ? (
            documents.map((file) => (
              <button className="document-row" key={file.id} onClick={() => onPreview(file)}>
                <FileIcon type={file.type} />
                <div className="doc-main">
                  <strong>{file.name}</strong>
                  <small>{file.category}</small>
                </div>
                <span className="doc-date">{file.modified}</span>
                {file.status && <Badge status={file.status} />}
                <ChevronRight size={16} />
              </button>
            ))
          ) : (
            <EmptyState
              icon={File}
              title="Sin documentos asociados"
              text="Los documentos que asocies a esta placa aparecerán aquí."
            />
          )}
        </section>
      )}
      {tab === "Fotografías" && (
        <section className="profile-photo-section">
          <div className="section-title">
            <div>
              <h2>Galería de fotografías</h2>
              <p>Selecciona una imagen para usarla como portada.</p>
            </div>
            <Button icon={Camera} onClick={() => photoInput.current?.click()}>
              Añadir fotografías
            </Button>
          </div>
          <div className="profile-photo-grid">
            {vehicle.photos.map((photo, index) => (
              <article key={photo} className={photo === vehicle.cover ? "cover" : ""}>
                <img src={photo} alt={`Fotografía ${index + 1} de ${vehicle.plate}`} />
                <div>
                  <span>{photo === vehicle.cover ? "Foto principal" : `Vista ${index + 1}`}</span>
                  <button onClick={() => onUpdate({ cover: photo })}>Usar de portada</button>
                </div>
                {vehicle.photos.length > 1 && (
                  <button
                    className="remove-photo"
                    aria-label="Eliminar fotografía"
                    onClick={() =>
                      onUpdate({
                        photos: vehicle.photos.filter((item) => item !== photo),
                        cover:
                          photo === vehicle.cover
                            ? vehicle.photos.find((item) => item !== photo)
                            : vehicle.cover,
                      })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {tab === "Vencimientos" && (
        <section className="card profile-tab-card">
          <div className="card-head">
            <div>
              <h2>Vencimientos documentales</h2>
              <p>Estados calculados con fechas ficticias</p>
            </div>
          </div>
          {documents.filter((file) => file.status === "Vencido" || file.status === "Por vencer")
            .length ? (
            documents
              .filter((file) => file.status === "Vencido" || file.status === "Por vencer")
              .map((file) => (
                <button className="document-row" key={file.id} onClick={() => onPreview(file)}>
                  <FileIcon type={file.type} />
                  <div className="doc-main">
                    <strong>{file.name}</strong>
                    <small>{file.category}</small>
                  </div>
                  <span className="doc-date">{file.modified}</span>
                  {file.status && <Badge status={file.status} />}
                  <ChevronRight size={16} />
                </button>
              ))
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="Sin alertas activas"
              text="No hay documentos vencidos o próximos a vencer para esta unidad."
            />
          )}
        </section>
      )}
      {tab === "Historial" && (
        <section className="card profile-tab-card">
          <div className="timeline vehicle-timeline">
            <div>
              <i>
                <Bus size={14} />
              </i>
              <p>
                <strong>Unidad registrada en el prototipo</strong>
                <span>Sesión actual · {vehicle.code}</span>
              </p>
            </div>
            <div>
              <i>
                <FolderPlus size={14} />
              </i>
              <p>
                <strong>Expediente documental creado</strong>
                <span>{dossierCategories.length} categorías configuradas</span>
              </p>
            </div>
            <div>
              <i>
                <Camera size={14} />
              </i>
              <p>
                <strong>Galería actualizada</strong>
                <span>{vehicle.photos.length} fotografías disponibles</span>
              </p>
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
}

function VehicleDossierPage({
  vehicle,
  folders,
  files,
  onBack,
  onOpenFolder,
  onNewFolder,
  onUpload,
  onPreview,
}: {
  vehicle: Vehicle;
  folders: DemoFolder[];
  files: DemoFile[];
  onBack: () => void;
  onOpenFolder: (id: number) => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onPreview: (file: DemoFile) => void;
}) {
  const categories = folders.filter((folder) => folder.parent === vehicle.folderId);
  const related = files.filter((file) => file.vehicle === vehicle.plate);
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Volver a la ficha
      </button>
      <PageHeader
        eyebrow="Expediente documental"
        title={`Unidad ${vehicle.plate}`}
        description={`Estructura flexible de carpetas para ${vehicle.brand} ${vehicle.model}.`}
        actions={
          <>
            <Button variant="secondary" icon={FolderPlus} onClick={onNewFolder}>
              Nueva categoría
            </Button>
            <Button icon={Upload} onClick={onUpload}>
              Subir documento
            </Button>
          </>
        }
      />
      <div className="dossier-banner">
        <div>
          <span>
            <ShieldCheck size={20} />
          </span>
          <p>
            <strong>Expediente creado</strong>
            <small>Las carpetas son configurables y pueden contener subcarpetas.</small>
          </p>
        </div>
        <dl>
          <div>
            <dt>Categorías</dt>
            <dd>{categories.length}</dd>
          </div>
          <div>
            <dt>Documentos</dt>
            <dd>{related.length}</dd>
          </div>
          <div>
            <dt>Alertas</dt>
            <dd>{related.filter((file) => file.status !== "Vigente").length}</dd>
          </div>
        </dl>
      </div>
      <section className="file-section">
        <div className="section-title">
          <div>
            <h2>Categorías documentales</h2>
            <p>Abre una carpeta para consultar documentos o crear subcarpetas.</p>
          </div>
        </div>
        {categories.length ? (
          <div className="dossier-grid">
            {categories.map((folder) => {
              const folderFiles = files.filter((file) => file.parent === folder.id);
              const warning = folderFiles.find(
                (file) => file.status === "Vencido" || file.status === "Por vencer",
              );
              return (
                <button
                  key={folder.id}
                  className="dossier-folder"
                  onClick={() => onOpenFolder(folder.id)}
                >
                  <span className={`folder-icon folder-${folder.color}`}>
                    <Folder size={23} fill="currentColor" />
                  </span>
                  <div>
                    <strong>{folder.name}</strong>
                    <small>
                      {folderFiles.length} documentos ·{" "}
                      {folders.filter((item) => item.parent === folder.id).length} subcarpetas
                    </small>
                  </div>
                  {warning ? (
                    <Badge status={warning.status || "Por vencer"} />
                  ) : folderFiles.length ? (
                    <span className="dossier-ok">
                      <Check size={13} /> Al día
                    </span>
                  ) : (
                    <span className="dossier-empty">Vacía</span>
                  )}
                  <ChevronRight size={17} />
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Folder}
            title="Expediente sin categorías"
            text="Crea una categoría para comenzar a organizar la documentación."
            action={
              <Button icon={FolderPlus} onClick={onNewFolder}>
                Nueva categoría
              </Button>
            }
          />
        )}
      </section>
      {related.length > 0 && (
        <section className="card dossier-recent">
          <div className="card-head">
            <div>
              <h2>Documentos de la unidad</h2>
              <p>Archivos vinculados recientemente</p>
            </div>
          </div>
          {related.slice(0, 4).map((file) => (
            <button className="document-row" key={file.id} onClick={() => onPreview(file)}>
              <FileIcon type={file.type} />
              <div className="doc-main">
                <strong>{file.name}</strong>
                <small>{file.category}</small>
              </div>
              <span className="doc-date">{file.modified}</span>
              {file.status && <Badge status={file.status} />}
              <ChevronRight size={16} />
            </button>
          ))}
        </section>
      )}
    </motion.div>
  );
}

function EditVehicleModal({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (patch: Partial<Vehicle>) => void;
}) {
  const [form, setForm] = useState(vehicle);
  return (
    <Modal
      title={`Editar ${vehicle.plate}`}
      subtitle="Actualiza los datos de la unidad en esta sesión."
      onClose={onClose}
      wide
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="form-grid">
          <label>
            Código interno
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
            />
          </label>
          <label>
            Placa
            <input
              value={form.plate}
              onChange={(event) => setForm({ ...form, plate: event.target.value.toUpperCase() })}
            />
          </label>
          <label>
            Marca
            <input
              value={form.brand}
              onChange={(event) => setForm({ ...form, brand: event.target.value })}
            />
          </label>
          <label>
            Modelo
            <input
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
            />
          </label>
          <label>
            Año
            <input
              type="number"
              value={form.year}
              onChange={(event) => setForm({ ...form, year: event.target.value })}
            />
          </label>
          <label>
            Capacidad
            <input
              type="number"
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
            />
          </label>
          <label>
            Tipo
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              <option>Bus de personal</option>
              <option>Minibús</option>
              <option>Van</option>
              <option>Camioneta</option>
            </select>
          </label>
          <label>
            Estado
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as Vehicle["status"] })
              }
            >
              <option>Operativa</option>
              <option>En mantenimiento</option>
              <option>Inactiva</option>
            </select>
          </label>
        </div>
        <label>
          Observaciones
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={Save}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DirectoryToolbar({
  query,
  setQuery,
  placeholder,
  filter,
  setFilter,
  options,
}: {
  query: string;
  setQuery: (value: string) => void;
  placeholder: string;
  filter: string;
  setFilter: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="directory-toolbar">
      <label className="inline-search">
        <Search size={17} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <select
        className="select-control"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <Button
        variant="secondary"
        icon={SlidersHorizontal}
        disabled
        title="Filtros avanzados disponibles en una implementación posterior"
      >
        Más filtros
      </Button>
    </div>
  );
}

function WorkersPage({
  workers,
  files,
  onOpen,
  onAdd,
}: {
  workers: Worker[];
  files: DemoFile[];
  onOpen: (worker: Worker) => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const filtered = workers.filter(
    (worker) =>
      (filter === "Todos" || worker.status === filter) &&
      `${worker.name} ${worker.code} ${worker.role}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Equipo operativo"
        title="Trabajadores"
        description="Gestiona expedientes laborales sin exponer información personal innecesaria."
        actions={
          <Button icon={UserPlus} onClick={onAdd}>
            Registrar trabajador
          </Button>
        }
      />
      <div className="module-stats">
        <StatCard
          label="Trabajadores"
          value={String(workers.length)}
          note="Datos ficticios"
          icon={Users}
        />
        <StatCard
          label="Activos"
          value={String(workers.filter((worker) => worker.status === "Activo").length)}
          note="Disponibles para operar"
          icon={Check}
          tone="teal"
        />
        <StatCard
          label="Licencias por vencer"
          value={String(files.filter((file) => file.worker && file.status === "Por vencer").length)}
          note="Próximos 30 días"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Documentos laborales"
          value={String(files.filter((file) => file.worker).length)}
          note="En expedientes"
          icon={Files}
          tone="blue"
        />
      </div>
      <DirectoryToolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar por nombre, cargo o código"
        filter={filter}
        setFilter={setFilter}
        options={["Todos", "Activo", "En descanso", "Inactivo"]}
      />
      {filtered.length ? (
        <div className="worker-grid">
          {filtered.map((worker) => {
            const documents = files.filter((file) => file.worker === worker.name);
            const alerts = documents.filter(
              (file) => file.status === "Por vencer" || file.status === "Vencido",
            ).length;
            return (
              <article className="worker-card" key={worker.id}>
                <div className="worker-card-head">
                  <span className="avatar avatar-large">{worker.initials}</span>
                  <Badge status={worker.status} />
                  <button className="icon-button">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                <h2>{worker.name}</h2>
                <p>{worker.role}</p>
                <span className="worker-code">{worker.code}</span>
                <div className="worker-contact">
                  <span>
                    <Mail size={14} />
                    {worker.email}
                  </span>
                  <span>
                    <Phone size={14} />
                    {worker.phone}
                  </span>
                </div>
                <div className="worker-doc-summary">
                  <div>
                    <strong>{documents.length}</strong>
                    <small>Documentos</small>
                  </div>
                  <div className={alerts ? "alert" : ""}>
                    <strong>{alerts}</strong>
                    <small>Alertas</small>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => onOpen(worker)}>
                  Ver ficha <ArrowRight size={15} />
                </Button>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Sin trabajadores"
          text={
            query
              ? `No encontramos coincidencias para “${query}”.`
              : "Registra al primer trabajador para crear su expediente."
          }
          action={
            !query && (
              <Button icon={UserPlus} onClick={onAdd}>
                Registrar trabajador
              </Button>
            )
          }
        />
      )}
    </motion.div>
  );
}

function WorkerProfilePage({
  worker,
  files,
  folders,
  onBack,
  onPreview,
  onUpload,
  onNewCategory,
}: {
  worker: Worker;
  files: DemoFile[];
  folders: DemoFolder[];
  onBack: () => void;
  onPreview: (file: DemoFile) => void;
  onUpload: () => void;
  onNewCategory: () => void;
}) {
  const [tab, setTab] = useState("Resumen");
  const documents = files.filter((file) => file.worker === worker.name);
  const categories = folders.filter((folder) => folder.parent === worker.folderId);
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Volver a Trabajadores
      </button>
      <section className="worker-profile-header">
        <span className="avatar avatar-xl">{worker.initials}</span>
        <div>
          <Badge status={worker.status} />
          <h1>{worker.name}</h1>
          <p>
            {worker.role} · {worker.code}
          </p>
        </div>
        <div className="worker-profile-actions">
          <Button variant="secondary" icon={FolderPlus} onClick={onNewCategory}>
            Nueva categoría
          </Button>
          <Button icon={Upload} onClick={onUpload}>
            Agregar documento
          </Button>
        </div>
      </section>
      <div className="profile-tabs">
        {["Resumen", "Documentos", "Licencias", "Contratos", "Certificados", "Historial"].map(
          (item) => (
            <button
              className={tab === item ? "active" : ""}
              key={item}
              onClick={() => setTab(item)}
            >
              {item}
            </button>
          ),
        )}
      </div>
      {tab === "Resumen" ? (
        <div className="worker-profile-grid">
          <section className="card worker-info-card">
            <div className="card-head">
              <div>
                <h2>Información básica</h2>
                <p>Datos profesionales de demostración</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>Código</dt>
                <dd>{worker.code}</dd>
              </div>
              <div>
                <dt>Cargo</dt>
                <dd>{worker.role}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{worker.email}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{worker.phone}</dd>
              </div>
            </dl>
            <div className="privacy-callout">
              <ShieldCheck size={17} />
              <p>
                <strong>Privacidad integrada</strong>
                <span>
                  La ficha evita mostrar datos personales que no son necesarios para la gestión
                  documental.
                </span>
              </p>
            </div>
          </section>
          <aside className="card worker-alert-card">
            <span>
              <CalendarClock size={22} />
            </span>
            <h2>Estado documental</h2>
            <strong>
              {
                documents.filter(
                  (file) => file.status === "Por vencer" || file.status === "Vencido",
                ).length
              }
            </strong>
            <p>documentos requieren atención</p>
            <button onClick={() => setTab("Licencias")}>
              Revisar vencimientos <ArrowRight size={14} />
            </button>
          </aside>
          <section className="card worker-categories">
            <div className="card-head">
              <div>
                <h2>Expediente del trabajador</h2>
                <p>Categorías flexibles</p>
              </div>
              <button onClick={onNewCategory}>
                Añadir categoría <Plus size={14} />
              </button>
            </div>
            <div className="worker-category-grid">
              {categories.map((category) => (
                <div key={category.id}>
                  <span className={`folder-icon folder-${category.color}`}>
                    <Folder size={19} />
                  </span>
                  <p>
                    <strong>{category.name}</strong>
                    <small>
                      {files.filter((file) => file.parent === category.id).length} documentos
                    </small>
                  </p>
                  <ChevronRight size={15} />
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : tab === "Historial" ? (
        <section className="card profile-tab-card">
          <div className="timeline vehicle-timeline">
            <div>
              <i>
                <UserRound size={14} />
              </i>
              <p>
                <strong>Ficha laboral creada</strong>
                <span>Registro demostrativo · {worker.code}</span>
              </p>
            </div>
            <div>
              <i>
                <FolderPlus size={14} />
              </i>
              <p>
                <strong>Expediente organizado</strong>
                <span>{categories.length} categorías disponibles</span>
              </p>
            </div>
            <div>
              <i>
                <FileText size={14} />
              </i>
              <p>
                <strong>Documentación revisada</strong>
                <span>{documents.length} archivos vinculados</span>
              </p>
            </div>
          </div>
        </section>
      ) : (
        <DocumentCollection
          title={tab === "Documentos" ? `Documentos de ${worker.name}` : tab}
          files={
            tab === "Documentos" ? documents : documents.filter((file) => file.category === tab)
          }
          onPreview={onPreview}
          onUpload={onUpload}
        />
      )}
    </motion.div>
  );
}

function DocumentCollection({
  title,
  files,
  onPreview,
  onUpload,
}: {
  title: string;
  files: DemoFile[];
  onPreview: (file: DemoFile) => void;
  onUpload: () => void;
}) {
  return (
    <section className="card profile-tab-card">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          <p>Documentos del expediente demostrativo</p>
        </div>
        <Button icon={Upload} onClick={onUpload}>
          Agregar
        </Button>
      </div>
      {files.length ? (
        files.map((file) => (
          <button className="document-row" key={file.id} onClick={() => onPreview(file)}>
            <FileIcon type={file.type} />
            <div className="doc-main">
              <strong>{file.name}</strong>
              <small>{file.category}</small>
            </div>
            <span className="doc-date">{file.expirationDate || file.modified}</span>
            {file.status && <Badge status={file.status} />}
            <ChevronRight size={16} />
          </button>
        ))
      ) : (
        <EmptyState
          icon={File}
          title={`Sin ${title.toLowerCase()}`}
          text="Los documentos que añadas a esta categoría aparecerán aquí."
          action={
            <Button icon={Upload} onClick={onUpload}>
              Agregar documento
            </Button>
          }
        />
      )}
    </section>
  );
}

function WorkerModal({
  templates,
  onClose,
  onCreate,
}: {
  templates: TemplateSetting[];
  onClose: () => void;
  onCreate: (worker: Omit<Worker, "id" | "folderId" | "initials">, categories: string[]) => void;
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    role: "Conductor",
    status: "Activo" as Worker["status"],
    phone: "",
    email: "",
  });
  const workerTemplates = templates.filter((item) => item.kind === "Trabajador" && item.active);
  const [templateId, setTemplateId] = useState(String(workerTemplates[0]?.id || "none"));
  const [error, setError] = useState("");
  return (
    <Modal
      title="Registrar trabajador"
      subtitle="Crea una ficha profesional con datos mínimos."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim() || !form.code.trim())
            return setError("Completa el nombre y el código interno.");
          onCreate(
            form,
            workerTemplates.find((item) => String(item.id) === templateId)?.items || [],
          );
        }}
      >
        <div className="form-grid">
          <label>
            Código interno
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
              placeholder="TR-005"
            />
          </label>
          <label>
            Estado
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as Worker["status"] })
              }
            >
              <option>Activo</option>
              <option>En descanso</option>
              <option>Inactivo</option>
            </select>
          </label>
        </div>
        <label>
          Nombre completo
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Nombre del trabajador"
          />
        </label>
        <label>
          Cargo
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option>Conductor</option>
            <option>Supervisor de ruta</option>
            <option>Coordinador de operaciones</option>
            <option>Asistente administrativo</option>
          </select>
        </label>
        <label>
          Plantilla documental
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            {workerTemplates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.items.length} categorías
              </option>
            ))}
            <option value="none">Sin plantilla</option>
          </select>
        </label>
        <div className="form-grid">
          <label>
            Teléfono
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+51 900 000 000"
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="correo@demo.pe"
            />
          </label>
        </div>
        {error && (
          <p className="form-note error">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={UserPlus}>
            Registrar trabajador
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function BusinessPage({
  mode,
  records,
  files,
  onAdd,
  onOpenFolder,
  onEdit,
}: {
  mode: "supplier" | "company";
  records: BusinessRecord[];
  files: DemoFile[];
  onAdd: () => void;
  onOpenFolder: (id: number) => void;
  onEdit: (record: BusinessRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const label = mode === "supplier" ? "Proveedores" : "Empresas contratantes";
  const filtered = records.filter(
    (record) =>
      (filter === "Todos" || record.kind === filter) &&
      `${record.name} ${record.legalName} ${record.contact}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const kinds = ["Todos", ...Array.from(new Set(records.map((record) => record.kind)))];
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow={mode === "supplier" ? "Red de servicios" : "Cartera empresarial"}
        title={label}
        description={
          mode === "supplier"
            ? "Centraliza contratos, facturas y documentos de tus proveedores."
            : "Organiza contratos, servicios y auditorías por empresa solicitante."
        }
        actions={
          <Button icon={Plus} onClick={onAdd}>
            Registrar {mode === "supplier" ? "proveedor" : "empresa"}
          </Button>
        }
      />
      <DirectoryToolbar
        query={query}
        setQuery={setQuery}
        placeholder={`Buscar ${label.toLowerCase()}`}
        filter={filter}
        setFilter={setFilter}
        options={kinds}
      />
      <div className="business-layout">
        <div className="business-table card">
          <div className="business-table-head">
            <span>Organización</span>
            <span>Tipo</span>
            <span>Contacto</span>
            <span>Documentos</span>
            <span>Actualización</span>
            <span />
          </div>
          {filtered.length ? (
            filtered.map((record) => {
              const docs = files.filter((file) =>
                mode === "supplier"
                  ? file.supplier === record.name
                  : file.company?.includes(record.name),
              );
              return (
                <button
                  className={selected?.id === record.id ? "selected" : ""}
                  key={record.id}
                  onClick={() => setSelected(record)}
                >
                  <span className="business-name">
                    <i>{record.name.slice(0, 2).toUpperCase()}</i>
                    <span>
                      <strong>{record.name}</strong>
                      <small>{record.legalName}</small>
                    </span>
                  </span>
                  <span>
                    <b className="category-tag">{record.kind}</b>
                  </span>
                  <span>
                    <strong>{record.contact}</strong>
                    <small>{record.email}</small>
                  </span>
                  <span>{docs.length} archivos</span>
                  <span>{record.updated}</span>
                  <ChevronRight size={16} />
                </button>
              );
            })
          ) : (
            <EmptyState
              icon={Building2}
              title="Sin resultados"
              text={`No encontramos ${label.toLowerCase()} con esos filtros.`}
            />
          )}
        </div>
        {selected && (
          <aside className="business-detail card">
            <div className="business-detail-head">
              <span>{selected.name.slice(0, 2).toUpperCase()}</span>
              <button className="icon-button" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>
            <span className="eyebrow">{selected.kind}</span>
            <h2>{selected.name}</h2>
            <p>{selected.legalName}</p>
            <dl>
              <div>
                <dt>Contacto</dt>
                <dd>{selected.contact}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{selected.phone}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{selected.email}</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd>{selected.updated}</dd>
              </div>
            </dl>
            <div className="business-detail-stats">
              <div>
                <strong>
                  {
                    files.filter((file) =>
                      mode === "supplier"
                        ? file.supplier === selected.name
                        : file.company?.includes(selected.name),
                    ).length
                  }
                </strong>
                <small>Documentos</small>
              </div>
              <div>
                <strong>{mode === "supplier" ? "2" : "1"}</strong>
                <small>{mode === "supplier" ? "Facturas" : "Contratos"}</small>
              </div>
            </div>
            <Button icon={Folder} onClick={() => onOpenFolder(selected.folderId)}>
              Abrir carpeta
            </Button>
            <Button variant="secondary" icon={Edit3} onClick={() => onEdit(selected)}>
              Editar información
            </Button>
          </aside>
        )}
      </div>
    </motion.div>
  );
}

function BusinessModal({
  mode,
  initial,
  onClose,
  onCreate,
}: {
  mode: "supplier" | "company";
  initial?: BusinessRecord | null;
  onClose: () => void;
  onCreate: (record: Omit<BusinessRecord, "id" | "updated" | "folderId">) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    legalName: initial?.legalName || "",
    kind: initial?.kind || (mode === "supplier" ? "Mantenimiento" : "Minería"),
    contact: initial?.contact || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
  });
  return (
    <Modal
      title={`${initial ? "Editar" : "Registrar"} ${mode === "supplier" ? "proveedor" : "empresa"}`}
      subtitle="Los datos se conservarán solo durante esta sesión."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.name.trim()) onCreate(form);
        }}
      >
        <label>
          Nombre comercial
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Razón social
          <input
            required
            value={form.legalName}
            onChange={(event) => setForm({ ...form, legalName: event.target.value })}
          />
        </label>
        <label>
          Tipo
          <select
            value={form.kind}
            onChange={(event) => setForm({ ...form, kind: event.target.value })}
          >
            {(mode === "supplier"
              ? ["Mantenimiento", "Repuestos", "Seguros", "Combustible", "Otros"]
              : ["Minería", "Agroindustria", "Construcción", "Servicios", "Otros"]
            ).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Persona de contacto
          <input
            value={form.contact}
            onChange={(event) => setForm({ ...form, contact: event.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Teléfono
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={Save}>
            {initial ? "Guardar cambios" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ManifestsPage({
  manifests,
  vehicles,
  companies,
  onAdd,
}: {
  manifests: ManifestRecord[];
  vehicles: Vehicle[];
  companies: BusinessRecord[];
  onAdd: () => void;
}) {
  const [query, setQuery] = useState("");
  const [vehicle, setVehicle] = useState("Todas");
  const [selected, setSelected] = useState<ManifestRecord | null>(null);
  const filtered = manifests.filter(
    (item) =>
      (vehicle === "Todas" || item.vehicle === vehicle) &&
      `${item.number} ${item.company} ${item.service}`.toLowerCase().includes(query.toLowerCase()),
  );
  const groups = Array.from(new Set(filtered.map((item) => item.date)));
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Operación documental"
        title="Manifiestos"
        description="Consulta archivos de servicio agrupados cronológicamente, sin datos reales de pasajeros."
        actions={
          <Button icon={Upload} onClick={onAdd}>
            Subir manifiesto
          </Button>
        }
      />
      <div className="manifest-warning">
        <ShieldCheck size={17} />
        <p>
          <strong>Privacidad del prototipo</strong>
          <span>
            Los manifiestos son ejemplos y no contienen nombres ni información real de pasajeros.
          </span>
        </p>
      </div>
      <DirectoryToolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar número, empresa o servicio"
        filter={vehicle}
        setFilter={setVehicle}
        options={["Todas", ...vehicles.map((item) => item.plate)]}
      />
      {groups.length ? (
        <div className="manifest-groups">
          {groups.map((date) => (
            <section key={date}>
              <div className="manifest-date">
                <CalendarClock size={16} />
                <span>
                  <strong>
                    {new Date(`${date}T12:00:00`).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  <small>{filtered.filter((item) => item.date === date).length} manifiestos</small>
                </span>
              </div>
              <div className="manifest-list card">
                {filtered
                  .filter((item) => item.date === date)
                  .map((item) => (
                    <article key={item.id}>
                      <FileIcon type="pdf" />
                      <div>
                        <strong>{item.number}</strong>
                        <small>{item.fileName}</small>
                      </div>
                      <span>
                        <Bus size={14} />
                        {item.vehicle}
                      </span>
                      <span>
                        <Building2 size={14} />
                        {item.company}
                      </span>
                      <span>{item.service}</span>
                      <button
                        className="icon-button"
                        aria-label={`Ver ${item.number}`}
                        onClick={() => setSelected(item)}
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Descarga no disponible"
                        disabled
                        title="Descarga pendiente de backend"
                      >
                        <Download size={17} />
                      </button>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Files}
          title="Sin manifiestos"
          text="No encontramos manifiestos para los filtros seleccionados."
          action={
            <Button icon={Upload} onClick={onAdd}>
              Subir manifiesto
            </Button>
          }
        />
      )}
      <AnimatePresence>
        {selected && (
          <Modal
            title={selected.number}
            subtitle="Detalle del manifiesto demostrativo"
            onClose={() => setSelected(null)}
          >
            <div className="invoice-detail">
              <span className="invoice-detail-icon">
                <Files size={24} />
              </span>
              <h3>{selected.fileName}</h3>
              <dl>
                <div>
                  <dt>Fecha</dt>
                  <dd>{new Date(`${selected.date}T12:00:00`).toLocaleDateString("es-PE")}</dd>
                </div>
                <div>
                  <dt>Unidad</dt>
                  <dd>{selected.vehicle}</dd>
                </div>
                <div>
                  <dt>Empresa</dt>
                  <dd>{selected.company}</dd>
                </div>
                <div>
                  <dt>Servicio</dt>
                  <dd>{selected.service}</dd>
                </div>
                <div>
                  <dt>Periodo</dt>
                  <dd>{selected.period}</dd>
                </div>
              </dl>
              <div className="prototype-note">
                <ShieldCheck size={14} />
                <span>No contiene información real de pasajeros.</span>
              </div>
              <div className="modal-actions">
                <Button onClick={() => setSelected(null)}>Cerrar</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ManifestModal({
  vehicles,
  companies,
  onClose,
  onCreate,
}: {
  vehicles: Vehicle[];
  companies: BusinessRecord[];
  onClose: () => void;
  onCreate: (record: Omit<ManifestRecord, "id">) => void;
}) {
  const [form, setForm] = useState({
    number: "",
    date: "2025-06-20",
    vehicle: vehicles[0]?.plate || "",
    company: companies[0]?.name || "",
    service: "Traslado de personal",
    period: "Junio 2025",
    fileName: "",
  });
  return (
    <Modal
      title="Registrar manifiesto"
      subtitle="Asocia un archivo demostrativo a una unidad y servicio."
      onClose={onClose}
      wide
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.number) onCreate({ ...form, fileName: form.fileName || `${form.number}.pdf` });
        }}
      >
        <div className="form-grid">
          <label>
            Número
            <input
              required
              value={form.number}
              onChange={(event) => setForm({ ...form, number: event.target.value.toUpperCase() })}
              placeholder="MAN-2025-0620"
            />
          </label>
          <label>
            Fecha
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </label>
          <label>
            Unidad
            <select
              value={form.vehicle}
              onChange={(event) => setForm({ ...form, vehicle: event.target.value })}
            >
              {vehicles.map((item) => (
                <option key={item.id}>{item.plate}</option>
              ))}
            </select>
          </label>
          <label>
            Empresa
            <select
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
            >
              {companies.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Servicio
            <input
              value={form.service}
              onChange={(event) => setForm({ ...form, service: event.target.value })}
            />
          </label>
          <label>
            Periodo
            <input
              value={form.period}
              onChange={(event) => setForm({ ...form, period: event.target.value })}
            />
          </label>
        </div>
        <label>
          Archivo demostrativo
          <input
            type="file"
            accept=".pdf,.xlsx,.docx"
            onChange={(event) =>
              setForm({ ...form, fileName: event.target.files?.[0]?.name || "" })
            }
          />
        </label>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={Save}>
            Guardar manifiesto
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function InvoicesPage({ invoices, onAdd }: { invoices: InvoiceRecord[]; onAdd: () => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<InvoiceRecord | null>(null);
  const filtered = invoices.filter(
    (item) =>
      (filter === "Todos" || item.status === filter) &&
      `${item.number} ${item.company}`.toLowerCase().includes(query.toLowerCase()),
  );
  const totalPen = invoices
    .filter((item) => item.currency === "PEN")
    .reduce((sum, item) => sum + item.amount, 0);
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Gestión documental"
        title="Facturas"
        description="Consulta comprobantes y archivos asociados. No implementa facturación electrónica."
        actions={
          <Button icon={Plus} onClick={onAdd}>
            Registrar factura
          </Button>
        }
      />
      <div className="module-stats invoice-stats">
        <StatCard
          label="Facturas registradas"
          value={String(invoices.length)}
          note="Datos de demostración"
          icon={ReceiptText}
        />
        <StatCard
          label="Importe en soles"
          value={`S/ ${totalPen.toLocaleString("es-PE")}`}
          note="Resumen demostrativo"
          icon={CreditCard}
          tone="blue"
        />
        <StatCard
          label="Pendientes"
          value={String(invoices.filter((item) => item.status === "Pendiente").length)}
          note="Por revisar"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Vencidas"
          value={String(invoices.filter((item) => item.status === "Vencida").length)}
          note="Requieren atención"
          icon={AlertCircle}
          tone="red"
        />
      </div>
      <DirectoryToolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar número o empresa"
        filter={filter}
        setFilter={setFilter}
        options={["Todos", "Pagada", "Pendiente", "Vencida"]}
      />
      <div className="invoice-table card">
        <div className="invoice-table-head">
          <span>Número</span>
          <span>Empresa</span>
          <span>Fecha</span>
          <span>Importe</span>
          <span>Archivo</span>
          <span>Estado</span>
          <span />
        </div>
        {filtered.map((item) => (
          <article key={item.id} onClick={() => setSelected(item)}>
            <strong>{item.number}</strong>
            <span>{item.company}</span>
            <span>{new Date(`${item.date}T12:00:00`).toLocaleDateString("es-PE")}</span>
            <strong>
              {item.currency === "PEN" ? "S/" : "US$"}{" "}
              {item.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </strong>
            <span className="invoice-file">
              <FileIcon type="pdf" />
              <small>{item.fileName}</small>
            </span>
            <Badge status={item.status} />
            <button
              className="icon-button"
              onClick={(event) => {
                event.stopPropagation();
                setSelected(item);
              }}
            >
              <MoreHorizontal size={18} />
            </button>
          </article>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <Modal
            title={`Factura ${selected.number}`}
            subtitle="Detalle documental de demostración."
            onClose={() => setSelected(null)}
          >
            <div className="invoice-detail">
              <span className="invoice-detail-icon">
                <ReceiptText size={25} />
              </span>
              <Badge status={selected.status} />
              <h3>{selected.company}</h3>
              <dl>
                <div>
                  <dt>Fecha</dt>
                  <dd>{new Date(`${selected.date}T12:00:00`).toLocaleDateString("es-PE")}</dd>
                </div>
                <div>
                  <dt>Importe</dt>
                  <dd>
                    {selected.currency === "PEN" ? "S/" : "US$"}{" "}
                    {selected.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </dd>
                </div>
                <div>
                  <dt>Moneda</dt>
                  <dd>{selected.currency}</dd>
                </div>
                <div>
                  <dt>Archivo</dt>
                  <dd>{selected.fileName}</dd>
                </div>
              </dl>
              <div className="prototype-note">
                <Sparkles size={14} />
                <span>Consulta demostrativa. No existe conexión con facturación electrónica.</span>
              </div>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setSelected(null)}>
                  Cerrar
                </Button>
                <Button icon={Download} disabled title="Descarga pendiente de backend">
                  Descarga no disponible
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function InvoiceModal({
  companies,
  onClose,
  onCreate,
}: {
  companies: BusinessRecord[];
  onClose: () => void;
  onCreate: (record: Omit<InvoiceRecord, "id">) => void;
}) {
  const [form, setForm] = useState({
    number: "",
    company: companies[0]?.legalName || "",
    date: "2025-06-20",
    amount: "",
    currency: "PEN" as InvoiceRecord["currency"],
    status: "Pendiente" as InvoiceRecord["status"],
    fileName: "",
  });
  return (
    <Modal
      title="Registrar factura"
      subtitle="Registro documental de demostración, sin emisión electrónica."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.number && form.amount)
            onCreate({
              ...form,
              amount: Number(form.amount),
              fileName: form.fileName || `${form.number}.pdf`,
            });
        }}
      >
        <label>
          Número de factura
          <input
            required
            value={form.number}
            onChange={(event) => setForm({ ...form, number: event.target.value.toUpperCase() })}
            placeholder="F001-00484"
          />
        </label>
        <label>
          Empresa
          <select
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
          >
            {companies.map((item) => (
              <option key={item.id}>{item.legalName}</option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Fecha
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </label>
          <label>
            Estado
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as InvoiceRecord["status"] })
              }
            >
              <option>Pagada</option>
              <option>Pendiente</option>
              <option>Vencida</option>
            </select>
          </label>
          <label>
            Moneda
            <select
              value={form.currency}
              onChange={(event) =>
                setForm({ ...form, currency: event.target.value as InvoiceRecord["currency"] })
              }
            >
              <option>PEN</option>
              <option>USD</option>
            </select>
          </label>
          <label>
            Importe
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </label>
        </div>
        <label>
          Archivo
          <input
            type="file"
            accept=".pdf,.xml"
            onChange={(event) =>
              setForm({ ...form, fileName: event.target.files?.[0]?.name || "" })
            }
          />
        </label>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={Save}>
            Guardar factura
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const demoToday = new Date("2025-06-20T12:00:00");
function daysUntil(date?: string) {
  if (!date) return null;
  return Math.ceil((new Date(`${date}T12:00:00`).getTime() - demoToday.getTime()) / 86400000);
}

function ExpirationsPage({
  files,
  onPreview,
}: {
  files: DemoFile[];
  onPreview: (file: DemoFile) => void;
}) {
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const expiring = files.filter((file) => file.expirationDate);
  const statusFor = (file: DemoFile) => {
    const days = daysUntil(file.expirationDate);
    return days === null
      ? "Sin fecha"
      : days < 0
        ? "Vencido"
        : days <= 30
          ? "Por vencer"
          : "Vigente";
  };
  const candidates =
    filter === "Sin fecha" ? files.filter((file) => !file.expirationDate) : expiring;
  const filtered = candidates.filter(
    (file) =>
      (filter === "Todos" || statusFor(file) === filter) &&
      `${file.name} ${file.category} ${file.vehicle} ${file.worker}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Control documental"
        title="Centro de vencimientos"
        description="Estados calculados con fechas coherentes para la demostración del 20 de junio de 2025."
        actions={
          <Button
            variant="secondary"
            icon={Settings}
            onClick={() =>
              document
                .querySelector(".expiration-settings")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            Configurar alertas
          </Button>
        }
      />
      <div className="expiration-indicators">
        {["Vigente", "Por vencer", "Vencido", "Sin fecha"].map((status) => (
          <button
            className={filter === status ? "active" : ""}
            key={status}
            onClick={() => setFilter(filter === status ? "Todos" : status)}
          >
            <span
              className={`expiration-dot expiration-${status.toLowerCase().replace(/ /g, "-")}`}
            />
            <div>
              <strong>
                {status === "Sin fecha"
                  ? files.filter((file) => !file.expirationDate).length
                  : expiring.filter((file) => statusFor(file) === status).length}
              </strong>
              <small>{status}</small>
            </div>
          </button>
        ))}
      </div>
      <div className="expiration-layout">
        <section>
          <DirectoryToolbar
            query={query}
            setQuery={setQuery}
            placeholder="Buscar documento, unidad o trabajador"
            filter={filter}
            setFilter={setFilter}
            options={["Todos", "Vigente", "Por vencer", "Vencido", "Sin fecha"]}
          />
          <div className="expiration-table card">
            <div className="expiration-table-head">
              <span>Documento</span>
              <span>Relacionado con</span>
              <span>Categoría</span>
              <span>Fecha</span>
              <span>Días</span>
              <span>Estado</span>
              <span />
            </div>
            {filtered.length ? (
              filtered.map((file) => {
                const days = daysUntil(file.expirationDate);
                const status = statusFor(file);
                return (
                  <button key={file.id} onClick={() => onPreview(file)}>
                    <span className="expiration-doc">
                      <FileIcon type={file.type} />
                      <span>
                        <strong>{file.name}</strong>
                        <small>{file.size}</small>
                      </span>
                    </span>
                    <span>{file.vehicle || file.worker || file.company || "General"}</span>
                    <span>{file.category}</span>
                    <span>
                      {file.expirationDate
                        ? new Date(`${file.expirationDate}T12:00:00`).toLocaleDateString("es-PE")
                        : "Sin fecha"}
                    </span>
                    <strong
                      className={
                        days === null ? "" : days < 0 ? "negative" : days <= 30 ? "soon" : ""
                      }
                    >
                      {days === null
                        ? "Sin fecha"
                        : days < 0
                          ? `${Math.abs(days)} vencido`
                          : `${days} días`}
                    </strong>
                    <Badge status={status} />
                    <ChevronRight size={16} />
                  </button>
                );
              })
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="Sin vencimientos"
                text="No hay documentos que coincidan con los filtros seleccionados."
              />
            )}
          </div>
        </section>
        <aside className="expiration-settings card">
          <span>
            <Bell size={21} />
          </span>
          <h2>Alertas configurables</h2>
          <p>Define cuándo deseas recibir avisos en una futura implementación.</p>
          {[30, 15, 7, 1].map((days) => (
            <label key={days}>
              <span>
                <strong>
                  {days} {days === 1 ? "día" : "días"} antes
                </strong>
                <small>Aviso visual en el sistema</small>
              </span>
              <input type="checkbox" defaultChecked={days !== 1} />
            </label>
          ))}
          <div className="prototype-note">
            <Sparkles size={14} />
            <span>Estos controles son demostrativos. No se envían notificaciones reales.</span>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

function normalizeAuditText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function fileMatchesRequirement(file: DemoFile, requirement: AuditRequirement) {
  const haystack = normalizeAuditText(`${file.category} ${file.name}`);
  const aliases: Record<string, string[]> = {
    soat: ["soat"],
    str: ["str"],
    polizas: ["poliza"],
    gps: ["gps"],
    revision: ["revision tecnica", "revision"],
    certificados: ["certificado"],
    permisos: ["permiso"],
    contratos: ["contrato"],
    otros: ["otros", "general"],
  };
  return (aliases[requirement.id] || [normalizeAuditText(requirement.label)]).some((term) =>
    haystack.includes(term),
  );
}

function documentAuditStatus(
  file: DemoFile,
  requirement: AuditRequirement,
): AuditEvidence["status"] {
  if (requirement.custom) return "Pendiente de revisión";
  if (!file.expirationDate) return "Sin fecha de vencimiento";
  return daysUntil(file.expirationDate)! < 0 ? "Vencido" : "Disponible";
}

function evaluateAudit(
  audit: AuditRecord,
  files: DemoFile[],
  vehicles: Vehicle[],
  workers: Worker[],
  companies: BusinessRecord[],
  manifests: ManifestRecord[],
  invoices: InvoiceRecord[],
) {
  const company = companies.find((item) => item.id === audit.companyId);
  const selectedVehicles = vehicles.filter((item) => audit.vehicleIds.includes(item.id));
  const selectedWorkers = workers.filter((item) => audit.workerIds.includes(item.id));
  const results: AuditEvidence[] = [];

  audit.requirements.forEach((requirement) => {
    if (requirement.scope === "Unidad") {
      const targets = selectedVehicles.length ? selectedVehicles : [null];
      targets.forEach((vehicle) => {
        const target = vehicle?.plate || "Sin unidad seleccionada";
        const found = vehicle
          ? files.find(
              (file) => file.vehicle === vehicle.plate && fileMatchesRequirement(file, requirement),
            )
          : undefined;
        results.push({
          id: `${requirement.id}-vehicle-${vehicle?.id || "none"}`,
          requirementId: requirement.id,
          requirement: requirement.label,
          scope: requirement.scope,
          target,
          status: found ? documentAuditStatus(found, requirement) : "Faltante",
          name: found?.name,
          expirationDate: found?.expirationDate,
          version: found ? "1.0 · Actual" : undefined,
          file: found,
          source: found ? "Documento" : undefined,
        });
      });
      return;
    }

    if (requirement.scope === "Trabajador") {
      const targets = selectedWorkers.length ? selectedWorkers : [null];
      targets.forEach((worker) => {
        const found = worker
          ? files.find((file) => {
              if (file.worker !== worker.name) return false;
              return requirement.id === "trabajadores" || fileMatchesRequirement(file, requirement);
            })
          : undefined;
        results.push({
          id: `${requirement.id}-worker-${worker?.id || "none"}`,
          requirementId: requirement.id,
          requirement: requirement.label,
          scope: requirement.scope,
          target: worker?.name || "Sin trabajador seleccionado",
          status: found ? documentAuditStatus(found, requirement) : "Faltante",
          name: found?.name,
          expirationDate: found?.expirationDate,
          version: found ? "1.0 · Actual" : undefined,
          file: found,
          source: found ? "Documento" : undefined,
        });
      });
      return;
    }

    if (requirement.id === "manifiestos") {
      const targets = selectedVehicles.length ? selectedVehicles : [null];
      targets.forEach((vehicle) => {
        const found = manifests.find(
          (manifest) =>
            (!vehicle || manifest.vehicle === vehicle.plate) &&
            (!company ||
              normalizeAuditText(manifest.company).includes(normalizeAuditText(company.name))) &&
            normalizeAuditText(manifest.period) === normalizeAuditText(audit.period),
        );
        results.push({
          id: `${requirement.id}-period-${vehicle?.id || "general"}`,
          requirementId: requirement.id,
          requirement: requirement.label,
          scope: requirement.scope,
          target: `${vehicle?.plate || "General"} · ${audit.period}`,
          status: found ? "Sin fecha de vencimiento" : "Faltante",
          name: found?.fileName,
          version: found ? "1.0 · Actual" : undefined,
          source: found ? "Manifiesto" : undefined,
        });
      });
      return;
    }

    if (requirement.id === "facturas") {
      const found = invoices.find(
        (invoice) =>
          !company ||
          normalizeAuditText(invoice.company).includes(normalizeAuditText(company.name)) ||
          normalizeAuditText(company.legalName).includes(normalizeAuditText(invoice.company)),
      );
      results.push({
        id: `${requirement.id}-company-${company?.id || "none"}`,
        requirementId: requirement.id,
        requirement: requirement.label,
        scope: requirement.scope,
        target: company?.name || "Sin empresa seleccionada",
        status: found
          ? found.status === "Vencida"
            ? "Vencido"
            : "Sin fecha de vencimiento"
          : "Faltante",
        name: found?.fileName,
        version: found ? "1.0 · Actual" : undefined,
        source: found ? "Factura" : undefined,
      });
      return;
    }

    const found = files.find(
      (file) =>
        (!company ||
          !file.company ||
          normalizeAuditText(file.company).includes(normalizeAuditText(company.name))) &&
        fileMatchesRequirement(file, requirement),
    );
    results.push({
      id: `${requirement.id}-company-${company?.id || "none"}`,
      requirementId: requirement.id,
      requirement: requirement.label,
      scope: requirement.scope,
      target: company?.name || audit.period,
      status: found ? documentAuditStatus(found, requirement) : "Faltante",
      name: found?.name,
      expirationDate: found?.expirationDate,
      version: found ? "1.0 · Actual" : undefined,
      file: found,
      source: found ? "Documento" : undefined,
    });
  });

  return results;
}

function auditMetrics(evidence: AuditEvidence[], reviewed: string[] = []) {
  const ready = evidence.filter(
    (item) =>
      item.status === "Disponible" ||
      item.status === "Sin fecha de vencimiento" ||
      (item.status === "Pendiente de revisión" && reviewed.includes(item.id)),
  ).length;
  const missing = evidence.filter((item) => item.status === "Faltante").length;
  const expired = evidence.filter((item) => item.status === "Vencido").length;
  return {
    ready,
    missing,
    expired,
    total: evidence.length,
    progress: evidence.length ? Math.round((ready / evidence.length) * 100) : 0,
  };
}

function AuditEvidenceBadge({ status }: { status: AuditEvidence["status"] }) {
  const icon =
    status === "Disponible" ? (
      <CheckCircle2 size={13} />
    ) : status === "Faltante" || status === "Vencido" ? (
      <XCircle size={13} />
    ) : (
      <Clock3 size={13} />
    );
  return (
    <span
      className={`audit-evidence-badge evidence-${normalizeAuditText(status).replace(/ /g, "-")}`}
    >
      {icon}
      {status}
    </span>
  );
}

function AuditCenterPage({
  audits,
  files,
  vehicles,
  workers,
  companies,
  manifests,
  invoices,
  onNew,
  onOpen,
  onDuplicate,
  onPackage,
}: {
  audits: AuditRecord[];
  files: DemoFile[];
  vehicles: Vehicle[];
  workers: Worker[];
  companies: BusinessRecord[];
  manifests: ManifestRecord[];
  invoices: InvoiceRecord[];
  onNew: () => void;
  onOpen: (audit: AuditRecord) => void;
  onDuplicate: (audit: AuditRecord) => void;
  onPackage: (audit: AuditRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todas");
  const evidenceByAudit = audits.map((audit) => ({
    audit,
    evidence: evaluateAudit(audit, files, vehicles, workers, companies, manifests, invoices),
  }));
  const missingTotal = evidenceByAudit.reduce(
    (total, item) => total + auditMetrics(item.evidence, item.audit.manuallyReviewed).missing,
    0,
  );
  const filtered = evidenceByAudit.filter(
    ({ audit }) =>
      (filter === "Todas" || audit.status === filter) &&
      `${audit.name} ${companies.find((company) => company.id === audit.companyId)?.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Preparación documental"
        title="Centro de Auditorías"
        description="Reúne requisitos, detecta faltantes y prepara cada entrega desde un solo lugar."
        actions={
          <Button icon={Plus} onClick={onNew}>
            Nueva auditoría
          </Button>
        }
      />
      <div className="audit-stats">
        <StatCard
          label="Auditorías activas"
          value={String(audits.filter((item) => item.status === "Activa").length)}
          note="En preparación"
          icon={BookOpenCheck}
        />
        <StatCard
          label="Pendientes"
          value={String(
            audits.filter((item) => item.status === "Pendiente" || item.status === "Borrador")
              .length,
          )}
          note="Requieren revisión"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Completadas"
          value={String(audits.filter((item) => item.status === "Completada").length)}
          note="Historial local"
          icon={CheckCircle2}
          tone="teal"
        />
        <StatCard
          label="Próximas a vencer"
          value={String(
            audits.filter((item) => {
              const days = daysUntil(item.deadline);
              return item.status !== "Completada" && days !== null && days >= 0 && days <= 15;
            }).length,
          )}
          note="En los próximos 15 días"
          icon={CalendarClock}
          tone="amber"
        />
        <StatCard
          label="Documentos faltantes"
          value={String(missingTotal)}
          note="Según requisitos reales"
          icon={AlertCircle}
          tone="red"
        />
      </div>
      <DirectoryToolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar auditoría o empresa"
        filter={filter}
        setFilter={setFilter}
        options={["Todas", "Activa", "Pendiente", "Borrador", "Completada"]}
      />
      {filtered.length ? (
        <div className="audit-table card">
          <div className="audit-table-head">
            <span>Auditoría</span>
            <span>Empresa</span>
            <span>Fecha límite</span>
            <span>Estado</span>
            <span>Unidades</span>
            <span>Progreso</span>
            <span />
          </div>
          {filtered.map(({ audit, evidence }) => {
            const metrics = auditMetrics(evidence, audit.manuallyReviewed);
            const company = companies.find((item) => item.id === audit.companyId);
            return (
              <article key={audit.id} onClick={() => onOpen(audit)}>
                <div className="audit-name">
                  <span>
                    <BookOpenCheck size={17} />
                  </span>
                  <div>
                    <strong>{audit.name}</strong>
                    <small>
                      Solicitada{" "}
                      {new Date(`${audit.requestDate}T12:00:00`).toLocaleDateString("es-PE")} ·{" "}
                      {audit.requirements.length} requisitos
                    </small>
                  </div>
                </div>
                <span>{company?.name || "Sin empresa"}</span>
                <span
                  className={
                    daysUntil(audit.deadline) !== null && daysUntil(audit.deadline)! < 0
                      ? "deadline-expired"
                      : ""
                  }
                >
                  {new Date(`${audit.deadline}T12:00:00`).toLocaleDateString("es-PE")}
                </span>
                <Badge status={audit.status} />
                <span>{audit.vehicleIds.length} unidades</span>
                <div className="audit-progress">
                  <div>
                    <i style={{ width: `${metrics.progress}%` }} />
                  </div>
                  <span>
                    {metrics.ready}/{metrics.total} listos
                  </span>
                </div>
                <div className="audit-row-actions">
                  <button
                    title="Duplicar"
                    aria-label={`Duplicar ${audit.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDuplicate(audit);
                    }}
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    title="Preparar paquete"
                    aria-label={`Preparar paquete de ${audit.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onPackage(audit);
                    }}
                  >
                    <Package size={15} />
                  </button>
                  <ChevronRight size={16} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpenCheck}
          title="Sin auditorías"
          text="No hay auditorías que coincidan con la búsqueda."
          action={
            <Button icon={Plus} onClick={onNew}>
              Nueva auditoría
            </Button>
          }
        />
      )}
      <div className="audit-history-note">
        <Clock3 size={16} />
        <div>
          <strong>Historial demostrativo incluido</strong>
          <p>
            Las auditorías completadas permanecen disponibles para consulta, duplicación y revisión
            durante esta sesión.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

const auditStepLabels = [
  "Información general",
  "Seleccionar unidades",
  "Seleccionar trabajadores",
  "Requisitos documentales",
  "Verificación",
  "Resumen",
];

function AuditWizard({
  initial,
  files,
  vehicles,
  workers,
  companies,
  manifests,
  invoices,
  templates,
  onCancel,
  onSave,
  onPreview,
}: {
  initial?: AuditRecord | null;
  files: DemoFile[];
  vehicles: Vehicle[];
  workers: Worker[];
  companies: BusinessRecord[];
  manifests: ManifestRecord[];
  invoices: InvoiceRecord[];
  templates: TemplateSetting[];
  onCancel: () => void;
  onSave: (audit: AuditRecord, preparePackage: boolean) => void;
  onPreview: (evidence: AuditEvidence) => void;
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [workerQuery, setWorkerQuery] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customScope, setCustomScope] = useState<RequirementScope>("Empresa");
  const [draft, setDraft] = useState<AuditRecord>(
    initial || {
      id: Date.now(),
      name: "",
      companyId: companies[0]?.id || 0,
      requestDate: "2025-06-20",
      deadline: "2025-07-05",
      period: "Junio 2025",
      description: "",
      notes: "",
      status: "Borrador",
      vehicleIds: [],
      workerIds: [],
      requirements: [],
      manuallyReviewed: [],
      excludedEvidence: [],
      updated: "Ahora",
    },
  );
  const evidence = evaluateAudit(draft, files, vehicles, workers, companies, manifests, invoices);
  const metrics = auditMetrics(evidence, draft.manuallyReviewed);
  const selectedCompany = companies.find((item) => item.id === draft.companyId);

  function nextStep() {
    setError("");
    if (step === 1 && (!draft.name.trim() || !draft.companyId || !draft.deadline)) {
      setError("Completa el nombre, la empresa y la fecha límite.");
      return;
    }
    if (step === 2 && !draft.vehicleIds.length) {
      setError("Selecciona al menos una unidad para continuar.");
      return;
    }
    if (step === 4 && !draft.requirements.length) {
      setError("Selecciona al menos un requisito documental.");
      return;
    }
    setStep((current) => Math.min(6, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function toggleVehicle(id: number) {
    setDraft((current) => ({
      ...current,
      vehicleIds: current.vehicleIds.includes(id)
        ? current.vehicleIds.filter((item) => item !== id)
        : [...current.vehicleIds, id],
    }));
  }
  function toggleWorker(id: number) {
    setDraft((current) => ({
      ...current,
      workerIds: current.workerIds.includes(id)
        ? current.workerIds.filter((item) => item !== id)
        : [...current.workerIds, id],
    }));
  }
  function toggleRequirement(requirement: AuditRequirement) {
    setDraft((current) => ({
      ...current,
      requirements: current.requirements.some((item) => item.id === requirement.id)
        ? current.requirements.filter((item) => item.id !== requirement.id)
        : [...current.requirements, requirement],
    }));
  }
  function addCustomRequirement() {
    if (!customLabel.trim()) return;
    const requirement: AuditRequirement = {
      id: `custom-${Date.now()}`,
      label: customLabel.trim(),
      scope: customScope,
      custom: true,
    };
    setDraft((current) => ({
      ...current,
      requirements: [...current.requirements, requirement],
    }));
    setCustomLabel("");
  }

  return (
    <motion.div
      className="page audit-wizard-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button className="back-link" onClick={onCancel}>
        <ArrowLeft size={16} /> Salir del asistente
      </button>
      <PageHeader
        eyebrow={initial ? "Editar auditoría" : "Nueva auditoría"}
        title={auditStepLabels[step - 1]}
        description={`Paso ${step} de 6 · La información se conserva únicamente durante esta sesión.`}
        actions={
          <span className="demo-pill">
            <Sparkles size={14} /> Prototipo local
          </span>
        }
      />
      <div className="audit-wizard-layout">
        <aside className="audit-stepper">
          {auditStepLabels.map((label, index) => {
            const number = index + 1;
            return (
              <button
                key={label}
                className={`${step === number ? "active" : ""} ${step > number ? "complete" : ""}`}
                onClick={() => number < step && setStep(number)}
              >
                <span>{step > number ? <Check size={14} /> : number}</span>
                <div>
                  <strong>{label}</strong>
                  <small>
                    {number === step ? "En curso" : step > number ? "Completado" : "Pendiente"}
                  </small>
                </div>
              </button>
            );
          })}
          <div className="wizard-context">
            <ShieldCheck size={16} />
            <p>
              <strong>Verificación real</strong>
              <span>Solo se consideran registros presentes en el prototipo.</span>
            </p>
          </div>
        </aside>
        <section className="wizard-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              {step === 1 && (
                <div className="wizard-form">
                  <div className="wizard-section-title">
                    <span>01</span>
                    <div>
                      <h2>Información general</h2>
                      <p>Identifica la solicitud y su periodo documental.</p>
                    </div>
                  </div>
                  <label className="field-full">
                    Nombre de la auditoría
                    <input
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                      placeholder="Ej. Auditoría documental — Julio 2025"
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Empresa contratante
                      <select
                        value={draft.companyId}
                        onChange={(event) =>
                          setDraft({ ...draft, companyId: Number(event.target.value) })
                        }
                      >
                        {companies.map((company) => (
                          <option value={company.id} key={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Periodo documental
                      <input
                        value={draft.period}
                        onChange={(event) => setDraft({ ...draft, period: event.target.value })}
                        placeholder="Ej. Julio 2025"
                      />
                    </label>
                    <label>
                      Fecha de solicitud
                      <input
                        type="date"
                        value={draft.requestDate}
                        onChange={(event) =>
                          setDraft({ ...draft, requestDate: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Fecha límite
                      <input
                        type="date"
                        value={draft.deadline}
                        onChange={(event) => setDraft({ ...draft, deadline: event.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    Descripción
                    <textarea
                      value={draft.description}
                      onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                      placeholder="Describe el alcance de la auditoría"
                    />
                  </label>
                  <label>
                    Observaciones <span className="optional">(opcional)</span>
                    <textarea
                      value={draft.notes}
                      onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                      placeholder="Notas internas para la preparación"
                    />
                  </label>
                </div>
              )}
              {step === 2 && (
                <div>
                  <div className="wizard-section-title">
                    <span>02</span>
                    <div>
                      <h2>Selecciona las unidades</h2>
                      <p>El checklist se calculará por cada unidad elegida.</p>
                    </div>
                  </div>
                  <label className="inline-search wizard-search">
                    <Search size={17} />
                    <input
                      value={vehicleQuery}
                      onChange={(event) => setVehicleQuery(event.target.value)}
                      placeholder="Buscar por placa, código o marca"
                    />
                  </label>
                  <div className="audit-select-grid">
                    {vehicles
                      .filter((vehicle) =>
                        `${vehicle.plate} ${vehicle.code} ${vehicle.brand}`
                          .toLowerCase()
                          .includes(vehicleQuery.toLowerCase()),
                      )
                      .map((vehicle) => {
                        const selected = draft.vehicleIds.includes(vehicle.id);
                        const alerts = files.filter(
                          (file) =>
                            file.vehicle === vehicle.plate &&
                            (file.status === "Vencido" || file.status === "Por vencer"),
                        ).length;
                        return (
                          <button
                            key={vehicle.id}
                            className={`audit-vehicle-option ${selected ? "selected" : ""}`}
                            onClick={() => toggleVehicle(vehicle.id)}
                          >
                            <span className="selection-check">
                              {selected && <Check size={14} />}
                            </span>
                            <img src={vehicle.cover} alt={`Unidad ${vehicle.plate}`} />
                            <div>
                              <strong>{vehicle.plate}</strong>
                              <small>
                                {vehicle.code} · {vehicle.brand} {vehicle.model}
                              </small>
                              <span className={alerts ? "has-alert" : ""}>
                                {alerts
                                  ? `${alerts} documentos requieren atención`
                                  : "Sin alertas documentales"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <div className="wizard-section-title">
                    <span>03</span>
                    <div>
                      <h2>Selecciona trabajadores</h2>
                      <p>
                        Paso opcional. Podrás exigir documentación por cada persona seleccionada.
                      </p>
                    </div>
                  </div>
                  <label className="inline-search wizard-search">
                    <Search size={17} />
                    <input
                      value={workerQuery}
                      onChange={(event) => setWorkerQuery(event.target.value)}
                      placeholder="Buscar por nombre, cargo o código"
                    />
                  </label>
                  <div className="audit-worker-list">
                    {workers
                      .filter((worker) =>
                        `${worker.name} ${worker.role} ${worker.code}`
                          .toLowerCase()
                          .includes(workerQuery.toLowerCase()),
                      )
                      .map((worker) => {
                        const selected = draft.workerIds.includes(worker.id);
                        return (
                          <button
                            key={worker.id}
                            className={selected ? "selected" : ""}
                            onClick={() => toggleWorker(worker.id)}
                          >
                            <span className="selection-check">
                              {selected && <Check size={14} />}
                            </span>
                            <span className="avatar">{worker.initials}</span>
                            <div>
                              <strong>{worker.name}</strong>
                              <small>
                                {worker.role} · {worker.code}
                              </small>
                            </div>
                            <Badge status={worker.status} />
                          </button>
                        );
                      })}
                  </div>
                  {!draft.workerIds.length && (
                    <div className="wizard-inline-note">
                      <CircleHelp size={16} />
                      <span>Puedes continuar sin trabajadores y añadirlos más adelante.</span>
                    </div>
                  )}
                </div>
              )}
              {step === 4 && (
                <div>
                  <div className="wizard-section-title">
                    <span>04</span>
                    <div>
                      <h2>Requisitos documentales</h2>
                      <p>Selecciona únicamente lo solicitado por la empresa.</p>
                    </div>
                  </div>
                  <div className="audit-template-picker">
                    <div>
                      <FileCheck2 size={17} />
                      <span>
                        <strong>Aplicar plantilla de auditoría</strong>
                        <small>Reemplaza la selección actual con requisitos configurados.</small>
                      </span>
                    </div>
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        const selected = templates.find(
                          (item) => String(item.id) === event.target.value,
                        );
                        if (selected)
                          setDraft((current) => ({
                            ...current,
                            requirements: auditRequirementCatalog.filter((item) =>
                              selected.items.includes(item.id),
                            ),
                          }));
                      }}
                    >
                      <option value="" disabled>
                        Seleccionar plantilla
                      </option>
                      {templates
                        .filter((item) => item.kind === "Auditoría" && item.active)
                        .map((item) => (
                          <option value={item.id} key={item.id}>
                            {item.name} · {item.items.length} requisitos
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="requirement-groups">
                    {(["Unidad", "Trabajador", "Empresa", "Periodo"] as RequirementScope[]).map(
                      (scope) => (
                        <section key={scope}>
                          <div>
                            <strong>Por {scope.toLowerCase()}</strong>
                            <span>
                              {scope === "Unidad"
                                ? `${draft.vehicleIds.length} seleccionadas`
                                : scope === "Trabajador"
                                  ? `${draft.workerIds.length} seleccionados`
                                  : scope === "Empresa"
                                    ? selectedCompany?.name
                                    : draft.period}
                            </span>
                          </div>
                          <div>
                            {auditRequirementCatalog
                              .filter((item) => item.scope === scope)
                              .map((requirement) => {
                                const checked = draft.requirements.some(
                                  (item) => item.id === requirement.id,
                                );
                                return (
                                  <button
                                    key={requirement.id}
                                    className={checked ? "selected" : ""}
                                    onClick={() => toggleRequirement(requirement)}
                                  >
                                    <span>{checked && <Check size={13} />}</span>
                                    <strong>{requirement.label}</strong>
                                    <small>{requirement.scope}</small>
                                  </button>
                                );
                              })}
                          </div>
                        </section>
                      ),
                    )}
                  </div>
                  <div className="custom-requirement">
                    <div>
                      <Plus size={17} />
                      <span>
                        <strong>Requisito personalizado</strong>
                        <small>
                          No se asumirá disponibilidad hasta encontrar una coincidencia.
                        </small>
                      </span>
                    </div>
                    <div>
                      <input
                        value={customLabel}
                        onChange={(event) => setCustomLabel(event.target.value)}
                        placeholder="Nombre del documento requerido"
                      />
                      <select
                        value={customScope}
                        onChange={(event) => setCustomScope(event.target.value as RequirementScope)}
                      >
                        <option>Unidad</option>
                        <option>Trabajador</option>
                        <option>Empresa</option>
                        <option>Periodo</option>
                      </select>
                      <Button type="button" variant="secondary" onClick={addCustomRequirement}>
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {step === 5 && (
                <div>
                  <div className="wizard-section-title">
                    <span>05</span>
                    <div>
                      <h2>Verificación documental</h2>
                      <p>Resultados encontrados en el estado compartido del prototipo.</p>
                    </div>
                  </div>
                  <AuditVerificationSummary metrics={metrics} />
                  <div className="verification-list">
                    {evidence.map((item) => (
                      <article key={item.id}>
                        <span className="verification-scope">{item.scope}</span>
                        <div>
                          <strong>{item.requirement}</strong>
                          <small>{item.target}</small>
                        </div>
                        <div>
                          <strong>{item.name || "Documento no encontrado"}</strong>
                          <small>
                            {item.expirationDate
                              ? `Vence ${new Date(`${item.expirationDate}T12:00:00`).toLocaleDateString("es-PE")}`
                              : item.name
                                ? "Sin fecha registrada"
                                : "Requiere agregar un archivo"}
                          </small>
                        </div>
                        <AuditEvidenceBadge status={item.status} />
                        <select disabled={!item.name}>
                          <option>{item.version || "Sin versión"}</option>
                        </select>
                        <button
                          className="icon-button"
                          disabled={!item.name}
                          onClick={() => onPreview(item)}
                        >
                          <Eye size={16} />
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {step === 6 && (
                <div>
                  <div className="wizard-section-title">
                    <span>06</span>
                    <div>
                      <h2>Resumen de la auditoría</h2>
                      <p>Revisa el alcance antes de guardar.</p>
                    </div>
                  </div>
                  <div className="audit-summary-hero">
                    <div>
                      <span>
                        <Building2 size={19} />
                      </span>
                      <p>
                        <small>Empresa solicitante</small>
                        <strong>{selectedCompany?.name}</strong>
                      </p>
                    </div>
                    <Badge status={metrics.missing || metrics.expired ? "Pendiente" : "Lista"} />
                  </div>
                  <div className="audit-summary-grid">
                    <div>
                      <span>Unidades</span>
                      <strong>{draft.vehicleIds.length}</strong>
                      <p>
                        {vehicles
                          .filter((item) => draft.vehicleIds.includes(item.id))
                          .map((item) => item.plate)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <span>Trabajadores</span>
                      <strong>{draft.workerIds.length}</strong>
                      <p>
                        {workers
                          .filter((item) => draft.workerIds.includes(item.id))
                          .map((item) => item.name)
                          .join(", ") || "Sin trabajadores"}
                      </p>
                    </div>
                    <div>
                      <span>Requisitos</span>
                      <strong>{draft.requirements.length}</strong>
                      <p>{evidence.length} comprobaciones generadas</p>
                    </div>
                    <div>
                      <span>Documentos listos</span>
                      <strong>{metrics.ready}</strong>
                      <p>de {metrics.total} comprobaciones</p>
                    </div>
                  </div>
                  <AuditVerificationSummary metrics={metrics} />
                  {(metrics.missing > 0 || metrics.expired > 0) && (
                    <div className="audit-warning-box">
                      <AlertCircle size={18} />
                      <div>
                        <strong>La auditoría requiere atención</strong>
                        <p>
                          {metrics.missing} documentos faltantes y {metrics.expired} vencidos.
                          Puedes guardarla y continuar después.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="summary-requirements">
                    <h3>Requisitos seleccionados</h3>
                    <div>
                      {draft.requirements.map((item) => (
                        <span key={item.id}>
                          {item.label}
                          <small>{item.scope}</small>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="wizard-summary-actions">
                    <Button variant="secondary" onClick={() => setStep(5)}>
                      Volver a revisar
                    </Button>
                    <Button
                      variant="secondary"
                      icon={Save}
                      onClick={() =>
                        onSave({ ...draft, status: "Activa", updated: "Ahora" }, false)
                      }
                    >
                      Guardar auditoría
                    </Button>
                    <Button
                      icon={Package}
                      onClick={() => onSave({ ...draft, status: "Activa", updated: "Ahora" }, true)}
                    >
                      Preparar paquete documental
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {error && (
            <p className="wizard-error">
              <AlertCircle size={15} />
              {error}
            </p>
          )}
          {step < 6 && (
            <div className="wizard-navigation">
              <Button
                variant="secondary"
                onClick={step === 1 ? onCancel : () => setStep((current) => current - 1)}
              >
                {step === 1 ? "Cancelar" : "Atrás"}
              </Button>
              <span>
                {step === 2
                  ? `${draft.vehicleIds.length} unidades seleccionadas`
                  : step === 3
                    ? `${draft.workerIds.length} trabajadores seleccionados`
                    : step === 4
                      ? `${draft.requirements.length} requisitos seleccionados`
                      : ""}
              </span>
              <Button onClick={nextStep}>
                Continuar <ArrowRight size={15} />
              </Button>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}

function AuditVerificationSummary({ metrics }: { metrics: ReturnType<typeof auditMetrics> }) {
  return (
    <div className="verification-summary">
      <div className="ready">
        <CheckCircle2 size={17} />
        <span>
          <strong>{metrics.ready}</strong>
          <small>Listos</small>
        </span>
      </div>
      <div className="missing">
        <XCircle size={17} />
        <span>
          <strong>{metrics.missing}</strong>
          <small>Faltantes</small>
        </span>
      </div>
      <div className="expired">
        <AlertCircle size={17} />
        <span>
          <strong>{metrics.expired}</strong>
          <small>Vencidos</small>
        </span>
      </div>
      <div className="progress">
        <span>
          <strong>{metrics.progress}%</strong>
          <small>Cumplimiento</small>
        </span>
        <div>
          <i style={{ width: `${metrics.progress}%` }} />
        </div>
      </div>
    </div>
  );
}

function AuditChecklistPage({
  audit,
  files,
  vehicles,
  workers,
  companies,
  manifests,
  invoices,
  onBack,
  onModify,
  onPackage,
  onUpdate,
  onPreview,
  onOpenExplorer,
}: {
  audit: AuditRecord;
  files: DemoFile[];
  vehicles: Vehicle[];
  workers: Worker[];
  companies: BusinessRecord[];
  manifests: ManifestRecord[];
  invoices: InvoiceRecord[];
  onBack: () => void;
  onModify: () => void;
  onPackage: () => void;
  onUpdate: (audit: AuditRecord) => void;
  onPreview: (evidence: AuditEvidence) => void;
  onOpenExplorer: () => void;
}) {
  const [filter, setFilter] = useState("Todos");
  const evidence = evaluateAudit(audit, files, vehicles, workers, companies, manifests, invoices);
  const metrics = auditMetrics(evidence, audit.manuallyReviewed);
  const company = companies.find((item) => item.id === audit.companyId);
  const visible = evidence.filter((item) => filter === "Todos" || item.status === filter);
  const groups = Array.from(new Set(visible.map((item) => `${item.scope}|${item.target}`)));
  function toggleReviewed(id: string) {
    const updated = {
      ...audit,
      manuallyReviewed: audit.manuallyReviewed.includes(id)
        ? audit.manuallyReviewed.filter((item) => item !== id)
        : [...audit.manuallyReviewed, id],
      updated: "Ahora",
    };
    onUpdate(updated);
  }
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Volver al Centro de Auditorías
      </button>
      <PageHeader
        eyebrow="Checklist documental"
        title={audit.name}
        description={`${company?.name || "Sin empresa"} · Fecha límite ${new Date(`${audit.deadline}T12:00:00`).toLocaleDateString("es-PE")}`}
        actions={
          <>
            <Button variant="secondary" icon={Edit3} onClick={onModify}>
              Modificar requisitos
            </Button>
            <Button icon={Package} onClick={onPackage}>
              Preparar paquete
            </Button>
          </>
        }
      />
      <div className="checklist-overview">
        <div className="checklist-score">
          <div
            className="score-ring"
            style={{ "--progress": `${metrics.progress * 3.6}deg` } as CSSProperties}
          >
            <span>{metrics.progress}%</span>
          </div>
          <div>
            <strong>Progreso documental</strong>
            <p>
              {metrics.ready} de {metrics.total} comprobaciones están listas.
            </p>
          </div>
        </div>
        <AuditVerificationSummary metrics={metrics} />
      </div>
      <div className="checklist-toolbar">
        <div className="checklist-filters">
          {[
            "Todos",
            "Disponible",
            "Faltante",
            "Vencido",
            "Sin fecha de vencimiento",
            "Pendiente de revisión",
          ].map((item) => (
            <button
              className={filter === item ? "active" : ""}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item}
              <span>
                {item === "Todos"
                  ? evidence.length
                  : evidence.filter((row) => row.status === item).length}
              </span>
            </button>
          ))}
        </div>
        <Button variant="secondary" icon={Folder} onClick={onOpenExplorer}>
          Agregar desde explorador
        </Button>
      </div>
      <div className="checklist-groups">
        {groups.map((group) => {
          const [scope, target] = group.split("|");
          const rows = visible.filter((item) => item.scope === scope && item.target === target);
          return (
            <section className="checklist-group card" key={group}>
              <div className="checklist-group-head">
                <span className={`scope-icon scope-${normalizeAuditText(scope)}`}>
                  {scope === "Unidad" ? (
                    <Bus size={18} />
                  ) : scope === "Trabajador" ? (
                    <UserRound size={18} />
                  ) : scope === "Empresa" ? (
                    <Building2 size={18} />
                  ) : (
                    <CalendarClock size={18} />
                  )}
                </span>
                <div>
                  <span>{scope}</span>
                  <h2>{target}</h2>
                </div>
                <small>
                  {
                    rows.filter((item) => item.status !== "Faltante" && item.status !== "Vencido")
                      .length
                  }
                  /{rows.length} disponibles
                </small>
              </div>
              <div className="checklist-rows">
                {rows.map((item) => {
                  const reviewed = audit.manuallyReviewed.includes(item.id);
                  return (
                    <article key={item.id}>
                      <span className="checklist-requirement">
                        <strong>{item.requirement}</strong>
                        <small>{item.scope}</small>
                      </span>
                      <span className="checklist-file">
                        <FileIcon type={item.file?.type || "pdf"} />
                        <span>
                          <strong>{item.name || "Documento faltante"}</strong>
                          <small>
                            {item.expirationDate
                              ? `Vence ${new Date(`${item.expirationDate}T12:00:00`).toLocaleDateString("es-PE")}`
                              : item.name
                                ? `${item.source} · Sin fecha de vencimiento`
                                : "No existe una coincidencia en el prototipo"}
                          </small>
                        </span>
                      </span>
                      <AuditEvidenceBadge
                        status={
                          reviewed && item.status === "Pendiente de revisión"
                            ? "Disponible"
                            : item.status
                        }
                      />
                      <select disabled={!item.name}>
                        <option>{item.version || "Sin versión"}</option>
                      </select>
                      <button
                        className={`manual-review ${reviewed ? "active" : ""}`}
                        disabled={!item.name || item.status === "Vencido"}
                        onClick={() => toggleReviewed(item.id)}
                      >
                        <Check size={14} />
                        {reviewed ? "Revisado" : "Revisión manual"}
                      </button>
                      <button
                        className="icon-button"
                        disabled={!item.name}
                        onClick={() => onPreview(item)}
                      >
                        <Eye size={16} />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      {!groups.length && (
        <EmptyState
          icon={BookOpenCheck}
          title="Sin comprobaciones"
          text="No existen elementos para el filtro seleccionado."
        />
      )}
      <div className="checklist-footer">
        <div>
          <strong>
            {metrics.missing + metrics.expired
              ? "Aún hay documentos por resolver"
              : "Checklist preparado"}
          </strong>
          <span>
            {metrics.missing} faltantes · {metrics.expired} vencidos · {metrics.ready} listos
          </span>
        </div>
        <Button icon={Package} onClick={onPackage}>
          Continuar al paquete
        </Button>
      </div>
    </motion.div>
  );
}

function AuditPackagePage({
  audit,
  files,
  vehicles,
  workers,
  companies,
  manifests,
  invoices,
  onBack,
  onChecklist,
  onUpdate,
  onPreview,
}: {
  audit: AuditRecord;
  files: DemoFile[];
  vehicles: Vehicle[];
  workers: Worker[];
  companies: BusinessRecord[];
  manifests: ManifestRecord[];
  invoices: InvoiceRecord[];
  onBack: () => void;
  onChecklist: () => void;
  onUpdate: (audit: AuditRecord) => void;
  onPreview: (evidence: AuditEvidence) => void;
}) {
  const evidence = evaluateAudit(audit, files, vehicles, workers, companies, manifests, invoices);
  const metrics = auditMetrics(evidence, audit.manuallyReviewed);
  const company = companies.find((item) => item.id === audit.companyId);
  const available = evidence.filter((item) => item.name && item.status !== "Vencido");
  const included = available.filter((item) => !audit.excludedEvidence.includes(item.id));
  const selectedVehicles = vehicles.filter((item) => audit.vehicleIds.includes(item.id));
  const selectedWorkers = workers.filter((item) => audit.workerIds.includes(item.id));
  function toggleEvidence(id: string) {
    onUpdate({
      ...audit,
      excludedEvidence: audit.excludedEvidence.includes(id)
        ? audit.excludedEvidence.filter((item) => item !== id)
        : [...audit.excludedEvidence, id],
      updated: "Ahora",
    });
  }
  const packageName = `AUDITORIA_${(company?.name || "EMPRESA").toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Volver al Centro de Auditorías
      </button>
      <PageHeader
        eyebrow="Preparación documental"
        title="Paquete de auditoría"
        description={audit.name}
        actions={
          <Button variant="secondary" onClick={onChecklist}>
            Volver al checklist
          </Button>
        }
      />
      <div className="export-pending-banner">
        <span>
          <Package size={21} />
        </span>
        <div>
          <strong>Vista previa de exportación — funcionalidad pendiente de backend</strong>
          <p>
            La estructura muestra únicamente archivos disponibles en esta sesión. No se generará ni
            descargará un ZIP real.
          </p>
        </div>
      </div>
      <div className="package-layout">
        <section className="card package-tree-card">
          <div className="card-head">
            <div>
              <h2>Estructura del paquete</h2>
              <p>{included.length} archivos seleccionados</p>
            </div>
          </div>
          <div className="package-tree">
            <div className="tree-root">
              <Folder size={18} />
              <strong>{packageName}/</strong>
            </div>
            <div className="tree-branch">
              <div>
                <Folder size={15} />
                <strong>INDICE/</strong>
                <small>Se preparará en la implementación final</small>
              </div>
            </div>
            <div className="tree-branch">
              <div>
                <Folder size={15} />
                <strong>UNIDADES/</strong>
                <small>{selectedVehicles.length} carpetas</small>
              </div>
              {selectedVehicles.map((vehicle) => (
                <div className="tree-level-2" key={vehicle.id}>
                  <Folder size={14} />
                  <strong>{vehicle.plate}/</strong>
                  <span>
                    {
                      included.filter(
                        (item) =>
                          item.target === vehicle.plate ||
                          item.target.startsWith(`${vehicle.plate} ·`),
                      ).length
                    }{" "}
                    archivos
                  </span>
                </div>
              ))}
            </div>
            <div className="tree-branch">
              <div>
                <Folder size={15} />
                <strong>TRABAJADORES/</strong>
                <small>{selectedWorkers.length} carpetas</small>
              </div>
              {selectedWorkers.map((worker) => (
                <div className="tree-level-2" key={worker.id}>
                  <Folder size={14} />
                  <strong>{worker.name.toUpperCase().replace(/ /g, "_")}/</strong>
                  <span>
                    {included.filter((item) => item.target === worker.name).length} archivos
                  </span>
                </div>
              ))}
            </div>
            <div className="tree-branch">
              <div>
                <Folder size={15} />
                <strong>MANIFIESTOS/</strong>
                <small>
                  {included.filter((item) => item.source === "Manifiesto").length} archivos
                </small>
              </div>
            </div>
            <div className="tree-branch">
              <div>
                <Folder size={15} />
                <strong>FACTURAS/</strong>
                <small>
                  {included.filter((item) => item.source === "Factura").length} archivos
                </small>
              </div>
            </div>
            <div className="tree-branch">
              <div>
                <Folder size={15} />
                <strong>CONTRATOS/</strong>
                <small>
                  {
                    included.filter((item) =>
                      normalizeAuditText(item.requirement).includes("contrato"),
                    ).length
                  }{" "}
                  archivos
                </small>
              </div>
            </div>
          </div>
        </section>
        <aside className="card package-summary">
          <span>
            <FileCheck2 size={22} />
          </span>
          <h2>Resumen de preparación</h2>
          <dl>
            <div>
              <dt>Documentos encontrados</dt>
              <dd>{available.length}</dd>
            </div>
            <div>
              <dt>Incluidos</dt>
              <dd>{included.length}</dd>
            </div>
            <div>
              <dt>Excluidos manualmente</dt>
              <dd>{audit.excludedEvidence.length}</dd>
            </div>
            <div>
              <dt>Faltantes</dt>
              <dd className={metrics.missing ? "danger" : ""}>{metrics.missing}</dd>
            </div>
            <div>
              <dt>Vencidos</dt>
              <dd className={metrics.expired ? "danger" : ""}>{metrics.expired}</dd>
            </div>
          </dl>
          <Button disabled icon={Download}>
            Exportación no disponible
          </Button>
          <small>No se ha generado ningún archivo.</small>
        </aside>
      </div>
      <section className="card package-files">
        <div className="card-head">
          <div>
            <h2>Documentos seleccionados</h2>
            <p>Excluye archivos que no deban formar parte de la futura exportación.</p>
          </div>
        </div>
        {available.length ? (
          available.map((item) => {
            const excluded = audit.excludedEvidence.includes(item.id);
            return (
              <article className={excluded ? "excluded" : ""} key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={!excluded}
                    onChange={() => toggleEvidence(item.id)}
                  />
                </label>
                <FileIcon type={item.file?.type || "pdf"} />
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.target} · {item.requirement}
                  </small>
                </div>
                <AuditEvidenceBadge status={item.status} />
                <select>
                  <option>{item.version}</option>
                </select>
                <button className="icon-button" onClick={() => onPreview(item)}>
                  <Eye size={16} />
                </button>
              </article>
            );
          })
        ) : (
          <EmptyState
            icon={File}
            title="Sin documentos disponibles"
            text="El checklist no encontró archivos que puedan incluirse en el paquete."
          />
        )}
      </section>
      {(metrics.missing > 0 || metrics.expired > 0) && (
        <div className="package-warning">
          <AlertCircle size={18} />
          <div>
            <strong>Paquete incompleto</strong>
            <p>
              La vista previa conserva {metrics.missing} faltantes y {metrics.expired} documentos
              vencidos. No se han creado archivos sustitutos.
            </p>
          </div>
          <Button variant="secondary" onClick={onChecklist}>
            Revisar checklist
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function FavoritesPage({
  files,
  onPreview,
  onToggle,
}: {
  files: DemoFile[];
  onPreview: (file: DemoFile) => void;
  onToggle: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const favorites = files.filter(
    (file) => file.favorite && file.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Acceso rápido"
        title="Favoritos"
        description="Documentos marcados para encontrarlos rápidamente durante esta sesión."
        actions={
          <span className="demo-pill">
            <Star size={14} /> {favorites.length} elementos
          </span>
        }
      />
      <div className="directory-toolbar">
        <label className="inline-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en favoritos"
          />
        </label>
      </div>
      {favorites.length ? (
        <div className="favorite-list card">
          {favorites.map((file) => (
            <article key={file.id}>
              <button className="favorite-main" onClick={() => onPreview(file)}>
                <FileIcon type={file.type} />
                <span>
                  <strong>{file.name}</strong>
                  <small>
                    {file.category} · {file.vehicle || file.worker || file.company || "General"}
                  </small>
                </span>
              </button>
              <span>{file.size}</span>
              <span>{file.modified}</span>
              {file.status && <Badge status={file.status} />}
              <button
                className="icon-button favorite-active"
                title="Quitar de favoritos"
                onClick={() => onToggle(file.id)}
              >
                <Star size={17} fill="currentColor" />
              </button>
              <button className="icon-button" onClick={() => onPreview(file)}>
                <Eye size={17} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Star}
          title={query ? "Sin resultados" : "Aún no tienes favoritos"}
          text={
            query
              ? `No encontramos favoritos para “${query}”.`
              : "Marca documentos con una estrella desde el explorador o la vista previa."
          }
        />
      )}
    </motion.div>
  );
}

function TrashPage({
  entries,
  onRestore,
  onRequestDelete,
}: {
  entries: TrashEntry[];
  onRestore: (id: number) => void;
  onRequestDelete: (entry: TrashEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = entries.filter((entry) =>
    entry.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Recuperación"
        title="Papelera"
        description="Restaura elementos eliminados durante la sesión. No se eliminan datos reales."
        actions={
          <span className="demo-pill">
            <Trash2 size={14} /> {entries.length} elementos
          </span>
        }
      />
      <div className="trash-notice">
        <ShieldCheck size={17} />
        <div>
          <strong>Papelera demostrativa</strong>
          <p>La eliminación permanente solo afecta datos ficticios de esta sesión.</p>
        </div>
      </div>
      <div className="directory-toolbar">
        <label className="inline-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar elementos eliminados"
          />
        </label>
      </div>
      {filtered.length ? (
        <div className="trash-table card">
          <div className="trash-table-head">
            <span>Elemento</span>
            <span>Tipo</span>
            <span>Fecha de eliminación</span>
            <span>Contenido</span>
            <span />
          </div>
          {filtered.map((entry) => (
            <article key={entry.id}>
              <span className="trash-name">
                {entry.kind === "Archivo" ? (
                  <FileIcon type={entry.files[0]?.type || "pdf"} />
                ) : (
                  <span className="folder-mini">
                    <Folder size={18} />
                  </span>
                )}
                <span>
                  <strong>{entry.name}</strong>
                  <small>Ubicación original conservada</small>
                </span>
              </span>
              <span>{entry.kind}</span>
              <span>{entry.deletedAt}</span>
              <span>
                {entry.files.length} archivos · {entry.folders.length} carpetas
              </span>
              <div>
                <Button variant="secondary" icon={RotateCcw} onClick={() => onRestore(entry.id)}>
                  Restaurar
                </Button>
                <button
                  className="icon-button danger-action"
                  title="Eliminar permanentemente"
                  onClick={() => onRequestDelete(entry)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trash2}
          title="La papelera está vacía"
          text="Los elementos que elimines desde Mis archivos aparecerán aquí."
        />
      )}
    </motion.div>
  );
}

function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="settings-card card">
      <div className="settings-card-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      <div className="settings-card-body">{children}</div>
    </div>
  );
}

function SettingsToggle({
  title,
  text,
  enabled = false,
}: {
  title: string;
  text: string;
  enabled?: boolean;
}) {
  const [active, setActive] = useState(enabled);
  return (
    <button className="settings-toggle-row" onClick={() => setActive(!active)}>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <span className={`settings-switch ${active ? "active" : ""}`}>
        <i />
      </span>
    </button>
  );
}

function SettingsSave() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="settings-save">
      <Button
        icon={saved ? Check : Save}
        onClick={() => {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1800);
        }}
      >
        {saved ? "Cambios guardados en la sesión" : "Guardar cambios"}
      </Button>
    </div>
  );
}

function SettingsPage({
  categories,
  templates,
  onAddCategory,
  onDeleteCategory,
  onAddTemplate,
  onToggleTemplate,
  onDeleteTemplate,
}: {
  categories: CategorySetting[];
  templates: TemplateSetting[];
  onAddCategory: (category: Omit<CategorySetting, "id">) => void;
  onDeleteCategory: (id: number) => void;
  onAddTemplate: (template: Omit<TemplateSetting, "id">) => void;
  onToggleTemplate: (id: number) => void;
  onDeleteTemplate: (id: number) => void;
}) {
  const [section, setSection] = useState("Perfil");
  const [categoryForm, setCategoryForm] = useState(false);
  const [templateForm, setTemplateForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "General",
    location: "Mis archivos",
    requiresExpiration: false,
    description: "",
    color: "emerald",
  });
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    kind: "Unidad" as TemplateSetting["kind"],
    items: "",
  });
  const sections = [
    ["Perfil", UserRound],
    ["Empresa", Building2],
    ["Categorías", Tags],
    ["Plantillas", Files],
    ["Preferencias", SlidersHorizontal],
    ["Notificaciones", Bell],
    ["Seguridad", ShieldCheck],
    ["Almacenamiento", HardDrive],
    ["Sistema", CircleHelp],
  ] as const;
  function createTemplate() {
    if (!newTemplate.name.trim() || !newTemplate.items.trim()) return;
    let items = newTemplate.items
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (newTemplate.kind === "Auditoría")
      items = items.map(
        (item) =>
          auditRequirementCatalog.find(
            (requirement) =>
              normalizeAuditText(requirement.label) === normalizeAuditText(item) ||
              requirement.id === item,
          )?.id || item,
      );
    onAddTemplate({ name: newTemplate.name.trim(), kind: newTemplate.kind, items, active: true });
    setNewTemplate({ name: "", kind: "Unidad", items: "" });
    setTemplateForm(false);
  }
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Administración del prototipo"
        title="Configuración"
        description="Personaliza categorías, plantillas y preferencias de la sesión."
        actions={
          <span className="demo-pill">
            <Sparkles size={14} /> Sin persistencia real
          </span>
        }
      />
      <div className="settings-layout">
        <aside className="settings-nav">
          {sections.map(([label, Icon]) => (
            <button
              className={section === label ? "active" : ""}
              key={label}
              onClick={() => setSection(label)}
            >
              <Icon size={17} />
              <span>{label}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </aside>
        <section className="settings-content">
          {section === "Perfil" && (
            <SettingsCard
              title="Perfil del gerente"
              description="Información mostrada dentro del prototipo."
            >
              <div className="profile-settings-head">
                <span className="avatar avatar-xl">JM</span>
                <div>
                  <strong>José Mendoza</strong>
                  <small>Gerente general</small>
                </div>
                <Button variant="secondary" disabled title="Carga de avatar pendiente">
                  Carga no disponible
                </Button>
              </div>
              <div className="settings-form-grid">
                <label>
                  Nombre completo
                  <input defaultValue="José Mendoza" />
                </label>
                <label>
                  Cargo
                  <input defaultValue="Gerente general" />
                </label>
                <label>
                  Correo
                  <input defaultValue="gerencia@misdosmarias.pe" />
                </label>
                <label>
                  Teléfono
                  <input defaultValue="+51 900 000 000" />
                </label>
              </div>
              <SettingsSave />
            </SettingsCard>
          )}
          {section === "Empresa" && (
            <SettingsCard
              title="Datos de la empresa"
              description="Datos ficticios visibles en documentos y cabeceras."
            >
              <div className="settings-form-grid">
                <label>
                  Razón social
                  <input defaultValue="MIS DOS MARÍAS E.I.R.L." />
                </label>
                <label>
                  Nombre comercial
                  <input defaultValue="Mis Dos Marías" />
                </label>
                <label>
                  RUC de demostración
                  <input defaultValue="20XXXXXXXXX" />
                </label>
                <label>
                  Actividad
                  <input defaultValue="Transporte de personal" />
                </label>
                <label className="field-full">
                  Dirección
                  <input defaultValue="Lima, Perú — dato demostrativo" />
                </label>
              </div>
              <SettingsSave />
            </SettingsCard>
          )}
          {section === "Categorías" && (
            <SettingsCard
              title="Categorías documentales"
              description="Las categorías creadas aparecen inmediatamente en carga y organización."
              action={
                <Button icon={Plus} onClick={() => setCategoryForm(!categoryForm)}>
                  Nueva categoría
                </Button>
              }
            >
              {categoryForm && (
                <div className="settings-inline-form">
                  <div className="settings-form-grid">
                    <label>
                      Nombre
                      <input
                        value={newCategory.name}
                        onChange={(event) =>
                          setNewCategory({ ...newCategory, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Tipo
                      <select
                        value={newCategory.type}
                        onChange={(event) =>
                          setNewCategory({ ...newCategory, type: event.target.value })
                        }
                      >
                        <option>General</option>
                        <option>Vehicular</option>
                        <option>Laboral</option>
                        <option>Empresarial</option>
                        <option>Financiero</option>
                      </select>
                    </label>
                    <label>
                      Ubicación
                      <input
                        value={newCategory.location}
                        onChange={(event) =>
                          setNewCategory({ ...newCategory, location: event.target.value })
                        }
                      />
                    </label>
                    <label className="toggle-label">
                      Requiere vencimiento
                      <input
                        type="checkbox"
                        checked={newCategory.requiresExpiration}
                        onChange={(event) =>
                          setNewCategory({
                            ...newCategory,
                            requiresExpiration: event.target.checked,
                          })
                        }
                      />
                    </label>
                    <label className="field-full">
                      Descripción
                      <input
                        value={newCategory.description}
                        onChange={(event) =>
                          setNewCategory({ ...newCategory, description: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="modal-actions">
                    <Button variant="secondary" onClick={() => setCategoryForm(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        if (!newCategory.name.trim()) return;
                        onAddCategory({ ...newCategory, name: newCategory.name.trim() });
                        setNewCategory({
                          name: "",
                          type: "General",
                          location: "Mis archivos",
                          requiresExpiration: false,
                          description: "",
                          color: "emerald",
                        });
                        setCategoryForm(false);
                      }}
                    >
                      Crear categoría
                    </Button>
                  </div>
                </div>
              )}
              <div className="category-settings-list">
                {categories.map((category) => (
                  <article key={category.id}>
                    <span className={`folder-icon folder-${category.color}`}>
                      <Tags size={18} />
                    </span>
                    <div>
                      <strong>{category.name}</strong>
                      <small>{category.description || "Sin descripción"}</small>
                    </div>
                    <span className="category-tag">{category.type}</span>
                    <span>{category.location}</span>
                    <Badge
                      status={category.requiresExpiration ? "Con vencimiento" : "Sin vencimiento"}
                    />
                    <button
                      className="icon-button danger-action"
                      onClick={() => onDeleteCategory(category.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            </SettingsCard>
          )}
          {section === "Plantillas" && (
            <SettingsCard
              title="Plantillas automáticas"
              description="Las plantillas activas aparecen en los flujos correspondientes."
              action={
                <Button icon={Plus} onClick={() => setTemplateForm(!templateForm)}>
                  Nueva plantilla
                </Button>
              }
            >
              {templateForm && (
                <div className="settings-inline-form">
                  <div className="settings-form-grid">
                    <label>
                      Nombre
                      <input
                        value={newTemplate.name}
                        onChange={(event) =>
                          setNewTemplate({ ...newTemplate, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Tipo
                      <select
                        value={newTemplate.kind}
                        onChange={(event) =>
                          setNewTemplate({
                            ...newTemplate,
                            kind: event.target.value as TemplateSetting["kind"],
                          })
                        }
                      >
                        <option>Unidad</option>
                        <option>Trabajador</option>
                        <option>Auditoría</option>
                      </select>
                    </label>
                    <label className="field-full">
                      Elementos separados por comas
                      <input
                        value={newTemplate.items}
                        onChange={(event) =>
                          setNewTemplate({ ...newTemplate, items: event.target.value })
                        }
                        placeholder="SOAT, STR, Contratos"
                      />
                    </label>
                  </div>
                  <div className="modal-actions">
                    <Button variant="secondary" onClick={() => setTemplateForm(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createTemplate}>Guardar plantilla</Button>
                  </div>
                </div>
              )}
              <div className="template-settings-grid">
                {templates.map((template) => (
                  <article key={template.id}>
                    <div>
                      <span className={`template-kind kind-${normalizeAuditText(template.kind)}`}>
                        {template.kind}
                      </span>
                      <button
                        className={`settings-switch ${template.active ? "active" : ""}`}
                        onClick={() => onToggleTemplate(template.id)}
                      >
                        <i />
                      </button>
                    </div>
                    <h3>{template.name}</h3>
                    <p>{template.items.length} elementos automáticos</p>
                    <div className="template-item-preview">
                      {template.items.slice(0, 5).map((item) => (
                        <span key={item}>
                          {auditRequirementCatalog.find((req) => req.id === item)?.label || item}
                        </span>
                      ))}
                      {template.items.length > 5 && <span>+{template.items.length - 5}</span>}
                    </div>
                    <button
                      className="template-delete"
                      onClick={() => onDeleteTemplate(template.id)}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </article>
                ))}
              </div>
            </SettingsCard>
          )}
          {section === "Preferencias" && (
            <SettingsCard
              title="Preferencias de interfaz"
              description="Ajustes locales de visualización."
            >
              <SettingsToggle title="Vista compacta" text="Reduce el espacio vertical de tablas." />
              <SettingsToggle
                title="Abrir documentos en vista previa"
                text="Evita iniciar descargas automáticamente."
                enabled
              />
              <SettingsToggle
                title="Respetar movimiento reducido"
                text="Utiliza transiciones mínimas cuando el sistema lo solicita."
                enabled
              />
            </SettingsCard>
          )}
          {section === "Notificaciones" && (
            <SettingsCard
              title="Preferencias de notificaciones"
              description="No se envían mensajes reales desde este prototipo."
            >
              <SettingsToggle
                title="Vencimientos documentales"
                text="Alertas visuales dentro de la aplicación."
                enabled
              />
              <SettingsToggle
                title="Auditorías próximas"
                text="Mostrar avisos en el centro de alertas."
                enabled
              />
              <SettingsToggle title="Resumen semanal" text="Funcionalidad pendiente de backend." />
            </SettingsCard>
          )}
          {section === "Seguridad" && (
            <SettingsCard
              title="Seguridad"
              description="Representación visual de futuras opciones."
            >
              <div className="security-row">
                <ShieldCheck size={21} />
                <div>
                  <strong>Acceso de demostración</strong>
                  <p>No existe autenticación real ni se almacenan credenciales.</p>
                </div>
                <Badge status="Prototipo" />
              </div>
              <SettingsToggle
                title="Bloqueo automático"
                text="Bloquear después de 15 minutos de inactividad."
                enabled
              />
              <SettingsToggle
                title="Confirmar acciones destructivas"
                text="Solicitar confirmación antes de vaciar la papelera."
                enabled
              />
            </SettingsCard>
          )}
          {section === "Almacenamiento" && (
            <SettingsCard
              title="Almacenamiento"
              description="Uso simulado durante la sesión actual."
            >
              <div className="storage-settings">
                <HardDrive size={24} />
                <div>
                  <strong>Espacio de demostración</strong>
                  <p>No se cargan documentos a servidores externos.</p>
                  <div>
                    <i />
                  </div>
                  <small>38% representativo · no corresponde a almacenamiento real</small>
                </div>
              </div>
            </SettingsCard>
          )}
          {section === "Sistema" && (
            <SettingsCard
              title="Información del sistema"
              description="Detalles de esta versión del prototipo."
            >
              <div className="system-info">
                <div>
                  <span>Producto</span>
                  <strong>Mis Dos Marías Docs</strong>
                </div>
                <div>
                  <span>Versión UI</span>
                  <strong>Prototipo Fase F</strong>
                </div>
                <div>
                  <span>Persistencia</span>
                  <strong>Estado local de sesión</strong>
                </div>
                <div>
                  <span>Integraciones</span>
                  <strong>No conectadas</strong>
                </div>
              </div>
              <div className="prototype-note">
                <CircleHelp size={15} />
                <span>La implementación productiva se conectará posteriormente.</span>
              </div>
            </SettingsCard>
          )}
        </section>
      </div>
    </motion.div>
  );
}

function VersionsModal({
  file,
  onClose,
  onRestore,
}: {
  file: DemoFile;
  onClose: () => void;
  onRestore: (fileId: number, versionId: number) => void;
}) {
  const versions = file.versions?.length
    ? file.versions
    : [{ id: file.id * 10, label: "1.0", date: file.modified, size: file.size, current: true }];
  return (
    <Modal title="Historial de versiones" subtitle={file.name} onClose={onClose}>
      <div className="versions-list">
        {versions.map((version) => (
          <article key={version.id} className={version.current ? "current" : ""}>
            <span>
              <History size={18} />
            </span>
            <div>
              <strong>Versión {version.label}</strong>
              <small>
                {version.date} · {version.size}
              </small>
            </div>
            {version.current ? (
              <Badge status="Actual" />
            ) : (
              <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={() => onRestore(file.id, version.id)}
              >
                Restaurar
              </Button>
            )}
          </article>
        ))}
      </div>
      <div className="version-note">
        <Sparkles size={14} /> Versionado demostrativo. No se conserva contenido binario.
      </div>
    </Modal>
  );
}

function ConfirmationDialog({
  title,
  text,
  onClose,
  onConfirm,
}: {
  title: string;
  text: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} subtitle={text} onClose={onClose}>
      <div className="confirmation-body">
        <span>
          <AlertCircle size={24} />
        </span>
        <p>
          Esta acción afecta únicamente datos ficticios de la sesión y no puede deshacerse dentro
          del prototipo.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="danger-button" icon={Trash2} onClick={onConfirm}>
            Eliminar permanentemente
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PlaceholderPage({ route, goTo }: { route: Route; goTo: (r: Route) => void }) {
  const item = nav.find((n) => n.id === route)!;
  const Icon = item.icon;
  return (
    <div className="page">
      <PageHeader
        title={item.label}
        description="Módulo incluido en la arquitectura general del producto."
      />
      <div className="placeholder-card">
        <span>
          <Icon size={30} />
        </span>
        <span className="eyebrow">Próxima fase</span>
        <h2>{item.label} se está preparando</h2>
        <p>
          La base de navegación y el sistema visual ya están listos. Este módulo se construirá
          manteniendo la misma experiencia.
        </p>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => goTo("dashboard")}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    window.requestAnimationFrame(() =>
      dialogRef.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus(),
    );
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [onClose]);
  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal ${wide ? "modal-wide" : ""}`}
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label={`Cerrar ${title}`}>
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function NewFolderModal({
  folders,
  parent,
  onClose,
  onCreate,
}: {
  folders: DemoFolder[];
  parent: number | null;
  onClose: () => void;
  onCreate: (name: string, parent: number | null, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(parent);
  const [color, setColor] = useState("emerald");
  const [error, setError] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Ingresa un nombre para la carpeta.");
    if (name.trim().length < 2) return setError("Utiliza al menos 2 caracteres.");
    onCreate(name.trim(), parentId, color);
  }
  return (
    <Modal
      title="Nueva carpeta"
      subtitle="Crea un espacio para organizar tus documentos."
      onClose={onClose}
    >
      <form onSubmit={submit} className="modal-form">
        <label>
          Nombre de la carpeta
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Ej. Documentos legales"
            className={error ? "invalid" : ""}
          />
          {error && (
            <small className="field-error">
              <AlertCircle size={13} />
              {error}
            </small>
          )}
        </label>
        <label>
          Carpeta padre
          <select
            value={parentId ?? ""}
            onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Mis archivos</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Descripción <span className="optional">(opcional)</span>
          <textarea placeholder="Añade una nota breve sobre esta carpeta" />
        </label>
        <fieldset>
          <legend>
            Color de carpeta <span className="optional">(opcional)</span>
          </legend>
          <div className="color-picker">
            {["emerald", "teal", "blue", "amber", "violet"].map((c) => (
              <button
                type="button"
                aria-label={`Color ${c}`}
                key={c}
                className={`${c} ${color === c ? "active" : ""}`}
                onClick={() => setColor(c)}
              >
                {color === c && <Check size={14} />}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={FolderPlus}>
            Crear carpeta
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function UploadModal({
  folders,
  vehicles,
  workers,
  categories,
  defaultVehicle,
  defaultWorker,
  defaultFolder,
  onClose,
  onComplete,
}: {
  folders: DemoFolder[];
  vehicles: Vehicle[];
  workers: Worker[];
  categories: CategorySetting[];
  defaultVehicle?: string;
  defaultWorker?: string;
  defaultFolder?: number | null;
  onClose: () => void;
  onComplete: (f: DemoFile) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{
    name: string;
    size: string;
    type: DemoFile["type"];
  } | null>(null);
  const [folder, setFolder] = useState<number | null>(defaultFolder ?? null);
  const [vehicle, setVehicle] = useState(defaultVehicle || "");
  const [worker, setWorker] = useState(defaultWorker || "");
  const [category, setCategory] = useState(categories[0]?.name || "Documento general");
  const [expirationDate, setExpirationDate] = useState("");
  const [detailError, setDetailError] = useState("");
  const [step, setStep] = useState<"pick" | "details" | "processing">("pick");
  function selectFile(file?: globalThis.File) {
    const name = file?.name || "SOAT_T3X-456_2025.pdf";
    const ext = name.split(".").pop()?.toLowerCase();
    const type: DemoFile["type"] =
      ext === "xlsx" || ext === "csv"
        ? "sheet"
        : ["jpg", "jpeg", "png"].includes(ext || "")
          ? "image"
          : ext === "zip"
            ? "zip"
            : ext === "docx"
              ? "doc"
              : "pdf";
    setPicked({ name, size: file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "2.4 MB", type });
    setStep("details");
  }
  function complete() {
    if (!picked) return;
    if (categories.find((item) => item.name === category)?.requiresExpiration && !expirationDate) {
      setDetailError("Esta categoría requiere una fecha de vencimiento.");
      return;
    }
    setStep("processing");
    window.setTimeout(
      () =>
        onComplete({
          id: Date.now(),
          name: picked.name,
          type: picked.type,
          size: picked.size,
          modified: "Ahora",
          category,
          parent: folder,
          vehicle: vehicle || undefined,
          worker: worker || undefined,
          status: "Vigente",
          expirationDate: expirationDate || undefined,
        }),
      850,
    );
  }
  return (
    <Modal
      title="Subir archivos"
      subtitle="Los archivos se procesan solo en esta sesión de demostración."
      onClose={onClose}
      wide
    >
      <div className="upload-steps">
        <span className={step === "pick" ? "active" : "done"}>
          <i>{step === "pick" ? "1" : <Check size={13} />}</i>Seleccionar
        </span>
        <b />
        <span className={step === "details" ? "active" : step === "processing" ? "done" : ""}>
          <i>{step === "processing" ? <Check size={13} /> : "2"}</i>Organizar
        </span>
        <b />
        <span className={step === "processing" ? "active" : ""}>
          <i>3</i>Finalizar
        </span>
      </div>
      {step === "pick" && (
        <div
          className="upload-area"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            selectFile(e.dataTransfer.files[0]);
          }}
        >
          <span>
            <CloudUpload size={30} />
          </span>
          <h3>Arrastra tus archivos aquí</h3>
          <p>o selecciona archivos de tu equipo</p>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Seleccionar archivos
          </Button>
          <input
            ref={inputRef}
            hidden
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.zip,.txt"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />
          <small>PDF, Word, Excel, imágenes, CSV, ZIP y TXT · Máx. 25 MB</small>
          <div className="mobile-upload-actions">
            <Button variant="secondary" icon={FileImage} onClick={() => inputRef.current?.click()}>
              Elegir fotografía
            </Button>
          </div>
        </div>
      )}
      {step === "details" && picked && (
        <div className="upload-details">
          <div className="selected-file">
            <FileIcon type={picked.type} size={25} />
            <div>
              <strong>{picked.name}</strong>
              <small>{picked.size} · Listo para organizar</small>
            </div>
            <Badge status="Vigente" />
            <button
              className="icon-button"
              onClick={() => {
                setPicked(null);
                setStep("pick");
              }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="form-grid">
            <label>
              Carpeta destino
              <select
                value={folder ?? ""}
                onChange={(e) => setFolder(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Mis archivos</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Unidad relacionada
              <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
                <option value="">Sin asociar</option>
                {vehicles.map((item) => (
                  <option key={item.id}>{item.plate}</option>
                ))}
              </select>
            </label>
            <label>
              Trabajador relacionado
              <select value={worker} onChange={(e) => setWorker(e.target.value)}>
                <option value="">Sin asociar</option>
                {workers.map((item) => (
                  <option key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              Categoría
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setDetailError("");
                }}
              >
                {categories.map((item) => (
                  <option key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              Fecha de vencimiento
              {categories.find((item) => item.name === category)?.requiresExpiration && " *"}
              <input
                type="date"
                value={expirationDate}
                onChange={(event) => {
                  setExpirationDate(event.target.value);
                  setDetailError("");
                }}
              />
            </label>
          </div>
          {detailError && (
            <p className="form-note error">
              <AlertCircle size={14} />
              {detailError}
            </p>
          )}
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setStep("pick")} icon={ArrowLeft}>
              Atrás
            </Button>
            <Button onClick={complete} icon={Upload}>
              Guardar en prototipo
            </Button>
          </div>
        </div>
      )}
      {step === "processing" && (
        <div className="processing-state">
          <span>
            <CloudUpload size={27} />
          </span>
          <h3>Organizando documento...</h3>
          <p>Procesando localmente para esta demostración.</p>
          <div>
            <i />
          </div>
        </div>
      )}
    </Modal>
  );
}

function OrganizeDrawer({
  file,
  folders,
  vehicles,
  categories,
  onClose,
  onSave,
}: {
  file: InboxItem;
  folders: DemoFolder[];
  vehicles: Vehicle[];
  categories: CategorySetting[];
  onClose: () => void;
  onSave: (file: InboxItem, parent: number | null, category: string, vehicle: string) => void;
}) {
  const [parent, setParent] = useState<number | null>(null);
  const [category, setCategory] = useState(categories[0]?.name || "Documento general");
  const [vehicle, setVehicle] = useState("");
  return (
    <motion.div
      className="drawer-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.aside
        className="drawer"
        onClick={(e) => e.stopPropagation()}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">Organizar documento</span>
            <h2>{file.name}</h2>
            <p>
              {file.size} · Recibido por {file.source}
            </p>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="drawer-preview">
          <FileIcon type={file.type} size={34} />
          <span>Vista previa demostrativa</span>
        </div>
        <form className="drawer-form">
          <label>
            Nombre del archivo
            <input defaultValue={file.name} />
          </label>
          <label>
            Categoría
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Carpeta destino
            <select
              value={parent ?? ""}
              onChange={(e) => setParent(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Mis archivos</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unidad relacionada
            <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="">Sin asociar</option>
              {vehicles.map((item) => (
                <option key={item.id}>{item.plate}</option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Fecha de emisión
              <input type="date" />
            </label>
            <label>
              Vencimiento
              <input type="date" />
            </label>
          </div>
          <label>
            Etiquetas
            <input placeholder="Ej. urgente, auditoría" />
          </label>
        </form>
        <div className="drawer-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon={MoveRight} onClick={() => onSave(file, parent, category, vehicle)}>
            Guardar en carpeta
          </Button>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function PreviewModal({
  file,
  onClose,
  onFavorite,
  onVersions,
}: {
  file: DemoFile;
  onClose: () => void;
  onFavorite: (id: number) => void;
  onVersions: (file: DemoFile) => void;
}) {
  return (
    <Modal title="Vista previa del documento" onClose={onClose} wide>
      <div className="preview-layout">
        <div className="preview-canvas">
          <div className="fake-document">
            <div className="fake-doc-head">
              <span>MDM</span>
              <div />
              <div />
            </div>
            <h3>{file.category.toUpperCase()}</h3>
            <p>Documento de demostración</p>
            <div className="fake-lines">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <i key={i} />
              ))}
            </div>
            <strong>VISTA PREVIA</strong>
          </div>
          <span>Vista demostrativa · El contenido real no se carga en servidores</span>
        </div>
        <aside className="metadata-panel">
          <FileIcon type={file.type} size={23} />
          <h3>{file.name}</h3>
          <Badge status={file.status || "Vigente"} />
          <dl>
            <div>
              <dt>Tipo</dt>
              <dd>{file.type.toUpperCase()}</dd>
            </div>
            <div>
              <dt>Tamaño</dt>
              <dd>{file.size}</dd>
            </div>
            <div>
              <dt>Fecha de carga</dt>
              <dd>{file.modified}</dd>
            </div>
            <div>
              <dt>Categoría</dt>
              <dd>{file.category}</dd>
            </div>
            <div>
              <dt>Unidad</dt>
              <dd>{file.vehicle || "Sin asociar"}</dd>
            </div>
            <div>
              <dt>Versión</dt>
              <dd>{file.versions?.find((version) => version.current)?.label || "1.0"} · Actual</dd>
            </div>
          </dl>
          <div className="metadata-actions">
            <Button icon={Download} disabled title="Descarga pendiente de almacenamiento backend">
              Descarga no disponible
            </Button>
            <Button
              variant="secondary"
              icon={file.favorite ? Star : FolderHeart}
              onClick={() => onFavorite(file.id)}
            >
              {file.favorite ? "Quitar favorito" : "Añadir a favoritos"}
            </Button>
            <Button variant="secondary" icon={History} onClick={() => onVersions(file)}>
              Consultar versiones
            </Button>
          </div>
        </aside>
      </div>
    </Modal>
  );
}

function SearchModal({
  files,
  folders,
  vehicles,
  workers,
  suppliers,
  companies,
  audits,
  manifests,
  invoices,
  onClose,
  onOpenFile,
  onOpenFolder,
  onNavigate,
}: {
  files: DemoFile[];
  folders: DemoFolder[];
  vehicles: Vehicle[];
  workers: Worker[];
  suppliers: BusinessRecord[];
  companies: BusinessRecord[];
  audits: AuditRecord[];
  manifests: ManifestRecord[];
  invoices: InvoiceRecord[];
  onClose: () => void;
  onOpenFile: (f: DemoFile) => void;
  onOpenFolder: (id: number) => void;
  onNavigate: (route: Route, id?: number) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = files
    .filter((f) =>
      `${f.name} ${f.category} ${f.vehicle}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 5);
  const folderMatches = folders
    .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);
  const entityMatches = query
    ? [
        ...vehicles
          .filter((item) =>
            `${item.plate} ${item.code} ${item.brand}`.toLowerCase().includes(query.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.plate,
            meta: `${item.code} · ${item.brand} ${item.model}`,
            type: "Unidad",
            route: "vehicles" as Route,
          })),
        ...workers
          .filter((item) =>
            `${item.name} ${item.code} ${item.role}`.toLowerCase().includes(query.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            meta: `${item.role} · ${item.code}`,
            type: "Trabajador",
            route: "workers" as Route,
          })),
        ...suppliers
          .filter((item) =>
            `${item.name} ${item.legalName}`.toLowerCase().includes(query.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            meta: item.legalName,
            type: "Proveedor",
            route: "suppliers" as Route,
          })),
        ...companies
          .filter((item) =>
            `${item.name} ${item.legalName}`.toLowerCase().includes(query.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            meta: item.legalName,
            type: "Empresa",
            route: "companies" as Route,
          })),
        ...audits
          .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
          .map((item) => ({
            id: item.id,
            name: item.name,
            meta: `${item.status} · ${item.period}`,
            type: "Auditoría",
            route: "audits" as Route,
          })),
        ...manifests
          .filter((item) =>
            `${item.number} ${item.vehicle} ${item.company} ${item.service}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.number,
            meta: `${item.vehicle} · ${item.company}`,
            type: "Manifiesto",
            route: "manifests" as Route,
          })),
        ...invoices
          .filter((item) =>
            `${item.number} ${item.company}`.toLowerCase().includes(query.toLowerCase()),
          )
          .map((item) => ({
            id: item.id,
            name: item.number,
            meta: `${item.company} · ${item.status}`,
            type: "Factura",
            route: "invoices" as Route,
          })),
      ].slice(0, 6)
    : [];
  return (
    <Modal
      title="Búsqueda global"
      subtitle="Busca por nombre, placa, categoría o etiqueta."
      onClose={onClose}
      wide
    >
      <div className="global-search-input">
        <Search size={21} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej. SOAT T3X-456"
        />
        <kbd>ESC</kbd>
      </div>
      {!query ? (
        <div className="search-empty">
          <span className="eyebrow">Búsquedas sugeridas</span>
          <div>
            <button onClick={() => setQuery("SOAT")}>SOAT</button>
            <button onClick={() => setQuery("T3X-456")}>T3X-456</button>
            <button onClick={() => setQuery("Factura")}>Facturas</button>
          </div>
          <p>
            <Search size={17} />
            Escribe para buscar en todos los datos de demostración.
          </p>
        </div>
      ) : (
        <div className="search-results">
          <span className="eyebrow">
            {matches.length + folderMatches.length + entityMatches.length} resultados
          </span>
          {matches.map((f) => (
            <button key={f.id} onClick={() => onOpenFile(f)}>
              <FileIcon type={f.type} />
              <div>
                <strong>{f.name}</strong>
                <small>
                  {f.category} · {f.vehicle || "General"}
                </small>
              </div>
              <ChevronRight size={16} />
            </button>
          ))}
          {folderMatches.map((f) => (
            <button key={f.id} onClick={() => onOpenFolder(f.id)}>
              <span className="folder-mini">
                <Folder size={18} />
              </span>
              <div>
                <strong>{f.name}</strong>
                <small>Carpeta · {f.modified}</small>
              </div>
              <ChevronRight size={16} />
            </button>
          ))}
          {entityMatches.length > 0 && (
            <span className="search-group-label">Registros relacionados</span>
          )}
          {entityMatches.map((item) => (
            <button key={`${item.type}-${item.id}`} onClick={() => onNavigate(item.route, item.id)}>
              <span className="folder-mini">
                {item.route === "vehicles" ? (
                  <Bus size={18} />
                ) : item.route === "workers" ? (
                  <UserRound size={18} />
                ) : item.route === "audits" ? (
                  <BookOpenCheck size={18} />
                ) : item.route === "invoices" ? (
                  <ReceiptText size={18} />
                ) : item.route === "manifests" ? (
                  <Files size={18} />
                ) : (
                  <Building2 size={18} />
                )}
              </span>
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.type} · {item.meta}
                </small>
              </div>
              <ChevronRight size={16} />
            </button>
          ))}
          {!matches.length && !folderMatches.length && !entityMatches.length && (
            <EmptyState
              icon={Search}
              title="Sin resultados"
              text={`No encontramos coincidencias para “${query}”.`}
            />
          )}
        </div>
      )}
    </Modal>
  );
}

function MobileNav({
  route,
  onRoute,
  onUpload,
}: {
  route: Route;
  onRoute: (r: Route) => void;
  onUpload: () => void;
}) {
  return (
    <nav className="mobile-nav">
      <button
        className={route === "dashboard" ? "active" : ""}
        onClick={() => onRoute("dashboard")}
        aria-current={route === "dashboard" ? "page" : undefined}
      >
        <Home size={20} />
        <span>Inicio</span>
      </button>
      <button
        className={route === "files" ? "active" : ""}
        onClick={() => onRoute("files")}
        aria-current={route === "files" ? "page" : undefined}
      >
        <Folder size={20} />
        <span>Archivos</span>
      </button>
      <button className="mobile-upload" onClick={onUpload} aria-label="Subir archivo">
        <span>
          <Plus size={23} />
        </span>
        <small>Subir</small>
      </button>
      <button
        className={route === "vehicles" ? "active" : ""}
        onClick={() => onRoute("vehicles")}
        aria-current={route === "vehicles" ? "page" : undefined}
      >
        <Bus size={20} />
        <span>Unidades</span>
      </button>
      <button
        onClick={() => document.querySelector<HTMLButtonElement>(".menu-button")?.click()}
        aria-label="Abrir más opciones"
      >
        <LayoutGrid size={20} />
        <span>Más</span>
      </button>
    </nav>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [route, setRoute] = useState<Route>("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [folders, setFolders] = useState(initialFolders);
  const [files, setFiles] = useState(initialFiles);
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [workers, setWorkers] = useState(initialWorkers);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [companies, setCompanies] = useState(initialCompanies);
  const [manifests, setManifests] = useState(initialManifests);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [audits, setAudits] = useState(initialAudits);
  const [categories, setCategories] = useState(initialCategories);
  const [templates, setTemplates] = useState(initialTemplates);
  const [trash, setTrash] = useState(initialTrash);
  const [inbox, setInbox] = useState(initialInbox);
  const [currentFolder, setCurrentFolder] = useState<number | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [modal, setModal] = useState<
    | "folder"
    | "upload"
    | "search"
    | "worker"
    | "supplier"
    | "company"
    | "manifest"
    | "invoice"
    | null
  >(null);
  const [vehicleScreen, setVehicleScreen] = useState<"list" | "register" | "profile" | "dossier">(
    "list",
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [auditScreen, setAuditScreen] = useState<"center" | "wizard" | "checklist" | "package">(
    "center",
  );
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<{
    mode: "supplier" | "company";
    record: BusinessRecord;
  } | null>(null);
  const [folderContext, setFolderContext] = useState<{
    parent: number | null;
    stayInDossier: boolean;
  } | null>(null);
  const [uploadVehicleId, setUploadVehicleId] = useState<number | null>(null);
  const [uploadWorkerId, setUploadWorkerId] = useState<number | null>(null);
  const [preview, setPreview] = useState<DemoFile | null>(null);
  const [versionFile, setVersionFile] = useState<DemoFile | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<TrashEntry | null>(null);
  const [organize, setOrganize] = useState<InboxItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [toast, setToast] = useState("");
  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setModal("search");
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);
  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }
  function goTo(next: Route) {
    setRoute(next);
    if (next === "vehicles") setVehicleScreen("list");
    if (next === "workers") setSelectedWorkerId(null);
    if (next === "audits") {
      setAuditScreen("center");
      setSelectedAuditId(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openRegisterVehicle() {
    setRoute("vehicles");
    setVehicleScreen("register");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openNewAudit() {
    setRoute("audits");
    setSelectedAuditId(null);
    setAuditScreen("wizard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openGeneralUpload() {
    setUploadVehicleId(null);
    setUploadWorkerId(null);
    setModal("upload");
  }
  function openVehicle(vehicle: Vehicle) {
    setSelectedVehicleId(vehicle.id);
    setRoute("vehicles");
    setVehicleScreen("profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function createVehicle(vehicle: Omit<Vehicle, "id" | "folderId">, templateCategories: string[]) {
    const rootId = Date.now();
    const categoryFolders = templateCategories.map((name, index) => ({
      id: rootId + index + 1,
      name,
      parent: rootId,
      modified: "Ahora",
      color: ["emerald", "teal", "blue", "amber", "violet"][index % 5],
    }));
    setFolders((previous) => [
      ...previous,
      {
        id: rootId,
        name: vehicle.plate,
        parent: 1,
        modified: "Ahora",
        color: "emerald",
      },
      ...categoryFolders,
    ]);
    const created: Vehicle = { ...vehicle, id: rootId, folderId: rootId };
    setVehicles((previous) => [...previous, created]);
    setSelectedVehicleId(created.id);
    setVehicleScreen("profile");
    showToast(
      templateCategories.length
        ? `Unidad ${created.plate} y expediente creados correctamente.`
        : `Unidad ${created.plate} registrada con expediente vacío.`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function createWorker(
    worker: Omit<Worker, "id" | "folderId" | "initials">,
    templateCategories: string[],
  ) {
    const rootId = Date.now();
    const initials = worker.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
    const created: Worker = { ...worker, id: rootId, folderId: rootId, initials };
    setFolders((previous) => [
      ...previous,
      { id: rootId, name: worker.name, parent: 2, modified: "Ahora", color: "teal" },
      ...templateCategories.map((name, index) => ({
        id: rootId + index + 1,
        name,
        parent: rootId,
        modified: "Ahora",
        color: ["blue", "amber", "emerald", "violet"][index],
      })),
    ]);
    setWorkers((previous) => [...previous, created]);
    setSelectedWorkerId(created.id);
    setModal(null);
    showToast(`Trabajador ${created.name} registrado con expediente.`);
  }
  function updateVehicle(id: number, patch: Partial<Vehicle>) {
    const current = vehicles.find((vehicle) => vehicle.id === id);
    if (!current) return;
    setVehicles((previous) =>
      previous.map((vehicle) => (vehicle.id === id ? { ...vehicle, ...patch } : vehicle)),
    );
    if (patch.plate && patch.plate !== current.plate) {
      setFiles((previous) =>
        previous.map((file) =>
          file.vehicle === current.plate ? { ...file, vehicle: patch.plate } : file,
        ),
      );
      setFolders((previous) =>
        previous.map((folder) =>
          folder.id === current.folderId ? { ...folder, name: patch.plate! } : folder,
        ),
      );
    }
  }
  function createFolder(name: string, parent: number | null, color: string) {
    const id = Date.now();
    setFolders((prev) => [...prev, { id, name, parent, color, modified: "Ahora" }]);
    setModal(null);
    if (!folderContext?.stayInDossier) {
      setRoute("files");
      setCurrentFolder(parent);
    }
    setFolderContext(null);
    showToast(`Carpeta “${name}” creada correctamente.`);
  }
  function completeUpload(file: DemoFile) {
    setFiles((prev) => [file, ...prev]);
    setModal(null);
    if (uploadVehicleId || uploadWorkerId) {
      if (uploadVehicleId) {
        setRoute("vehicles");
        setVehicleScreen("profile");
      } else {
        setRoute("workers");
      }
    } else {
      setRoute("files");
      setCurrentFolder(file.parent);
    }
    setUploadVehicleId(null);
    setUploadWorkerId(null);
    setPreview(file);
    showToast("Documento añadido al prototipo.");
  }
  function organizeFile(file: InboxItem, parent: number | null, category: string, vehicle: string) {
    const organized: DemoFile = {
      ...file,
      parent,
      category,
      vehicle: vehicle || undefined,
      modified: "Ahora",
      status: "Vigente",
    };
    setFiles((prev) => [organized, ...prev]);
    setInbox((prev) => prev.filter((i) => i.id !== file.id));
    setOrganize(null);
    setSelectedIds((prev) => prev.filter((id) => id !== file.id));
    showToast("Documento organizado y guardado en Mis archivos.");
  }
  function toggleFavorite(id: number) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, favorite: !f.favorite } : f)));
    setPreview((prev) => (prev?.id === id ? { ...prev, favorite: !prev.favorite } : prev));
    showToast("Favoritos actualizados.");
  }
  function trashFile(id: number) {
    const file = files.find((item) => item.id === id);
    if (!file) return;
    setFiles((previous) => previous.filter((item) => item.id !== id));
    setTrash((previous) => [
      {
        id: Date.now(),
        name: file.name,
        kind: "Archivo",
        deletedAt: "Ahora",
        files: [file],
        folders: [],
      },
      ...previous,
    ]);
    showToast(`“${file.name}” se movió a la papelera.`);
  }
  function trashFolder(id: number) {
    const root = folders.find((item) => item.id === id);
    if (!root) return;
    const ids = new Set<number>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      folders.forEach((folder) => {
        if (folder.parent !== null && ids.has(folder.parent) && !ids.has(folder.id)) {
          ids.add(folder.id);
          changed = true;
        }
      });
    }
    const removedFolders = folders.filter((folder) => ids.has(folder.id));
    const removedFiles = files.filter((file) => file.parent !== null && ids.has(file.parent));
    setFolders((previous) => previous.filter((folder) => !ids.has(folder.id)));
    setFiles((previous) =>
      previous.filter((file) => file.parent === null || !ids.has(file.parent)),
    );
    setTrash((previous) => [
      {
        id: Date.now(),
        name: root.name,
        kind: "Carpeta",
        deletedAt: "Ahora",
        files: removedFiles,
        folders: removedFolders,
      },
      ...previous,
    ]);
    if (currentFolder !== null && ids.has(currentFolder)) setCurrentFolder(root.parent);
    showToast(`Carpeta “${root.name}” movida a la papelera.`);
  }
  function restoreTrashEntry(id: number) {
    const entry = trash.find((item) => item.id === id);
    if (!entry) return;
    setFiles((previous) => [...previous, ...entry.files]);
    setFolders((previous) => [...previous, ...entry.folders]);
    setTrash((previous) => previous.filter((item) => item.id !== id));
    showToast(`“${entry.name}” restaurado en su ubicación original.`);
  }
  function restoreVersion(fileId: number, versionId: number) {
    setFiles((previous) =>
      previous.map((file) => {
        if (file.id !== fileId) return file;
        const versions = (
          file.versions || [
            { id: file.id * 10, label: "1.0", date: file.modified, size: file.size, current: true },
          ]
        ).map((version) => ({ ...version, current: version.id === versionId }));
        const restored = versions.find((version) => version.id === versionId);
        return {
          ...file,
          modified: "Ahora",
          versions: [
            {
              id: Date.now(),
              label: `${versions.length + 1}.0`,
              date: "Ahora · restaurada",
              size: restored?.size || file.size,
              current: true,
            },
            ...versions.map((version) => ({ ...version, current: false })),
          ],
        };
      }),
    );
    setVersionFile(null);
    showToast("Versión restaurada como una nueva versión actual.");
  }
  function saveAudit(audit: AuditRecord, preparePackage: boolean) {
    setAudits((previous) => {
      const exists = previous.some((item) => item.id === audit.id);
      return exists
        ? previous.map((item) => (item.id === audit.id ? audit : item))
        : [audit, ...previous];
    });
    setSelectedAuditId(audit.id);
    setAuditScreen(preparePackage ? "package" : "checklist");
    showToast(
      preparePackage
        ? "Auditoría guardada. Vista previa del paquete preparada."
        : "Auditoría guardada en el estado local.",
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateAudit(audit: AuditRecord) {
    setAudits((previous) => previous.map((item) => (item.id === audit.id ? audit : item)));
  }
  function previewAuditEvidence(evidence: AuditEvidence) {
    if (!evidence.name) return;
    if (evidence.file) {
      setPreview(evidence.file);
      return;
    }
    setPreview({
      id: Date.now(),
      name: evidence.name,
      type: "pdf",
      size: "Registro demostrativo",
      modified: "Disponible en la sesión",
      category: evidence.requirement,
      parent: null,
      status: evidence.status === "Vencido" ? "Vencido" : "Vigente",
    });
  }
  if (!loggedIn) return <Login onEnter={() => setLoggedIn(true)} />;
  const coreRoutes: Route[] = [
    "dashboard",
    "files",
    "inbox",
    "vehicles",
    "workers",
    "suppliers",
    "companies",
    "manifests",
    "invoices",
    "expirations",
    "audits",
    "favorites",
    "trash",
    "settings",
  ];
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null;
  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId) || null;
  const selectedAudit = audits.find((audit) => audit.id === selectedAuditId) || null;
  return (
    <div className="app-shell">
      <Sidebar
        route={route}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onRoute={goTo}
        onCollapse={() => setCollapsed(!collapsed)}
        onClose={() => setMobileOpen(false)}
      />
      <div className={`app-main ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Topbar
          route={route}
          onMenu={() => setMobileOpen(true)}
          onUpload={openGeneralUpload}
          onSearch={() => setModal("search")}
          onNotifications={() => goTo("expirations")}
          onAccount={() => goTo("settings")}
        />
        <main id="main-content" tabIndex={-1}>
          {route === "dashboard" && (
            <Dashboard
              files={files}
              vehicles={vehicles}
              auditCount={audits.filter((audit) => audit.status !== "Completada").length}
              inboxCount={inbox.length}
              goTo={goTo}
              onUpload={openGeneralUpload}
              onNewFolder={() => {
                setFolderContext({ parent: null, stayInDossier: false });
                setModal("folder");
              }}
              onRegisterVehicle={openRegisterVehicle}
              onNewAudit={openNewAudit}
              onPreview={setPreview}
            />
          )}
          {route === "files" && (
            <FileExplorer
              folders={folders}
              files={files}
              currentFolder={currentFolder}
              setCurrentFolder={setCurrentFolder}
              onNewFolder={() => {
                setFolderContext({ parent: currentFolder, stayInDossier: false });
                setModal("folder");
              }}
              onUpload={() => {
                setUploadVehicleId(null);
                setModal("upload");
              }}
              onPreview={setPreview}
              onFavorite={toggleFavorite}
              onTrashFile={trashFile}
              onTrashFolder={trashFolder}
              view={view}
              setView={setView}
            />
          )}
          {route === "inbox" && (
            <InboxPage
              items={inbox}
              onSelect={setOrganize}
              selectedIds={selectedIds}
              toggleSelect={(id) =>
                setSelectedIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
            />
          )}
          {route === "workers" && !selectedWorker && (
            <WorkersPage
              workers={workers}
              files={files}
              onOpen={(worker) => setSelectedWorkerId(worker.id)}
              onAdd={() => setModal("worker")}
            />
          )}
          {route === "workers" && selectedWorker && (
            <WorkerProfilePage
              worker={selectedWorker}
              files={files}
              folders={folders}
              onBack={() => setSelectedWorkerId(null)}
              onPreview={setPreview}
              onUpload={() => {
                setUploadWorkerId(selectedWorker.id);
                setUploadVehicleId(null);
                setModal("upload");
              }}
              onNewCategory={() => {
                setFolderContext({ parent: selectedWorker.folderId, stayInDossier: true });
                setModal("folder");
              }}
            />
          )}
          {route === "suppliers" && (
            <BusinessPage
              mode="supplier"
              records={suppliers}
              files={files}
              onAdd={() => {
                setEditingBusiness(null);
                setModal("supplier");
              }}
              onOpenFolder={(id) => {
                setCurrentFolder(id);
                setRoute("files");
              }}
              onEdit={(record) => {
                setEditingBusiness({ mode: "supplier", record });
                setModal("supplier");
              }}
            />
          )}
          {route === "companies" && (
            <BusinessPage
              mode="company"
              records={companies}
              files={files}
              onAdd={() => {
                setEditingBusiness(null);
                setModal("company");
              }}
              onOpenFolder={(id) => {
                setCurrentFolder(id);
                setRoute("files");
              }}
              onEdit={(record) => {
                setEditingBusiness({ mode: "company", record });
                setModal("company");
              }}
            />
          )}
          {route === "manifests" && (
            <ManifestsPage
              manifests={manifests}
              vehicles={vehicles}
              companies={companies}
              onAdd={() => setModal("manifest")}
            />
          )}
          {route === "invoices" && (
            <InvoicesPage invoices={invoices} onAdd={() => setModal("invoice")} />
          )}
          {route === "expirations" && <ExpirationsPage files={files} onPreview={setPreview} />}
          {route === "favorites" && (
            <FavoritesPage files={files} onPreview={setPreview} onToggle={toggleFavorite} />
          )}
          {route === "trash" && (
            <TrashPage
              entries={trash}
              onRestore={restoreTrashEntry}
              onRequestDelete={setDeleteConfirmation}
            />
          )}
          {route === "settings" && (
            <SettingsPage
              categories={categories}
              templates={templates}
              onAddCategory={(category) => {
                setCategories((previous) => [...previous, { ...category, id: Date.now() }]);
                showToast("Categoría añadida a los flujos documentales.");
              }}
              onDeleteCategory={(id) =>
                setCategories((previous) => previous.filter((item) => item.id !== id))
              }
              onAddTemplate={(template) => {
                setTemplates((previous) => [...previous, { ...template, id: Date.now() }]);
                showToast("Plantilla disponible en el flujo correspondiente.");
              }}
              onToggleTemplate={(id) =>
                setTemplates((previous) =>
                  previous.map((item) =>
                    item.id === id ? { ...item, active: !item.active } : item,
                  ),
                )
              }
              onDeleteTemplate={(id) =>
                setTemplates((previous) => previous.filter((item) => item.id !== id))
              }
            />
          )}
          {route === "audits" && auditScreen === "center" && (
            <AuditCenterPage
              audits={audits}
              files={files}
              vehicles={vehicles}
              workers={workers}
              companies={companies}
              manifests={manifests}
              invoices={invoices}
              onNew={openNewAudit}
              onOpen={(audit) => {
                setSelectedAuditId(audit.id);
                setAuditScreen("checklist");
              }}
              onDuplicate={(audit) => {
                const duplicate = {
                  ...audit,
                  id: Date.now(),
                  name: `${audit.name} — copia`,
                  status: "Borrador" as const,
                  manuallyReviewed: [],
                  excludedEvidence: [],
                  updated: "Ahora",
                };
                setAudits((previous) => [duplicate, ...previous]);
                setSelectedAuditId(duplicate.id);
                setAuditScreen("wizard");
                showToast("Auditoría duplicada como borrador.");
              }}
              onPackage={(audit) => {
                setSelectedAuditId(audit.id);
                setAuditScreen("package");
              }}
            />
          )}
          {route === "audits" && auditScreen === "wizard" && (
            <AuditWizard
              key={selectedAudit?.id || "new-audit"}
              initial={selectedAudit}
              files={files}
              vehicles={vehicles}
              workers={workers}
              companies={companies}
              manifests={manifests}
              invoices={invoices}
              templates={templates}
              onCancel={() => setAuditScreen("center")}
              onSave={saveAudit}
              onPreview={previewAuditEvidence}
            />
          )}
          {route === "audits" && auditScreen === "checklist" && selectedAudit && (
            <AuditChecklistPage
              audit={selectedAudit}
              files={files}
              vehicles={vehicles}
              workers={workers}
              companies={companies}
              manifests={manifests}
              invoices={invoices}
              onBack={() => setAuditScreen("center")}
              onModify={() => setAuditScreen("wizard")}
              onPackage={() => setAuditScreen("package")}
              onUpdate={updateAudit}
              onPreview={previewAuditEvidence}
              onOpenExplorer={() => {
                setCurrentFolder(null);
                setRoute("files");
              }}
            />
          )}
          {route === "audits" && auditScreen === "package" && selectedAudit && (
            <AuditPackagePage
              audit={selectedAudit}
              files={files}
              vehicles={vehicles}
              workers={workers}
              companies={companies}
              manifests={manifests}
              invoices={invoices}
              onBack={() => setAuditScreen("center")}
              onChecklist={() => setAuditScreen("checklist")}
              onUpdate={updateAudit}
              onPreview={previewAuditEvidence}
            />
          )}
          {route === "vehicles" && vehicleScreen === "list" && (
            <VehiclesPage
              vehicles={vehicles}
              files={files}
              onRegister={openRegisterVehicle}
              onOpen={openVehicle}
            />
          )}
          {route === "vehicles" && vehicleScreen === "register" && (
            <VehicleFormPage
              onBack={() => setVehicleScreen("list")}
              onCreate={createVehicle}
              existingPlates={vehicles.map((vehicle) => vehicle.plate)}
              templates={templates}
            />
          )}
          {route === "vehicles" && vehicleScreen === "profile" && selectedVehicle && (
            <VehicleProfilePage
              vehicle={selectedVehicle}
              files={files}
              onBack={() => setVehicleScreen("list")}
              onEdit={() => setEditingVehicle(true)}
              onDossier={() => setVehicleScreen("dossier")}
              onUploadDocument={() => {
                setUploadVehicleId(selectedVehicle.id);
                setModal("upload");
              }}
              onPreview={setPreview}
              onUpdate={(patch) => updateVehicle(selectedVehicle.id, patch)}
            />
          )}
          {route === "vehicles" && vehicleScreen === "dossier" && selectedVehicle && (
            <VehicleDossierPage
              vehicle={selectedVehicle}
              folders={folders}
              files={files}
              onBack={() => setVehicleScreen("profile")}
              onOpenFolder={(id) => {
                setCurrentFolder(id);
                setRoute("files");
              }}
              onNewFolder={() => {
                setFolderContext({ parent: selectedVehicle.folderId, stayInDossier: true });
                setModal("folder");
              }}
              onUpload={() => {
                setUploadVehicleId(selectedVehicle.id);
                setModal("upload");
              }}
              onPreview={setPreview}
            />
          )}
          {!coreRoutes.includes(route) && <PlaceholderPage route={route} goTo={goTo} />}
        </main>
      </div>
      <MobileNav route={route} onRoute={goTo} onUpload={openGeneralUpload} />
      <AnimatePresence>
        {modal === "folder" && (
          <NewFolderModal
            folders={folders}
            parent={folderContext ? folderContext.parent : currentFolder}
            onClose={() => {
              setModal(null);
              setFolderContext(null);
            }}
            onCreate={createFolder}
          />
        )}
        {modal === "upload" && (
          <UploadModal
            folders={folders}
            vehicles={vehicles}
            workers={workers}
            categories={categories}
            defaultVehicle={
              uploadVehicleId
                ? vehicles.find((vehicle) => vehicle.id === uploadVehicleId)?.plate
                : undefined
            }
            defaultWorker={
              uploadWorkerId
                ? workers.find((worker) => worker.id === uploadWorkerId)?.name
                : undefined
            }
            defaultFolder={
              uploadVehicleId
                ? vehicles.find((vehicle) => vehicle.id === uploadVehicleId)?.folderId
                : uploadWorkerId
                  ? workers.find((worker) => worker.id === uploadWorkerId)?.folderId
                  : undefined
            }
            onClose={() => {
              setModal(null);
              setUploadVehicleId(null);
              setUploadWorkerId(null);
            }}
            onComplete={completeUpload}
          />
        )}
        {modal === "search" && (
          <SearchModal
            files={files}
            folders={folders}
            vehicles={vehicles}
            workers={workers}
            suppliers={suppliers}
            companies={companies}
            audits={audits}
            manifests={manifests}
            invoices={invoices}
            onClose={() => setModal(null)}
            onOpenFile={(f) => {
              setModal(null);
              setPreview(f);
            }}
            onOpenFolder={(id) => {
              setModal(null);
              setCurrentFolder(id);
              setRoute("files");
            }}
            onNavigate={(nextRoute, id) => {
              setModal(null);
              setRoute(nextRoute);
              if (nextRoute === "vehicles" && id) {
                setSelectedVehicleId(id);
                setVehicleScreen("profile");
              } else if (nextRoute === "workers" && id) {
                setSelectedWorkerId(id);
              } else if (nextRoute === "audits" && id) {
                setSelectedAuditId(id);
                setAuditScreen("checklist");
              }
            }}
          />
        )}
        {preview && (
          <PreviewModal
            file={files.find((f) => f.id === preview.id) || preview}
            onClose={() => setPreview(null)}
            onFavorite={toggleFavorite}
            onVersions={(file) => {
              setPreview(null);
              setVersionFile(file);
            }}
          />
        )}
        {organize && (
          <OrganizeDrawer
            file={organize}
            folders={folders}
            vehicles={vehicles}
            categories={categories}
            onClose={() => setOrganize(null)}
            onSave={organizeFile}
          />
        )}
        {editingVehicle && selectedVehicle && (
          <EditVehicleModal
            vehicle={selectedVehicle}
            onClose={() => setEditingVehicle(false)}
            onSave={(patch) => {
              updateVehicle(selectedVehicle.id, patch);
              setEditingVehicle(false);
              showToast("Datos de la unidad actualizados.");
            }}
          />
        )}
        {modal === "worker" && (
          <WorkerModal
            templates={templates}
            onClose={() => setModal(null)}
            onCreate={createWorker}
          />
        )}
        {versionFile && (
          <VersionsModal
            file={files.find((file) => file.id === versionFile.id) || versionFile}
            onClose={() => setVersionFile(null)}
            onRestore={restoreVersion}
          />
        )}
        {deleteConfirmation && (
          <ConfirmationDialog
            title={`Eliminar “${deleteConfirmation.name}”`}
            text="Se eliminará permanentemente de la papelera demostrativa."
            onClose={() => setDeleteConfirmation(null)}
            onConfirm={() => {
              setTrash((previous) => previous.filter((item) => item.id !== deleteConfirmation.id));
              setDeleteConfirmation(null);
              showToast("Elemento eliminado permanentemente de la sesión.");
            }}
          />
        )}
        {modal === "supplier" && (
          <BusinessModal
            mode="supplier"
            initial={editingBusiness?.mode === "supplier" ? editingBusiness.record : null}
            onClose={() => {
              setModal(null);
              setEditingBusiness(null);
            }}
            onCreate={(record) => {
              if (editingBusiness?.mode === "supplier") {
                setSuppliers((previous) =>
                  previous.map((item) =>
                    item.id === editingBusiness.record.id
                      ? { ...item, ...record, updated: "Ahora" }
                      : item,
                  ),
                );
                setFolders((previous) =>
                  previous.map((folder) =>
                    folder.id === editingBusiness.record.folderId
                      ? { ...folder, name: record.name, modified: "Ahora" }
                      : folder,
                  ),
                );
              } else {
                const id = Date.now();
                setSuppliers((previous) => [
                  ...previous,
                  { ...record, id, folderId: id, updated: "Ahora" },
                ]);
                setFolders((previous) => [
                  ...previous,
                  { id, name: record.name, parent: 30, modified: "Ahora", color: "amber" },
                ]);
              }
              setModal(null);
              setEditingBusiness(null);
              showToast(
                editingBusiness
                  ? "Proveedor actualizado."
                  : "Proveedor registrado en el prototipo.",
              );
            }}
          />
        )}
        {modal === "company" && (
          <BusinessModal
            mode="company"
            initial={editingBusiness?.mode === "company" ? editingBusiness.record : null}
            onClose={() => {
              setModal(null);
              setEditingBusiness(null);
            }}
            onCreate={(record) => {
              if (editingBusiness?.mode === "company") {
                setCompanies((previous) =>
                  previous.map((item) =>
                    item.id === editingBusiness.record.id
                      ? { ...item, ...record, updated: "Ahora" }
                      : item,
                  ),
                );
                setFolders((previous) =>
                  previous.map((folder) =>
                    folder.id === editingBusiness.record.folderId
                      ? { ...folder, name: record.name, modified: "Ahora" }
                      : folder,
                  ),
                );
              } else {
                const id = Date.now();
                setCompanies((previous) => [
                  ...previous,
                  { ...record, id, folderId: id, updated: "Ahora" },
                ]);
                setFolders((previous) => [
                  ...previous,
                  { id, name: record.name, parent: 31, modified: "Ahora", color: "blue" },
                ]);
              }
              setModal(null);
              setEditingBusiness(null);
              showToast(
                editingBusiness ? "Empresa actualizada." : "Empresa contratante registrada.",
              );
            }}
          />
        )}
        {modal === "manifest" && (
          <ManifestModal
            vehicles={vehicles}
            companies={companies}
            onClose={() => setModal(null)}
            onCreate={(record) => {
              const id = Date.now();
              setManifests((previous) => [{ ...record, id }, ...previous]);
              setFiles((previous) => [
                {
                  id: id + 1,
                  name: record.fileName,
                  type: "pdf",
                  size: "Archivo local",
                  modified: "Ahora",
                  category: "Manifiestos",
                  parent: null,
                  vehicle: record.vehicle,
                  company: record.company,
                  issuedDate: record.date,
                  status: "Vigente",
                },
                ...previous,
              ]);
              setModal(null);
              showToast("Manifiesto añadido al registro demostrativo.");
            }}
          />
        )}
        {modal === "invoice" && (
          <InvoiceModal
            companies={companies}
            onClose={() => setModal(null)}
            onCreate={(record) => {
              const id = Date.now();
              setInvoices((previous) => [{ ...record, id }, ...previous]);
              setFiles((previous) => [
                {
                  id: id + 1,
                  name: record.fileName,
                  type: "pdf",
                  size: "Archivo local",
                  modified: "Ahora",
                  category: "Facturas",
                  parent: 4,
                  company: record.company,
                  issuedDate: record.date,
                  status: record.status === "Vencida" ? "Vencido" : "Vigente",
                },
                ...previous,
              ]);
              setModal(null);
              showToast("Factura registrada en el prototipo.");
            }}
          />
        )}
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <span>
              <Check size={16} />
            </span>
            {toast}
            <button onClick={() => setToast("")}>
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
