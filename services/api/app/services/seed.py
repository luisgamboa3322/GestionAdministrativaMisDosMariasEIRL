import argparse
import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.entities import (
    DocumentTemplate,
    DocumentType,
    Organization,
    TemplateRequirement,
    User,
)

DEFAULT_DOCUMENT_TYPES: list[tuple[str, str, bool]] = [
    ("SOAT", "Unidad", True),
    ("STR", "Unidad", True),
    ("Pólizas", "Unidad", True),
    ("GPS", "Unidad", True),
    ("Revisión técnica", "Unidad", True),
    ("Tarjeta de propiedad", "Unidad", False),
    ("Certificados", "General", True),
    ("Permisos", "General", True),
    ("Contratos", "Empresa", True),
    ("Manifiestos", "Periodo", False),
    ("Facturas", "Empresa", False),
    ("Otros", "General", False),
]

DEFAULT_TEMPLATES: list[tuple[str, str, list[str]]] = [
    (
        "Transporte de personal",
        "Unidad",
        ["SOAT", "STR", "Pólizas", "GPS", "Revisión técnica", "Tarjeta de propiedad", "Permisos"],
    ),
    (
        "Conductor operativo",
        "Trabajador",
        ["Licencias", "Certificados", "Capacitaciones", "Contrato"],
    ),
    (
        "Auditoría estándar",
        "Auditoría",
        ["SOAT", "STR", "Pólizas", "GPS", "Revisión técnica", "Documentos de trabajadores"],
    ),
]


def ensure_initial_manager(
    db: Session,
    *,
    org_name: str,
    full_name: str,
    email: str,
    plain_password: str,
) -> tuple[Organization, User, bool]:
    """Idempotently create the base organization, default doc types, and manager user."""
    org = db.scalar(select(Organization).where(Organization.legal_name == org_name))
    if org is None:
        org = Organization(legal_name=org_name)
        db.add(org)
        db.flush()

    existing_types = {
        row.name
        for row in db.scalars(
            select(DocumentType).where(DocumentType.organization_id == org.id)
        )
    }
    for name, scope, requires_expiration in DEFAULT_DOCUMENT_TYPES:
        if name not in existing_types:
            db.add(
                DocumentType(
                    organization_id=org.id,
                    name=name,
                    scope=scope,
                    requires_expiration=requires_expiration,
                )
            )

    existing_templates = {
        row.name
        for row in db.scalars(
            select(DocumentTemplate).where(DocumentTemplate.organization_id == org.id)
        )
    }
    for tpl_name, tpl_kind, tpl_items in DEFAULT_TEMPLATES:
        if tpl_name not in existing_templates:
            tpl = DocumentTemplate(
                organization_id=org.id,
                name=tpl_name,
                kind=tpl_kind,
                is_active=True,
            )
            db.add(tpl)
            db.flush()
            for item in tpl_items:
                db.add(TemplateRequirement(template_id=tpl.id, label=item, is_required=True))

    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    created = False
    if user is None:
        if len(plain_password) < 8:
            raise ValueError("La contraseña inicial debe tener al menos 8 caracteres.")
        user = User(
            organization_id=org.id,
            full_name=full_name.strip(),
            email=normalized_email,
            password_hash=hash_password(plain_password),
            role="general_manager",
            is_active=True,
        )
        db.add(user)
        created = True

    db.commit()
    db.refresh(org)
    db.refresh(user)
    return org, user, created


def main() -> int:
    """CLI entrypoint to bootstrap the single General Manager account."""
    settings = get_settings()
    parser = argparse.ArgumentParser(description="Bootstrap inicial del Gerente General")
    parser.add_argument("--email", default=settings.initial_manager_email)
    parser.add_argument("--name", default=settings.initial_manager_name)
    parser.add_argument("--org", default=settings.initial_org_name)
    parser.add_argument("--password", default=settings.initial_manager_password)
    args = parser.parse_args()

    if not args.password:
        print(
            "Error: define INITIAL_MANAGER_PASSWORD en .env o pásalo con --password.",
            file=sys.stderr,
        )
        return 1

    with SessionLocal() as db:
        org, user, created = ensure_initial_manager(
            db,
            org_name=args.org,
            full_name=args.name,
            email=args.email,
            plain_password=args.password,
        )
        action = "creado" if created else "ya existente"
        print(f"Organización '{org.legal_name}' lista. Usuario '{user.email}' ({action}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
