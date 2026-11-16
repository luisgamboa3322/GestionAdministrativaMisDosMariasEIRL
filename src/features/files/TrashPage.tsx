import { useState } from "react";
import { motion } from "motion/react";
import { Folder, Search, ShieldCheck, Trash2, RotateCcw } from "lucide-react";
import type { TrashEntry } from "@/types";
import { Button, FileIcon, EmptyState } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function TrashPage({
  entries,
  onRestore,
  onRequestDelete,
}: {
  entries: TrashEntry[];
  onRestore: (id: number) => void;
  onRequestDelete: (entry: TrashEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = entries.filter((entry) =>
    entry.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Recuperación"
        title="Papelera"
        description="Restaura elementos eliminados durante la sesión. No se eliminan datos reales."
        actions={
          <span className="demo-pill">
            <Trash2 size={14} /> {entries.length} elementos
          </span>
        }
      />
      <div className="trash-notice">
        <ShieldCheck size={17} />
        <div>
          <strong>Papelera demostrativa</strong>
          <p>La eliminación permanente solo afecta datos ficticios de esta sesión.</p>
        </div>
      </div>
      <div className="directory-toolbar">
        <label className="inline-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar elementos eliminados"
          />
        </label>
      </div>
      {filtered.length ? (
        <div className="trash-table card">
          <div className="trash-table-head">
            <span>Elemento</span>
            <span>Tipo</span>
            <span>Fecha de eliminación</span>
            <span>Contenido</span>
            <span />
          </div>
          {filtered.map((entry) => (
            <article key={entry.id}>
              <span className="trash-name">
                {entry.kind === "Archivo" ? (
                  <FileIcon type={entry.files[0]?.type || "pdf"} />
                ) : (
                  <span className="folder-mini">
                    <Folder size={18} />
                  </span>
                )}
                <span>
                  <strong>{entry.name}</strong>
                  <small>Ubicación original conservada</small>
                </span>
              </span>
              <span>{entry.kind}</span>
              <span>{entry.deletedAt}</span>
              <span>
                {entry.files.length} archivos · {entry.folders.length} carpetas
              </span>
              <div>
                <Button variant="secondary" icon={RotateCcw} onClick={() => onRestore(entry.id)}>
                  Restaurar
                </Button>
                <button
                  className="icon-button danger-action"
                  title="Eliminar permanentemente"
                  onClick={() => onRequestDelete(entry)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trash2}
          title="La papelera está vacía"
          text="Los elementos que elimines desde Mis archivos aparecerán aquí."
        />
      )}
    </motion.div>
  );
}
