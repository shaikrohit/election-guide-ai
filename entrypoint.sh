#!/bin/sh
# entrypoint.sh — Injects environment variables into config.js at container startup
# This ensures API keys are never stored in source code.

CONFIG_FILE="/usr/share/nginx/html/config/config.js"

# Replace placeholders with actual environment variable values
sed -i "s|__GEMINI_API_KEY__|${GEMINI_API_KEY:-}|g" "$CONFIG_FILE"
sed -i "s|__MAPS_API_KEY__|${MAPS_API_KEY:-}|g" "$CONFIG_FILE"

# Start nginx
exec nginx -g "daemon off;"
