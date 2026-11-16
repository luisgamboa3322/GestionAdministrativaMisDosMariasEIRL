import { useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BookOpenCheck,
  Building2,
  Bus,
  CalendarClock,
  Check,
  Edit3,
  Eye,
  Folder,
  Package,
  UserRound,
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
} from "@/types";
import { normalizeAuditText, evaluateAudit, auditMetrics } from "@/utils/audits";
import { Button, FileIcon, EmptyState } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";
import { AuditEvidenceBadge, AuditVerificationSummary } from "@/features/audits/AuditComponents";

export function AuditChecklistPage({
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
