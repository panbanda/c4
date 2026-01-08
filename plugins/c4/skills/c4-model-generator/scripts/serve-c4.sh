#!/usr/bin/env bash
# Serve C4 model visualization using the c4 CLI
# Usage: ./serve-c4.sh [c4-model-directory]

set -euo pipefail

C4_DIR="${1:-.}"

exec c4 serve -C "$C4_DIR"
