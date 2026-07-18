"""
Jack & Jill preview-env reverse proxy.

This FastAPI process only exists because the Emergent preview ingress routes
/api/* to port 8001 (this process) instead of directly to Next.js on port 3000.
Everything under /api/* is transparently proxied to the Next.js app running on
localhost:3000, preserving method, headers, cookies, body and query params.

In production (Hostinger Node.js hosting) only the Next.js app in frontend/
is deployed and this file is unused.
"""
from __future__ import annotations

import os
import logging

import httpx
from fastapi import FastAPI, Request, Response
from starlette.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api-proxy")

UPSTREAM = os.environ.get("NEXTJS_UPSTREAM", "http://localhost:3000")
TIMEOUT = httpx.Timeout(60.0, connect=10.0)

app = FastAPI(title="Jack & Jill API proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Reuse a single async client for connection pooling
_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def _startup() -> None:
    global _client
    _client = httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False)
    logger.info("API proxy started, forwarding to %s", UPSTREAM)


@app.on_event("shutdown")
async def _shutdown() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


# Headers we must not forward as-is (hop-by-hop or length/encoding related)
_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "content-encoding",
    "content-length",
    "host",
}


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def proxy(path: str, request: Request) -> Response:
    global _client
    if _client is None:  # defensive, in case startup event was missed
        _client = httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=False)

    target = f"{UPSTREAM}/api/{path}"
    # Preserve query string
    if request.url.query:
        target = f"{target}?{request.url.query}"

    # Copy request headers, minus hop-by-hop
    fwd_headers = {
        k: v for k, v in request.headers.items() if k.lower() not in _HOP_BY_HOP
    }
    # Let httpx set the real Host header for localhost:3000
    fwd_headers.pop("host", None)

    body = await request.body()

    try:
        upstream = await _client.request(
            request.method,
            target,
            headers=fwd_headers,
            content=body,
        )
    except httpx.RequestError as exc:  # network / connect failure
        logger.error("Upstream request failed: %s", exc)
        return Response(
            content=f'{{"error":"upstream_unreachable","detail":"{exc}"}}',
            status_code=502,
            media_type="application/json",
        )

    # Strip hop-by-hop response headers so Starlette can compute correct length
    resp_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in _HOP_BY_HOP
    }

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=resp_headers,
        media_type=upstream.headers.get("content-type"),
    )


@app.get("/")
async def root() -> dict:
    return {"ok": True, "service": "jack-and-jill-api-proxy", "upstream": UPSTREAM}
