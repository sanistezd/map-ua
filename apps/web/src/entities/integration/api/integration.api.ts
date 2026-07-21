import type {
  EmailStatusDto,
  EmailTestResultDto,
  SendTestEmailDto,
  StorageFileDto,
  StorageStatusDto,
  StorageTestResultDto,
} from '@root/shared';

import { apiRequest } from '@/shared/api';

export const integrationApi = {
  emailStatus: () => apiRequest<EmailStatusDto>('/email/status'),
  sendTestEmail: (input: SendTestEmailDto) =>
    apiRequest<EmailTestResultDto>('/email/test', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  storageStatus: () => apiRequest<StorageStatusDto>('/storage/status'),
  listStorageFiles: () => apiRequest<StorageFileDto[]>('/storage/files'),
  uploadTestFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<StorageTestResultDto>('/storage/test', {
      method: 'POST',
      body: formData,
    });
  },
  deleteStorageFile: (key: string) =>
    apiRequest<StorageTestResultDto>(
      `/storage/files?key=${encodeURIComponent(key)}`,
      { method: 'DELETE' },
    ),
};
