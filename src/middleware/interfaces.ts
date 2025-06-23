export interface ImportResult {
    importedCount: number;
    failedEntries: {
      block: string;
      error: string;
    }[];
  }
  
export interface FailedImportEntry {
  block: string;
  error: string;
}

export interface MulterRequest extends Request {
  file?: File;
}

// interface MulterFile extends Express.Multer.File {
//   buffer: Buffer;
// }