import type { APIRoute } from "astro";
import { SITE_ENVIRONMENT, isIndexable } from "../site-environment";
import { robotsTxt } from "../sitemap";

export const GET: APIRoute = () =>
  new Response(robotsTxt(SITE_ENVIRONMENT, isIndexable(SITE_ENVIRONMENT)), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
