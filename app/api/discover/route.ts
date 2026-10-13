import { DiscoveryError, parseDiscoveryRequest } from "@/lib/discovery";
import { discoverPlaces } from "@/lib/server/places";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      throw new DiscoveryError("Search from the NeoQuest website.", 403);
    if (
      request.headers.get("content-type")?.split(";")[0].trim() !==
      "application/json"
    )
      throw new DiscoveryError("Send a JSON search request.", 415);
    const text = await request.text();
    if (text.length > 2048)
      throw new DiscoveryError("The search request is too large.", 413);
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new DiscoveryError("The search request is not valid JSON.", 400);
    }
    const result = await discoverPlaces(parseDiscoveryRequest(body));
    return Response.json(result, { headers });
  } catch (error) {
    const known = error instanceof DiscoveryError;
    return Response.json(
      {
        error: known
          ? error.message
          : "Search is temporarily unavailable. Try demo mode.",
      },
      {
        status: known ? error.status : 500,
        headers: {
          ...headers,
          ...(known && error.status === 429 ? { "Retry-After": "60" } : {}),
        },
      },
    );
  }
}
