function notFound(): Response {
  return new Response("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export default {
  async fetch(): Promise<Response> {
    return notFound();
  },
} satisfies ExportedHandler<Env>;
