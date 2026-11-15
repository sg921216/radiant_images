import { DurableObject } from 'cloudflare:workers';
import type { Env } from '../env';
import { runScheduled } from '../scheduled';
import { productionRuntime } from './runtime';

// One coordinator for the single recovery ledger, shared by both cron schedules.
// The R2 status records remain the durable source of completion/failure evidence.
export class ScheduledOperations extends DurableObject<Env> {
  private tail: Promise<void> = Promise.resolve();
  private pending = 0;

  protected async execute(cron: string): Promise<void> {
    await runScheduled(cron, this.env, productionRuntime);
  }

  async run(cron: string): Promise<void> {
    if (cron !== '*/5 * * * *' && cron !== '0 3 * * *') throw new Error('unsupported_schedule');
    if (this.pending >= 2) throw new Error('scheduled_operations_busy');
    this.pending++;
    const operation = this.tail.then(() => this.execute(cron));
    // Keep failure visible to the caller without poisoning the next invocation.
    this.tail = operation.catch(() => undefined);
    try {
      await operation;
    } finally {
      this.pending--;
    }
  }
}
