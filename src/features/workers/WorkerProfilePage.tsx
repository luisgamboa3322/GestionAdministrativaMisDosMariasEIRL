import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  Plus,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import type { DemoFile, DemoFolder, Worker } from "@/types";
import { Button, Badge, DocumentCollection } from "@/components/ui/Common";

export function WorkerProfilePage({
  worker,
  files,
  folders,
  onBack,
  onPreview,
  onUpload,
  onNewCategory,
  isLive = false,
}: {
  worker: Worker;
  files: DemoFile[];
  folders: DemoFolder[];
  onBack: () => void;
  onPreview: (file: DemoFile) => void;
  onUpload: () => void;
  onNewCategory: () => void;
  isLive?: boolean;
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
                <p>{isLive ? "Datos registrados en el sistema" : "Datos profesionales de demostración"}</p>
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
