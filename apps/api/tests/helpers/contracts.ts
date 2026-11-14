import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
export type ContractDocument = {
  paths: Record<string, Record<string, unknown>>;
  components: Record<string, unknown>;
};
type Operation = { security?: unknown[]; responses: Record<string, Reply> };
type Reply = {
  $ref?: string;
  content?: Record<string, { schema: object }>;
  headers?: Record<string, { required?: boolean; schema: { type?: string } }>;
};
const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);
export function checkProtectedDeclarations(document: ContractDocument): void {
  for (const [path, item] of Object.entries(document.paths))
    for (const [method, value] of Object.entries(item)) {
      if (!methods.has(method)) continue;
      const operation = value as Operation;
      if (
        operation.security?.length &&
        (!operation.responses['401'] || !operation.responses['403'])
      )
        throw new Error(`Missing authorization responses: ${method} ${path}`);
    }
}
export function checkApplicableDeclarations(document: ContractDocument): void {
  checkProtectedDeclarations(document);
  for (const [path, item] of Object.entries(document.paths))
    for (const [method, value] of Object.entries(item)) {
      if (!methods.has(method)) continue;
      const operation = value as Operation;
      const required = new Set(['500', '503']);
      const mutation = !['get', 'head', 'options'].includes(method);
      if (mutation) required.add('413');
      if (
        (mutation && path !== '/auth/logout') ||
        path.includes('{') ||
        path === '/admin/clients' ||
        path === '/auth/google/callback'
      )
        required.add('400');
      if (
        (path.startsWith('/admin/') && mutation) ||
        path.startsWith('/auth/google/') ||
        path === '/auth/exchange' ||
        (mutation && (path === '/inquiries' || path.startsWith('/questionnaire/')))
      )
        required.add('429');
      if (
        (path.includes('{id}') && path !== '/admin/gallery/order') ||
        path.startsWith('/questionnaire/')
      )
        required.add('404');
      if (
        path === '/inquiries' ||
        (path === '/admin/gallery' && method === 'post') ||
        (path.startsWith('/questionnaire/') && mutation)
      )
        required.add('409');
      if (path === '/auth/exchange') required.add('403');
      if (path === '/auth/google/callback' || (path === '/admin/config' && method === 'put'))
        required.add('502');
      if (path === '/inquiries' || path.endsWith('/emails') || path.endsWith('/questionnaires')) {
        required.add('502');
        required.add('504');
      }
      for (const status of required)
        if (!operation.responses[status])
          throw new Error(`Missing applicable response: ${method} ${path} ${status}`);
    }
}
function resolve(document: ContractDocument, value: Reply): Reply {
  if (!value.$ref) return value;
  if (!value.$ref.startsWith('#/')) throw new Error('External contract references are forbidden');
  let result: unknown = document;
  for (const part of value.$ref.slice(2).split('/'))
    result = (result as Record<string, unknown>)[part.replaceAll('~1', '/').replaceAll('~0', '~')];
  if (!result) throw new Error('Unresolved contract reference');
  return result as Reply;
}
function schemaWithDefinitions(document: ContractDocument, schema: object): object {
  return JSON.parse(
    JSON.stringify({ ...schema, $defs: document.components.schemas }).replaceAll(
      '#/components/schemas/',
      '#/$defs/',
    ),
  ) as object;
}
export async function assertContract(
  document: ContractDocument,
  path: string,
  method: string,
  response: Response,
): Promise<void> {
  const operation = document.paths[path]?.[method.toLowerCase()] as Operation | undefined;
  const declaration = operation?.responses[String(response.status)];
  if (!declaration)
    throw new Error(`Undeclared contract response: ${method} ${path} ${response.status}`);
  const reply = resolve(document, declaration);
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  for (const [name, header] of Object.entries(reply.headers ?? {})) {
    const raw = response.headers.get(name);
    if (header.required && raw === null) throw new Error(`Missing contract header: ${name}`);
    if (raw !== null) {
      const value = header.schema.type === 'integer' && /^\d+$/.test(raw) ? Number(raw) : raw;
      if (!ajv.validate(header.schema, value)) throw new Error(`Invalid contract header: ${name}`);
    }
  }
  const schema = reply.content?.['application/json']?.schema;
  if (schema) {
    if (!response.headers.get('content-type')?.includes('application/json'))
      throw new Error('Expected JSON contract response');
    const value: unknown = await response.clone().json();
    if (!ajv.validate(schemaWithDefinitions(document, schema), value))
      throw new Error(`Contract schema mismatch: ${method} ${path} ${response.status}`);
  }
}
