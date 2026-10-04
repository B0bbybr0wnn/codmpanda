export async function onRequest(context) {
  const url = new URL(context.request.url);

  const target =
    "https://codmpanda-app.firebaseapp.com" +
    url.pathname +
    url.search;

  const response = await fetch(target, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.method === "GET" ||
          context.request.method === "HEAD"
      ? undefined
      : context.request.body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
