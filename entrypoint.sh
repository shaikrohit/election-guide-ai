#!/bin/sh
# entrypoint.sh — Injects environment variables into config.js at container startup
# This ensures API keys are never stored in source code.

CONFIG_FILE="/usr/share/nginx/html/config/config.js"

# Replace placeholders with actual environment variable values
sed -i "s|__GEMINI_API_KEY__|${GEMINI_API_KEY:-}|g" "$CONFIG_FILE"
sed -i "s|__MAPS_API_KEY__|${MAPS_API_KEY:-}|g" "$CONFIG_FILE"
sed -i "s|__CIVIC_API_KEY__|${CIVIC_API_KEY:-}|g" "$CONFIG_FILE"
sed -i "s|__TRANSLATE_API_KEY__|${TRANSLATE_API_KEY:-}|g" "$CONFIG_FILE"
sed -i "s|__TTS_API_KEY__|${TTS_API_KEY:-}|g" "$CONFIG_FILE"
sed -i "s|__NL_API_KEY__|${NL_API_KEY:-}|g" "$CONFIG_FILE"
sed -i "s|__FIREBASE_API_KEY__|${FIREBASE_API_KEY:-}|g" "$CONFIG_FILE"
sed -i "s|__FIREBASE_AUTH_DOMAIN__|${FIREBASE_AUTH_DOMAIN:-}|g" "$CONFIG_FILE"
sed -i "s|__FIREBASE_PROJECT_ID__|${FIREBASE_PROJECT_ID:-}|g" "$CONFIG_FILE"
sed -i "s|__FIREBASE_STORAGE_BUCKET__|${FIREBASE_STORAGE_BUCKET:-}|g" "$CONFIG_FILE"
sed -i "s|__FIREBASE_MESSAGING_SENDER_ID__|${FIREBASE_MESSAGING_SENDER_ID:-}|g" "$CONFIG_FILE"
sed -i "s|__FIREBASE_APP_ID__|${FIREBASE_APP_ID:-}|g" "$CONFIG_FILE"
sed -i "s|__FIREBASE_MEASUREMENT_ID__|${FIREBASE_MEASUREMENT_ID:-}|g" "$CONFIG_FILE"

# Start nginx
exec nginx -g "daemon off;"
