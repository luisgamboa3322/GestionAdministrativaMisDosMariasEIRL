import { ReactNode, useState } from "react";
import { motion } from "motion/react";
import {
  Bell,
  Building2,
  Check,
  ChevronRight,
  CircleHelp,
  Files,
  HardDrive,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tags,
  Trash2,
  UserRound,
} from "lucide-react";
import type { CategorySetting, TemplateSetting } from "@/types";
import { auditRequirementCatalog } from "@/data/demo";
import { normalizeAuditText } from "@/utils/audits";
import { Button, Badge } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="settings-card card">
      <div className="settings-card-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      <div className="settings-card-body">{children}</div>
    </div>
  );
}

export function SettingsToggle({
  title,
  text,
  enabled = false,
}: {
  title: string;
  text: string;
  enabled?: boolean;
}) {
  const [active, setActive] = useState(enabled);
  return (
    <button className="settings-toggle-row" onClick={() => setActive(!active)}>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <span className={`settings-switch ${active ? "active" : ""}`}>
        <i />
      </span>
    </button>
  );
}

export function SettingsSave() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="settings-save">
      <Button
        icon={saved ? Check : Save}
        onClick={() => {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1800);
        }}
      >
        {saved ? "Cambios guardados en la sesión" : "Guardar cambios"}
      </Button>
    </div>
  );
}

export function SettingsPage({
  categories,
  templates,
  onAddCategory,
  onDeleteCategory,
  onAddTemplate,
  onToggleTemplate,
  onDeleteTemplate,
}: {
  categories: CategorySetting[];
  templates: TemplateSetting[];
  onAddCategory: (category: Omit<CategorySetting, "id">) => void;
  onDeleteCategory: (id: number) => void;
  onAddTemplate: (template: Omit<TemplateSetting, "id">) => void;
  onToggleTemplate: (id: number) => void;
  onDeleteTemplate: (id: number) => void;
}) {
  const [section, setSection] = useState("Perfil");
  const [categoryForm, setCategoryForm] = useState(false);
  const [templateForm, setTemplateForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "General",
    location: "Mis archivos",
    requiresExpiration: false,
    description: "",
    color: "emerald",
  });
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    kind: "Unidad" as TemplateSetting["kind"],
    items: "",
  });
  const sections = [
    ["Perfil", UserRound],
    ["Empresa", Building2],
    ["Categorías", Tags],
    ["Plantillas", Files],
    ["Preferencias", SlidersHorizontal],
    ["Notificaciones", Bell],
    ["Seguridad", ShieldCheck],
    ["Almacenamiento", HardDrive],
    ["Sistema", CircleHelp],
  ] as const;
  function createTemplate() {
    if (!newTemplate.name.trim() || !newTemplate.items.trim()) return;
    let items = newTemplate.items
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (newTemplate.kind === "Auditoría")
      items = items.map(
        (item) =>
          auditRequirementCatalog.find(
            (requirement) =>
              normalizeAuditText(requirement.label) === normalizeAuditText(item) ||
              requirement.id === item,
          )?.id || item,
      );
    onAddTemplate({ name: newTemplate.name.trim(), kind: newTemplate.kind, items, active: true });
    setNewTemplate({ name: "", kind: "Unidad", items: "" });
    setTemplateForm(false);
  }
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Administración del prototipo"
        title="Configuración"
        description="Personaliza categorías, plantillas y preferencias de la sesión."
        actions={
          <span className="demo-pill">
            <Sparkles size={14} /> Sin persistencia real
          </span>
        }
      />
      <div className="settings-layout">
        <aside className="settings-nav">
          {sections.map(([label, Icon]) => (
            <button
              className={section === label ? "active" : ""}
              key={label}
              onClick={() => setSection(label)}
            >
              <Icon size={17} />
              <span>{label}</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </aside>
        <section className="settings-content">
          {section === "Perfil" && (
            <SettingsCard
              title="Perfil del gerente"
              description="Información mostrada dentro del prototipo."
            >
              <div className="profile-settings-head">
                <span className="avatar avatar-xl">JM</span>
                <div>
                  <strong>José Mendoza</strong>
                  <small>Gerente general</small>
                </div>
                <Button variant="secondary" disabled title="Carga de avatar pendiente">
                  Carga no disponible
                </Button>
              </div>
              <div className="settings-form-grid">
                <label>
                  Nombre completo
                  <input defaultValue="José Mendoza" />
                </label>
                <label>
                  Cargo
                  <input defaultValue="Gerente general" />
                </label>
                <label>
                  Correo
                  <input defaultValue="gerencia@misdosmarias.pe" />
                </label>
                <label>
                  Teléfono
                  <input defaultValue="+51 900 000 000" />
                </label>
              </div>
              <SettingsSave />
            </SettingsCard>
          )}
          {section === "Empresa" && (
            <SettingsCard
              title="Datos de la empresa"
              description="Datos ficticios visibles en documentos y cabeceras."
            >
              <div className="settings-form-grid">
                <label>
                  Razón social
                  <input defaultValue="MIS DOS MARÍAS E.I.R.L." />
                </label>
                <label>
                  Nombre comercial
                  <input defaultValue="Mis Dos Marías" />
                </label>
                <label>
                  RUC de demostración
                  <input defaultValue="20XXXXXXXXX" />
                </label>
                <label>
                  Actividad
                  <input defaultValue="Transporte de personal" />
                </label>
                <label className="field-full">
                  Dirección
                  <input defaultValue="Lima, Perú — dato demostrativo" />
                </label>
              </div>
              <SettingsSave />
            </SettingsCard>
          )}
          {section === "Categorías" && (
            <SettingsCard
              title="Categorías documentales"
              description="Las categorías creadas aparecen inmediatamente en carga y organización."
              action={
                <Button icon={Plus} onClick={() => setCategoryForm(!categoryForm)}>
                  Nueva categoría
                </Button>
              }
            >
              {categoryForm && (
                <div className="settings-inline-form">
                  <div className="settings-form-grid">
                    <label>
                      Nombre
                      <input
                        value={newCategory.name}
                        onChange={(event) =>
                          setNewCategory({ ...newCategory, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Tipo
                      <select
                        value={newCategory.type}
                        onChange={(event) =>
                          setNewCategory({ ...newCategory, type: event.target.value })
                        }
                      >
                        <option>General</option>
                        <option>Vehicular</option>
                        <option>Laboral</option>
                        <option>Empresarial</option>
                        <option>Financiero</option>
                      </select>
                    </label>
                    <label>
                      Ubicación
                      <input
                        value={newCategory.location}
                        onChange={(event) =>
                          setNewCategory({ ...newCategory, location: event.target.value })
                        }
                      />
                    </label>
                    <label className="toggle-label">
                      Requiere vencimiento
                      <input
                        type="checkbox"
                        checked={newCategory.requiresExpiration}
                        onChange={(event) =>
                          setNewCategory({
                            ...newCategory,
                            requiresExpiration: event.target.checked,
                          })
                        }
                      />
                    </label>
                    <label className="field-full">
                      Descripción
                      <input
                        value={newCategory.description}
                        onChange={(event) =>
                          setNewCategory({ ...newCategory, description: event.target.value })
                        }
                      />
                    </label>
                  </div>
                  <div className="modal-actions">
                    <Button variant="secondary" onClick={() => setCategoryForm(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        if (!newCategory.name.trim()) return;
                        onAddCategory({ ...newCategory, name: newCategory.name.trim() });
                        setNewCategory({
                          name: "",
                          type: "General",
                          location: "Mis archivos",
                          requiresExpiration: false,
                          description: "",
                          color: "emerald",
                        });
                        setCategoryForm(false);
                      }}
                    >
                      Crear categoría
                    </Button>
                  </div>
                </div>
              )}
              <div className="category-settings-list">
                {categories.map((category) => (
                  <article key={category.id}>
                    <span className={`folder-icon folder-${category.color}`}>
                      <Tags size={18} />
                    </span>
                    <div>
                      <strong>{category.name}</strong>
                      <small>{category.description || "Sin descripción"}</small>
                    </div>
                    <span className="category-tag">{category.type}</span>
                    <span>{category.location}</span>
                    <Badge
                      status={category.requiresExpiration ? "Con vencimiento" : "Sin vencimiento"}
                    />
                    <button
                      className="icon-button danger-action"
                      onClick={() => onDeleteCategory(category.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </article>
                ))}
              </div>
            </SettingsCard>
          )}
          {section === "Plantillas" && (
            <SettingsCard
              title="Plantillas automáticas"
              description="Las plantillas activas aparecen en los flujos correspondientes."
              action={
                <Button icon={Plus} onClick={() => setTemplateForm(!templateForm)}>
                  Nueva plantilla
                </Button>
              }
            >
              {templateForm && (
                <div className="settings-inline-form">
                  <div className="settings-form-grid">
                    <label>
                      Nombre
                      <input
                        value={newTemplate.name}
                        onChange={(event) =>
                          setNewTemplate({ ...newTemplate, name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      Tipo
                      <select
                        value={newTemplate.kind}
                        onChange={(event) =>
                          setNewTemplate({
                            ...newTemplate,
                            kind: event.target.value as TemplateSetting["kind"],
                          })
                        }
                      >
                        <option>Unidad</option>
                        <option>Trabajador</option>
                        <option>Auditoría</option>
                      </select>
                    </label>
                    <label className="field-full">
                      Elementos separados por comas
                      <input
                        value={newTemplate.items}
                        onChange={(event) =>
                          setNewTemplate({ ...newTemplate, items: event.target.value })
                        }
                        placeholder="SOAT, STR, Contratos"
                      />
                    </label>
                  </div>
                  <div className="modal-actions">
                    <Button variant="secondary" onClick={() => setTemplateForm(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createTemplate}>Guardar plantilla</Button>
                  </div>
                </div>
              )}
              <div className="template-settings-grid">
                {templates.map((template) => (
                  <article key={template.id}>
                    <div>
                      <span className={`template-kind kind-${normalizeAuditText(template.kind)}`}>
                        {template.kind}
                      </span>
                      <button
                        className={`settings-switch ${template.active ? "active" : ""}`}
                        onClick={() => onToggleTemplate(template.id)}
                      >
                        <i />
                      </button>
                    </div>
                    <h3>{template.name}</h3>
                    <p>{template.items.length} elementos automáticos</p>
                    <div className="template-item-preview">
                      {template.items.slice(0, 5).map((item) => (
                        <span key={item}>
                          {auditRequirementCatalog.find((req) => req.id === item)?.label || item}
                        </span>
                      ))}
                      {template.items.length > 5 && <span>+{template.items.length - 5}</span>}
                    </div>
                    <button
                      className="template-delete"
                      onClick={() => onDeleteTemplate(template.id)}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </article>
                ))}
              </div>
            </SettingsCard>
          )}
          {section === "Preferencias" && (
            <SettingsCard
              title="Preferencias de interfaz"
              description="Ajustes locales de visualización."
            >
              <SettingsToggle title="Vista compacta" text="Reduce el espacio vertical de tablas." />
              <SettingsToggle
                title="Abrir documentos en vista previa"
                text="Evita iniciar descargas automáticamente."
                enabled
              />
              <SettingsToggle
                title="Respetar movimiento reducido"
                text="Utiliza transiciones mínimas cuando el sistema lo solicita."
                enabled
              />
            </SettingsCard>
          )}
          {section === "Notificaciones" && (
            <SettingsCard
              title="Preferencias de notificaciones"
              description="No se envían mensajes reales desde este prototipo."
            >
              <SettingsToggle
                title="Vencimientos documentales"
                text="Alertas visuales dentro de la aplicación."
                enabled
              />
              <SettingsToggle
                title="Auditorías próximas"
                text="Mostrar avisos en el centro de alertas."
                enabled
              />
              <SettingsToggle title="Resumen semanal" text="Funcionalidad pendiente de backend." />
            </SettingsCard>
          )}
          {section === "Seguridad" && (
            <SettingsCard
              title="Seguridad"
              description="Representación visual de futuras opciones."
            >
              <div className="security-row">
                <ShieldCheck size={21} />
                <div>
                  <strong>Acceso de demostración</strong>
                  <p>No existe autenticación real ni se almacenan credenciales.</p>
                </div>
                <Badge status="Prototipo" />
              </div>
              <SettingsToggle
                title="Bloqueo automático"
                text="Bloquear después de 15 minutos de inactividad."
                enabled
              />
              <SettingsToggle
                title="Confirmar acciones destructivas"
                text="Solicitar confirmación antes de vaciar la papelera."
                enabled
              />
            </SettingsCard>
          )}
          {section === "Almacenamiento" && (
            <SettingsCard
              title="Almacenamiento"
              description="Uso simulado durante la sesión actual."
            >
              <div className="storage-settings">
                <HardDrive size={24} />
                <div>
                  <strong>Espacio de demostración</strong>
                  <p>No se cargan documentos a servidores externos.</p>
                  <div>
                    <i />
                  </div>
                  <small>38% representativo · no corresponde a almacenamiento real</small>
                </div>
              </div>
            </SettingsCard>
          )}
          {section === "Sistema" && (
            <SettingsCard
              title="Información del sistema"
              description="Detalles de esta versión del prototipo."
            >
              <div className="system-info">
                <div>
                  <span>Producto</span>
                  <strong>Mis Dos Marías Docs</strong>
                </div>
                <div>
                  <span>Versión UI</span>
                  <strong>Prototipo Fase F</strong>
                </div>
                <div>
                  <span>Persistencia</span>
                  <strong>Estado local de sesión</strong>
                </div>
                <div>
                  <span>Integraciones</span>
                  <strong>No conectadas</strong>
                </div>
              </div>
              <div className="prototype-note">
                <CircleHelp size={15} />
                <span>La implementación productiva se conectará posteriormente.</span>
              </div>
            </SettingsCard>
          )}
        </section>
      </div>
    </motion.div>
  );
}
