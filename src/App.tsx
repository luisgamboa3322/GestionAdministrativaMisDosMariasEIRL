import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import type {
  AuthSession,
  Route,
  DemoFile,
  DemoFolder,
  TrashEntry,
  InboxItem,
  Vehicle,
  Worker,
  BusinessRecord,
  AuditRecord,
  AuditEvidence,
} from "@/types";
import {
  checkNotificationsApi,
  createAuditApi,
  createCategoryApi,
  createCompanyApi,
  createFolderApi,
  createInvoiceApi,
  createManifestApi,
  createTemplateApi,
  createVehicleApi,
  createWorkerApi,
  deleteCategoryApi,
  deleteDocumentApi,
  deleteFolderApi,
  deleteVehiclePhotoApi,
  generateAuditExportApi,
  getMeApi,
  listAuditsApi,
  listCategoriesApi,
  listCompaniesApi,
  listDocumentsApi,
  listFoldersApi,
  listInvoicesApi,
  listManifestsApi,
  listTemplatesApi,
  listVehiclesApi,
  listWorkersApi,
  logoutApi,
  mapApiAudit,
  mapApiCompany,
  mapApiDocument,
  mapApiFolder,
  mapApiInboxItem,
  mapApiInvoice,
  mapApiManifest,
  mapApiVehicle,
  mapApiWorker,
  restoreDocumentApi,
  restoreFolderApi,
  setVehicleCoverPhotoApi,
  toggleTemplateApi,
  updateAuditApi,
  updateCompanyApi,
  updateDocumentApi,
  updateFolderApi,
  updateVehicleApi,
  uploadDocumentApi,
  uploadDocumentVersionApi,
  uploadVehiclePhotoApi,
} from "@/lib/api";
import {
  initialCategories,
  initialTemplates,
  initialFolders,
  initialFiles,
  initialVehicles,
  initialWorkers,
  initialSuppliers,
  initialCompanies,
  initialManifests,
  initialInvoices,
  initialAudits,
  initialTrash,
  initialInbox,
} from "@/data/demo";
import { ConfirmationDialog } from "@/components/ui/Modal";
import { PlaceholderPage } from "@/components/ui/Common";
import { Sidebar, Topbar, MobileNav } from "@/components/layout/AppLayout";
import { Login } from "@/features/auth/Login";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { FileExplorer } from "@/features/files/FileExplorer";
import { InboxPage } from "@/features/files/InboxPage";
import { FavoritesPage } from "@/features/files/FavoritesPage";
import { TrashPage } from "@/features/files/TrashPage";
import {
  VersionsModal,
  NewFolderModal,
  UploadModal,
  OrganizeDrawer,
  PreviewModal,
  RenameMoveModal,
  SearchModal,
} from "@/features/files/FileModals";
import { VehiclesPage } from "@/features/vehicles/VehiclesPage";
import { VehicleFormPage } from "@/features/vehicles/VehicleFormPage";
import { VehicleProfilePage } from "@/features/vehicles/VehicleProfilePage";
import { VehicleDossierPage } from "@/features/vehicles/VehicleDossierPage";
import { EditVehicleModal } from "@/features/vehicles/EditVehicleModal";
import { WorkersPage } from "@/features/workers/WorkersPage";
import { WorkerProfilePage } from "@/features/workers/WorkerProfilePage";
import { WorkerModal } from "@/features/workers/WorkerModal";
import { BusinessPage } from "@/features/business/BusinessPage";
import { BusinessModal } from "@/features/business/BusinessModal";
import { ManifestsPage } from "@/features/business/ManifestsPage";
import { ManifestModal } from "@/features/business/ManifestModal";
import { InvoicesPage } from "@/features/business/InvoicesPage";
import { InvoiceModal } from "@/features/business/InvoiceModal";
import { ExpirationsPage } from "@/features/expirations/ExpirationsPage";
import { AuditCenterPage } from "@/features/audits/AuditCenterPage";
import { AuditWizard } from "@/features/audits/AuditWizard";
import { AuditChecklistPage } from "@/features/audits/AuditChecklistPage";
import { AuditPackagePage } from "@/features/audits/AuditPackagePage";
import { SettingsPage } from "@/features/settings/SettingsPage";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"demo" | "live">("demo");
  const [session, setSession] = useState<AuthSession | null>(null);
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
  const [renameMoveTarget, setRenameMoveTarget] = useState<
    { kind: "folder"; item: DemoFolder } | { kind: "file"; item: DemoFile } | null
  >(null);
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
  async function loadLiveWorkspace() {
    const [
      apiFolders,
      apiDocs,
      apiVehicles,
      apiWorkers,
      apiCompanies,
      apiManifests,
      apiInvoices,
      apiAudits,
      apiCategories,
      apiTemplates,
    ] = await Promise.all([
      listFoldersApi(true),
      listDocumentsApi({ includeDeleted: true }),
      listVehiclesApi(),
      listWorkersApi(),
      listCompaniesApi(),
      listManifestsApi(),
      listInvoicesApi(),
      listAuditsApi(),
      listCategoriesApi(),
      listTemplatesApi(),
    ]);
    void checkNotificationsApi().catch(() => {});
    const vehiclePlateById = new Map(apiVehicles.map((v) => [v.id, v.plate]));
    const workerNameById = new Map(apiWorkers.map((w) => [w.id, w.name]));
    const companyNameById = new Map(apiCompanies.map((c) => [c.id, c.name]));
    const activeFolders = apiFolders.filter((f) => !f.deleted_at).map(mapApiFolder);
    const deletedFolders = apiFolders.filter((f) => Boolean(f.deleted_at));
    const activeDocs = apiDocs.filter((d) => !d.deleted_at);
    const deletedDocs = apiDocs.filter((d) => Boolean(d.deleted_at));

    if (apiCategories.length) setCategories(apiCategories);
    if (apiTemplates.length) setTemplates(apiTemplates);
    setVehicles(apiVehicles.map(mapApiVehicle));
    setWorkers(apiWorkers.map(mapApiWorker));
    setCompanies(apiCompanies.filter((c) => c.mode === "company").map(mapApiCompany));
    setSuppliers(apiCompanies.filter((c) => c.mode === "supplier").map(mapApiCompany));
    setManifests(apiManifests.map(mapApiManifest));
    setInvoices(apiInvoices.map(mapApiInvoice));
    setAudits(apiAudits.map(mapApiAudit));
    setFolders(activeFolders);
    setFiles(
      activeDocs
        .filter((d) => !d.is_inbox)
        .map((d) => mapApiDocument(d, vehiclePlateById, workerNameById, companyNameById)),
    );
    setInbox(
      activeDocs
        .filter((d) => d.is_inbox)
        .map((d) => mapApiInboxItem(d, vehiclePlateById, workerNameById, companyNameById)),
    );
    setTrash([
      ...deletedFolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        kind: "Carpeta" as const,
        deletedAt: new Date(folder.deleted_at!).toLocaleDateString("es-PE"),
        files: [],
        folders: [mapApiFolder(folder)],
      })),
      ...deletedDocs.map((doc) => ({
        id: doc.id,
        name: doc.name,
        kind: "Archivo" as const,
        deletedAt: new Date(doc.deleted_at!).toLocaleDateString("es-PE"),
        files: [mapApiDocument(doc, vehiclePlateById, workerNameById, companyNameById)],
        folders: [],
      })),
    ]);
  }
  async function enterLiveMode(nextSession: AuthSession) {
    setSession(nextSession);
    setAuthMode("live");
    setLoggedIn(true);
    setCurrentFolder(null);
    try {
      await loadLiveWorkspace();
    } catch {
      showToast("Sesión iniciada, pero no se pudieron cargar los documentos.");
    }
  }
  function enterDemoMode() {
    setSession(null);
    setAuthMode("demo");
    setCategories(initialCategories);
    setTemplates(initialTemplates);
    setVehicles(initialVehicles);
    setWorkers(initialWorkers);
    setCompanies(initialCompanies);
    setSuppliers(initialSuppliers);
    setManifests(initialManifests);
    setInvoices(initialInvoices);
    setAudits(initialAudits);
    setFolders(initialFolders);
    setFiles(initialFiles);
    setInbox(initialInbox);
    setTrash(initialTrash);
    setLoggedIn(true);
  }
  async function handleLogout() {
    if (authMode === "live") {
      try {
        await logoutApi();
      } catch {
        // Ignore network error during logout cleanup
      }
    }
    setSession(null);
    setAuthMode("demo");
    setLoggedIn(false);
    setRoute("dashboard");
  }
  useEffect(() => {
    let active = true;
    getMeApi()
      .then((me) => {
        if (!active) return;
        void enterLiveMode(me);
      })
      .catch(() => {
        // Not signed in or backend offline; stay on Login screen.
      });
    return () => {
      active = false;
    };
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
  async function createVehicle(
    vehicle: Omit<Vehicle, "id" | "folderId">,
    templateCategories: string[],
    rawPhotoFiles: globalThis.File[] = [],
  ) {
    if (authMode === "live") {
      try {
        const created = await createVehicleApi({
          plate: vehicle.plate,
          internal_code: vehicle.code,
          brand: vehicle.brand,
          model: vehicle.model,
          year: Number(vehicle.year) || 2025,
          capacity: Number(vehicle.capacity) || 19,
          vehicle_type: vehicle.type,
          status: vehicle.status,
          notes: vehicle.notes || undefined,
          template_categories: templateCategories,
        });
        for (let i = 0; i < rawPhotoFiles.length; i += 1) {
          await uploadVehiclePhotoApi(created.id, rawPhotoFiles[i], i === 0);
        }
        await loadLiveWorkspace();
        setSelectedVehicleId(created.id);
        setVehicleScreen("profile");
        showToast(`Unidad ${created.plate} y su expediente guardados en el servidor.`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo registrar la unidad.");
      }
      return;
    }
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
  async function createWorker(
    worker: Omit<Worker, "id" | "folderId" | "initials">,
    templateCategories: string[],
  ) {
    if (authMode === "live") {
      try {
        const created = await createWorkerApi({
          code: worker.code,
          name: worker.name,
          role: worker.role,
          status: worker.status,
          phone: worker.phone || undefined,
          email: worker.email || undefined,
          template_categories: templateCategories,
        });
        await loadLiveWorkspace();
        setSelectedWorkerId(created.id);
        setModal(null);
        showToast(`Trabajador ${created.name} guardado con expediente.`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo registrar al trabajador.");
      }
      return;
    }
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
  async function updateVehicle(id: number, patch: Partial<Vehicle>) {
    const current = vehicles.find((vehicle) => vehicle.id === id);
    if (!current) return;
    if (authMode === "live" && current.isPersisted) {
      try {
        await updateVehicleApi(id, {
          plate: patch.plate,
          internal_code: patch.code,
          brand: patch.brand,
          model: patch.model,
          year: patch.year ? Number(patch.year) : undefined,
          capacity: patch.capacity ? Number(patch.capacity) : undefined,
          vehicle_type: patch.type,
          status: patch.status,
          notes: patch.notes,
        });
        await loadLiveWorkspace();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo actualizar la unidad.");
      }
      return;
    }
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
  async function addVehiclePhotos(vehicleId: number, selected: FileList) {
    try {
      for (const file of Array.from(selected)) {
        await uploadVehiclePhotoApi(vehicleId, file, false);
      }
      await loadLiveWorkspace();
      showToast("Fotografías subidas al almacenamiento privado.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudieron subir las fotografías.");
    }
  }
  async function setVehicleCoverPhoto(vehicleId: number, photoId: number) {
    try {
      await setVehicleCoverPhotoApi(vehicleId, photoId);
      await loadLiveWorkspace();
      showToast("Fotografía principal actualizada.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo actualizar la portada.");
    }
  }
  async function deleteVehiclePhoto(vehicleId: number, photoId: number) {
    try {
      await deleteVehiclePhotoApi(vehicleId, photoId);
      await loadLiveWorkspace();
      showToast("Fotografía eliminada.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar la fotografía.");
    }
  }
  async function createFolder(name: string, parent: number | null, color: string) {
    if (authMode === "live") {
      try {
        await createFolderApi({ name, parent_id: parent, color });
        await loadLiveWorkspace();
        setModal(null);
        if (!folderContext?.stayInDossier) {
          setRoute("files");
          setCurrentFolder(parent);
        }
        setFolderContext(null);
        showToast(`Carpeta “${name}” guardada en el servidor.`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo crear la carpeta.");
      }
      return;
    }
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
  async function uploadLiveDocument(
    rawFile: globalThis.File,
    meta: {
      name: string;
      folderId: number | null;
      category: string;
      vehicle: string;
      worker: string;
      expirationDate: string;
      isInbox: boolean;
    },
  ) {
    const formData = new FormData();
    formData.append("file", rawFile);
    formData.append("name", meta.name);
    formData.append("category", meta.category);
    if (meta.folderId !== null && !meta.isInbox) {
      formData.append("folder_id", String(meta.folderId));
    }
    const matchedVehicle = meta.vehicle
      ? vehicles.find((v) => v.plate === meta.vehicle)
      : undefined;
    if (matchedVehicle?.isPersisted) {
      formData.append("related_vehicle_id", String(matchedVehicle.id));
    }
    const matchedWorker = meta.worker
      ? workers.find((w) => w.name === meta.worker)
      : undefined;
    if (matchedWorker?.isPersisted) {
      formData.append("related_worker_id", String(matchedWorker.id));
    }
    if (meta.expirationDate) {
      formData.append("expires_at", meta.expirationDate);
    }
    if (meta.isInbox) {
      formData.append("is_inbox", "true");
      formData.append("inbox_source", "Carga web/móvil");
    }
    const created = await uploadDocumentApi(formData);
    await loadLiveWorkspace();
    setModal(null);
    const hadVehicleContext = Boolean(uploadVehicleId);
    const hadWorkerContext = Boolean(uploadWorkerId);
    setUploadVehicleId(null);
    setUploadWorkerId(null);
    if (meta.isInbox) {
      setRoute("inbox");
    } else if (hadVehicleContext) {
      setRoute("vehicles");
      setVehicleScreen("profile");
    } else if (hadWorkerContext) {
      setRoute("workers");
    } else {
      setRoute("files");
      setCurrentFolder(meta.folderId);
    }
    const vehiclePlateById = new Map(vehicles.map((v) => [v.id, v.plate]));
    setPreview(mapApiDocument(created, vehiclePlateById));
    showToast("Documento subido y almacenado de forma privada.");
  }
  async function uploadNewVersion(documentId: number, nextFile: globalThis.File) {
    const formData = new FormData();
    formData.append("file", nextFile);
    const updated = await uploadDocumentVersionApi(documentId, formData);
    await loadLiveWorkspace();
    setVersionFile(mapApiDocument(updated));
    showToast("Nueva versión guardada correctamente.");
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
  async function organizeFile(
    file: InboxItem,
    parent: number | null,
    category: string,
    vehicle: string,
  ) {
    if (authMode === "live" && file.isPersisted) {
      try {
        const matchedVehicle = vehicle ? vehicles.find((v) => v.plate === vehicle) : undefined;
        await updateDocumentApi(file.id, {
          folder_id: parent,
          move_to_root: parent === null,
          category,
          related_vehicle_id: matchedVehicle?.isPersisted ? matchedVehicle.id : undefined,
          is_inbox: false,
        });
        await loadLiveWorkspace();
        setOrganize(null);
        setSelectedIds((prev) => prev.filter((id) => id !== file.id));
        showToast("Documento organizado y guardado en Mis archivos.");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo organizar el documento.");
      }
      return;
    }
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
  async function toggleFavorite(id: number) {
    const target = files.find((f) => f.id === id);
    if (authMode === "live" && target?.isPersisted) {
      try {
        const updated = await updateDocumentApi(id, { is_favorite: !target.favorite });
        const mapped = mapApiDocument(updated);
        await loadLiveWorkspace();
        setPreview((prev) => (prev?.id === id ? mapped : prev));
        showToast("Favoritos actualizados.");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo actualizar favorito.");
      }
      return;
    }
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, favorite: !f.favorite } : f)));
    setPreview((prev) => (prev?.id === id ? { ...prev, favorite: !prev.favorite } : prev));
    showToast("Favoritos actualizados.");
  }
  async function trashFile(id: number) {
    const file = files.find((item) => item.id === id);
    if (!file) return;
    if (authMode === "live" && file.isPersisted) {
      try {
        await deleteDocumentApi(id, false);
        await loadLiveWorkspace();
        showToast(`“${file.name}” se movió a la papelera.`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo eliminar el documento.");
      }
      return;
    }
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
  async function trashFolder(id: number) {
    const root = folders.find((item) => item.id === id);
    if (!root) return;
    if (authMode === "live") {
      try {
        await deleteFolderApi(id, false);
        await loadLiveWorkspace();
        if (currentFolder === id) setCurrentFolder(root.parent);
        showToast(`Carpeta “${root.name}” movida a la papelera.`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo eliminar la carpeta.");
      }
      return;
    }
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
  async function restoreTrashEntry(id: number) {
    const entry = trash.find((item) => item.id === id);
    if (!entry) return;
    if (authMode === "live") {
      try {
        if (entry.kind === "Carpeta") {
          await restoreFolderApi(entry.id);
        } else {
          await restoreDocumentApi(entry.id);
        }
        await loadLiveWorkspace();
        showToast(`“${entry.name}” restaurado en su ubicación original.`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo restaurar el elemento.");
      }
      return;
    }
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
  async function saveAudit(audit: AuditRecord, preparePackage: boolean) {
    if (authMode === "live") {
      try {
        const persistedVehicleIds = vehicles
          .filter((v) => v.isPersisted && audit.vehicleIds.includes(v.id))
          .map((v) => v.id);
        const persistedWorkerIds = workers
          .filter((w) => w.isPersisted && audit.workerIds.includes(w.id))
          .map((w) => w.id);
        const persistedCompanyId =
          companies.find((c) => c.id === audit.companyId && c.isPersisted)?.id ?? null;
        const reqPayload = audit.requirements.map((r) => ({
          id: r.id,
          label: r.label,
          scope: r.scope,
          custom: Boolean(r.custom),
        }));
        const saved = audit.isPersisted
          ? await updateAuditApi(audit.id, {
              name: audit.name,
              status: audit.status,
              description: audit.description,
              notes: audit.notes,
              vehicle_ids: persistedVehicleIds,
              worker_ids: persistedWorkerIds,
              requirements: reqPayload,
              manually_reviewed: audit.manuallyReviewed,
              excluded_evidence: audit.excludedEvidence,
            })
          : await createAuditApi({
              name: audit.name,
              company_id: persistedCompanyId,
              request_date: audit.requestDate,
              deadline: audit.deadline,
              period: audit.period,
              description: audit.description,
              notes: audit.notes,
              status: audit.status,
              vehicle_ids: persistedVehicleIds,
              worker_ids: persistedWorkerIds,
              requirements: reqPayload,
            });
        await loadLiveWorkspace();
        setSelectedAuditId(saved.id);
        setAuditScreen(preparePackage ? "package" : "checklist");
        showToast(
          preparePackage
            ? "Auditoría guardada. Lista para generar ZIP real."
            : "Auditoría guardada en el servidor.",
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo guardar la auditoría.");
      }
      return;
    }
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
  async function updateAudit(audit: AuditRecord) {
    if (authMode === "live" && audit.isPersisted) {
      try {
        await updateAuditApi(audit.id, {
          status: audit.status,
          manually_reviewed: audit.manuallyReviewed,
          excluded_evidence: audit.excludedEvidence,
        });
        await loadLiveWorkspace();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "No se pudo actualizar la auditoría.");
      }
      return;
    }
    setAudits((previous) => previous.map((item) => (item.id === audit.id ? audit : item)));
  }
  async function exportAuditZip(auditId: number) {
    try {
      const createdExport = await generateAuditExportApi(auditId);
      await loadLiveWorkspace();
      const anchor = document.createElement("a");
      anchor.href = createdExport.download_url;
      anchor.download = createdExport.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      showToast(`Paquete ZIP generado (${createdExport.included_count} archivo(s)).`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo generar el ZIP.");
    }
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
  if (!loggedIn) {
    return (
      <Login
        onEnter={enterDemoMode}
        onLiveLogin={(nextSession) => {
          void enterLiveMode(nextSession);
        }}
      />
    );
  }
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
        isLive={authMode === "live"}
        inboxCount={inbox.length}
        onRoute={goTo}
        onCollapse={() => setCollapsed(!collapsed)}
        onClose={() => setMobileOpen(false)}
        onLogout={() => {
          void handleLogout();
        }}
      />
      <div className={`app-main ${collapsed ? "sidebar-collapsed" : ""}`}>
        <Topbar
          route={route}
          userName={session?.user.full_name || "José Mendoza"}
          userRoleLabel={
            authMode === "live" ? session?.organization.legal_name || "Gerente general" : "Gerente general (Demo)"
          }
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
              onEditFolder={(folder) => setRenameMoveTarget({ kind: "folder", item: folder })}
              onEditFile={(file) => setRenameMoveTarget({ kind: "file", item: file })}
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
          {route === "expirations" && (
            <ExpirationsPage
              files={files}
              onPreview={setPreview}
              isLive={authMode === "live"}
            />
          )}
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
                if (authMode === "live") {
                  createCategoryApi({
                    name: category.name,
                    type: category.type,
                    requires_expiration: category.requiresExpiration,
                    description: category.description,
                    color: category.color,
                  })
                    .then(() => loadLiveWorkspace())
                    .then(() => showToast("Categoría guardada en el servidor."))
                    .catch((err) =>
                      showToast(err instanceof Error ? err.message : "No se pudo crear categoría."),
                    );
                  return;
                }
                setCategories((previous) => [...previous, { ...category, id: Date.now() }]);
                showToast("Categoría añadida a los flujos documentales.");
              }}
              onDeleteCategory={(id) => {
                if (authMode === "live") {
                  deleteCategoryApi(id)
                    .then(() => loadLiveWorkspace())
                    .then(() => showToast("Categoría eliminada."))
                    .catch((err) =>
                      showToast(
                        err instanceof Error ? err.message : "No se pudo eliminar categoría.",
                      ),
                    );
                  return;
                }
                setCategories((previous) => previous.filter((item) => item.id !== id));
              }}
              onAddTemplate={(template) => {
                if (authMode === "live") {
                  createTemplateApi({
                    name: template.name,
                    kind: template.kind,
                    items: template.items,
                  })
                    .then(() => loadLiveWorkspace())
                    .then(() => showToast("Plantilla guardada en el servidor."))
                    .catch((err) =>
                      showToast(err instanceof Error ? err.message : "No se pudo crear plantilla."),
                    );
                  return;
                }
                setTemplates((previous) => [...previous, { ...template, id: Date.now() }]);
                showToast("Plantilla disponible en el flujo correspondiente.");
              }}
              onToggleTemplate={(id) => {
                if (authMode === "live") {
                  toggleTemplateApi(id)
                    .then(() => loadLiveWorkspace())
                    .catch((err) =>
                      showToast(
                        err instanceof Error ? err.message : "No se pudo actualizar plantilla.",
                      ),
                    );
                  return;
                }
                setTemplates((previous) =>
                  previous.map((item) =>
                    item.id === id ? { ...item, active: !item.active } : item,
                  ),
                );
              }}
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
              isLive={authMode === "live"}
              onBack={() => setAuditScreen("center")}
              onChecklist={() => setAuditScreen("checklist")}
              onUpdate={(next) => void updateAudit(next)}
              onPreview={previewAuditEvidence}
              onExportZip={exportAuditZip}
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
              isLive={authMode === "live"}
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
              onUpdate={(patch) => void updateVehicle(selectedVehicle.id, patch)}
              onAddPhotos={(selected) => addVehiclePhotos(selectedVehicle.id, selected)}
              onSetCoverPhoto={(photoId) => setVehicleCoverPhoto(selectedVehicle.id, photoId)}
              onDeletePhoto={(photoId) => deleteVehiclePhoto(selectedVehicle.id, photoId)}
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
                  : currentFolder
            }
            isLive={authMode === "live"}
            onClose={() => {
              setModal(null);
              setUploadVehicleId(null);
              setUploadWorkerId(null);
            }}
            onComplete={completeUpload}
            onUploadLive={uploadLiveDocument}
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
        {renameMoveTarget && (
          <RenameMoveModal
            target={renameMoveTarget}
            folders={folders}
            onClose={() => setRenameMoveTarget(null)}
            onSave={async (nextName, nextParent) => {
              if (authMode === "live") {
                if (renameMoveTarget.kind === "folder") {
                  await updateFolderApi(renameMoveTarget.item.id, {
                    name: nextName,
                    parent_id: nextParent,
                    move_to_root: nextParent === null,
                  });
                } else {
                  await updateDocumentApi(renameMoveTarget.item.id, {
                    name: nextName,
                    folder_id: nextParent,
                    move_to_root: nextParent === null,
                  });
                }
                await loadLiveWorkspace();
                setRenameMoveTarget(null);
                showToast("Ubicación y nombre actualizados en el servidor.");
                return;
              }
              if (renameMoveTarget.kind === "folder") {
                setFolders((prev) =>
                  prev.map((f) =>
                    f.id === renameMoveTarget.item.id
                      ? { ...f, name: nextName, parent: nextParent, modified: "Ahora" }
                      : f,
                  ),
                );
              } else {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === renameMoveTarget.item.id
                      ? { ...f, name: nextName, parent: nextParent, modified: "Ahora" }
                      : f,
                  ),
                );
              }
              setRenameMoveTarget(null);
              showToast("Cambios guardados en la sesión.");
            }}
          />
        )}
        {versionFile && (
          <VersionsModal
            file={files.find((file) => file.id === versionFile.id) || versionFile}
            onClose={() => setVersionFile(null)}
            onRestore={restoreVersion}
            onUploadVersion={authMode === "live" ? uploadNewVersion : undefined}
          />
        )}
        {deleteConfirmation && (
          <ConfirmationDialog
            title={`Eliminar “${deleteConfirmation.name}”`}
            text={
              authMode === "live"
                ? "Se eliminará permanentemente del servidor y almacenamiento privado."
                : "Se eliminará permanentemente de la papelera demostrativa."
            }
            onClose={() => setDeleteConfirmation(null)}
            onConfirm={() => {
              if (authMode === "live") {
                const target = deleteConfirmation;
                const action =
                  target.kind === "Carpeta"
                    ? deleteFolderApi(target.id, true)
                    : deleteDocumentApi(target.id, true);
                action
                  .then(() => loadLiveWorkspace())
                  .then(() => {
                    setDeleteConfirmation(null);
                    showToast("Elemento eliminado permanentemente.");
                  })
                  .catch((err) => {
                    setDeleteConfirmation(null);
                    showToast(
                      err instanceof Error ? err.message : "No se pudo eliminar el elemento.",
                    );
                  });
                return;
              }
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
              if (authMode === "live") {
                const action =
                  editingBusiness?.mode === "supplier" && editingBusiness.record.isPersisted
                    ? updateCompanyApi(editingBusiness.record.id, {
                        name: record.name,
                        legal_name: record.legalName,
                        kind: record.kind,
                        contact: record.contact,
                        phone: record.phone,
                        email: record.email,
                      })
                    : createCompanyApi({
                        mode: "supplier",
                        name: record.name,
                        legal_name: record.legalName,
                        kind: record.kind,
                        contact: record.contact,
                        phone: record.phone,
                        email: record.email,
                      });
                action
                  .then(() => loadLiveWorkspace())
                  .then(() => {
                    setModal(null);
                    setEditingBusiness(null);
                    showToast(editingBusiness ? "Proveedor actualizado." : "Proveedor guardado.");
                  })
                  .catch((err) =>
                    showToast(err instanceof Error ? err.message : "No se pudo guardar proveedor."),
                  );
                return;
              }
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
              if (authMode === "live") {
                const action =
                  editingBusiness?.mode === "company" && editingBusiness.record.isPersisted
                    ? updateCompanyApi(editingBusiness.record.id, {
                        name: record.name,
                        legal_name: record.legalName,
                        kind: record.kind,
                        contact: record.contact,
                        phone: record.phone,
                        email: record.email,
                      })
                    : createCompanyApi({
                        mode: "company",
                        name: record.name,
                        legal_name: record.legalName,
                        kind: record.kind,
                        contact: record.contact,
                        phone: record.phone,
                        email: record.email,
                      });
                action
                  .then(() => loadLiveWorkspace())
                  .then(() => {
                    setModal(null);
                    setEditingBusiness(null);
                    showToast(
                      editingBusiness ? "Empresa actualizada." : "Empresa contratante guardada.",
                    );
                  })
                  .catch((err) =>
                    showToast(err instanceof Error ? err.message : "No se pudo guardar empresa."),
                  );
                return;
              }
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
            onCreate={(record, rawFile) => {
              if (authMode === "live") {
                const run = async () => {
                  let documentId: number | undefined;
                  if (rawFile) {
                    const formData = new FormData();
                    formData.append("file", rawFile);
                    formData.append("name", record.fileName);
                    formData.append("category", "Manifiestos");
                    formData.append("issued_at", record.date);
                    const matchedVeh = vehicles.find((v) => v.plate === record.vehicle);
                    if (matchedVeh?.isPersisted) {
                      formData.append("related_vehicle_id", String(matchedVeh.id));
                    }
                    const uploaded = await uploadDocumentApi(formData);
                    documentId = uploaded.id;
                  }
                  await createManifestApi({
                    number: record.number,
                    service_date: record.date,
                    vehicle_plate: record.vehicle,
                    company_name: record.company,
                    service: record.service,
                    period: record.period,
                    document_id: documentId,
                    file_name: record.fileName,
                  });
                  await loadLiveWorkspace();
                  setModal(null);
                  showToast("Manifiesto y archivo guardados en el servidor.");
                };
                run().catch((err) =>
                  showToast(err instanceof Error ? err.message : "No se pudo guardar manifiesto."),
                );
                return;
              }
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
            onCreate={(record, rawFile) => {
              if (authMode === "live") {
                const run = async () => {
                  let documentId: number | undefined;
                  if (rawFile) {
                    const formData = new FormData();
                    formData.append("file", rawFile);
                    formData.append("name", record.fileName);
                    formData.append("category", "Facturas");
                    formData.append("issued_at", record.date);
                    const matchedCompany = companies.find(
                      (c) => c.legalName === record.company || c.name === record.company,
                    );
                    if (matchedCompany?.isPersisted) {
                      formData.append("related_company_id", String(matchedCompany.id));
                    }
                    const uploaded = await uploadDocumentApi(formData);
                    documentId = uploaded.id;
                  }
                  await createInvoiceApi({
                    number: record.number,
                    company_name: record.company,
                    issued_date: record.date,
                    amount: record.amount,
                    currency: record.currency,
                    status: record.status,
                    document_id: documentId,
                    file_name: record.fileName,
                  });
                  await loadLiveWorkspace();
                  setModal(null);
                  showToast("Factura y archivo guardados en el servidor.");
                };
                run().catch((err) =>
                  showToast(err instanceof Error ? err.message : "No se pudo guardar factura."),
                );
                return;
              }
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
