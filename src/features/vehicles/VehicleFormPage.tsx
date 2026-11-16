import { FormEvent, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Bus, Camera, Check, Folder, ShieldCheck, Sparkles, X } from "lucide-react";
import type { TemplateSetting, Vehicle } from "@/types";
import { photos } from "@/data/demo";
import { Button } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function VehicleFormPage({
  onBack,
  onCreate,
  existingPlates,
  templates,
  isLive = false,
}: {
  onBack: () => void;
  onCreate: (
    vehicle: Omit<Vehicle, "id" | "folderId">,
    categories: string[],
    rawPhotoFiles?: globalThis.File[],
  ) => void | Promise<void>;
  existingPlates: string[];
  templates: TemplateSetting[];
  isLive?: boolean;
}) {
  const photoInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    code: "",
    plate: "",
    brand: "",
    model: "",
    year: "2025",
    capacity: "",
    type: "Bus de personal",
    status: "Operativa" as Vehicle["status"],
    notes: "",
  });
  const [photoEntries, setPhotoEntries] = useState<{ url: string; file: globalThis.File }[]>([]);
  const unitTemplates = templates.filter((item) => item.kind === "Unidad" && item.active);
  const [template, setTemplate] = useState(String(unitTemplates[0]?.id || "none"));
  const selectedTemplate = unitTemplates.find((item) => String(item.id) === template);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  function update(key: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  }
  function addPhotos(selected?: FileList | null) {
    if (!selected?.length) return;
    const next = Array.from(selected).map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setPhotoEntries((previous) => [...previous, ...next].slice(0, 6));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.code.trim()) nextErrors.code = "Ingresa el código interno.";
    if (!form.plate.trim()) nextErrors.plate = "Ingresa la placa.";
    if (existingPlates.includes(form.plate.trim().toUpperCase()))
      nextErrors.plate = "Esta placa ya está registrada.";
    if (!form.brand.trim()) nextErrors.brand = "Ingresa la marca.";
    if (!form.model.trim()) nextErrors.model = "Ingresa el modelo.";
    if (!form.capacity || Number(form.capacity) < 1)
      nextErrors.capacity = "Ingresa una capacidad válida.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const urls = photoEntries.map((item) => item.url);
    const cover = urls[0] || photos.bus1;
    setSubmitting(true);
    try {
      await onCreate(
        {
          ...form,
          code: form.code.trim().toUpperCase(),
          plate: form.plate.trim().toUpperCase(),
          cover,
          photos: urls.length ? urls : [cover],
        },
        selectedTemplate?.items || [],
        photoEntries.map((item) => item.file),
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <motion.div className="page" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Volver a Mis unidades
      </button>
      <PageHeader
        eyebrow="Nueva unidad"
        title="Registrar unidad"
        description="Completa los datos y prepara su expediente documental automático."
        actions={
          <span className="demo-pill">
            <Sparkles size={14} /> {isLive ? "Almacenamiento privado" : "Datos de demostración"}
          </span>
        }
      />
      <form className="vehicle-form-layout" onSubmit={submit}>
        <div className="vehicle-form-main">
          <section className="form-section-card">
            <div className="form-section-head">
              <span>01</span>
              <div>
                <h2>Información de la unidad</h2>
                <p>Datos de identificación y operación.</p>
              </div>
            </div>
            <div className="vehicle-fields">
              <label>
                Código interno
                <input
                  value={form.code}
                  onChange={(event) => update("code", event.target.value)}
                  placeholder="Ej. UN-004"
                  className={errors.code ? "invalid" : ""}
                />
                {errors.code && <small className="field-error">{errors.code}</small>}
              </label>
              <label>
                Placa
                <input
                  value={form.plate}
                  onChange={(event) => update("plate", event.target.value)}
                  placeholder="Ej. A1B-234"
                  className={errors.plate ? "invalid" : ""}
                />
                {errors.plate && <small className="field-error">{errors.plate}</small>}
              </label>
              <label>
                Marca
                <input
                  value={form.brand}
                  onChange={(event) => update("brand", event.target.value)}
                  placeholder="Ej. Mercedes-Benz"
                  className={errors.brand ? "invalid" : ""}
                />
                {errors.brand && <small className="field-error">{errors.brand}</small>}
              </label>
              <label>
                Modelo
                <input
                  value={form.model}
                  onChange={(event) => update("model", event.target.value)}
                  placeholder="Ej. OF 1721"
                  className={errors.model ? "invalid" : ""}
                />
                {errors.model && <small className="field-error">{errors.model}</small>}
              </label>
              <label>
                Año
                <input
                  type="number"
                  min="1990"
                  max="2030"
                  value={form.year}
                  onChange={(event) => update("year", event.target.value)}
                />
              </label>
              <label>
                Capacidad
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(event) => update("capacity", event.target.value)}
                  placeholder="Ej. 42"
                  className={errors.capacity ? "invalid" : ""}
                />
                {errors.capacity && <small className="field-error">{errors.capacity}</small>}
              </label>
              <label>
                Tipo de unidad
                <select value={form.type} onChange={(event) => update("type", event.target.value)}>
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
                  onChange={(event) => update("status", event.target.value)}
                >
                  <option>Operativa</option>
                  <option>En mantenimiento</option>
                  <option>Inactiva</option>
                </select>
              </label>
              <label className="field-full">
                Observaciones <span className="optional">(opcional)</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  placeholder="Añade información complementaria de la unidad"
                />
              </label>
            </div>
          </section>
          <section className="form-section-card">
            <div className="form-section-head">
              <span>02</span>
              <div>
                <h2>Fotografías</h2>
                <p>Añade una portada y hasta cinco vistas adicionales.</p>
              </div>
            </div>
            <div className="vehicle-photo-uploader">
              <button type="button" onClick={() => photoInput.current?.click()}>
                <Camera size={24} />
                <strong>
                  {photoEntries.length ? "Añadir más fotografías" : "Seleccionar fotografías"}
                </strong>
                <small>
                  {isLive
                    ? "JPG, PNG o WEBP · Almacenamiento privado"
                    : "JPG o PNG · Uso local durante esta sesión"}
                </small>
              </button>
              <input
                ref={photoInput}
                hidden
                multiple
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => addPhotos(event.target.files)}
              />
              {photoEntries.length > 0 && (
                <div className="vehicle-photo-previews">
                  {photoEntries.map((entry, index) => (
                    <div key={entry.url}>
                      <img src={entry.url} alt={`Vista ${index + 1} de la nueva unidad`} />
                      {index === 0 && <span>Portada</span>}
                      <button
                        type="button"
                        aria-label="Eliminar fotografía"
                        onClick={() =>
                          setPhotoEntries((previous) =>
                            previous.filter((item) => item.url !== entry.url),
                          )
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
          <section className="form-section-card">
            <div className="form-section-head">
              <span>03</span>
              <div>
                <h2>Plantilla documental</h2>
                <p>Define la estructura inicial del expediente.</p>
              </div>
            </div>
            <div className="template-options">
              {[
                ...unitTemplates.map((item) => ({
                  value: String(item.id),
                  name: item.name,
                  count: item.items.length,
                })),
                { value: "none", name: "Sin plantilla", count: 0 },
              ].map((option) => (
                <label className={template === option.value ? "selected" : ""} key={option.value}>
                  <input
                    type="radio"
                    name="template"
                    checked={template === option.value}
                    onChange={() => setTemplate(option.value)}
                  />
                  <span>
                    <strong>{option.name}</strong>
                    <small>
                      {option.value === "none"
                        ? "Crea únicamente la carpeta principal de la unidad."
                        : `Crea ${option.count} categorías configuradas.`}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            {selectedTemplate && (
              <div className="template-preview">
                <div>
                  <Folder size={18} />
                  <strong>{form.plate.toUpperCase() || "PLACA DE LA UNIDAD"}</strong>
                  <span>{selectedTemplate.items.length} carpetas automáticas</span>
                </div>
                <ul>
                  {selectedTemplate.items.map((category) => (
                    <li key={category}>
                      <Folder size={14} /> {category}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
        <aside className="vehicle-form-aside">
          <h3>Antes de registrar</h3>
          <p>Revisa que la placa y el código sean correctos. Podrás editar el resto después.</p>
          <div>
            <Check size={15} />
            <span>La unidad aparecerá en Mis unidades.</span>
          </div>
          <div>
            <Check size={15} />
            <span>El expediente se añadirá a Mis archivos.</span>
          </div>
          <div>
            <ShieldCheck size={15} />
            <span>
              {isLive
                ? "Se guardará en PostgreSQL y almacenamiento privado."
                : "Solo se guardan datos durante esta sesión."}
            </span>
          </div>
          <Button type="submit" icon={Bus} disabled={submitting}>
            {submitting ? "Creando unidad..." : "Crear unidad"}
          </Button>
          <Button type="button" variant="secondary" onClick={onBack}>
            Cancelar
          </Button>
        </aside>
      </form>
    </motion.div>
  );
}
