import type { Page, TestInfo } from '@playwright/test';

// Test-only, passive diagnostics: retain lengths and DOM identities, never contact values.
export async function recordClientInput(page: Page) {
  await page.addInitScript(() => {
    const ids = ['client-firstName', 'client-lastName', 'client-email'];
    const events: unknown[] = [];
    const nodes = new WeakMap<Element, number>();
    let nextNode = 0;
    const snapshot = () =>
      ids.map((id) => {
        const element = document.getElementById(id) as HTMLInputElement | null;
        if (element && !nodes.has(element)) nodes.set(element, ++nextNode);
        return {
          id,
          node: element ? nodes.get(element) : null,
          length: element?.value.length ?? null,
        };
      });
    const record = (type: string, event?: Event) => {
      if (events.length === 200) events.shift();
      events.push({
        type,
        at: performance.now(),
        target: event?.target instanceof Element ? event.target.id : null,
        trusted: event?.isTrusted ?? null,
        inputType: event instanceof InputEvent ? event.inputType : null,
        active: ids.includes(document.activeElement?.id ?? '') ? document.activeElement!.id : null,
        focused: document.hasFocus(),
        fields: snapshot(),
      });
    };
    for (const type of ['focus', 'blur', 'beforeinput', 'input', 'change']) {
      document.addEventListener(
        type,
        (event) => {
          if (!(event.target instanceof HTMLInputElement) || !ids.includes(event.target.id)) return;
          record(type, event);
          if (type === 'input') queueMicrotask(() => record('after-input', event));
        },
        { capture: true, passive: true },
      );
    }
    new MutationObserver((changes) => {
      if (
        changes.some(
          (change) =>
            (change.target instanceof Element && ids.includes(change.target.id)) ||
            [...change.addedNodes, ...change.removedNodes].some(
              (node) =>
                node instanceof Element &&
                (ids.includes(node.id) || ids.some((id) => node.querySelector(`#${id}`))),
            ),
        )
      )
        record('dom-change');
    }).observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['value'],
    });
    Object.assign(window, { __clientInputDiagnostics: events });
  });
}

export async function attachClientInput(page: Page, testInfo: TestInfo) {
  const events = await page
    .evaluate(
      () =>
        (window as unknown as { __clientInputDiagnostics?: unknown[] }).__clientInputDiagnostics ??
        [],
    )
    .catch(() => []);
  await testInfo.attach('client-input-events', {
    body: JSON.stringify(events, null, 2),
    contentType: 'application/json',
  });
}
