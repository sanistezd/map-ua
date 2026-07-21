'use client';

import type { StorageFileDto } from '@root/shared';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { integrationApi } from '@/entities/integration';
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  FileUpload,
} from '@/shared/ui';

export function TestStorageCard() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [files, setFiles] = useState<StorageFileDto[]>([]);
  const [filesFailed, setFilesFailed] = useState(false);
  const t = useTranslations('Integrations.storage');

  const refreshFiles = useCallback(() => {
    void integrationApi
      .listStorageFiles()
      .then((listed) => {
        setFiles(listed);
        setFilesFailed(false);
      })
      .catch(() => setFilesFailed(true));
  }, []);

  useEffect(() => {
    void integrationApi
      .storageStatus()
      .then((status) => {
        setConfigured(status.configured);
        if (status.configured) {
          refreshFiles();
        }
      })
      .catch(() => setConfigured(false));
  }, [refreshFiles]);

  async function deleteFile(key: string) {
    try {
      const outcome = await integrationApi.deleteStorageFile(key);
      if (outcome.success) {
        toast.success(t('deleted', { key }));
        refreshFiles();
      } else {
        toast.error(t('deleteFailed', { error: outcome.error ?? '' }));
      }
    } catch (error) {
      toast.error(t('deleteFailed', { error: (error as Error).message }));
    }
  }

  async function upload(selectedFiles: File[]) {
    const file = selectedFiles[0];
    if (!file) {
      return;
    }

    setOpen(false);
    setPending(true);
    try {
      const outcome = await integrationApi.uploadTestFile(file);
      if (outcome.success) {
        toast.success(t('success', { key: outcome.key ?? '' }));
        refreshFiles();
      } else {
        toast.error(t('failed', { error: outcome.error ?? '' }));
      }
    } catch (error) {
      toast.error(t('failed', { error: (error as Error).message }));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={
            configured === null
              ? 'h-1.5 w-1.5 rounded-full bg-graphite'
              : configured
                ? 'h-1.5 w-1.5 rounded-full bg-ok'
                : 'h-1.5 w-1.5 rounded-full bg-blueprint-soft'
          }
          aria-hidden="true"
        />
        <h3 className="font-mono text-xs font-semibold tracking-wide uppercase">
          {t('title')}
        </h3>
      </div>
      {configured === false && (
        <p className="mb-3 text-xs text-muted-foreground">
          {t('notConfiguredHint')}
        </p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('dialogDescription')}</DialogDescription>
          </DialogHeader>
          <FileUpload
            onChange={(files) => void upload(files)}
            title={t('fileUploadTitle')}
            subtitle={t('fileUploadSubtitle')}
            dropActiveLabel={t('fileUploadDropActive')}
          />
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        disabled={pending || configured !== true}
        onClick={() => setOpen(true)}
      >
        {pending ? t('uploading') : t('upload')}
      </Button>
      {configured === true && (
        <div className="mt-4">
          <p className="panel-label">{t('filesTitle')}</p>
          {filesFailed ? (
            <p className="error mt-2">{t('filesLoadFailed')}</p>
          ) : files.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t('filesEmpty')}
            </p>
          ) : (
            <ul className="data-list mt-2">
              {files.map((file) => (
                <li key={file.key}>
                  <span className="truncate font-mono text-xs">{file.key}</span>
                  <span className="flex items-center gap-3">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs whitespace-nowrap text-signal underline underline-offset-2"
                    >
                      {t('open')}
                    </a>
                    <ConfirmDialog
                      trigger={
                        <button
                          type="button"
                          className="font-mono text-xs whitespace-nowrap text-destructive underline underline-offset-2"
                        >
                          {t('delete')}
                        </button>
                      }
                      title={t('deleteTitle')}
                      description={t('deleteDescription', { key: file.key })}
                      confirmLabel={t('deleteConfirm')}
                      cancelLabel={t('deleteCancel')}
                      onConfirm={() => void deleteFile(file.key)}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
