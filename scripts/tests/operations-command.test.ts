import { expect, test } from 'vitest';
import { operationsCommand } from '../operations-command';
test('local operations accepts only fixed commands and a validated private backup key', () => {
  expect(operationsCommand(['backup'])).toEqual({ action: 'backup' });
  expect(operationsCommand(['restore', 'backups/01K00000000000000000000001.json'])).toEqual({
    action: 'restore',
    key: 'backups/01K00000000000000000000001.json',
  });
  for (const args of [
    ['backup', '--remote'],
    ['restore', '../../secret'],
    ['delete'],
    ['reopen', 'extra'],
    [],
  ])
    expect(() => operationsCommand(args)).toThrow();
});
