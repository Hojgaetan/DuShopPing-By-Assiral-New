export function getErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object' || !('message' in error) || typeof error.message !== 'string' || !error.message.trim()) return fallback;
  const code = 'code' in error && typeof error.code === 'string' && error.code ? ' [' + error.code + ']' : '';
  return error.message + code;
}
