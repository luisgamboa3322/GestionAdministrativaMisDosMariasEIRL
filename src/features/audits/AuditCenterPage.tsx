import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  CalendarClock,
  ChevronRight,
  Clock3,
  Copy,
  Package,
  Plus,
} from "lucide-react";
import type {
  DemoFile,
  Vehicle,
  Worker,
  BusinessRecord,
  ManifestRecord,
  InvoiceRecord,
  AuditRecord,
} from "@/types";
import { daysUntil } from "@/utils/dates";
import { evaluateAudit, auditMetrics } from "@/utils/audits";
import { Button, Badge, StatCard, EmptyState, DirectoryToolbar } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function AuditCenterPage({
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
