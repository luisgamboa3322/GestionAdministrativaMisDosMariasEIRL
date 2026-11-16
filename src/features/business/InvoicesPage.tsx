import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Clock3,
  CreditCard,
  Download,
  MoreHorizontal,
  Plus,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import type { InvoiceRecord } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button, Badge, FileIcon, StatCard, DirectoryToolbar } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function InvoicesPage({
  invoices,
  onAdd,
  isLive = false,
}: {
  invoices: InvoiceRecord[];
  onAdd: () => void;
  isLive?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<InvoiceRecord | null>(null);
  const filtered = invoices.filter(
    (item) =>
      (filter === "Todos" || item.status === filter) &&
      `${item.number} ${item.company}`.toLowerCase().includes(query.toLowerCase()),
  );
  const totalPen = invoices
    .filter((item) => item.currency === "PEN")
    .reduce((sum, item) => sum + item.amount, 0);
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Gestión documental"
        title="Facturas"
        description="Consulta comprobantes y archivos asociados. No implementa facturación electrónica."
        actions={
          <Button icon={Plus} onClick={onAdd}>
            Registrar factura
          </Button>
        }
      />
      <div className="module-stats invoice-stats">
        <StatCard
          label="Facturas registradas"
          value={String(invoices.length)}
          note={isLive ? "En repositorio privado" : "Datos de demostración"}
          icon={ReceiptText}
        />
        <StatCard
          label="Importe en soles"
          value={`S/ ${totalPen.toLocaleString("es-PE")}`}
          note={isLive ? "Acumulado en soles" : "Resumen demostrativo"}
          icon={CreditCard}
          tone="blue"
        />
        <StatCard
          label="Pendientes"
          value={String(invoices.filter((item) => item.status === "Pendiente").length)}
          note="Por revisar"
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label="Vencidas"
          value={String(invoices.filter((item) => item.status === "Vencida").length)}
          note="Requieren atención"
          icon={AlertCircle}
          tone="red"
        />
      </div>
      <DirectoryToolbar
        query={query}
        setQuery={setQuery}
        placeholder="Buscar número o empresa"
        filter={filter}
        setFilter={setFilter}
        options={["Todos", "Pagada", "Pendiente", "Vencida"]}
      />
      <div className="invoice-table card">
        <div className="invoice-table-head">
          <span>Número</span>
          <span>Empresa</span>
          <span>Fecha</span>
          <span>Importe</span>
          <span>Archivo</span>
          <span>Estado</span>
          <span />
        </div>
        {filtered.map((item) => (
          <article key={item.id} onClick={() => setSelected(item)}>
            <strong>{item.number}</strong>
            <span>{item.company}</span>
            <span>{new Date(`${item.date}T12:00:00`).toLocaleDateString("es-PE")}</span>
            <strong>
              {item.currency === "PEN" ? "S/" : "US$"}{" "}
              {item.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </strong>
            <span className="invoice-file">
              <FileIcon type="pdf" />
              <small>{item.fileName}</small>
            </span>
            <Badge status={item.status} />
            <button
              className="icon-button"
              onClick={(event) => {
                event.stopPropagation();
                setSelected(item);
              }}
            >
              <MoreHorizontal size={18} />
            </button>
          </article>
        ))}
      </div>
      <AnimatePresence>
        {selected && (
          <Modal
            title={`Factura ${selected.number}`}
            subtitle={isLive ? "Detalle del comprobante registrado." : "Detalle documental de demostración."}
            onClose={() => setSelected(null)}
          >
            <div className="invoice-detail">
              <span className="invoice-detail-icon">
                <ReceiptText size={25} />
              </span>
              <Badge status={selected.status} />
              <h3>{selected.company}</h3>
              <dl>
                <div>
                  <dt>Fecha</dt>
                  <dd>{new Date(`${selected.date}T12:00:00`).toLocaleDateString("es-PE")}</dd>
                </div>
                <div>
                  <dt>Importe</dt>
                  <dd>
                    {selected.currency === "PEN" ? "S/" : "US$"}{" "}
                    {selected.amount.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </dd>
                </div>
                <div>
                  <dt>Moneda</dt>
                  <dd>{selected.currency}</dd>
                </div>
                <div>
                  <dt>Archivo</dt>
                  <dd>{selected.fileName}</dd>
                </div>
              </dl>
              <div className="prototype-note">
                <Sparkles size={14} />
                <span>Consulta demostrativa. No existe conexión con facturación electrónica.</span>
              </div>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setSelected(null)}>
                  Cerrar
                </Button>
                <Button icon={Download} disabled title="Descarga pendiente de backend">
                  Descarga no disponible
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
