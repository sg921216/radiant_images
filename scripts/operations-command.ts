export function operationsCommand(args: string[]): {
  action: 'backup' | 'restore' | 'reopen' | 'cleanup' | 'list';
  key?: string;
} {
  const [action, key] = args;
  if (
    args.length === 1 &&
    (action === 'backup' || action === 'reopen' || action === 'cleanup' || action === 'list')
  )
    return { action };
  if (
    args.length === 2 &&
    action === 'restore' &&
    key &&
    /^backups\/[0-9A-HJKMNP-TV-Z]{26}\.json$/.test(key)
  )
    return { action, key };
  throw new Error(
    'Use backup, list, cleanup, restore backups/ID.json, or reopen. All operations are local-only.',
  );
}
