export const API_ERROR_CODES = {
  badRequest: 'common.badRequest',
  validationFailed: 'common.validationFailed',
  notFound: 'common.notFound',
  conflict: 'common.conflict',
  tooManyRequests: 'common.tooManyRequests',
  internal: 'common.internal',
  unavailable: 'common.unavailable',
  unauthorized: 'auth.unauthorized',
  forbidden: 'auth.forbidden',
  userEmailTaken: 'user.emailTaken',
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
