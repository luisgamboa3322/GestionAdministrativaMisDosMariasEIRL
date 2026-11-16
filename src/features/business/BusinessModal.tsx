import { useState } from "react";
import { Save } from "lucide-react";
import type { BusinessRecord } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Common";

export function BusinessModal({
  mode,
  initial,
  onClose,
  onCreate,
}: {
  mode: "supplier" | "company";
  initial?: BusinessRecord | null;
  onClose: () => void;
  onCreate: (record: Omit<BusinessRecord, "id" | "updated" | "folderId">) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    legalName: initial?.legalName || "",
    kind: initial?.kind || (mode === "supplier" ? "Mantenimiento" : "Minería"),
    contact: initial?.contact || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
  });
  return (
    <Modal
      title={`${initial ? "Editar" : "Registrar"} ${mode === "supplier" ? "proveedor" : "empresa"}`}
      subtitle="Los datos se conservarán solo durante esta sesión."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.name.trim()) onCreate(form);
        }}
      >
        <label>
          Nombre comercial
          <input
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Razón social
          <input
            required
            value={form.legalName}
            onChange={(event) => setForm({ ...form, legalName: event.target.value })}
          />
        </label>
        <label>
          Tipo
          <select
            value={form.kind}
            onChange={(event) => setForm({ ...form, kind: event.target.value })}
          >
            {(mode === "supplier"
              ? ["Mantenimiento", "Repuestos", "Seguros", "Combustible", "Otros"]
              : ["Minería", "Agroindustria", "Construcción", "Servicios", "Otros"]
            ).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Persona de contacto
          <input
            value={form.contact}
            onChange={(event) => setForm({ ...form, contact: event.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Teléfono
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={Save}>
            {initial ? "Guardar cambios" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
