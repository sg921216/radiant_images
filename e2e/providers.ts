import type { Page, APIRequestContext } from '@playwright/test';
export async function syntheticCaptcha(page: Page, readinessDelay = 0) {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    (async () => {
      if (readinessDelay) await new Promise((resolve) => setTimeout(resolve, readinessDelay));
      await route.fulfill({
        contentType: 'application/javascript',
        body: `(() => {
 let count=0;const widgets=new Map();window.turnstile={render(element,options){const id='synthetic-'+(++count);const button=document.createElement('button');button.type='button';button.textContent='Complete test verification';button.onclick=()=>{options.callback('synthetic-captcha-'+id);button.disabled=true;};element.appendChild(button);widgets.set(id,element);return id;},remove(id){widgets.get(id)?.replaceChildren();widgets.delete(id);},reset(id){const element=widgets.get(id);if(element)element.querySelector('button').disabled=false;},getResponse(){return 'synthetic-captcha';},isExpired(){return false;}};const script=document.currentScript;const callback=new URL(script.src).searchParams.get('onload');if(callback&&window[callback])window[callback]();})();`,
      });
    })(),
  );
}
export async function control(request: APIRequestContext, value: Record<string, unknown>) {
  const response = await request.post('http://127.0.0.1:8787/__test/control', {
    headers: { 'X-Synthetic-Test': 'local-only' },
    data: value,
  });
  if (!response.ok()) throw new Error('Synthetic provider control failed');
}
export async function sentCount(request: APIRequestContext) {
  const response = await request.get('http://127.0.0.1:8787/__test/messages', {
    headers: { 'X-Synthetic-Test': 'local-only' },
  });
  return ((await response.json()) as { count: number }).count;
}
export async function signInOwner(page: Page, request: APIRequestContext) {
  const grant = await request.post('http://127.0.0.1:8787/__test/grant', {
    headers: { 'X-Synthetic-Test': 'local-only' },
  });
  const { code } = (await grant.json()) as { code: string };
  await page.goto(`/admin/callback#code=${encodeURIComponent(code)}`);
  await page.waitForURL('**/admin');
}
