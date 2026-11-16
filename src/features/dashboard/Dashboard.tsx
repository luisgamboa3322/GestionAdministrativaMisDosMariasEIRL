import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Bus,
  Check,
  ChevronRight,
  Clock3,
  Files,
  FolderPlus,
  Inbox,
  MoreHorizontal,
  Sparkles,
  Upload,
} from "lucide-react";
import type { Route, DemoFile, Vehicle } from "@/types";
import { Badge, FileIcon, StatCard } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function Dashboard({
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
