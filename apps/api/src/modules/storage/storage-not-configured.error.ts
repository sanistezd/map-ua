export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      'S3 storage is not configured. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.',
    );
    this.name = StorageNotConfiguredError.name;
  }
}
