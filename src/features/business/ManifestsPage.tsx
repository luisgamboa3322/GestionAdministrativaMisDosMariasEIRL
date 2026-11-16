import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Building2,
  Bus,
  CalendarClock,
  Download,
  Eye,
  Files,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { Vehicle, BusinessRecord, ManifestRecord } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button, FileIcon, EmptyState, DirectoryToolbar } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function ManifestsPage({
  manifests,
  vehicles,
  companies,
  onAdd,
}: {
  manifests: ManifestRecord[];
  vehicles: Vehicle[];
  companies: BusinessRecord[];
  onAdd: () => void;
}) {
  const [query, setQuery] = useState("");
  const [vehicle, setVehicle] = useState("Todas");
  const [selected, setSelected] = useState<ManifestRecord | null>(null);
  const filtered = manifests.filter(
    (item) =>
      (vehicle === "Todas" || item.vehicle === vehicle) &&
      `${item.number} ${item.company} ${item.service}`.toLowerCase().includes(query.toLowerCase()),
  );
  const groups = Array.from(new Set(filtered.map((item) => item.date)));
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Operación documental"
        title="Manifiestos"
        description="Consulta archivos de servicio agrupados cronológicamente, sin datos reales de pasajeros."
        actions={
          <Button icon={Upload} onClick={onAdd}>
            Subir manifiesto
          </Button>
        }
      />
      <div className="manifest-warning">
        <ShieldCheck size={17} />
        <p>
          <strong>Privacidad del prototipo</strong>
          <span>
            Los manifiestos son ejemplos y no contienen nombres ni información real de pasajeros.
          </span>
        </p>
      </div>
      <DirectoryToolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar número, empresa o servicio"
        filter={vehicle}
        setFilter={setVehicle}
        options={["Todas", ...vehicles.map((item) => item.plate)]}
      />
      {groups.length ? (
        <div className="manifest-groups">
          {groups.map((date) => (
            <section key={date}>
              <div className="manifest-date">
                <CalendarClock size={16} />
                <span>
                  <strong>
                    {new Date(`${date}T12:00:00`).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                  <small>{filtered.filter((item) => item.date === date).length} manifiestos</small>
                </span>
              </div>
              <div className="manifest-list card">
                {filtered
                  .filter((item) => item.date === date)
                  .map((item) => (
                    <article key={item.id}>
                      <FileIcon type="pdf" />
                      <div>
                        <strong>{item.number}</strong>
                        <small>{item.fileName}</small>
                      </div>
                      <span>
                        <Bus size={14} />
                        {item.vehicle}
                      </span>
                      <span>
                        <Building2 size={14} />
                        {item.company}
                      </span>
                      <span>{item.service}</span>
                      <button
                        className="icon-button"
                        aria-label={`Ver ${item.number}`}
                        onClick={() => setSelected(item)}
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label="Descarga no disponible"
                        disabled
                        title="Descarga pendiente de backend"
                      >
                        <Download size={17} />
                      </button>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Files}
          title="Sin manifiestos"
          text="No encontramos manifiestos para los filtros seleccionados."
          action={
            <Button icon={Upload} onClick={onAdd}>
              Subir manifiesto
            </Button>
          }
        />
      )}
      <AnimatePresence>
        {selected && (
          <Modal
            title={selected.number}
            subtitle="Detalle del manifiesto demostrativo"
            onClose={() => setSelected(null)}
          >
            <div className="invoice-detail">
              <span className="invoice-detail-icon">
                <Files size={24} />
              </span>
              <h3>{selected.fileName}</h3>
              <dl>
                <div>
                  <dt>Fecha</dt>
                  <dd>{new Date(`${selected.date}T12:00:00`).toLocaleDateString("es-PE")}</dd>
                </div>
                <div>
                  <dt>Unidad</dt>
                  <dd>{selected.vehicle}</dd>
                </div>
                <div>
                  <dt>Empresa</dt>
                  <dd>{selected.company}</dd>
                </div>
                <div>
                  <dt>Servicio</dt>
                  <dd>{selected.service}</dd>
                </div>
                <div>
                  <dt>Periodo</dt>
                  <dd>{selected.period}</dd>
                </div>
              </dl>
              <div className="prototype-note">
                <ShieldCheck size={14} />
                <span>No contiene información real de pasajeros.</span>
              </div>
              <div className="modal-actions">
                <Button onClick={() => setSelected(null)}>Cerrar</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
