import { describe, expect, it } from "vitest";
import { daysUntil } from "@/utils/dates";
import { auditMetrics, evaluateAudit, normalizeAuditText } from "@/utils/audits";
import { formatBytes, mapApiDocument, mapApiVehicle } from "@/lib/api";
import type { AuditRecord, DemoFile, Vehicle } from "@/types";

describe("Utilidades de fechas y auditorías", () => {
  it("calcula días restantes respecto a una fecha de referencia", () => {
    const ref = new Date("2026-11-16T12:00:00");
    expect(daysUntil("2026-11-26", ref)).toBe(10);
    expect(daysUntil("2026-11-10", ref)).toBe(-6);
    expect(daysUntil(undefined, ref)).toBeNull();
  });

  it("evalúa requisitos disponibles y faltantes sin inventar documentos", () => {
    const vehicles: Vehicle[] = [
      {
        id: 1,
        code: "UN-001",
        plate: "T3X-456",
        brand: "Mercedes-Benz",
        model: "Sprinter",
        year: "2024",
        capacity: "19",
        type: "Bus de personal",
        status: "Operativa",
        notes: "",
        cover: "",
        photos: [],
        folderId: 10,
      },
    ];
    const files: DemoFile[] = [
      {
        id: 100,
        name: "SOAT_T3X-456.pdf",
        type: "pdf",
        size: "1.2 MB",
        modified: "Hoy",
        category: "SOAT",
        parent: 10,
        vehicle: "T3X-456",
        expirationDate: "2099-12-31",
        isPersisted: true,
      },
    ];
    const audit: AuditRecord = {
      id: 1,
      name: "Auditoría Test",
      companyId: 1,
      requestDate: "2026-11-16",
      deadline: "2026-11-30",
      period: "Noviembre 2026",
      description: "",
      notes: "",
      status: "Activa",
      vehicleIds: [1],
      workerIds: [],
      requirements: [
        { id: "soat", label: "SOAT", scope: "Unidad" },
        { id: "str", label: "STR", scope: "Unidad" },
      ],
      manuallyReviewed: [],
      excludedEvidence: [],
      updated: "Hoy",
    };

    const evidence = evaluateAudit(audit, files, vehicles, [], [], [], []);
    expect(evidence.find((e) => e.requirement === "SOAT")?.status).toBe("Disponible");
    expect(evidence.find((e) => e.requirement === "STR")?.status).toBe("Faltante");

    const metrics = auditMetrics(evidence);
    expect(metrics.ready).toBe(1);
    expect(metrics.missing).toBe(1);
    expect(metrics.progress).toBe(50);
  });

  it("normaliza acentos y formatea tamaños correctamente", () => {
    expect(normalizeAuditText("Póliza de Revisión Técnica")).toBe("poliza de revision tecnica");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});

describe("Adaptadores de API", () => {
  it("mapea vehículos y documentos persistidos resolviendo placa", () => {
    const vehicle = mapApiVehicle({
      id: 7,
      organization_id: 1,
      folder_id: 22,
      plate: "A1B-234",
      internal_code: "UN-007",
      brand: "Volvo",
      model: "B270F",
      year: 2024,
      capacity: 42,
      vehicle_type: "Bus de personal",
      status: "Operativa",
      notes: null,
      created_at: "2026-11-16T10:00:00Z",
      photos: [
        {
          id: 99,
          vehicle_id: 7,
          description: null,
          is_cover: true,
          url: "/api/v1/vehicles/7/photos/99/file",
          created_at: "2026-11-16T10:00:00Z",
        },
      ],
    });
    expect(vehicle.isPersisted).toBe(true);
    expect(vehicle.cover).toBe("/api/v1/vehicles/7/photos/99/file");

    const doc = mapApiDocument(
      {
        id: 50,
        organization_id: 1,
        folder_id: 22,
        category: "SOAT",
        name: "SOAT A1B-234",
        description: null,
        related_vehicle_id: 7,
        related_worker_id: null,
        related_company_id: null,
        tags: null,
        is_favorite: true,
        is_inbox: false,
        inbox_source: null,
        issued_at: "2026-01-01",
        expires_at: "2099-01-01",
        created_at: "2026-11-16T10:00:00Z",
        deleted_at: null,
        current_version: {
          id: 1,
          document_id: 50,
          version_number: 1,
          original_filename: "soat.pdf",
          mime_type: "application/pdf",
          byte_size: 102400,
          checksum: "abc",
          is_current: true,
          uploaded_at: "2026-11-16T10:00:00Z",
        },
        versions: [],
      },
      new Map([[vehicle.id, vehicle.plate]]),
    );

    expect(doc.vehicle).toBe("A1B-234");
    expect(doc.status).toBe("Vigente");
    expect(doc.isPersisted).toBe(true);
  });
});
