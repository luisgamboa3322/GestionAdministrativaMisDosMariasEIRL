import { AlertCircle, CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { AuditEvidence } from "@/types";
import { normalizeAuditText, auditMetrics } from "@/utils/audits";

export function AuditEvidenceBadge({ status }: { status: AuditEvidence["status"] }) {
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

export function AuditVerificationSummary({
  metrics,
}: {
  metrics: ReturnType<typeof auditMetrics>;
}) {
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
