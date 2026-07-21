/** Framework-independent storage configuration status shared across applications. */
export interface StorageStatusDto {
  configured: boolean;
}

/** Framework-independent test-upload result shared across applications. */
export interface StorageTestResultDto {
  success: boolean;
  key?: string;
  error?: string;
}

/** A single object listed from storage, with a short-lived signed URL to open it. */
export interface StorageFileDto {
  key: string;
  url: string;
  size?: number;
  lastModifiedAt?: string;
}
