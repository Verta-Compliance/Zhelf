#!/usr/bin/env bash
set -euo pipefail
curl -i -X POST "http://localhost:3000/api/listings" \
  -H "Content-Type: application/json" \
  --data @"$(dirname "$0")/sample-data.json"
