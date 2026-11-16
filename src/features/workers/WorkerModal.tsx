import { useState } from "react";
import { AlertCircle, UserPlus } from "lucide-react";
import type { TemplateSetting, Worker } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Common";

export function WorkerModal({
  templates,
  onClose,
  onCreate,
}: {
  templates: TemplateSetting[];
  onClose: () => void;
  onCreate: (worker: Omit<Worker, "id" | "folderId" | "initials">, categories: string[]) => void;
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    role: "Conductor",
    status: "Activo" as Worker["status"],
    phone: "",
    email: "",
  });
  const workerTemplates = templates.filter((item) => item.kind === "Trabajador" && item.active);
  const [templateId, setTemplateId] = useState(String(workerTemplates[0]?.id || "none"));
  const [error, setError] = useState("");
  return (
    <Modal
      title="Registrar trabajador"
      subtitle="Crea una ficha profesional con datos mínimos."
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!form.name.trim() || !form.code.trim())
            return setError("Completa el nombre y el código interno.");
          onCreate(
            form,
            workerTemplates.find((item) => String(item.id) === templateId)?.items || [],
          );
        }}
      >
        <div className="form-grid">
          <label>
            Código interno
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
              placeholder="TR-005"
            />
          </label>
          <label>
            Estado
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as Worker["status"] })
              }
            >
              <option>Activo</option>
              <option>En descanso</option>
              <option>Inactivo</option>
            </select>
          </label>
        </div>
        <label>
          Nombre completo
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Nombre del trabajador"
          />
        </label>
        <label>
          Cargo
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            <option>Conductor</option>
            <option>Supervisor de ruta</option>
            <option>Coordinador de operaciones</option>
            <option>Asistente administrativo</option>
          </select>
        </label>
        <label>
          Plantilla documental
          <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            {workerTemplates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.items.length} categorías
              </option>
            ))}
            <option value="none">Sin plantilla</option>
          </select>
        </label>
        <div className="form-grid">
          <label>
            Teléfono
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="+51 900 000 000"
            />
          </label>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="correo@demo.pe"
            />
          </label>
        </div>
        {error && (
          <p className="form-note error">
            <AlertCircle size={14} />
            {error}
          </p>
        )}
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={UserPlus}>
            Registrar trabajador
          </Button>
        </div>
      </form>
    </Modal>
  );
}
