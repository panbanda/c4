#!/usr/bin/env bash
# Validate C4 model using the c4 CLI
# Usage: ./validate-c4.sh [c4-model-directory]

set -euo pipefail

C4_DIR="${1:-.}"

exec c4 validate -C "$C4_DIR"
