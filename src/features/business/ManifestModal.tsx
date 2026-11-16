import { useState } from "react";
import { Save } from "lucide-react";
import type { Vehicle, BusinessRecord, ManifestRecord } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Common";

export function ManifestModal({
  vehicles,
  companies,
  onClose,
  onCreate,
}: {
  vehicles: Vehicle[];
  companies: BusinessRecord[];
  onClose: () => void;
  onCreate: (record: Omit<ManifestRecord, "id">, rawFile?: globalThis.File) => void;
}) {
  const [rawFile, setRawFile] = useState<globalThis.File | undefined>();
  const [form, setForm] = useState({
    number: "",
    date: "2026-11-16",
    vehicle: vehicles[0]?.plate || "",
    company: companies[0]?.name || "",
    service: "Traslado de personal",
    period: "Noviembre 2026",
    fileName: "",
  });
  return (
    <Modal
      title="Registrar manifiesto"
      subtitle="Asocia un archivo a una unidad y servicio."
      onClose={onClose}
      wide
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.number)
            onCreate({ ...form, fileName: form.fileName || `${form.number}.pdf` }, rawFile);
        }}
      >
        <div className="form-grid">
          <label>
            Número
            <input
              required
              value={form.number}
              onChange={(event) => setForm({ ...form, number: event.target.value.toUpperCase() })}
              placeholder="MAN-2025-0620"
            />
          </label>
          <label>
            Fecha
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
          </label>
          <label>
            Unidad
            <select
              value={form.vehicle}
              onChange={(event) => setForm({ ...form, vehicle: event.target.value })}
            >
              {vehicles.map((item) => (
                <option key={item.id}>{item.plate}</option>
              ))}
            </select>
          </label>
          <label>
            Empresa
            <select
              value={form.company}
              onChange={(event) => setForm({ ...form, company: event.target.value })}
            >
              {companies.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Servicio
            <input
              value={form.service}
              onChange={(event) => setForm({ ...form, service: event.target.value })}
            />
          </label>
          <label>
            Periodo
            <input
              value={form.period}
              onChange={(event) => setForm({ ...form, period: event.target.value })}
            />
          </label>
        </div>
        <label>
          Archivo adjunto (PDF, Excel o imagen)
          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.docx,.jpg,.jpeg,.png"
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
            Guardar manifiesto
          </Button>
        </div>
      </form>
    </Modal>
  );
}
