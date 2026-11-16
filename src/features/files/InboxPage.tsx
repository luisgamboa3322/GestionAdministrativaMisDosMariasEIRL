import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check, Inbox, SlidersHorizontal, Sparkles } from "lucide-react";
import type { InboxItem } from "@/types";
import { Button, FileIcon, EmptyState } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function InboxPage({
  items,
  onSelect,
  selectedIds,
  toggleSelect,
}: {
  items: InboxItem[];
  onSelect: (f: InboxItem) => void;
  selectedIds: number[];
  toggleSelect: (id: number) => void;
}) {
  const [showInfo, setShowInfo] = useState(true);
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Bandeja documental"
        title="Archivos por organizar"
        description="Clasifica rápidamente documentos recibidos de WhatsApp, correo o proveedores."
        actions={
          <span className="demo-pill">
            <Inbox size={14} /> {items.length} pendientes
          </span>
        }
      />
      {showInfo && (
        <div className="inbox-info">
          <span>
            <Sparkles size={17} />
          </span>
          <div>
            <strong>Este es un flujo de demostración</strong>
            <p>
              Los archivos son ficticios. Al organizarlos se moverán durante esta sesión, sin
              almacenamiento permanente.
            </p>
          </div>
          <button onClick={() => setShowInfo(false)}>Entendido</button>
        </div>
      )}
      <div className="inbox-toolbar">
        <div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={items.length > 0 && selectedIds.length === items.length}
              onChange={() =>
                items.forEach((item) => {
                  const allSelected = selectedIds.length === items.length;
                  if (allSelected || !selectedIds.includes(item.id)) toggleSelect(item.id);
                })
              }
            />{" "}
            Seleccionar todo
          </label>
          {selectedIds.length > 0 && <span>{selectedIds.length} seleccionados</span>}
        </div>
        <div>
          <Button
            variant="secondary"
            icon={SlidersHorizontal}
            disabled
            title="Sin filtros adicionales"
          >
            Filtrar
          </Button>
          <select className="select-control">
            <option>Más recientes</option>
          </select>
        </div>
      </div>
      {items.length ? (
        <div className="inbox-grid">
          {items.map((file) => (
            <article
              className={`inbox-card ${selectedIds.includes(file.id) ? "selected" : ""}`}
              key={file.id}
            >
              <label className="card-check">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(file.id)}
                  onChange={() => toggleSelect(file.id)}
                />
              </label>
              <div className="inbox-preview">
                <FileIcon type={file.type} size={34} />
                <span>{file.type.toUpperCase()}</span>
              </div>
              <div className="inbox-card-body">
                <div>
                  <strong>{file.name}</strong>
                  <small>
                    {file.size} · {file.modified}
                  </small>
                </div>
                <span className="source-tag">{file.source}</span>
                <Button onClick={() => onSelect(file)}>
                  Organizar archivo <ArrowRight size={15} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Check}
          title="Bandeja organizada"
          text="No quedan archivos pendientes. Los documentos clasificados ya aparecen en Mis archivos."
        />
      )}
    </motion.div>
  );
}
