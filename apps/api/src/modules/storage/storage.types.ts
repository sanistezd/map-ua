export interface UploadObjectParams {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
}

export interface SignedUrlParams {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
}

export interface StorageObject {
  key: string;
}

export interface ListedStorageObject {
  key: string;
  size?: number;
  lastModified?: Date;
}
