import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleHelp,
  Eye,
  FileCheck2,
  Package,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type {
  DemoFile,
  TemplateSetting,
  Vehicle,
  Worker,
  BusinessRecord,
  ManifestRecord,
  InvoiceRecord,
  RequirementScope,
  AuditRequirement,
  AuditRecord,
  AuditEvidence,
} from "@/types";
import { auditRequirementCatalog, auditStepLabels } from "@/data/demo";
import { evaluateAudit, auditMetrics } from "@/utils/audits";
import { Button, Badge } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";
import { AuditEvidenceBadge, AuditVerificationSummary } from "@/features/audits/AuditComponents";

export function AuditWizard({
  initial,
  files,
  vehicles,
  workers,
  companies,
  manifests,
  invoices,
  templates,
  onCancel,
  onSave,
  onPreview,
  isLive = false,
}: {
  initial?: AuditRecord | null;
  files: DemoFile[];
  vehicles: Vehicle[];
  workers: Worker[];
  companies: BusinessRecord[];
  manifests: ManifestRecord[];
  invoices: InvoiceRecord[];
  templates: TemplateSetting[];
  onCancel: () => void;
  onSave: (audit: AuditRecord, preparePackage: boolean) => void;
  onPreview: (evidence: AuditEvidence) => void;
  isLive?: boolean;
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [workerQuery, setWorkerQuery] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customScope, setCustomScope] = useState<RequirementScope>("Empresa");
  const [draft, setDraft] = useState<AuditRecord>(
    initial || {
      id: Date.now(),
      name: "",
      companyId: companies[0]?.id || 0,
      requestDate: "2025-06-20",
      deadline: "2025-07-05",
      period: "Junio 2025",
      description: "",
      notes: "",
      status: "Borrador",
      vehicleIds: [],
      workerIds: [],
      requirements: [],
      manuallyReviewed: [],
      excludedEvidence: [],
      updated: "Ahora",
    },
  );
  const evidence = evaluateAudit(draft, files, vehicles, workers, companies, manifests, invoices);
  const metrics = auditMetrics(evidence, draft.manuallyReviewed);
  const selectedCompany = companies.find((item) => item.id === draft.companyId);

  function nextStep() {
    setError("");
    if (step === 1 && (!draft.name.trim() || !draft.companyId || !draft.deadline)) {
      setError("Completa el nombre, la empresa y la fecha límite.");
      return;
    }
    if (step === 2 && !draft.vehicleIds.length) {
      setError("Selecciona al menos una unidad para continuar.");
      return;
    }
    if (step === 4 && !draft.requirements.length) {
      setError("Selecciona al menos un requisito documental.");
      return;
    }
    setStep((current) => Math.min(6, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function toggleVehicle(id: number) {
    setDraft((current) => ({
      ...current,
      vehicleIds: current.vehicleIds.includes(id)
        ? current.vehicleIds.filter((item) => item !== id)
        : [...current.vehicleIds, id],
    }));
  }
  function toggleWorker(id: number) {
    setDraft((current) => ({
      ...current,
      workerIds: current.workerIds.includes(id)
        ? current.workerIds.filter((item) => item !== id)
        : [...current.workerIds, id],
    }));
  }
  function toggleRequirement(requirement: AuditRequirement) {
    setDraft((current) => ({
      ...current,
      requirements: current.requirements.some((item) => item.id === requirement.id)
        ? current.requirements.filter((item) => item.id !== requirement.id)
        : [...current.requirements, requirement],
    }));
  }
  function addCustomRequirement() {
    if (!customLabel.trim()) return;
    const requirement: AuditRequirement = {
      id: `custom-${Date.now()}`,
      label: customLabel.trim(),
      scope: customScope,
      custom: true,
    };
    setDraft((current) => ({
      ...current,
      requirements: [...current.requirements, requirement],
    }));
    setCustomLabel("");
  }

  return (
    <motion.div
      className="page audit-wizard-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button className="back-link" onClick={onCancel}>
        <ArrowLeft size={16} /> Salir del asistente
      </button>
      <PageHeader
        eyebrow={initial ? "Editar auditoría" : "Nueva auditoría"}
        title={auditStepLabels[step - 1]}
        description={
          isLive
            ? `Paso ${step} de 6 · La auditoría se guardará en tu repositorio.`
            : `Paso ${step} de 6 · La información se conserva únicamente durante esta sesión.`
        }
        actions={
          !isLive ? (
            <span className="demo-pill">
              <Sparkles size={14} /> Prototipo local
            </span>
          ) : undefined
        }
      />
      <div className="audit-wizard-layout">
        <aside className="audit-stepper">
          {auditStepLabels.map((label, index) => {
            const number = index + 1;
            return (
              <button
                key={label}
                className={`${step === number ? "active" : ""} ${step > number ? "complete" : ""}`}
                onClick={() => number < step && setStep(number)}
              >
                <span>{step > number ? <Check size={14} /> : number}</span>
                <div>
                  <strong>{label}</strong>
                  <small>
                    {number === step ? "En curso" : step > number ? "Completado" : "Pendiente"}
                  </small>
                </div>
              </button>
            );
          })}
          <div className="wizard-context">
            <ShieldCheck size={16} />
            <p>
              <strong>Verificación real</strong>
              <span>
                {isLive
                  ? "Solo se consideran documentos registrados en el sistema."
                  : "Solo se consideran registros presentes en el prototipo."}
              </span>
            </p>
          </div>
        </aside>
        <section className="wizard-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              {step === 1 && (
                <div className="wizard-form">
                  <div className="wizard-section-title">
                    <span>01</span>
                    <div>
                      <h2>Información general</h2>
                      <p>Identifica la solicitud y su periodo documental.</p>
                    </div>
                  </div>
                  <label className="field-full">
                    Nombre de la auditoría
                    <input
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                      placeholder="Ej. Auditoría documental — Julio 2025"
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Empresa contratante
                      <select
                        value={draft.companyId}
                        onChange={(event) =>
                          setDraft({ ...draft, companyId: Number(event.target.value) })
                        }
                      >
                        {companies.map((company) => (
                          <option value={company.id} key={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Periodo documental
                      <input
                        value={draft.period}
                        onChange={(event) => setDraft({ ...draft, period: event.target.value })}
                        placeholder="Ej. Julio 2025"
                      />
                    </label>
                    <label>
                      Fecha de solicitud
                      <input
                        type="date"
                        value={draft.requestDate}
                        onChange={(event) =>
                          setDraft({ ...draft, requestDate: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Fecha límite
                      <input
                        type="date"
                        value={draft.deadline}
                        onChange={(event) => setDraft({ ...draft, deadline: event.target.value })}
                      />
                    </label>
                  </div>
                  <label>
                    Descripción
                    <textarea
                      value={draft.description}
                      onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                      placeholder="Describe el alcance de la auditoría"
                    />
                  </label>
                  <label>
                    Observaciones <span className="optional">(opcional)</span>
                    <textarea
                      value={draft.notes}
                      onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                      placeholder="Notas internas para la preparación"
                    />
                  </label>
                </div>
              )}
              {step === 2 && (
                <div>
                  <div className="wizard-section-title">
                    <span>02</span>
                    <div>
                      <h2>Selecciona las unidades</h2>
                      <p>El checklist se calculará por cada unidad elegida.</p>
                    </div>
                  </div>
                  <label className="inline-search wizard-search">
                    <Search size={17} />
                    <input
                      value={vehicleQuery}
                      onChange={(event) => setVehicleQuery(event.target.value)}
                      placeholder="Buscar por placa, código o marca"
                    />
                  </label>
                  <div className="audit-select-grid">
                    {vehicles
                      .filter((vehicle) =>
                        `${vehicle.plate} ${vehicle.code} ${vehicle.brand}`
                          .toLowerCase()
                          .includes(vehicleQuery.toLowerCase()),
                      )
                      .map((vehicle) => {
                        const selected = draft.vehicleIds.includes(vehicle.id);
                        const alerts = files.filter(
                          (file) =>
                            file.vehicle === vehicle.plate &&
                            (file.status === "Vencido" || file.status === "Por vencer"),
                        ).length;
                        return (
                          <button
                            key={vehicle.id}
                            className={`audit-vehicle-option ${selected ? "selected" : ""}`}
                            onClick={() => toggleVehicle(vehicle.id)}
                          >
                            <span className="selection-check">
                              {selected && <Check size={14} />}
                            </span>
                            <img src={vehicle.cover} alt={`Unidad ${vehicle.plate}`} />
                            <div>
                              <strong>{vehicle.plate}</strong>
                              <small>
                                {vehicle.code} · {vehicle.brand} {vehicle.model}
                              </small>
                              <span className={alerts ? "has-alert" : ""}>
                                {alerts
                                  ? `${alerts} documentos requieren atención`
                                  : "Sin alertas documentales"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <div className="wizard-section-title">
                    <span>03</span>
                    <div>
                      <h2>Selecciona trabajadores</h2>
                      <p>
                        Paso opcional. Podrás exigir documentación por cada persona seleccionada.
                      </p>
                    </div>
                  </div>
                  <label className="inline-search wizard-search">
                    <Search size={17} />
                    <input
                      value={workerQuery}
                      onChange={(event) => setWorkerQuery(event.target.value)}
                      placeholder="Buscar por nombre, cargo o código"
                    />
                  </label>
                  <div className="audit-worker-list">
                    {workers
                      .filter((worker) =>
                        `${worker.name} ${worker.role} ${worker.code}`
                          .toLowerCase()
                          .includes(workerQuery.toLowerCase()),
                      )
                      .map((worker) => {
                        const selected = draft.workerIds.includes(worker.id);
                        return (
                          <button
                            key={worker.id}
                            className={selected ? "selected" : ""}
                            onClick={() => toggleWorker(worker.id)}
                          >
                            <span className="selection-check">
                              {selected && <Check size={14} />}
                            </span>
                            <span className="avatar">{worker.initials}</span>
                            <div>
                              <strong>{worker.name}</strong>
                              <small>
                                {worker.role} · {worker.code}
                              </small>
                            </div>
                            <Badge status={worker.status} />
                          </button>
                        );
                      })}
                  </div>
                  {!draft.workerIds.length && (
                    <div className="wizard-inline-note">
                      <CircleHelp size={16} />
                      <span>Puedes continuar sin trabajadores y añadirlos más adelante.</span>
                    </div>
                  )}
                </div>
              )}
              {step === 4 && (
                <div>
                  <div className="wizard-section-title">
                    <span>04</span>
                    <div>
                      <h2>Requisitos documentales</h2>
                      <p>Selecciona únicamente lo solicitado por la empresa.</p>
                    </div>
                  </div>
                  <div className="audit-template-picker">
                    <div>
                      <FileCheck2 size={17} />
                      <span>
                        <strong>Aplicar plantilla de auditoría</strong>
                        <small>Reemplaza la selección actual con requisitos configurados.</small>
                      </span>
                    </div>
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        const selected = templates.find(
                          (item) => String(item.id) === event.target.value,
                        );
                        if (selected)
                          setDraft((current) => ({
                            ...current,
                            requirements: auditRequirementCatalog.filter((item) =>
                              selected.items.includes(item.id),
                            ),
                          }));
                      }}
                    >
                      <option value="" disabled>
                        Seleccionar plantilla
                      </option>
                      {templates
                        .filter((item) => item.kind === "Auditoría" && item.active)
                        .map((item) => (
                          <option value={item.id} key={item.id}>
                            {item.name} · {item.items.length} requisitos
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="requirement-groups">
                    {(["Unidad", "Trabajador", "Empresa", "Periodo"] as RequirementScope[]).map(
                      (scope) => (
                        <section key={scope}>
                          <div>
                            <strong>Por {scope.toLowerCase()}</strong>
                            <span>
                              {scope === "Unidad"
                                ? `${draft.vehicleIds.length} seleccionadas`
                                : scope === "Trabajador"
                                  ? `${draft.workerIds.length} seleccionados`
                                  : scope === "Empresa"
                                    ? selectedCompany?.name
                                    : draft.period}
                            </span>
                          </div>
                          <div>
                            {auditRequirementCatalog
                              .filter((item) => item.scope === scope)
                              .map((requirement) => {
                                const checked = draft.requirements.some(
                                  (item) => item.id === requirement.id,
                                );
                                return (
                                  <button
                                    key={requirement.id}
                                    className={checked ? "selected" : ""}
                                    onClick={() => toggleRequirement(requirement)}
                                  >
                                    <span>{checked && <Check size={13} />}</span>
                                    <strong>{requirement.label}</strong>
                                    <small>{requirement.scope}</small>
                                  </button>
                                );
                              })}
                          </div>
                        </section>
                      ),
                    )}
                  </div>
                  <div className="custom-requirement">
                    <div>
                      <Plus size={17} />
                      <span>
                        <strong>Requisito personalizado</strong>
                        <small>
                          No se asumirá disponibilidad hasta encontrar una coincidencia.
                        </small>
                      </span>
                    </div>
                    <div>
                      <input
                        value={customLabel}
                        onChange={(event) => setCustomLabel(event.target.value)}
                        placeholder="Nombre del documento requerido"
                      />
                      <select
                        value={customScope}
                        onChange={(event) => setCustomScope(event.target.value as RequirementScope)}
                      >
                        <option>Unidad</option>
                        <option>Trabajador</option>
                        <option>Empresa</option>
                        <option>Periodo</option>
                      </select>
                      <Button type="button" variant="secondary" onClick={addCustomRequirement}>
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              {step === 5 && (
                <div>
                  <div className="wizard-section-title">
                    <span>05</span>
                    <div>
                      <h2>Verificación documental</h2>
                      <p>
                        {isLive
                          ? "Resultados encontrados en tu repositorio privado."
                          : "Resultados encontrados en el estado compartido del prototipo."}
                      </p>
                    </div>
                  </div>
                  <AuditVerificationSummary metrics={metrics} />
                  <div className="verification-list">
                    {evidence.map((item) => (
                      <article key={item.id}>
                        <span className="verification-scope">{item.scope}</span>
                        <div>
                          <strong>{item.requirement}</strong>
                          <small>{item.target}</small>
                        </div>
                        <div>
                          <strong>{item.name || "Documento no encontrado"}</strong>
                          <small>
                            {item.expirationDate
                              ? `Vence ${new Date(`${item.expirationDate}T12:00:00`).toLocaleDateString("es-PE")}`
                              : item.name
                                ? "Sin fecha registrada"
                                : "Requiere agregar un archivo"}
                          </small>
                        </div>
                        <AuditEvidenceBadge status={item.status} />
                        <select disabled={!item.name}>
                          <option>{item.version || "Sin versión"}</option>
                        </select>
                        <button
                          className="icon-button"
                          disabled={!item.name}
                          onClick={() => onPreview(item)}
                        >
                          <Eye size={16} />
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              )}
              {step === 6 && (
                <div>
                  <div className="wizard-section-title">
                    <span>06</span>
                    <div>
                      <h2>Resumen de la auditoría</h2>
                      <p>Revisa el alcance antes de guardar.</p>
                    </div>
                  </div>
                  <div className="audit-summary-hero">
                    <div>
                      <span>
                        <Building2 size={19} />
                      </span>
                      <p>
                        <small>Empresa solicitante</small>
                        <strong>{selectedCompany?.name}</strong>
                      </p>
                    </div>
                    <Badge status={metrics.missing || metrics.expired ? "Pendiente" : "Lista"} />
                  </div>
                  <div className="audit-summary-grid">
                    <div>
                      <span>Unidades</span>
                      <strong>{draft.vehicleIds.length}</strong>
                      <p>
                        {vehicles
                          .filter((item) => draft.vehicleIds.includes(item.id))
                          .map((item) => item.plate)
                          .join(", ")}
                      </p>
                    </div>
                    <div>
                      <span>Trabajadores</span>
                      <strong>{draft.workerIds.length}</strong>
                      <p>
                        {workers
                          .filter((item) => draft.workerIds.includes(item.id))
                          .map((item) => item.name)
                          .join(", ") || "Sin trabajadores"}
                      </p>
                    </div>
                    <div>
                      <span>Requisitos</span>
                      <strong>{draft.requirements.length}</strong>
                      <p>{evidence.length} comprobaciones generadas</p>
                    </div>
                    <div>
                      <span>Documentos listos</span>
                      <strong>{metrics.ready}</strong>
                      <p>de {metrics.total} comprobaciones</p>
                    </div>
                  </div>
                  <AuditVerificationSummary metrics={metrics} />
                  {(metrics.missing > 0 || metrics.expired > 0) && (
                    <div className="audit-warning-box">
                      <AlertCircle size={18} />
                      <div>
                        <strong>La auditoría requiere atención</strong>
                        <p>
                          {metrics.missing} documentos faltantes y {metrics.expired} vencidos.
                          Puedes guardarla y continuar después.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="summary-requirements">
                    <h3>Requisitos seleccionados</h3>
                    <div>
                      {draft.requirements.map((item) => (
                        <span key={item.id}>
                          {item.label}
                          <small>{item.scope}</small>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="wizard-summary-actions">
                    <Button variant="secondary" onClick={() => setStep(5)}>
                      Volver a revisar
                    </Button>
                    <Button
                      variant="secondary"
                      icon={Save}
                      onClick={() =>
                        onSave({ ...draft, status: "Activa", updated: "Ahora" }, false)
                      }
                    >
                      Guardar auditoría
                    </Button>
                    <Button
                      icon={Package}
                      onClick={() => onSave({ ...draft, status: "Activa", updated: "Ahora" }, true)}
                    >
                      Preparar paquete documental
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {error && (
            <p className="wizard-error">
              <AlertCircle size={15} />
              {error}
            </p>
          )}
          {step < 6 && (
            <div className="wizard-navigation">
              <Button
                variant="secondary"
                onClick={step === 1 ? onCancel : () => setStep((current) => current - 1)}
              >
                {step === 1 ? "Cancelar" : "Atrás"}
              </Button>
              <span>
                {step === 2
                  ? `${draft.vehicleIds.length} unidades seleccionadas`
                  : step === 3
                    ? `${draft.workerIds.length} trabajadores seleccionados`
                    : step === 4
                      ? `${draft.requirements.length} requisitos seleccionados`
                      : ""}
              </span>
              <Button onClick={nextStep}>
                Continuar <ArrowRight size={15} />
              </Button>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  );
}
