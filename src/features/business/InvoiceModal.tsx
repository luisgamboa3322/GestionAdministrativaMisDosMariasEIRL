import { useState } from "react";
import { Save } from "lucide-react";
import type { BusinessRecord, InvoiceRecord } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Common";

export function InvoiceModal({
  companies,
  onClose,
  onCreate,
}: {
  companies: BusinessRecord[];
  onClose: () => void;
  onCreate: (record: Omit<InvoiceRecord, "id">, rawFile?: globalThis.File) => void;
}) {
  const [rawFile, setRawFile] = useState<globalThis.File | undefined>();
  const [form, setForm] = useState({
    number: "",
    company: companies[0]?.legalName || "",
    date: "2026-11-16",
    amount: "",
    currency: "PEN" as InvoiceRecord["currency"],
    status: "Pendiente" as InvoiceRecord["status"],
    fileName: "",
  });
  return (
    <Modal
      title="Registrar factura"
      subtitle="Archivo documental de comprobante, sin emisión electrónica."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.number && form.amount)
            onCreate(
              {
                ...form,
                amount: Number(form.amount),
                fileName: form.fileName || `${form.number}.pdf`,
              },
              rawFile,
            );
        }}
      >
        <label>
          Número de factura
          <input
            required
            value={form.number}
            onChange={(event) => setForm({ ...form, number: event.target.value.toUpperCase() })}
            placeholder="F001-00484"
          />
        </label>
        <label>
          Empresa
          <select
            value={form.company}
            onChange={(event) => setForm({ ...form, company: event.target.value })}
          >
            {companies.map((item) => (
              <option key={item.id}>{item.legalName}</option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label>
            Fecha
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </label>
          <label>
            Estado
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as InvoiceRecord["status"] })
              }
            >
              <option>Pagada</option>
              <option>Pendiente</option>
              <option>Vencida</option>
            </select>
          </label>
          <label>
            Moneda
            <select
              value={form.currency}
              onChange={(event) =>
                setForm({ ...form, currency: event.target.value as InvoiceRecord["currency"] })
              }
            >
              <option>PEN</option>
              <option>USD</option>
            </select>
          </label>
          <label>
            Importe
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </label>
        </div>
        <label>
          Archivo adjunto
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.txt"
            onChange={(event) => {
              const picked = event.target.files?.[0];
              setRawFile(picked);
              setForm({ ...form, fileName: picked?.name || "" });
            }}
          />
        </label>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={Save}>
            Guardar factura
          </Button>
        </div>
      </form>
    </Modal>
  );
}
