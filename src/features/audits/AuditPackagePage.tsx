import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Eye,
  File,
  Folder,
  FileCheck2,
  Package,
} from "lucide-react";
import type {
  DemoFile,
  Vehicle,
  Worker,
  BusinessRecord,
  ManifestRecord,
  InvoiceRecord,
  AuditRecord,
  AuditEvidence,
  AuditExportItem,
} from "@/types";
import { normalizeAuditText, evaluateAudit, auditMetrics } from "@/utils/audits";
import { Button, FileIcon, EmptyState } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";
import { AuditEvidenceBadge } from "@/features/audits/AuditComponents";

export function AuditPackagePage({
  audit,
  files,
  vehicles,
  workers,
  companies,
  manifests,
  invoices,
  isLive = false,
  onBack,
  onChecklist,
  onUpdate,
  onPreview,
  onExportZip,
}: {
  audit: AuditRecord;
  files: DemoFile[];
  vehicles: Vehicle[];
  workers: Worker[];
  companies: BusinessRecord[];
  manifests: ManifestRecord[];
  invoices: InvoiceRecord[];
  isLive?: boolean;
  onBack: () => void;
  onChecklist: () => void;
  onUpdate: (audit: AuditRecord) => void;
  onPreview: (evidence: AuditEvidence) => void;
  onExportZip?: (auditId: number) => Promise<AuditExportItem | void>;
}) {
  const [exporting, setExporting] = useState(false);
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
          <strong>
            {isLive && audit.isPersisted
              ? "Paquete listo para exportación ZIP con índice CSV"
              : "Vista previa de exportación — funcionalidad pendiente de backend"}
          </strong>
          <p>
            {isLive && audit.isPersisted
              ? "El servidor empaquetará los documentos vigentes incluidos junto con 00_INDICE/indice.csv."
              : "La estructura muestra únicamente archivos disponibles en esta sesión. No se generará ni descargará un ZIP real."}
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
          {isLive && audit.isPersisted && onExportZip ? (
            <>
              <Button
                icon={Download}
                disabled={exporting || included.length === 0}
                onClick={() => {
                  setExporting(true);
                  void onExportZip(audit.id).finally(() => setExporting(false));
                }}
              >
                {exporting ? "Generando ZIP..." : "Generar y descargar ZIP"}
              </Button>
              <small>
                {included.length === 0
                  ? "Incluye al menos un archivo disponible para exportar."
                  : "Incluye archivos reales e índice CSV en 00_INDICE/."}
              </small>
              {audit.exports && audit.exports.length > 0 && (
                <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                  {audit.exports.slice(0, 3).map((exp) => (
                    <a
                      key={exp.id}
                      href={exp.downloadUrl}
                      download
                      className="button button-secondary"
                      style={{ fontSize: 12, justifyContent: "space-between" }}
                    >
                      <span>{exp.filename}</span>
                      <Download size={14} />
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <Button disabled icon={Download}>
                Exportación no disponible
              </Button>
              <small>No se ha generado ningún archivo.</small>
            </>
          )}
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
