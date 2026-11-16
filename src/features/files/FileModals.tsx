import { FormEvent, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  Building2,
  Bus,
  Check,
  ChevronRight,
  CloudUpload,
  Download,
  FileImage,
  Files,
  Folder,
  FolderHeart,
  FolderPlus,
  MoveRight,
  ReceiptText,
  Search,
  Sparkles,
  Star,
  History,
  RotateCcw,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import type {
  Route,
  DemoFile,
  CategorySetting,
  DemoFolder,
  InboxItem,
  Vehicle,
  Worker,
  BusinessRecord,
  ManifestRecord,
  InvoiceRecord,
  AuditRecord,
} from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button, Badge, FileIcon, EmptyState } from "@/components/ui/Common";
import { documentDownloadUrl } from "@/lib/api";

export function VersionsModal({
  file,
  onClose,
  onRestore,
  onUploadVersion,
}: {
  file: DemoFile;
  onClose: () => void;
  onRestore: (fileId: number, versionId: number) => void;
  onUploadVersion?: (fileId: number, nextFile: globalThis.File) => Promise<void>;
}) {
  const versionInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const versions = file.versions?.length
    ? file.versions
    : [{ id: file.id * 10, label: "1.0", date: file.modified, size: file.size, current: true }];

  async function handleNewVersion(selected?: globalThis.File) {
    if (!selected || !onUploadVersion) return;
    setError("");
    setUploading(true);
    try {
      await onUploadVersion(file.id, selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la nueva versión.");
    } finally {
      setUploading(false);
    }
  }

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
            {file.isPersisted && (
              <a
                className="button button-ghost"
                href={documentDownloadUrl(file.id, { versionId: version.id })}
                download
                title="Descargar esta versión"
              >
                <Download size={16} />
              </a>
            )}
            {version.current ? (
              <Badge status="Actual" />
            ) : (
              !file.isPersisted && (
                <Button
                  variant="secondary"
                  icon={RotateCcw}
                  onClick={() => onRestore(file.id, version.id)}
                >
                  Restaurar
                </Button>
              )
            )}
          </article>
        ))}
      </div>
      {file.isPersisted && onUploadVersion ? (
        <div className="modal-actions" style={{ marginTop: 14 }}>
          <input
            ref={versionInputRef}
            hidden
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.zip,.txt"
            onChange={(e) => void handleNewVersion(e.target.files?.[0])}
          />
          {error && (
            <p className="form-note error">
              <AlertCircle size={14} />
              {error}
            </p>
          )}
          <Button
            variant="secondary"
            icon={Upload}
            disabled={uploading}
            onClick={() => versionInputRef.current?.click()}
          >
            {uploading ? "Subiendo versión..." : "Subir nueva versión"}
          </Button>
        </div>
      ) : (
        <div className="version-note">
          <Sparkles size={14} /> Versionado demostrativo. No se conserva contenido binario.
        </div>
      )}
    </Modal>
  );
}

export function NewFolderModal({
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

export function UploadModal({
  folders,
  vehicles,
  workers,
  categories,
  defaultVehicle,
  defaultWorker,
  defaultFolder,
  isLive = false,
  onClose,
  onComplete,
  onUploadLive,
}: {
  folders: DemoFolder[];
  vehicles: Vehicle[];
  workers: Worker[];
  categories: CategorySetting[];
  defaultVehicle?: string;
  defaultWorker?: string;
  defaultFolder?: number | null;
  isLive?: boolean;
  onClose: () => void;
  onComplete: (f: DemoFile) => void;
  onUploadLive?: (
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
  ) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<{
    name: string;
    size: string;
    type: DemoFile["type"];
    rawFile?: globalThis.File;
  } | null>(null);
  const [folder, setFolder] = useState<number | null>(defaultFolder ?? null);
  const [vehicle, setVehicle] = useState(defaultVehicle || "");
  const [worker, setWorker] = useState(defaultWorker || "");
  const [category, setCategory] = useState(categories[0]?.name || "Documento general");
  const [expirationDate, setExpirationDate] = useState("");
  const [sendToInbox, setSendToInbox] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [step, setStep] = useState<"pick" | "details" | "processing">("pick");
  function selectFile(file?: globalThis.File) {
    const name = file?.name || "SOAT_T3X-456_2025.pdf";
    const ext = name.split(".").pop()?.toLowerCase();
    const type: DemoFile["type"] =
      ext === "xlsx" || ext === "xls" || ext === "csv"
        ? "sheet"
        : ["jpg", "jpeg", "png", "webp"].includes(ext || "")
          ? "image"
          : ext === "zip"
            ? "zip"
            : ext === "docx" || ext === "doc" || ext === "txt"
              ? "doc"
              : "pdf";
    setPicked({
      name,
      size: file ? `${Math.max(0.1, file.size / 1024 / 1024).toFixed(1)} MB` : "2.4 MB",
      type,
      rawFile: file,
    });
    setDetailError("");
    setStep("details");
  }
  async function complete() {
    if (!picked) return;
    if (categories.find((item) => item.name === category)?.requiresExpiration && !expirationDate) {
      setDetailError("Esta categoría requiere una fecha de vencimiento.");
      return;
    }
    if (isLive && onUploadLive) {
      if (!picked.rawFile) {
        setDetailError("Selecciona un archivo real de tu equipo o celular.");
        return;
      }
      setStep("processing");
      try {
        await onUploadLive(picked.rawFile, {
          name: picked.name,
          folderId: sendToInbox ? null : folder,
          category,
          vehicle,
          worker,
          expirationDate,
          isInbox: sendToInbox,
        });
      } catch (err) {
        setStep("details");
        setDetailError(err instanceof Error ? err.message : "No se pudo subir el archivo.");
      }
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
      subtitle={
        isLive
          ? "Los archivos se almacenan de forma privada en tu servidor."
          : "Los archivos se procesan solo en esta sesión de demostración."
      }
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
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.webp,.zip,.txt"
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
          {isLive && (
            <label className="check-label" style={{ marginTop: 10 }}>
              <input
                type="checkbox"
                checked={sendToInbox}
                onChange={(e) => setSendToInbox(e.target.checked)}
              />
              Enviar primero a “Archivos por organizar” (bandeja documental)
            </label>
          )}
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
            <Button onClick={() => void complete()} icon={Upload}>
              {isLive ? "Subir al sistema" : "Guardar en prototipo"}
            </Button>
          </div>
        </div>
      )}
      {step === "processing" && (
        <div className="processing-state">
          <span>
            <CloudUpload size={27} />
          </span>
          <h3>{isLive ? "Subiendo documento..." : "Organizando documento..."}</h3>
          <p>
            {isLive
              ? "Validando formato y guardando en almacenamiento privado."
              : "Procesando localmente para esta demostración."}
          </p>
          <div>
            <i />
          </div>
        </div>
      )}
    </Modal>
  );
}

export function OrganizeDrawer({
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

export function PreviewModal({
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
  const inlineUrl = file.isPersisted ? documentDownloadUrl(file.id, { inline: true }) : null;
  const downloadUrl = file.isPersisted ? documentDownloadUrl(file.id) : null;
  const canInlinePdf = Boolean(file.isPersisted && file.type === "pdf");
  const canInlineImage = Boolean(file.isPersisted && file.type === "image");

  return (
    <Modal title="Vista previa del documento" onClose={onClose} wide>
      <div className="preview-layout">
        <div className="preview-canvas">
          {canInlineImage && inlineUrl ? (
            <img
              src={inlineUrl}
              alt={file.name}
              style={{ maxWidth: "100%", maxHeight: 420, borderRadius: 12, objectFit: "contain" }}
            />
          ) : canInlinePdf && inlineUrl ? (
            <iframe
              src={inlineUrl}
              title={file.name}
              style={{ width: "100%", height: 420, border: 0, borderRadius: 12, background: "#fff" }}
            />
          ) : (
            <div className="fake-document">
              <div className="fake-doc-head">
                <span>MDM</span>
                <div />
                <div />
              </div>
              <h3>{file.category.toUpperCase()}</h3>
              <p>{file.isPersisted ? "Archivo almacenado en repositorio privado" : "Documento de demostración"}</p>
              <div className="fake-lines">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <i key={i} />
                ))}
              </div>
              <strong>{file.isPersisted ? "DESCARGA DISPONIBLE" : "VISTA PREVIA"}</strong>
            </div>
          )}
          <span>
            {file.isPersisted
              ? "Archivo privado autenticado desde almacenamiento seguro"
              : "Vista demostrativa · El contenido real no se carga en servidores"}
          </span>
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
            {downloadUrl ? (
              <a className="button button-primary" href={downloadUrl} download>
                <Download size={17} /> Descargar archivo
              </a>
            ) : (
              <Button icon={Download} disabled title="Descarga pendiente de almacenamiento backend">
                Descarga no disponible
              </Button>
            )}
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

export function SearchModal({
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

export function RenameMoveModal({
  target,
  folders,
  onClose,
  onSave,
}: {
  target:
    | { kind: "folder"; item: DemoFolder }
    | { kind: "file"; item: DemoFile };
  folders: DemoFolder[];
  onClose: () => void;
  onSave: (nextName: string, nextParent: number | null) => void | Promise<void>;
}) {
  const [name, setName] = useState(target.item.name);
  const [parent, setParent] = useState<number | null>(target.item.parent);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const availableParents =
    target.kind === "folder"
      ? folders.filter((f) => f.id !== target.item.id)
      : folders;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("El nombre no puede estar vacío.");
      return;
    }
    setSaving(true);
    try {
      await onSave(name.trim(), parent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={target.kind === "folder" ? "Renombrar o mover carpeta" : "Renombrar o mover archivo"}
      subtitle={target.item.name}
      onClose={onClose}
    >
      <form onSubmit={(e) => void submit(e)} className="modal-form">
        <label>
          Nuevo nombre
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
          />
        </label>
        <label>
          Carpeta de ubicación
          <select
            value={parent ?? ""}
            onChange={(e) => setParent(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Mis archivos (raíz)</option>
            {availableParents.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p className="form-note error">
            <AlertCircle size={15} />
            {error}
          </p>
        )}
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
