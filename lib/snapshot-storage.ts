import fs from "fs/promises";
import path from "path";

export interface SnapshotStorageProvider {
  save(id: string, buffer: Buffer): Promise<string>;
}

export class LocalSnapshotStorage implements SnapshotStorageProvider {
  private baseDir = path.join(process.cwd(), "public", "snapshots");

  async save(id: string, buffer: Buffer): Promise<string> {
    try {
      await fs.access(this.baseDir);
    } catch {
      await fs.mkdir(this.baseDir, { recursive: true });
    }

    const fileName = `${id}.jpg`;
    const filePath = path.join(this.baseDir, fileName);
    await fs.writeFile(filePath, buffer);
    
    return `/snapshots/${fileName}`;
  }
}

export function getSnapshotStorage(): SnapshotStorageProvider {
  return new LocalSnapshotStorage();
}