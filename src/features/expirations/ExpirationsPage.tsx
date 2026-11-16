import { useState } from "react";
import { motion } from "motion/react";
import { Bell, CalendarClock, ChevronRight, Settings, Sparkles } from "lucide-react";
import type { DemoFile } from "@/types";
import { daysUntil } from "@/utils/dates";
import { Button, Badge, FileIcon, EmptyState, DirectoryToolbar } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function ExpirationsPage({
  files,
  onPreview,
  isLive = false,
}: {
  files: DemoFile[];
  onPreview: (file: DemoFile) => void;
  isLive?: boolean;
}) {
  const [filter, setFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const refDate = isLive ? new Date() : undefined;
  const expiring = files.filter((file) => file.expirationDate);
  const statusFor = (file: DemoFile) => {
    const days = daysUntil(file.expirationDate, refDate);
    return days === null
      ? "Sin fecha"
      : days < 0
        ? "Vencido"
        : days <= 30
          ? "Por vencer"
          : "Vigente";
  };
  const candidates =
    filter === "Sin fecha" ? files.filter((file) => !file.expirationDate) : expiring;
  const filtered = candidates.filter(
    (file) =>
      (filter === "Todos" || statusFor(file) === filter) &&
      `${file.name} ${file.category} ${file.vehicle} ${file.worker}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Control documental"
        title="Centro de vencimientos"
        description={
          isLive
            ? "Estados calculados al día de hoy desde los registros guardados."
            : "Estados calculados con fechas coherentes para la demostración del 20 de junio de 2025."
        }
        actions={
          <Button
            variant="secondary"
            icon={Settings}
            onClick={() =>
              document
                .querySelector(".expiration-settings")
                ?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
          >
            Configurar alertas
          </Button>
        }
      />
      <div className="expiration-indicators">
        {["Vigente", "Por vencer", "Vencido", "Sin fecha"].map((status) => (
          <button
            className={filter === status ? "active" : ""}
            key={status}
            onClick={() => setFilter(filter === status ? "Todos" : status)}
          >
            <span
              className={`expiration-dot expiration-${status.toLowerCase().replace(/ /g, "-")}`}
            />
            <div>
              <strong>
                {status === "Sin fecha"
                  ? files.filter((file) => !file.expirationDate).length
                  : expiring.filter((file) => statusFor(file) === status).length}
              </strong>
              <small>{status}</small>
            </div>
          </button>
        ))}
      </div>
      <div className="expiration-layout">
        <section>
          <DirectoryToolbar
            query={query}
            setQuery={setQuery}
            placeholder="Buscar documento, unidad o trabajador"
            filter={filter}
            setFilter={setFilter}
            options={["Todos", "Vigente", "Por vencer", "Vencido", "Sin fecha"]}
          />
          <div className="expiration-table card">
            <div className="expiration-table-head">
              <span>Documento</span>
              <span>Relacionado con</span>
              <span>Categoría</span>
              <span>Fecha</span>
              <span>Días</span>
              <span>Estado</span>
              <span />
            </div>
            {filtered.length ? (
              filtered.map((file) => {
                const days = daysUntil(file.expirationDate, refDate);
                const status = statusFor(file);
                return (
                  <button key={file.id} onClick={() => onPreview(file)}>
                    <span className="expiration-doc">
                      <FileIcon type={file.type} />
                      <span>
                        <strong>{file.name}</strong>
                        <small>{file.size}</small>
                      </span>
                    </span>
                    <span>{file.vehicle || file.worker || file.company || "General"}</span>
                    <span>{file.category}</span>
                    <span>
                      {file.expirationDate
                        ? new Date(`${file.expirationDate}T12:00:00`).toLocaleDateString("es-PE")
                        : "Sin fecha"}
                    </span>
                    <strong
                      className={
                        days === null ? "" : days < 0 ? "negative" : days <= 30 ? "soon" : ""
                      }
                    >
                      {days === null
                        ? "Sin fecha"
                        : days < 0
                          ? `${Math.abs(days)} vencido`
                          : `${days} días`}
                    </strong>
                    <Badge status={status} />
                    <ChevronRight size={16} />
                  </button>
                );
              })
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="Sin vencimientos"
                text="No hay documentos que coincidan con los filtros seleccionados."
              />
            )}
          </div>
        </section>
        <aside className="expiration-settings card">
          <span>
            <Bell size={21} />
          </span>
          <h2>Alertas configurables</h2>
          <p>Define cuándo deseas recibir avisos en una futura implementación.</p>
          {[30, 15, 7, 1].map((days) => (
            <label key={days}>
              <span>
                <strong>
                  {days} {days === 1 ? "día" : "días"} antes
                </strong>
                <small>Aviso visual en el sistema</small>
              </span>
              <input type="checkbox" defaultChecked={days !== 1} />
            </label>
          ))}
          <div className="prototype-note">
            <Sparkles size={14} />
            <span>Estos controles son demostrativos. No se envían notificaciones reales.</span>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
