/**
 * 커스텀 에러 클래스들
 */

/**
 * API 에러 기본 클래스
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 유효성 검증 에러
 */
export class ValidationError extends ApiError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * 리소스를 찾을 수 없음
 */
export class NotFoundError extends ApiError {
  constructor(message: string = '리소스를 찾을 수 없습니다.') {
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Perplexity API 에러
 */
export class PerplexityError extends ApiError {
  constructor(message: string) {
    super(502, message, 'PERPLEXITY_ERROR');
    this.name = 'PerplexityError';
  }
}

/**
 * DynamoDB 에러
 */
export class DatabaseError extends ApiError {
  constructor(message: string) {
    super(500, message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

/**
 * 분석 실패 에러
 */
export class AnalysisError extends ApiError {
  constructor(message: string) {
    super(500, message, 'ANALYSIS_FAILED');
    this.name = 'AnalysisError';
  }
}

/**
 * Rate Limit 에러
 */
export class RateLimitError extends ApiError {
  constructor(message: string = '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.') {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

/**
 * 인증 에러
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = '인증이 필요합니다.') {
    super(401, message, 'AUTHENTICATION_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

/**
 * 권한 에러
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = '권한이 없습니다.') {
    super(403, message, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}
