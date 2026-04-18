from __future__ import annotations

import argparse
from pathlib import Path

from nokin_lens_ingest.pipeline import run_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Build canonical Nikon lens dataset from local HTML snapshots.")
    parser.add_argument(
        "--lenses-html",
        default="data/source/lenses.html",
        help="Path to local lenses HTML snapshot.",
    )
    parser.add_argument(
        "--specs-html",
        default="data/source/specs.html",
        help="Path to local specs HTML snapshot.",
    )
    parser.add_argument(
        "--schema-doc",
        default="doc/data-model/lenses/JSON_SCHEMA_DRAFT.md",
        help="Path to markdown file that contains JSON schema code block.",
    )
    parser.add_argument(
        "--output",
        default="data/processed/lenses.v1.json",
        help="Output dataset JSON path.",
    )
    args = parser.parse_args()

    dataset = run_pipeline(
        lenses_html_path=Path(args.lenses_html),
        specs_html_path=Path(args.specs_html),
        schema_doc_path=Path(args.schema_doc),
        output_json_path=Path(args.output),
    )
    print(f"Built dataset with {len(dataset['lenses'])} records at {args.output}")


if __name__ == "__main__":
    main()

