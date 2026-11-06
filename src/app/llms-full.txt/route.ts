/**
 * llms-full.txt: the llms.txt map plus the full markdown body of the main
 * pages, so an agent can read the whole public site in one request. Rendered
 * from the same registry as the .md endpoints, so content cannot drift.
 */
import { markdownResponse } from "@/lib/md/http";
import { MARKDOWN_ROUTES } from "@/lib/md/registry";

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const body = MARKDOWN_ROUTES.map((route) => route.render(origin).trim()).join("\n\n---\n\n");
  return markdownResponse(`${body}\n`, { canonicalPath: "/llms-full.txt", origin });
}
