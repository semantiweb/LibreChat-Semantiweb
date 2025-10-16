#!/bin/sh
set -e

echo "[INFO] Starting LibreChat initialization..."

# Check required environment variables
if [ -z "$LIBRECHAT_CONFIG_SSM_PARAMETER" ]; then
  echo "[ERROR] LIBRECHAT_CONFIG_SSM_PARAMETER not set"
  exit 1
fi

if [ -z "$AWS_REGION" ]; then
  echo "[ERROR] AWS_REGION not set"
  exit 1
fi

# Download LibreChat configuration from SSM Parameter Store
echo "[INFO] Downloading LibreChat configuration from SSM: $LIBRECHAT_CONFIG_SSM_PARAMETER"

aws ssm get-parameter \
  --name "$LIBRECHAT_CONFIG_SSM_PARAMETER" \
  --region "$AWS_REGION" \
  --query 'Parameter.Value' \
  --output text > /app/librechat.yaml

if [ ! -f /app/librechat.yaml ]; then
  echo "[ERROR] Failed to download librechat.yaml from SSM"
  exit 1
fi

echo "[INFO] LibreChat configuration downloaded successfully"
echo "[INFO] Configuration file size: $(wc -c < /app/librechat.yaml) bytes"

# Validate YAML syntax (basic check)
if ! grep -q "version:" /app/librechat.yaml; then
  echo "[ERROR] Invalid librechat.yaml - missing version field"
  exit 1
fi

echo "[INFO] Configuration validated"

# Start LibreChat application
echo "[INFO] Starting LibreChat application..."
exec npm run backend
