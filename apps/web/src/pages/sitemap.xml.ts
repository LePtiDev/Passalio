import type { APIRoute } from "astro";
import { SITE_ENVIRONMENT } from "../site-environment";
import { sitemapXml } from "../sitemap";

export const GET: APIRoute = () =>
  new Response(sitemapXml(SITE_ENVIRONMENT), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
