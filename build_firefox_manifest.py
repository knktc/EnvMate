#!/usr/bin/env python3
"""Create the Firefox-compatible manifest from the shared extension manifest."""

import json
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: build_firefox_manifest.py INPUT OUTPUT")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    manifest = json.loads(input_path.read_text(encoding="utf-8"))

    background = manifest.get("background")
    if not isinstance(background, dict) or "service_worker" not in background:
        raise SystemExit("manifest must define background.service_worker")

    worker_path = background.pop("service_worker")
    background["scripts"] = [worker_path]

    gecko = manifest.setdefault("browser_specific_settings", {}).setdefault("gecko", {})
    gecko.setdefault("id", "@envmate-knktc")
    gecko.setdefault("strict_min_version", "115.0")
    gecko.setdefault("data_collection_permissions", {"required": ["none"]})

    output_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
