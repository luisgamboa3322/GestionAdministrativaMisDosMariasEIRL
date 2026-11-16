import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  Bus,
  Check,
  Clock3,
  Grid2X2,
  List,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { DemoFile, Vehicle } from "@/types";
import { Button, EmptyState } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function VehiclesPage({
  vehicles,
  files,
  onRegister,
  onOpen,
}: {
  vehicles: Vehicle[];
  files: DemoFile[];
  onRegister: () => void;
  onOpen: (vehicle: Vehicle) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todas");
  const [view, setView] = useState<"grid" | "list">("grid");
  const filtered = vehicles.filter(
    (vehicle) =>
      (status === "Todas" || vehicle.status === status) &&
      `${vehicle.plate} ${vehicle.code} ${vehicle.brand} ${vehicle.model}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Gestión de flota"
        title="Mis unidades"
        description="Consulta el estado documental y el expediente digital de cada vehículo."
        actions={
          <Button icon={Plus} onClick={onRegister}>
            Registrar unidad
          </Button>
        }
      />
      <div className="vehicle-summary">
        <div>
          <span>
            <Bus size={18} />
          </span>
          <p>
            <strong>{vehicles.length}</strong>
            <small>Unidades registradas</small>
          </p>
        </div>
        <div>
          <span className="success">
            <Check size={18} />
          </span>
          <p>
            <strong>{vehicles.filter((v) => v.status === "Operativa").length}</strong>
            <small>Operativas</small>
          </p>
        </div>
        <div>
          <span className="warning">
            <Clock3 size={18} />
          </span>
          <p>
            <strong>{files.filter((file) => file.status === "Por vencer").length}</strong>
            <small>Documentos por vencer</small>
          </p>
        </div>
        <div>
          <span className="danger">
            <AlertCircle size={18} />
          </span>
          <p>
            <strong>{files.filter((file) => file.status === "Vencido").length}</strong>
            <small>Documentos vencidos</small>
          </p>
        </div>
      </div>
      <div className="vehicle-toolbar">
        <label className="inline-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por placa, código, marca o modelo"
          />
        </label>
        <select
          className="select-control"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filtrar por estado"
        >
          <option>Todas</option>
          <option>Operativa</option>
          <option>En mantenimiento</option>
          <option>Inactiva</option>
        </select>
        <div className="view-switch">
          <button
            className={view === "grid" ? "active" : ""}
            onClick={() => setView("grid")}
            aria-label="Vista de cuadrícula"
          >
            <Grid2X2 size={17} />
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
            aria-label="Vista de lista"
          >
            <List size={18} />
          </button>
        </div>
      </div>
      {filtered.length ? (
        <div className={`vehicle-grid ${view === "list" ? "vehicle-list" : ""}`}>
          {filtered.map((vehicle) => {
            const docs = files.filter((file) => file.vehicle === vehicle.plate);
            const pending = docs.filter(
              (file) => file.status === "Vencido" || file.status === "Por vencer",
            ).length;
            return (
              <article className="vehicle-card" key={vehicle.id}>
                <button className="vehicle-photo" onClick={() => onOpen(vehicle)}>
                  <img src={vehicle.cover} alt={`Bus ${vehicle.plate}`} />
                  <span
                    className={`vehicle-status status-${vehicle.status.toLowerCase().replace(/ /g, "-")}`}
                  >
                    {vehicle.status}
                  </span>
                  <small>Foto de demostración</small>
                </button>
                <div className="vehicle-card-body">
                  <div className="vehicle-card-title">
                    <div>
                      <strong>{vehicle.plate}</strong>
                      <span>{vehicle.code}</span>
                    </div>
                    <button
                      className="icon-button"
                      aria-label={`Abrir ficha de ${vehicle.plate}`}
                      onClick={() => onOpen(vehicle)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  <p>
                    {vehicle.brand} {vehicle.model} · {vehicle.year}
                  </p>
                  <dl>
                    <div>
                      <dt>Capacidad</dt>
                      <dd>{vehicle.capacity} pasajeros</dd>
                    </div>
                    <div>
                      <dt>Documentos</dt>
                      <dd>{docs.length || "Sin archivos"}</dd>
                    </div>
                  </dl>
                  <div className={`vehicle-doc-state ${pending ? "needs-attention" : ""}`}>
                    {pending ? <AlertCircle size={15} /> : <ShieldCheck size={15} />}
                    <span>
                      <strong>
                        {pending ? `${pending} requieren atención` : "Expediente al día"}
                      </strong>
                      <small>{vehicle.folderId ? "Expediente creado" : "Sin expediente"}</small>
                    </span>
                  </div>
                  <Button variant="secondary" onClick={() => onOpen(vehicle)}>
                    Ver ficha digital <ArrowRight size={15} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bus}
          title={query ? "No encontramos unidades" : "Aún no hay unidades"}
          text={
            query
              ? `No hay placas o códigos que coincidan con “${query}”.`
              : "Registra el primer vehículo para crear su expediente digital."
          }
          action={
            !query && (
              <Button icon={Plus} onClick={onRegister}>
                Registrar unidad
              </Button>
            )
          }
        />
      )}
    </motion.div>
  );
}
