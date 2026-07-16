"""
Backend API smoke tests for Jack & Jill (Next.js Route Handlers)
Tests are executed against the PUBLIC preview URL to exercise the same path
customers/admins would hit (going through Kubernetes ingress).

NOTE (iteration 1): We suspect the ingress routes /api/* to FastAPI (port 8001)
rather than Next.js (port 3000). This test file makes that visible.
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get(
    "PUBLIC_BASE_URL",
    "https://kids-wear-store-3.preview.emergentagent.com",
).rstrip("/")

LOCAL_NEXT = "http://localhost:3000"
LOCAL_FASTAPI = "http://localhost:8001"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Accept": "application/json"})
    return sess


# ---------- Public pages (HTML, not JSON) ----------
class TestPublicPages:
    @pytest.mark.parametrize("path,expected", [
        ("/", 200),
        ("/shop", 200),
        ("/shop?category=footwear", 200),
        ("/product/sunshine-cotton-frock", 200),
        ("/auth", 200),
        ("/track", 200),
        ("/contact", 200),
        ("/faq", 200),
        ("/about", 200),
        ("/legal/privacy", 200),
        ("/legal/terms", 200),
        ("/legal/shipping", 200),
        ("/legal/returns", 200),
        ("/legal/refund", 200),
        ("/legal/cancellation", 200),
        ("/robots.txt", 200),
        ("/sitemap.xml", 200),
    ])
    def test_public_page_renders(self, s, path, expected):
        r = s.get(f"{BASE_URL}{path}", timeout=30)
        assert r.status_code == expected, f"{path} -> {r.status_code}"

    def test_admin_gate_redirects_to_auth(self, s):
        r = s.get(f"{BASE_URL}/admin", timeout=30, allow_redirects=False)
        assert r.status_code in (302, 307), r.status_code
        loc = r.headers.get("location", "")
        assert "/auth" in loc, f"unexpected redirect location {loc}"


# ---------- Next.js API routes (currently ingress-blocked) ----------
class TestNextJsAPIRoutesViaPublicURL:
    """These SHOULD hit Next.js /api routes but currently hit FastAPI."""

    def test_pincode_lookup(self, s):
        r = s.get(f"{BASE_URL}/api/pincode/416001", timeout=15)
        # Expected: 200 with { serviceable: true, city: 'Kolhapur' ... }
        # Actual today: FastAPI 404 {"detail":"Not Found"}
        assert r.status_code == 200, (
            f"/api/pincode/416001 returned {r.status_code} "
            f"body={r.text[:200]} — ingress is routing /api/* to FastAPI, "
            f"but this is a Next.js app. All API calls broken."
        )
        body = r.json()
        assert body.get("serviceable") is True

    def test_track_missing_params_returns_400(self, s):
        r = s.get(f"{BASE_URL}/api/track", timeout=15)
        # Next.js route returns 400 for missing params
        assert r.status_code == 400, (
            f"/api/track expected 400 got {r.status_code} body={r.text[:200]}"
        )

    def test_contact_submit(self, s):
        r = s.post(
            f"{BASE_URL}/api/contact",
            json={
                "name": "TEST_qatester",
                "email": "qa+contact@example.com",
                "message": "This is a QA test contact submission",
            },
            timeout=15,
        )
        assert r.status_code in (200, 201), (
            f"/api/contact returned {r.status_code} body={r.text[:200]}"
        )
        assert r.json().get("ok") is True

    def test_orders_create_cod_fallback(self, s):
        """Since Razorpay keys are placeholders, /api/orders/create
        should auto-degrade to COD and still return ok=true."""
        # We need a real variant_id to test this end-to-end.
        pytest.skip("Requires seeded variant id lookup via Supabase — see UI test")


# ---------- Sanity: what IS on the /api path today ----------
class TestApiPathSanity:
    def test_api_root_returns_fastapi_hello(self, s):
        """Documenting that the ingress is currently pointing /api to FastAPI."""
        r = s.get(f"{BASE_URL}/api/", timeout=15)
        # If this passes with a FastAPI hello -> confirmed misrouted.
        # If Next.js were serving, this would 404 (no /api route at exact / in Next).
        try:
            body = r.json()
        except Exception:
            body = {}
        # We assert this fact so it's visible in the test report.
        assert body.get("message") == "Hello World", (
            f"/api/ returned {r.status_code} body={r.text[:200]} — "
            f"expected FastAPI 'Hello World' documenting the ingress conflict"
        )

    def test_nextjs_api_available_on_port_3000(self):
        """Next.js /api DOES work when hit directly on port 3000."""
        try:
            r = requests.get(f"{LOCAL_NEXT}/api/track", timeout=10)
        except Exception as e:
            pytest.skip(f"local next.js port not reachable: {e}")
        # Next.js /api/track returns 400 (missing params) — proving the route
        # exists and would work if ingress routed here.
        assert r.status_code == 400, (
            f"port 3000 /api/track expected 400 got {r.status_code} "
            f"body={r.text[:200]}"
        )
