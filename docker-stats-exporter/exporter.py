import json
import os
import socket
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import quote


DOCKER_SOCKET = os.getenv("DOCKER_SOCKET", "/var/run/docker.sock")
LISTEN_PORT = int(os.getenv("EXPORTER_PORT", "9104"))
PROJECT_LABEL = os.getenv("DOCKER_PROJECT_LABEL", "office-rent")
TIMEOUT_SECONDS = float(os.getenv("DOCKER_API_TIMEOUT", "5"))


def docker_api(path):
    request = (
        f"GET {path} HTTP/1.1\r\n"
        "Host: docker\r\n"
        "User-Agent: office-rent-docker-stats-exporter\r\n"
        "Connection: close\r\n\r\n"
    ).encode("utf-8")

    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
        client.settimeout(TIMEOUT_SECONDS)
        client.connect(DOCKER_SOCKET)
        client.sendall(request)
        chunks = []
        while True:
            chunk = client.recv(65536)
            if not chunk:
                break
            chunks.append(chunk)

    raw = b"".join(chunks)
    header_blob, _, body = raw.partition(b"\r\n\r\n")
    header_text = header_blob.decode("iso-8859-1")
    if not header_text.startswith("HTTP/1.1 2"):
        raise RuntimeError(header_text.splitlines()[0] if header_text else "Docker API error")
    if "transfer-encoding: chunked" in header_text.lower():
        body = decode_chunked(body)
    return json.loads(body.decode("utf-8") or "null")


def decode_chunked(body):
    decoded = bytearray()
    index = 0
    while True:
        marker = body.find(b"\r\n", index)
        if marker == -1:
            break
        size_text = body[index:marker].split(b";", 1)[0]
        size = int(size_text, 16)
        index = marker + 2
        if size == 0:
            break
        decoded.extend(body[index:index + size])
        index += size + 2
    return bytes(decoded)


def prom_label(value):
    return str(value or "").replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')


def labels(**items):
    return "{" + ",".join(f'{key}="{prom_label(value)}"' for key, value in items.items()) + "}"


def container_service(container):
    labels_ = container.get("Labels") or {}
    return labels_.get("com.docker.compose.service", "unknown")


def container_name(container):
    names = container.get("Names") or []
    if names:
        return names[0].lstrip("/")
    return container.get("Id", "")[:12]


def collect_metrics():
    filters = quote(json.dumps({"label": [f"com.docker.compose.project={PROJECT_LABEL}"]}))
    containers = docker_api(f"/containers/json?all=1&filters={filters}") or []
    now = int(time.time())
    lines = [
        "# HELP office_rent_container_up Container is running, grouped by Docker Compose service.",
        "# TYPE office_rent_container_up gauge",
        "# HELP office_rent_container_cpu_usage_seconds_total Total CPU time consumed by the container.",
        "# TYPE office_rent_container_cpu_usage_seconds_total counter",
        "# HELP office_rent_container_memory_usage_bytes Current container memory usage.",
        "# TYPE office_rent_container_memory_usage_bytes gauge",
        "# HELP office_rent_container_memory_limit_bytes Container memory limit.",
        "# TYPE office_rent_container_memory_limit_bytes gauge",
        "# HELP office_rent_container_network_receive_bytes_total Total network bytes received by the container.",
        "# TYPE office_rent_container_network_receive_bytes_total counter",
        "# HELP office_rent_container_network_transmit_bytes_total Total network bytes transmitted by the container.",
        "# TYPE office_rent_container_network_transmit_bytes_total counter",
        "# HELP office_rent_container_scrape_timestamp_seconds Unix timestamp when this exporter scraped Docker.",
        "# TYPE office_rent_container_scrape_timestamp_seconds gauge",
    ]

    for container in containers:
        container_id = container.get("Id", "")
        state = container.get("State", "unknown")
        base_labels = {
            "container": container_name(container),
            "service": container_service(container),
            "image": container.get("Image", ""),
            "state": state,
        }
        is_running = 1 if state == "running" else 0
        lines.append(f"office_rent_container_up{labels(**base_labels)} {is_running}")
        lines.append(f"office_rent_container_scrape_timestamp_seconds{labels(**base_labels)} {now}")

        if not container_id or state != "running":
            continue

        stats = docker_api(f"/containers/{container_id}/stats?stream=false&one-shot=true") or {}
        cpu_total = (stats.get("cpu_stats", {}).get("cpu_usage", {}).get("total_usage") or 0) / 1_000_000_000
        memory_stats = stats.get("memory_stats") or {}
        network_stats = stats.get("networks") or {}
        memory_usage = memory_stats.get("usage") or 0
        memory_limit = memory_stats.get("limit") or 0
        rx_bytes = sum((network.get("rx_bytes") or 0) for network in network_stats.values())
        tx_bytes = sum((network.get("tx_bytes") or 0) for network in network_stats.values())

        lines.append(f"office_rent_container_cpu_usage_seconds_total{labels(**base_labels)} {cpu_total}")
        lines.append(f"office_rent_container_memory_usage_bytes{labels(**base_labels)} {memory_usage}")
        lines.append(f"office_rent_container_memory_limit_bytes{labels(**base_labels)} {memory_limit}")
        lines.append(f"office_rent_container_network_receive_bytes_total{labels(**base_labels)} {rx_bytes}")
        lines.append(f"office_rent_container_network_transmit_bytes_total{labels(**base_labels)} {tx_bytes}")

    return "\n".join(lines) + "\n"


class MetricsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok\n")
            return

        if self.path != "/metrics":
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"not found\n")
            return

        try:
            body = collect_metrics().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as exc:
            body = f"collector error: {exc}\n".encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", LISTEN_PORT), MetricsHandler)
    server.serve_forever()
