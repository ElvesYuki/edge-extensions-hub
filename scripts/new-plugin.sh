#!/bin/bash
set -euo pipefail

NAME="${1:-}"
TITLE="${2:-$NAME}"
DESC="${3:-A browser extension.}"

if [ -z "$NAME" ]; then
  echo "Usage: ./scripts/new-plugin.sh <plugin-name> [title] [description]"
  echo "  plugin-name: directory name, lowercase-hyphenated (e.g. quick-search)"
  echo "  title:       display name for the popup (defaults to plugin-name)"
  echo "  description: short description for manifest (defaults to generic)"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_DIR="$ROOT/plugins/$NAME"
TEMPLATE_DIR="$ROOT/template"

if [ -d "$PLUGIN_DIR" ]; then
  echo "Error: plugins/$NAME already exists."
  exit 1
fi

echo "Creating plugin: $NAME"

cp -R "$TEMPLATE_DIR" "$PLUGIN_DIR"
find "$PLUGIN_DIR" -type f -print0 | LC_ALL=C xargs -0 sed -i '' \
  -e "s/{{PLUGIN_NAME}}/$NAME/g" \
  -e "s/{{PLUGIN_TITLE}}/$TITLE/g" \
  -e "s/{{PLUGIN_DESC}}/$DESC/g"

echo "Done. Load in Edge: edge://extensions → 'Load unpacked' → select plugins/$NAME"
