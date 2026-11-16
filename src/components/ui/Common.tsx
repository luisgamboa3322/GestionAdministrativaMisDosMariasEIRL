import { ReactNode } from "react";
import type React from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Search,
  SlidersHorizontal,
  Upload,
  type LucideIcon,
} from "lucide-react";
import type { Route, DemoFile } from "@/types";
import { nav } from "@/data/demo";
import { PageHeader } from "@/components/layout/AppLayout";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <span>MM</span>
      </div>
      {!compact && (
        <div>
          <strong>Mis Dos Marías</strong>
          <small>Document Manager</small>
        </div>
      )}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  icon: Icon,
  className = "",
  ...props
}: {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: LucideIcon;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {Icon && <Icon size={17} />}
      {children}
    </button>
  );
}

export function Badge({ status }: { status: string }) {
  const key = status.toLowerCase().replace(" ", "-");
  return (
    <span className={`badge badge-${key}`}>
      <span />
      {status}
    </span>
  );
}

export function FileIcon({ type, size = 20 }: { type: DemoFile["type"]; size?: number }) {
  const Icon =
    type === "sheet"
      ? FileSpreadsheet
      : type === "image"
        ? FileImage
        : type === "zip"
          ? FileArchive
          : type === "doc"
            ? FileText
            : File;
  return (
    <span className={`file-icon file-${type}`}>
      <Icon size={size} />
    </span>
  );
}

export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "green",
  onClick,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className={`stat-icon tone-${tone}`}>
        <Icon size={20} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      {onClick && <ArrowRight className="stat-arrow" size={16} />}
    </>
  );
  if (!onClick) return <div className="stat-card">{content}</div>;
  return (
    <button className="stat-card" onClick={onClick}>
      {content}
    </button>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function DirectoryToolbar({
  query,
  setQuery,
  placeholder,
  filter,
  setFilter,
  options,
}: {
  query: string;
  setQuery: (value: string) => void;
  placeholder: string;
  filter: string;
  setFilter: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="directory-toolbar">
      <label className="inline-search">
        <Search size={17} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <select
        className="select-control"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <Button
        variant="secondary"
        icon={SlidersHorizontal}
        disabled
        title="Filtros avanzados disponibles en una implementación posterior"
      >
        Más filtros
      </Button>
    </div>
  );
}

export function DocumentCollection({
  title,
  files,
  onPreview,
  onUpload,
}: {
  title: string;
  files: DemoFile[];
  onPreview: (file: DemoFile) => void;
  onUpload: () => void;
}) {
  return (
    <section className="card profile-tab-card">
      <div className="card-head">
        <div>
          <h2>{title}</h2>
          <p>Documentos del expediente demostrativo</p>
        </div>
        <Button icon={Upload} onClick={onUpload}>
          Agregar
        </Button>
      </div>
      {files.length ? (
        files.map((file) => (
          <button className="document-row" key={file.id} onClick={() => onPreview(file)}>
            <FileIcon type={file.type} />
            <div className="doc-main">
              <strong>{file.name}</strong>
              <small>{file.category}</small>
            </div>
            <span className="doc-date">{file.expirationDate || file.modified}</span>
            {file.status && <Badge status={file.status} />}
            <ChevronRight size={16} />
          </button>
        ))
      ) : (
        <EmptyState
          icon={File}
          title={`Sin ${title.toLowerCase()}`}
          text="Los documentos que añadas a esta categoría aparecerán aquí."
          action={
            <Button icon={Upload} onClick={onUpload}>
              Agregar documento
            </Button>
          }
        />
      )}
    </section>
  );
}

export function PlaceholderPage({ route, goTo }: { route: Route; goTo: (r: Route) => void }) {
  const item = nav.find((n) => n.id === route)!;
  const Icon = item.icon;
  return (
    <div className="page">
      <PageHeader
        title={item.label}
        description="Módulo incluido en la arquitectura general del producto."
      />
      <div className="placeholder-card">
        <span>
          <Icon size={30} />
        </span>
        <span className="eyebrow">Próxima fase</span>
        <h2>{item.label} se está preparando</h2>
        <p>
          La base de navegación y el sistema visual ya están listos. Este módulo se construirá
          manteniendo la misma experiencia.
        </p>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => goTo("dashboard")}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
