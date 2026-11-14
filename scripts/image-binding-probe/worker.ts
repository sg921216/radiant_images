// Only run through `wrangler dev --remote` for provider evidence.
// This diagnostic intentionally skips application validation to observe the provider.
export default {
  async fetch(request: Request, env: ImageProbeEnv) {
    const url = new URL(request.url);
    const edge = Number(url.searchParams.get('edge') ?? 2000);
    if (request.method !== 'POST' || url.pathname !== '/transform')
      return new Response(null, { status: 404 });
    if (![2000, 800, 320].includes(edge) || !request.body)
      return new Response(null, { status: 400 });
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 10_485_760) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      chunks.push(value);
    }
    const stream = () =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(chunk);
          controller.close();
        },
      });
    let info: ImageInfoResponse | undefined;
    try {
      info = await env.IMAGES.info(stream());
      const output = await env.IMAGES.input(stream())
        .transform({ width: edge, height: edge, fit: 'scale-down' })
        .output({ format: 'image/webp', quality: 80, anim: false });
      const response = output.response();
      response.headers.set('X-Probe-Info', JSON.stringify(info));
      response.headers.set('Cache-Control', 'no-store');
      return response;
    } catch (error) {
      return Response.json(
        {
          error: 'images_provider_error',
          code:
            error instanceof Error && 'code' in error && typeof error.code === 'number'
              ? error.code
              : null,
          info,
        },
        { status: 422, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  },
};
