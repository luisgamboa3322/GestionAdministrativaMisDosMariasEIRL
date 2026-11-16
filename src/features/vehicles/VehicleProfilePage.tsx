import { useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  Camera,
  ChevronRight,
  Edit3,
  File,
  Folder,
  FolderPlus,
  Images,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import type { DemoFile, Vehicle } from "@/types";
import { dossierCategories } from "@/data/demo";
import { Button, Badge, FileIcon, EmptyState } from "@/components/ui/Common";

export function VehicleProfilePage({
  vehicle,
  files,
  onBack,
  onEdit,
  onDossier,
  onUploadDocument,
  onPreview,
  onUpdate,
  onAddPhotos,
  onSetCoverPhoto,
  onDeletePhoto,
  isLive = false,
}: {
  vehicle: Vehicle;
  files: DemoFile[];
  onBack: () => void;
  onEdit: () => void;
  onDossier: () => void;
  onUploadDocument: () => void;
  onPreview: (file: DemoFile) => void;
  onUpdate: (patch: Partial<Vehicle>) => void;
  onAddPhotos?: (selected: FileList) => Promise<void>;
  onSetCoverPhoto?: (photoId: number) => Promise<void>;
  onDeletePhoto?: (photoId: number) => Promise<void>;
  isLive?: boolean;
}) {
  const [tab, setTab] = useState("Resumen");
  const photoInput = useRef<HTMLInputElement>(null);
  const documents = files.filter((file) => file.vehicle === vehicle.plate);
  const addPhotos = (selected?: FileList | null) => {
    if (!selected?.length) return;
    if (vehicle.isPersisted && onAddPhotos) {
      void onAddPhotos(selected);
      return;
    }
    const added = Array.from(selected).map((file) => URL.createObjectURL(file));
    onUpdate({ photos: [...vehicle.photos, ...added].slice(0, 8) });
  };
  return (
    <motion.div
      className="page vehicle-profile-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Volver a Mis unidades
      </button>
      <section className="vehicle-hero">
        <img src={vehicle.cover} alt={`Bus ${vehicle.plate}`} />
        <div className="vehicle-hero-overlay" />
        <div className="vehicle-hero-copy">
          <Badge status={vehicle.status} />
          <span>{vehicle.code}</span>
          <h1>{vehicle.plate}</h1>
          <p>
            {vehicle.brand} {vehicle.model} · {vehicle.year}
          </p>
        </div>
        <div className="vehicle-hero-actions">
          <Button variant="secondary" icon={Edit3} onClick={onEdit}>
            Editar
          </Button>
          <Button variant="secondary" icon={Camera} onClick={() => photoInput.current?.click()}>
            Añadir foto
          </Button>
          <Button icon={Upload} onClick={onUploadDocument}>
            Agregar documento
          </Button>
          <input
            ref={photoInput}
            hidden
            multiple
            type="file"
            accept="image/*"
            onChange={(event) => addPhotos(event.target.files)}
          />
        </div>
      </section>
      <div className="profile-tabs" role="tablist">
        {["Resumen", "Documentos", "Fotografías", "Vencimientos", "Historial"].map((item) => (
          <button
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            key={item}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "Resumen" && (
        <div className="profile-grid">
          <section className="card vehicle-data-card">
            <div className="card-head">
              <div>
                <h2>Información de la unidad</h2>
                <p>{isLive ? "Datos registrados en el sistema" : "Datos registrados en el prototipo"}</p>
              </div>
              <button onClick={onEdit}>
                Editar <Edit3 size={14} />
              </button>
            </div>
            <dl>
              <div>
                <dt>Código interno</dt>
                <dd>{vehicle.code}</dd>
              </div>
              <div>
                <dt>Marca</dt>
                <dd>{vehicle.brand}</dd>
              </div>
              <div>
                <dt>Modelo</dt>
                <dd>{vehicle.model}</dd>
              </div>
              <div>
                <dt>Año</dt>
                <dd>{vehicle.year}</dd>
              </div>
              <div>
                <dt>Capacidad</dt>
                <dd>{vehicle.capacity} pasajeros</dd>
              </div>
              <div>
                <dt>Tipo</dt>
                <dd>{vehicle.type}</dd>
              </div>
            </dl>
            <div className="vehicle-notes">
              <span>Observaciones</span>
              <p>{vehicle.notes || "Sin observaciones registradas."}</p>
            </div>
          </section>
          <aside className="card dossier-access-card">
            <span>
              <Folder size={23} />
            </span>
            <div>
              <small>Expediente documental</small>
              <h2>{vehicle.plate}</h2>
              <p>
                {documents.length} documentos vinculados · {dossierCategories.length} categorías
              </p>
            </div>
            <Button onClick={onDossier}>
              Ver expediente <ArrowRight size={15} />
            </Button>
          </aside>
          <section className="card vehicle-gallery-card">
            <div className="card-head">
              <div>
                <h2>Galería de la unidad</h2>
                <p>{vehicle.photos.length} fotografías en esta sesión</p>
              </div>
              <button onClick={() => setTab("Fotografías")}>
                Ver galería <ArrowRight size={14} />
              </button>
            </div>
            <div className="vehicle-gallery-strip">
              {vehicle.photos.slice(0, 4).map((photo, index) => {
                const persistedItem = vehicle.photoItems?.find((item) => item.url === photo);
                return (
                  <button
                    key={photo}
                    onClick={() => {
                      if (vehicle.isPersisted && persistedItem && onSetCoverPhoto) {
                        void onSetCoverPhoto(persistedItem.id);
                      } else {
                        onUpdate({ cover: photo });
                      }
                    }}
                  >
                    <img src={photo} alt={`Vista ${index + 1} de ${vehicle.plate}`} />
                    {photo === vehicle.cover && <span>Portada</span>}
                  </button>
                );
              })}
              {!vehicle.photos.length && (
                <EmptyState
                  icon={Images}
                  title="Sin fotografías"
                  text="Añade imágenes para crear la galería de esta unidad."
                />
              )}
            </div>
          </section>
          <section className="card vehicle-documents-card">
            <div className="card-head">
              <div>
                <h2>Documentos recientes</h2>
                <p>Archivos vinculados a la placa</p>
              </div>
              <button onClick={() => setTab("Documentos")}>
                Ver todos <ArrowRight size={14} />
              </button>
            </div>
            {documents.length ? (
              documents.slice(0, 3).map((file) => (
                <button className="document-row" key={file.id} onClick={() => onPreview(file)}>
                  <FileIcon type={file.type} />
                  <div className="doc-main">
                    <strong>{file.name}</strong>
                    <small>{file.category}</small>
                  </div>
                  <span className="doc-date">{file.modified}</span>
                  {file.status && <Badge status={file.status} />}
                  <ChevronRight size={16} />
                </button>
              ))
            ) : (
              <EmptyState
                icon={File}
                title="Sin documentos"
                text="Agrega el primer archivo al expediente de esta unidad."
                action={
                  <Button icon={Upload} onClick={onUploadDocument}>
                    Agregar documento
                  </Button>
                }
              />
            )}
          </section>
        </div>
      )}
      {tab === "Documentos" && (
        <section className="card profile-tab-card">
          <div className="card-head">
            <div>
              <h2>Documentos de {vehicle.plate}</h2>
              <p>Archivos asociados a esta unidad</p>
            </div>
            <Button icon={Upload} onClick={onUploadDocument}>
              Agregar
            </Button>
          </div>
          {documents.length ? (
            documents.map((file) => (
              <button className="document-row" key={file.id} onClick={() => onPreview(file)}>
                <FileIcon type={file.type} />
                <div className="doc-main">
                  <strong>{file.name}</strong>
                  <small>{file.category}</small>
                </div>
                <span className="doc-date">{file.modified}</span>
                {file.status && <Badge status={file.status} />}
                <ChevronRight size={16} />
              </button>
            ))
          ) : (
            <EmptyState
              icon={File}
              title="Sin documentos asociados"
              text="Los documentos que asocies a esta placa aparecerán aquí."
            />
          )}
        </section>
      )}
      {tab === "Fotografías" && (
        <section className="profile-photo-section">
          <div className="section-title">
            <div>
              <h2>Galería de fotografías</h2>
              <p>Selecciona una imagen para usarla como portada.</p>
            </div>
            <Button icon={Camera} onClick={() => photoInput.current?.click()}>
              Añadir fotografías
            </Button>
          </div>
          <div className="profile-photo-grid">
            {vehicle.photos.map((photo, index) => {
              const persistedItem = vehicle.photoItems?.find((item) => item.url === photo);
              return (
                <article key={photo} className={photo === vehicle.cover ? "cover" : ""}>
                  <img src={photo} alt={`Fotografía ${index + 1} de ${vehicle.plate}`} />
                  <div>
                    <span>{photo === vehicle.cover ? "Foto principal" : `Vista ${index + 1}`}</span>
                    <button
                      onClick={() => {
                        if (vehicle.isPersisted && persistedItem && onSetCoverPhoto) {
                          void onSetCoverPhoto(persistedItem.id);
                        } else {
                          onUpdate({ cover: photo });
                        }
                      }}
                    >
                      Usar de portada
                    </button>
                  </div>
                  {vehicle.photos.length > 1 && (
                    <button
                      className="remove-photo"
                      aria-label="Eliminar fotografía"
                      onClick={() => {
                        if (vehicle.isPersisted && persistedItem && onDeletePhoto) {
                          void onDeletePhoto(persistedItem.id);
                        } else {
                          onUpdate({
                            photos: vehicle.photos.filter((item) => item !== photo),
                            cover:
                              photo === vehicle.cover
                                ? vehicle.photos.find((item) => item !== photo)
                                : vehicle.cover,
                          });
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}
      {tab === "Vencimientos" && (
        <section className="card profile-tab-card">
          <div className="card-head">
            <div>
              <h2>Vencimientos documentales</h2>
              <p>
                {isLive
                  ? "Estados calculados al día de hoy"
                  : "Estados calculados con fechas ficticias"}
              </p>
            </div>
          </div>
          {documents.filter((file) => file.status === "Vencido" || file.status === "Por vencer")
            .length ? (
            documents
              .filter((file) => file.status === "Vencido" || file.status === "Por vencer")
              .map((file) => (
                <button className="document-row" key={file.id} onClick={() => onPreview(file)}>
                  <FileIcon type={file.type} />
                  <div className="doc-main">
                    <strong>{file.name}</strong>
                    <small>{file.category}</small>
                  </div>
                  <span className="doc-date">{file.modified}</span>
                  {file.status && <Badge status={file.status} />}
                  <ChevronRight size={16} />
                </button>
              ))
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="Sin alertas activas"
              text="No hay documentos vencidos o próximos a vencer para esta unidad."
            />
          )}
        </section>
      )}
      {tab === "Historial" && (
        <section className="card profile-tab-card">
          <div className="timeline vehicle-timeline">
            <div>
              <i>
                <Bus size={14} />
              </i>
              <p>
                <strong>
                  {isLive ? "Unidad registrada en el sistema" : "Unidad registrada en el prototipo"}
                </strong>
                <span>Sesión actual · {vehicle.code}</span>
              </p>
            </div>
            <div>
              <i>
                <FolderPlus size={14} />
              </i>
              <p>
                <strong>Expediente documental creado</strong>
                <span>{dossierCategories.length} categorías configuradas</span>
              </p>
            </div>
            <div>
              <i>
                <Camera size={14} />
              </i>
              <p>
                <strong>Galería actualizada</strong>
                <span>{vehicle.photos.length} fotografías disponibles</span>
              </p>
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
}
