import { useState } from "react";
import { Save } from "lucide-react";
import type { Vehicle } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Common";

export function EditVehicleModal({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (patch: Partial<Vehicle>) => void;
}) {
  const [form, setForm] = useState(vehicle);
  return (
    <Modal
      title={`Editar ${vehicle.plate}`}
      subtitle="Actualiza los datos de la unidad en esta sesión."
      onClose={onClose}
      wide
    >
      <form
        className="modal-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="form-grid">
          <label>
            Código interno
            <input
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
            />
          </label>
          <label>
            Placa
            <input
              value={form.plate}
              onChange={(event) => setForm({ ...form, plate: event.target.value.toUpperCase() })}
            />
          </label>
          <label>
            Marca
            <input
              value={form.brand}
              onChange={(event) => setForm({ ...form, brand: event.target.value })}
            />
          </label>
          <label>
            Modelo
            <input
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
            />
          </label>
          <label>
            Año
            <input
              type="number"
              value={form.year}
              onChange={(event) => setForm({ ...form, year: event.target.value })}
            />
          </label>
          <label>
            Capacidad
            <input
              type="number"
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
            />
          </label>
          <label>
            Tipo
            <select
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              <option>Bus de personal</option>
              <option>Minibús</option>
              <option>Van</option>
              <option>Camioneta</option>
            </select>
          </label>
          <label>
            Estado
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as Vehicle["status"] })
              }
            >
              <option>Operativa</option>
              <option>En mantenimiento</option>
              <option>Inactiva</option>
            </select>
          </label>
        </div>
        <label>
          Observaciones
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </label>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon={Save}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
