import { useState } from "react";
import { motion } from "motion/react";
import { Eye, Search, Star } from "lucide-react";
import type { DemoFile } from "@/types";
import { Badge, FileIcon, EmptyState } from "@/components/ui/Common";
import { PageHeader } from "@/components/layout/AppLayout";

export function FavoritesPage({
  files,
  onPreview,
  onToggle,
}: {
  files: DemoFile[];
  onPreview: (file: DemoFile) => void;
  onToggle: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const favorites = files.filter(
    (file) => file.favorite && file.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <motion.div className="page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        eyebrow="Acceso rápido"
        title="Favoritos"
        description="Documentos marcados para encontrarlos rápidamente durante esta sesión."
        actions={
          <span className="demo-pill">
            <Star size={14} /> {favorites.length} elementos
          </span>
        }
      />
      <div className="directory-toolbar">
        <label className="inline-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar en favoritos"
          />
        </label>
      </div>
      {favorites.length ? (
        <div className="favorite-list card">
          {favorites.map((file) => (
            <article key={file.id}>
              <button className="favorite-main" onClick={() => onPreview(file)}>
                <FileIcon type={file.type} />
                <span>
                  <strong>{file.name}</strong>
                  <small>
                    {file.category} · {file.vehicle || file.worker || file.company || "General"}
                  </small>
                </span>
              </button>
              <span>{file.size}</span>
              <span>{file.modified}</span>
              {file.status && <Badge status={file.status} />}
              <button
                className="icon-button favorite-active"
                title="Quitar de favoritos"
                onClick={() => onToggle(file.id)}
              >
                <Star size={17} fill="currentColor" />
              </button>
              <button className="icon-button" onClick={() => onPreview(file)}>
                <Eye size={17} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Star}
          title={query ? "Sin resultados" : "Aún no tienes favoritos"}
          text={
            query
              ? `No encontramos favoritos para “${query}”.`
              : "Marca documentos con una estrella desde el explorador o la vista previa."
          }
        />
      )}
    </motion.div>
  );
}
