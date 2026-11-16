import { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Bus,
  ChevronDown,
  ChevronRight,
  Folder,
  HardDrive,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Upload,
  X,
} from "lucide-react";
import type { Route } from "@/types";
import { nav, routeNames } from "@/data/demo";
import { Logo, Button } from "@/components/ui/Common";

export function Sidebar({
  route,
  collapsed,
  mobileOpen,
  isLive = false,
  inboxCount,
  onRoute,
  onCollapse,
  onClose,
  onLogout,
}: {
  route: Route;
  collapsed: boolean;
  mobileOpen: boolean;
  isLive?: boolean;
  inboxCount?: number;
  onRoute: (r: Route) => void;
  onCollapse: () => void;
  onClose: () => void;
  onLogout?: () => void;
}) {
  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            aria-label="Cerrar menú"
            className="sidebar-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      <aside
        className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
      >
        <div className="sidebar-head">
          <Logo compact={collapsed} />
          <button
            className="icon-button sidebar-close-mobile"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Navegación principal">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                {item.group && !collapsed && <span className="nav-divider" />}
                <button
                  title={collapsed ? item.label : undefined}
                  className={`nav-item ${route === item.id ? "active" : ""}`}
                  aria-current={route === item.id ? "page" : undefined}
                  onClick={() => {
                    onRoute(item.id);
                    onClose();
                  }}
                >
                  <Icon size={19} />
                  <span>{item.label}</span>
                  {item.id === "inbox" && typeof inboxCount === "number"
                    ? inboxCount > 0 && <b>{inboxCount}</b>
                    : item.badge && <b>{item.badge}</b>}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          {!collapsed && (
            <div className="storage">
              <div>
                <HardDrive size={16} />
                <span>{isLive ? "Almacenamiento privado" : "Espacio de demostración"}</span>
              </div>
              <div className="storage-bar">
                <i />
              </div>
              <small>
                {isLive
                  ? "Sesión real conectada a PostgreSQL"
                  : "Datos ficticios · Sin almacenamiento real"}
              </small>
            </div>
          )}
          {onLogout && (
            <button className="collapse-button" onClick={onLogout} aria-label="Cerrar sesión">
              <LogOut size={19} />
              <span>Cerrar sesión</span>
            </button>
          )}
          <button
            className="collapse-button"
            onClick={onCollapse}
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            <span>Contraer menú</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function Topbar({
  route,
  userName = "José Mendoza",
  userRoleLabel = "Gerente general",
  onMenu,
  onUpload,
  onSearch,
  onNotifications,
  onAccount,
}: {
  route: Route;
  userName?: string;
  userRoleLabel?: string;
  onMenu: () => void;
  onUpload: () => void;
  onSearch: () => void;
  onNotifications: () => void;
  onAccount: () => void;
}) {
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "GG";
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button menu-button" onClick={onMenu} aria-label="Abrir menú">
          <Menu size={21} />
        </button>
        <div className="breadcrumbs">
          <span>Mis Dos Marías Docs</span>
          <ChevronRight size={14} />
          <strong>{routeNames[route]}</strong>
        </div>
      </div>
      <div className="topbar-actions">
        <button className="search-trigger" onClick={onSearch}>
          <Search size={17} />
          <span>Buscar documentos, unidades...</span>
          <kbd>⌘ K</kbd>
        </button>
        <Button icon={Upload} onClick={onUpload} className="top-upload">
          Subir archivo
        </Button>
        <button
          className="icon-button notification-button"
          aria-label="Abrir centro de vencimientos"
          onClick={onNotifications}
        >
          <Bell size={19} />
          <i />
        </button>
        <button
          className="profile-button"
          onClick={onAccount}
          aria-label="Abrir configuración de cuenta"
        >
          <span>{initials}</span>
          <div>
            <strong>{userName}</strong>
            <small>{userRoleLabel}</small>
          </div>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function MobileNav({
  route,
  onRoute,
  onUpload,
}: {
  route: Route;
  onRoute: (r: Route) => void;
  onUpload: () => void;
}) {
  return (
    <nav className="mobile-nav">
      <button
        className={route === "dashboard" ? "active" : ""}
        onClick={() => onRoute("dashboard")}
        aria-current={route === "dashboard" ? "page" : undefined}
      >
        <Home size={20} />
        <span>Inicio</span>
      </button>
      <button
        className={route === "files" ? "active" : ""}
        onClick={() => onRoute("files")}
        aria-current={route === "files" ? "page" : undefined}
      >
        <Folder size={20} />
        <span>Archivos</span>
      </button>
      <button className="mobile-upload" onClick={onUpload} aria-label="Subir archivo">
        <span>
          <Plus size={23} />
        </span>
        <small>Subir</small>
      </button>
      <button
        className={route === "vehicles" ? "active" : ""}
        onClick={() => onRoute("vehicles")}
        aria-current={route === "vehicles" ? "page" : undefined}
      >
        <Bus size={20} />
        <span>Unidades</span>
      </button>
      <button
        onClick={() => document.querySelector<HTMLButtonElement>(".menu-button")?.click()}
        aria-label="Abrir más opciones"
      >
        <LayoutGrid size={20} />
        <span>Más</span>
      </button>
    </nav>
  );
}
