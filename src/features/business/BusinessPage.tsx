import { useState } from "react";
import { motion } from "motion/react";
import { Building2, ChevronRight, Edit3, Folder, Plus, X } from "lucide-react";
import type { DemoFile, BusinessRecord } from "@/types";
import { Button, EmptyState, DirectoryToolbar } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function BusinessPage({
  mode,
  records,
  files,
  onAdd,
  onOpenFolder,
  onEdit,
}: {
  mode: "supplier" | "company";
  records: BusinessRecord[];
  files: DemoFile[];
  onAdd: () => void;
  onOpenFolder: (id: number) => void;
  onEdit: (record: BusinessRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<BusinessRecord | null>(null);
  const label = mode === "supplier" ? "Proveedores" : "Empresas contratantes";
  const filtered = records.filter(
    (record) =>
      (filter === "Todos" || record.kind === filter) &&
      `${record.name} ${record.legalName} ${record.contact}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const kinds = ["Todos", ...Array.from(new Set(records.map((record) => record.kind)))];
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow={mode === "supplier" ? "Red de servicios" : "Cartera empresarial"}
        title={label}
        description={
          mode === "supplier"
            ? "Centraliza contratos, facturas y documentos de tus proveedores."
            : "Organiza contratos, servicios y auditorías por empresa solicitante."
        }
        actions={
          <Button icon={Plus} onClick={onAdd}>
            Registrar {mode === "supplier" ? "proveedor" : "empresa"}
          </Button>
        }
      />
      <DirectoryToolbar
        query={query}
        setQuery={setQuery}
        placeholder={`Buscar ${label.toLowerCase()}`}
        filter={filter}
        setFilter={setFilter}
        options={kinds}
      />
      <div className="business-layout">
        <div className="business-table card">
          <div className="business-table-head">
            <span>Organización</span>
            <span>Tipo</span>
            <span>Contacto</span>
            <span>Documentos</span>
            <span>Actualización</span>
            <span />
          </div>
          {filtered.length ? (
            filtered.map((record) => {
              const docs = files.filter((file) =>
                mode === "supplier"
                  ? file.supplier === record.name
                  : file.company?.includes(record.name),
              );
              return (
                <button
                  className={selected?.id === record.id ? "selected" : ""}
                  key={record.id}
                  onClick={() => setSelected(record)}
                >
                  <span className="business-name">
                    <i>{record.name.slice(0, 2).toUpperCase()}</i>
                    <span>
                      <strong>{record.name}</strong>
                      <small>{record.legalName}</small>
                    </span>
                  </span>
                  <span>
                    <b className="category-tag">{record.kind}</b>
                  </span>
                  <span>
                    <strong>{record.contact}</strong>
                    <small>{record.email}</small>
                  </span>
                  <span>{docs.length} archivos</span>
                  <span>{record.updated}</span>
                  <ChevronRight size={16} />
                </button>
              );
            })
          ) : (
            <EmptyState
              icon={Building2}
              title="Sin resultados"
              text={`No encontramos ${label.toLowerCase()} con esos filtros.`}
            />
          )}
        </div>
        {selected && (
          <aside className="business-detail card">
            <div className="business-detail-head">
              <span>{selected.name.slice(0, 2).toUpperCase()}</span>
              <button className="icon-button" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>
            <span className="eyebrow">{selected.kind}</span>
            <h2>{selected.name}</h2>
            <p>{selected.legalName}</p>
            <dl>
              <div>
                <dt>Contacto</dt>
                <dd>{selected.contact}</dd>
              </div>
              <div>
                <dt>Teléfono</dt>
                <dd>{selected.phone}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{selected.email}</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd>{selected.updated}</dd>
              </div>
            </dl>
            <div className="business-detail-stats">
              <div>
                <strong>
                  {
                    files.filter((file) =>
                      mode === "supplier"
                        ? file.supplier === selected.name
                        : file.company?.includes(selected.name),
                    ).length
                  }
                </strong>
                <small>Documentos</small>
              </div>
              <div>
                <strong>{mode === "supplier" ? "2" : "1"}</strong>
                <small>{mode === "supplier" ? "Facturas" : "Contratos"}</small>
              </div>
            </div>
            <Button icon={Folder} onClick={() => onOpenFolder(selected.folderId)}>
              Abrir carpeta
            </Button>
            <Button variant="secondary" icon={Edit3} onClick={() => onEdit(selected)}>
              Editar información
            </Button>
          </aside>
        )}
      </div>
    </motion.div>
  );
}
