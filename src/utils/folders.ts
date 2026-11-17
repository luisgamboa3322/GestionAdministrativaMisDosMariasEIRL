import type { DemoFolder } from "@/types";

export interface FolderOption {
  id: number;
  label: string;
}

export function getFolderPath(folderId: number, folders: DemoFolder[]): string {
  const byId = new Map<number, DemoFolder>();
  for (const folder of folders) {
    byId.set(folder.id, folder);
  }
  const parts: string[] = [];
  const seen = new Set<number>();
  let currentId: number | null = folderId;
  while (currentId !== null && !seen.has(currentId)) {
    seen.add(currentId);
    const current = byId.get(currentId);
    if (!current) break;
    parts.unshift(current.name);
    currentId = current.parent;
  }
  return parts.join(" / ");
}

export function getFolderOptions(
  folders: DemoFolder[],
  excludeIds?: Set<number>,
): FolderOption[] {
  return folders
    .filter((folder) => !excludeIds?.has(folder.id))
    .map((folder) => ({
      id: folder.id,
      label: getFolderPath(folder.id, folders) || folder.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}
