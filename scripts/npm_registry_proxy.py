from __future__ import annotations

import json
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


UPSTREAM = "https://registry.npmjs.org"
LOCAL = "http://127.0.0.1:4873"

_original_getaddrinfo = socket.getaddrinfo


def _getaddrinfo_ipv4(host: str, port: int, family: int = 0, type: int = 0, proto: int = 0, flags: int = 0):
    return _original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)


socket.getaddrinfo = _getaddrinfo_ipv4


class RegistryProxy(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_HEAD(self) -> None:
        self._proxy(head=True)

    def do_GET(self) -> None:
        self._proxy(head=False)

    def log_message(self, fmt: str, *args: object) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _proxy(self, head: bool) -> None:
        upstream_url = f"{UPSTREAM}{self.path}"
        request = urllib.request.Request(
            upstream_url,
            method="HEAD" if head else "GET",
            headers={
                "User-Agent": "sovereign-lens-local-npm-proxy",
                "Accept": self.headers.get("Accept", "*/*"),
            },
        )

        try:
            with urllib.request.urlopen(request, timeout=90) as response:
                body = b"" if head else response.read()
                content_type = response.headers.get("Content-Type", "")

                if body and "application/json" in content_type:
                    body = body.replace(UPSTREAM.encode("utf-8"), LOCAL.encode("utf-8"))
                    try:
                        # Some metadata includes escaped tarball URLs.
                        parsed = json.loads(body)
                        body = json.dumps(parsed).encode("utf-8")
                    except json.JSONDecodeError:
                        pass

                self.send_response(response.status)
                for key, value in response.headers.items():
                    lowered = key.lower()
                    if lowered in {"content-length", "connection", "content-encoding", "transfer-encoding"}:
                        continue
                    self.send_header(key, value)
                self.send_header("Content-Length", str(len(body)))
                self.send_header("Connection", "close")
                self.end_headers()
                if not head:
                    self.wfile.write(body)
        except urllib.error.HTTPError as exc:
            body = exc.read()
            self.send_response(exc.code)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Connection", "close")
            self.end_headers()
            if not head:
                self.wfile.write(body)
        except Exception as exc:
            body = str(exc).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Connection", "close")
            self.end_headers()
            if not head:
                self.wfile.write(body)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 4873), RegistryProxy)
    print(f"Proxying {LOCAL} -> {UPSTREAM}", flush=True)
    server.serve_forever()
