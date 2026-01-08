#!/usr/bin/env bash
# Initialize a new C4 workspace using the c4 CLI
# Usage: ./init-c4.sh [workspace-name]

set -euo pipefail

NAME="${1:-c4-model}"

exec c4 init "$NAME"
