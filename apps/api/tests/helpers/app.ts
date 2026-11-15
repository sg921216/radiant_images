import { parse } from 'yaml';
import source from '../../../../specs/001-radiant-images-website/contracts/openapi.yaml?raw';
import { createApp as actualCreateApp } from '../../src';
import { assertContract, type ContractDocument } from './contracts';
export const contract = parse(source) as ContractDocument;
export function createApp(...args: Parameters<typeof actualCreateApp>) {
  const app = actualCreateApp(...args);
  const request = app.request.bind(app);
  app.request = async (...input: Parameters<typeof request>) => {
    const response = await request(...input);
    const url = new URL(
      input[0] instanceof Request ? input[0].url : String(input[0]),
      'http://localhost',
    );
    const method = (
      input[1]?.method ?? (input[0] instanceof Request ? input[0].method : 'GET')
    ).toLowerCase();
    const path = Object.keys(contract.paths).find((path) =>
      new RegExp(`^${path.replace(/\{[^}]+\}/g, '[^/]+')}/?$`).test(url.pathname),
    );
    if (path && contract.paths[path]?.[method])
      await assertContract(contract, path, method, response);
    return response;
  };
  return app;
}
