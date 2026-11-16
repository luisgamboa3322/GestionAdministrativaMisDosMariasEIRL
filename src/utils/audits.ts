import type {
  DemoFile,
  Vehicle,
  Worker,
  BusinessRecord,
  ManifestRecord,
  InvoiceRecord,
  AuditRequirement,
  AuditRecord,
  AuditEvidence,
} from "@/types";
import { daysUntil } from "@/utils/dates";

export function normalizeAuditText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function fileMatchesRequirement(file: DemoFile, requirement: AuditRequirement) {
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

export function documentAuditStatus(
  file: DemoFile,
  requirement: AuditRequirement,
): AuditEvidence["status"] {
  if (requirement.custom) return "Pendiente de revisión";
  if (!file.expirationDate) return "Sin fecha de vencimiento";
  const diff = daysUntil(file.expirationDate, file.isPersisted ? new Date() : undefined);
  return diff !== null && diff < 0 ? "Vencido" : "Disponible";
}

export function evaluateAudit(
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

export function auditMetrics(evidence: AuditEvidence[], reviewed: string[] = []) {
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
