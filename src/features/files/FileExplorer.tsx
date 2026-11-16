import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronRight,
  Edit3,
  Folder,
  FolderPlus,
  Grid2X2,
  Home,
  List,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import type { DemoFile, DemoFolder } from "@/types";
import { Button, FileIcon, EmptyState } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function FileExplorer({
  folders,
  files,
  currentFolder,
  setCurrentFolder,
  onNewFolder,
  onUpload,
  onPreview,
  onFavorite,
  onTrashFile,
  onTrashFolder,
  onEditFolder,
  onEditFile,
  view,
  setView,
}: {
  folders: DemoFolder[];
  files: DemoFile[];
  currentFolder: number | null;
  setCurrentFolder: (id: number | null) => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onPreview: (f: DemoFile) => void;
  onFavorite: (id: number) => void;
  onTrashFile: (id: number) => void;
  onTrashFolder: (id: number) => void;
  onEditFolder?: (folder: DemoFolder) => void;
  onEditFile?: (file: DemoFile) => void;
  view: "grid" | "list";
  setView: (v: "grid" | "list") => void;
}) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "type">("recent");
  const current = folders.find((f) => f.id === currentFolder);
  const visibleFolders = useMemo(() => {
    const base = folders.filter(
      (f) => f.parent === currentFolder && f.name.toLowerCase().includes(query.toLowerCase()),
    );
    return sortBy === "name" ? [...base].sort((a, b) => a.name.localeCompare(b.name)) : base;
  }, [folders, currentFolder, query, sortBy]);
  const visibleFiles = useMemo(() => {
    const base = files.filter(
      (f) => f.parent === currentFolder && f.name.toLowerCase().includes(query.toLowerCase()),
    );
    if (sortBy === "name") return [...base].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "type") return [...base].sort((a, b) => a.type.localeCompare(b.type));
    return base;
  }, [files, currentFolder, query, sortBy]);
  const crumbs = useMemo(() => {
    const result: DemoFolder[] = [];
    let id = currentFolder;
    while (id) {
      const folder = folders.find((f) => f.id === id);
      if (!folder) break;
      result.unshift(folder);
      id = folder.parent;
    }
    return result;
  }, [currentFolder, folders]);
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title={current?.name || "Mis archivos"}
        description="Organiza carpetas y documentos en tu espacio de demostración."
        actions={
          <>
            <Button variant="secondary" icon={FolderPlus} onClick={onNewFolder}>
              Nueva carpeta
            </Button>
            <Button icon={Upload} onClick={onUpload}>
              Subir archivo
            </Button>
          </>
        }
      />
      <div className="explorer-toolbar">
        <div className="folder-breadcrumbs">
          <button onClick={() => setCurrentFolder(null)}>
            <Home size={15} /> Mis archivos
          </button>
          {crumbs.map((f) => (
            <span key={f.id}>
              <ChevronRight size={14} />
              <button onClick={() => setCurrentFolder(f.id)}>{f.name}</button>
            </span>
          ))}
        </div>
        <div className="toolbar-row">
          <label className="inline-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en esta carpeta"
            />
          </label>
          <Button variant="secondary" icon={SlidersHorizontal}>
            Filtrar
          </Button>
          <select
            className="select-control"
            aria-label="Ordenar"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "recent" | "name" | "type")}
          >
            <option value="recent">Última modificación</option>
            <option value="name">Nombre A–Z</option>
            <option value="type">Tipo de archivo</option>
          </select>
          <div className="view-switch">
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
              aria-label="Vista de cuadrícula"
            >
              <Grid2X2 size={17} />
            </button>
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
              aria-label="Vista de lista"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
      {visibleFolders.length > 0 || visibleFiles.length > 0 ? (
        <>
          {visibleFolders.length > 0 && (
            <section className="file-section">
              <div className="section-title compact">
                <h2>
                  Carpetas <span>{visibleFolders.length}</span>
                </h2>
              </div>
              <div className={view === "grid" ? "folder-grid" : "file-list-view"}>
                {visibleFolders.map((folder) => (
                  <button
                    className="folder-card"
                    key={folder.id}
                    onDoubleClick={() => setCurrentFolder(folder.id)}
                    onClick={() => setCurrentFolder(folder.id)}
                  >
                    <span className={`folder-icon folder-${folder.color}`}>
                      <Folder size={23} fill="currentColor" />
                    </span>
                    <div>
                      <strong>{folder.name}</strong>
                      <small>
                        {folders.filter((f) => f.parent === folder.id).length +
                          files.filter((f) => f.parent === folder.id).length}{" "}
                        elementos · {folder.modified}
                      </small>
                    </div>
                    <span className="file-quick-actions">
                      {onEditFolder && (
                        <span
                          className="folder-trash-action"
                          role="button"
                          tabIndex={0}
                          title="Renombrar o mover carpeta"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEditFolder(folder);
                          }}
                        >
                          <Edit3 size={16} />
                        </span>
                      )}
                      <span
                        className="folder-trash-action"
                        role="button"
                        tabIndex={0}
                        title="Mover a papelera"
                        onClick={(event) => {
                          event.stopPropagation();
                          onTrashFolder(folder.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {visibleFiles.length > 0 && (
            <section className="file-section">
              <div className="section-title compact">
                <h2>
                  Archivos <span>{visibleFiles.length}</span>
                </h2>
              </div>
              <div className={view === "grid" ? "files-grid" : "file-list-view"}>
                {visibleFiles.map((file) => (
                  <article
                    className="file-card"
                    key={file.id}
                    onDoubleClick={() => onPreview(file)}
                  >
                    <div className="file-preview">
                      <FileIcon type={file.type} size={28} />
                      {file.favorite && (
                        <Star className="favorite-star" size={16} fill="currentColor" />
                      )}
                    </div>
                    <div className="file-card-body">
                      <div>
                        <strong title={file.name}>{file.name}</strong>
                        <small>
                          {file.size} · {file.modified}
                        </small>
                      </div>
                      <span className="file-quick-actions">
                        <button onClick={() => onFavorite(file.id)} aria-label="Alternar favorito">
                          <Star size={15} fill={file.favorite ? "currentColor" : "none"} />
                        </button>
                        {onEditFile && (
                          <button
                            onClick={() => onEditFile(file)}
                            aria-label="Renombrar o mover archivo"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                        <button onClick={() => onTrashFile(file.id)} aria-label="Mover a papelera">
                          <Trash2 size={15} />
                        </button>
                      </span>
                    </div>
                    <span className="category-tag">{file.category}</span>
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <EmptyState
          icon={Folder}
          title={query ? "Sin resultados" : "Esta carpeta está vacía"}
          text={
            query
              ? `No encontramos archivos que coincidan con “${query}”.`
              : "Sube un documento o crea una subcarpeta para comenzar."
          }
          action={
            !query && (
              <Button icon={Upload} onClick={onUpload}>
                Subir documento
              </Button>
            )
          }
        />
      )}
    </motion.div>
  );
}
