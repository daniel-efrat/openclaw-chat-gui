#!/bin/bash

# Verification script to test OpenClaw gateway connectivity
# Run this from your Coolify server to verify it can reach the gateway

GATEWAY_IP="3.86.116.96"
GATEWAY_PORT="18789"
GATEWAY_TOKEN="75ea6dfc861382674d19b2f1ed202ab02311d4ea04e81936"

echo "========================================="
echo "OpenClaw Gateway Connectivity Test"
echo "========================================="
echo ""

# Test 1: Basic connectivity
echo "Test 1: Checking if gateway port is reachable..."
if timeout 5 bash -c "cat < /dev/null > /dev/tcp/${GATEWAY_IP}/${GATEWAY_PORT}" 2>/dev/null; then
    echo "✅ Port ${GATEWAY_PORT} is OPEN and reachable"
else
    echo "❌ Port ${GATEWAY_PORT} is NOT reachable"
    echo "   This means either:"
    echo "   - The gateway is not running"
    echo "   - AWS Security Group is blocking the connection"
    echo "   - Network firewall is blocking the connection"
    exit 1
fi

echo ""

# Test 2: HTTP connectivity
echo "Test 2: Testing HTTP connection to gateway..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${GATEWAY_IP}:${GATEWAY_PORT}/v1/models" 2>/dev/null)

if [ "$HTTP_CODE" = "000" ]; then
    echo "❌ Cannot connect to gateway HTTP endpoint"
    echo "   The port is open but HTTP is not responding"
    exit 1
elif [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Gateway is responding (401 Unauthorized - expected without token)"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Gateway is responding (200 OK)"
else
    echo "⚠️  Gateway responded with HTTP code: ${HTTP_CODE}"
fi

echo ""

# Test 3: Authenticated request
echo "Test 3: Testing authenticated request..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -H "Authorization: Bearer ${GATEWAY_TOKEN}" \
    -H "Content-Type: application/json" \
    "http://${GATEWAY_IP}:${GATEWAY_PORT}/v1/models" 2>/dev/null)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Authentication successful!"
    echo "   Gateway is fully accessible with the provided token"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Authentication failed (401 Unauthorized)"
    echo "   The token may be incorrect or expired"
    exit 1
else
    echo "⚠️  Unexpected response code: ${HTTP_CODE}"
    echo "   Response: ${BODY}"
fi

echo ""
echo "========================================="
echo "Summary: Gateway is accessible!"
echo "========================================="
echo ""
echo "You can now use this in Coolify:"
echo "OPENCLAW_GATEWAY_URL=http://${GATEWAY_IP}:${GATEWAY_PORT}"
echo ""
