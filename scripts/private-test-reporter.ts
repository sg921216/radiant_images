import type {
  Reporter,
  TestCase,
  TestResult,
  TestError,
  TestStep,
} from '@playwright/test/reporter';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { sanitizeTestOutput } from './sanitize-test-output';
function scrub(value: unknown, seen = new WeakSet<object>()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  for (const key of Object.keys(value)) {
    const object = value as Record<string, unknown>;
    const item = object[key];
    if (typeof item === 'string') object[key] = sanitizeTestOutput(item);
    else if (!Buffer.isBuffer(item)) scrub(item, seen);
  }
}
export default class PrivateTestReporter implements Reporter {
  onStepBegin(_test: TestCase, _result: TestResult, step: TestStep) {
    step.title = sanitizeTestOutput(step.title);
  }
  onStepEnd(_test: TestCase, _result: TestResult, step: TestStep) {
    scrub(step);
  }
  onError(error: TestError) {
    scrub(error);
  }
  onTestEnd(_test: TestCase, result: TestResult) {
    scrub(result);
    for (const attachment of result.attachments) {
      if (attachment.body && /text|json/.test(attachment.contentType))
        attachment.body = Buffer.from(sanitizeTestOutput(attachment.body.toString('utf-8')));
      if (attachment.path && /\.(md|txt|json)$/.test(attachment.path)) {
        const root = resolve('test-results'),
          file = resolve(attachment.path),
          within = relative(root, file);
        if (!within.startsWith('..') && !isAbsolute(within)) {
          const text = readFileSync(file, 'utf-8');
          writeFileSync(file, sanitizeTestOutput(text), 'utf-8');
        }
      }
    }
  }
}
