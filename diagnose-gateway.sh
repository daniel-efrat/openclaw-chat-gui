#!/bin/bash

echo "========================================="
echo "OpenClaw Gateway Diagnostic Script"
echo "========================================="
echo ""

echo "1. Checking if gateway service is running..."
systemctl --user status openclaw-gateway --no-pager | head -15
echo ""

echo "2. Checking if port 18789 is listening..."
sudo netstat -tlnp 2>/dev/null | grep 18789 || ss -tlnp 2>/dev/null | grep 18789 || echo "Port 18789 is NOT listening"
echo ""

echo "3. Checking gateway configuration..."
grep -A 5 '"gateway"' ~/.openclaw/openclaw.json
echo ""

echo "4. Testing local connection to gateway..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:18789/v1/models 2>&1 || echo "Cannot connect to localhost:18789"
echo ""

echo "5. Testing external connection to gateway..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://3.86.116.96:18789/v1/models 2>&1 || echo "Cannot connect to 3.86.116.96:18789"
echo ""

echo "6. Checking recent gateway logs..."
journalctl --user -u openclaw-gateway -n 20 --no-pager 2>/dev/null || echo "Cannot read logs"
echo ""

echo "7. Checking gateway process..."
ps aux | grep openclaw-gateway | grep -v grep
echo ""

echo "========================================="
echo "Diagnostic complete"
echo "========================================="
