export function sanitizeTestOutput(value: string) {
  return value
    .replace(/(\/(?:q|questionnaire)\/)[A-Za-z0-9_%.-]{16,}/g, '$1[redacted]')
    .replace(/((?:#|[?&])code=)[A-Za-z0-9_%.-]+/g, '$1[redacted]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~-]+/gi, '$1[redacted]');
}
