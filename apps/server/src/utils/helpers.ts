/**
 * 공통 유틸리티 함수들
 */

import { randomUUID } from 'crypto';
import crypto from 'crypto';

/**
 * UUID v4 생성
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * TTL (Time To Live) 계산
 * @param days - 일 수
 * @returns Unix timestamp (초 단위)
 */
export function calculateTTL(days: number): number {
  const now = Math.floor(Date.now() / 1000);
  const secondsInDay = 24 * 60 * 60;
  return now + days * secondsInDay;
}

/**
 * 캐시 키 생성
 * @param productName - 제품명
 * @param version - 분석 알고리즘 버전
 * @returns 캐시 키 (20자리 해시)
 */
export function generateCacheKey(productName: string, version: string = '1.0.0'): string {
  const data = `${productName.toLowerCase().trim()}:${version}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 20);
}

/**
 * ISO 8601 형식의 현재 시간 반환
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * 만료 시간 계산 (ISO 8601)
 * @param hours - 시간
 */
export function calculateExpiresAt(hours: number): string {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return expiresAt.toISOString();
}

/**
 * 날짜가 만료되었는지 확인
 */
export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * 문자열을 정규화 (소문자, 공백 제거)
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * 배열을 청크로 나누기
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 딜레이 (비동기)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 재시도 로직
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    exponentialBackoff?: boolean;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, exponentialBackoff = true } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      const waitTime = exponentialBackoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
      await delay(waitTime);
    }
  }

  throw lastError || new Error('Retry failed');
}
