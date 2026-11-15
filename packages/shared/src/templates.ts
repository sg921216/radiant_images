export const PLACEHOLDERS = [
  'firstName',
  'lastName',
  'sessionDate',
  'shootType',
  'questionnaireLink',
] as const;
export const OMITTED_QUESTIONNAIRE_LINK = '[questionnaire link omitted]';
export function validPlaceholders(text: string) {
  let valid = true;
  const rest = text.replace(/\{\{([^{}]+)\}\}/g, (_match, key: string) => {
    if (!(PLACEHOLDERS as readonly string[]).includes(key)) valid = false;
    return '';
  });
  return valid && !rest.includes('{{') && !rest.includes('}}');
}
export function expandTemplate(
  text: string,
  client: Record<string, unknown>,
  link = '{{questionnaireLink}}',
) {
  if (!validPlaceholders(text)) throw new Error('Use only the listed placeholders.');
  const type = String(client.shootType ?? '');
  const values: Record<string, string> = {
    firstName: String(client.firstName ?? ''),
    lastName: String(client.lastName ?? ''),
    sessionDate: client.sessionDate ? String(client.sessionDate) : 'Not scheduled',
    shootType: type.charAt(0).toUpperCase() + type.slice(1),
    questionnaireLink: link,
  };
  return text.replace(/\{\{([^{}]+)\}\}/g, (_match, key: string) => values[key]!);
}
export function hasQuestionnaireUrl(text: string, origin: string) {
  for (const candidate of text.match(/https?:\/\/[^\s<>"']+|\/\/[^\s<>"']+|\/q\/[^\s<>"']*/gi) ??
    []) {
    try {
      const url = new URL(candidate, origin);
      let path = url.pathname;
      for (let i = 0; i < 3; i++) {
        try {
          const decoded = decodeURIComponent(path);
          if (decoded === path) break;
          path = decoded;
        } catch {
          break;
        }
      }
      if (url.origin === new URL(origin).origin && path.startsWith('/q/')) return true;
    } catch {
      /* Non-URLs remain plain text. */
    }
  }
  return false;
}
