import { motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Folder,
  FolderPlus,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { DemoFile, DemoFolder, Vehicle } from "@/types";
import { Button, Badge, FileIcon, EmptyState } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function VehicleDossierPage({
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
