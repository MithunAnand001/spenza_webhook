export enum SpenzaErrorCode {
  SUCCESS = 'SPZ_000',
  VALIDATION_ERROR = 'SPZ_001',
  UNAUTHORIZED = 'SPZ_002',
  FORBIDDEN = 'SPZ_003',
  NOT_FOUND = 'SPZ_004',
  CONFLICT = 'SPZ_005',
  INTERNAL_ERROR = 'SPZ_006',
  BAD_REQUEST = 'SPZ_007',
  DATABASE_ERROR = 'SPZ_008',
  RABBITMQ_ERROR = 'SPZ_009',
}

export const mapSpenzaError = (code: string | number): SpenzaErrorCode => {
  switch (code) {
    case 400: return SpenzaErrorCode.BAD_REQUEST;
    case 401: return SpenzaErrorCode.UNAUTHORIZED;
    case 403: return SpenzaErrorCode.FORBIDDEN;
    case 404: return SpenzaErrorCode.NOT_FOUND;
    case 409: return SpenzaErrorCode.CONFLICT;
    case 500: return SpenzaErrorCode.INTERNAL_ERROR;
    default: return SpenzaErrorCode.INTERNAL_ERROR;
  }
};
