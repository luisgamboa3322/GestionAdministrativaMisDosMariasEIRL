import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Clock3,
  Files,
  Mail,
  MoreHorizontal,
  Phone,
  UserPlus,
  Users,
} from "lucide-react";
import type { DemoFile, Worker } from "@/types";
import { Button, Badge, StatCard, EmptyState, DirectoryToolbar } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function WorkersPage({
  workers,
  files,
  onOpen,
  onAdd,
}: {
  workers: Worker[];
  files: DemoFile[];
  onOpen: (worker: Worker) => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const filtered = workers.filter(
    (worker) =>
      (filter === "Todos" || worker.status === filter) &&
      `${worker.name} ${worker.code} ${worker.role}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Equipo operativo"
        title="Trabajadores"
        description="Gestiona expedientes laborales sin exponer información personal innecesaria."
        actions={
          <Button icon={UserPlus} onClick={onAdd}>
            Registrar trabajador
          </Button>
        }
      />
      <div className="module-stats">
        <StatCard
          label="Trabajadores"
          value={String(workers.length)}
          note="Datos ficticios"
          icon={Users}
        />
        <StatCard
          label="Activos"
          value={String(workers.filter((worker) => worker.status === "Activo").length)}
          note="Disponibles para operar"
          icon={Check}
          tone="teal"
        />
        <StatCard
          label="Licencias por vencer"
          value={String(files.filter((file) => file.worker && file.status === "Por vencer").length)}
          note="Próximos 30 días"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Documentos laborales"
          value={String(files.filter((file) => file.worker).length)}
          note="En expedientes"
          icon={Files}
          tone="blue"
        />
      </div>
      <DirectoryToolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar por nombre, cargo o código"
        filter={filter}
        setFilter={setFilter}
        options={["Todos", "Activo", "En descanso", "Inactivo"]}
      />
      {filtered.length ? (
        <div className="worker-grid">
          {filtered.map((worker) => {
            const documents = files.filter((file) => file.worker === worker.name);
            const alerts = documents.filter(
              (file) => file.status === "Por vencer" || file.status === "Vencido",
            ).length;
            return (
              <article className="worker-card" key={worker.id}>
                <div className="worker-card-head">
                  <span className="avatar avatar-large">{worker.initials}</span>
                  <Badge status={worker.status} />
                  <button className="icon-button">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                <h2>{worker.name}</h2>
                <p>{worker.role}</p>
                <span className="worker-code">{worker.code}</span>
                <div className="worker-contact">
                  <span>
                    <Mail size={14} />
                    {worker.email}
                  </span>
                  <span>
                    <Phone size={14} />
                    {worker.phone}
                  </span>
                </div>
                <div className="worker-doc-summary">
                  <div>
                    <strong>{documents.length}</strong>
                    <small>Documentos</small>
                  </div>
                  <div className={alerts ? "alert" : ""}>
                    <strong>{alerts}</strong>
                    <small>Alertas</small>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => onOpen(worker)}>
                  Ver ficha <ArrowRight size={15} />
                </Button>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Sin trabajadores"
          text={
            query
              ? `No encontramos coincidencias para “${query}”.`
              : "Registra al primer trabajador para crear su expediente."
          }
          action={
            !query && (
              <Button icon={UserPlus} onClick={onAdd}>
                Registrar trabajador
              </Button>
            )
          }
        />
      )}
    </motion.div>
  );
}
