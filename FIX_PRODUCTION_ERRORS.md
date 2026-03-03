# Fix for Production Errors in Coolify

## Problem Summary

Your Coolify deployment is showing:

- ❌ **502 Bad Gateway** error on `/api/chat`
- ❌ **WebSocket connection failed** to `ws://localhost:8081/`
- ⚠️ Grammarly extension errors (can be ignored - browser extension issue)

## Root Cause

The main issue is that `OPENCLAW_GATEWAY_URL` is set to `http://127.0.0.1:18789` in your environment variables. When running inside a Docker container (which Coolify uses), `127.0.0.1` refers to the container itself, NOT your host machine or the EC2 instance where your gateway is running.

## The Fix

### Step 1: Update Environment Variables in Coolify

1. Log into your Coolify dashboard
2. Navigate to your chat-gui application
3. Go to **Environment Variables** or **Settings** → **Environment**
4. Update/add these variables:

```
OPENCLAW_GATEWAY_URL=http://3.86.116.96:18789
OPENCLAW_GATEWAY_TOKEN=75ea6dfc861382674d19b2f1ed202ab02311d4ea04e81936
OPENCLAW_AGENT_ID=main
OPENCLAW_MODEL=openclaw:main
OPENCLAW_USER=chat-gui
PORT=4000
```

**The critical change:** `OPENCLAW_GATEWAY_URL` must use the **public IP** of your EC2 instance (`3.86.116.96`), not `localhost` or `127.0.0.1`.

### Step 2: Verify AWS Security Group

Your OpenClaw gateway runs on EC2 at `3.86.116.96:18789`. You need to ensure the security group allows incoming traffic on port 18789 from your Coolify server.

1. Go to AWS EC2 Console
2. Find your instance (`ip-172-31-84-20`)
3. Check the Security Group
4. Ensure there's an inbound rule:
   - **Type:** Custom TCP
   - **Port:** 18789
   - **Source:** Either:
     - Your Coolify server's IP address (most secure)
     - Or `0.0.0.0/0` (allows from anywhere - less secure but easier for testing)

### Step 3: Test Gateway Connectivity (Optional but Recommended)

Before redeploying, verify your Coolify server can reach the gateway:

```bash
# From your Coolify server, run:
curl http://3.86.116.96:18789/v1/models
```

Expected: Should return a response (might be 401 without auth, which is fine)

If it times out or fails to connect:

- Check AWS Security Group (Step 2)
- Verify the gateway is running on your EC2 instance
- Check if there's a firewall on the EC2 instance blocking port 18789

### Step 4: Redeploy in Coolify

1. After updating environment variables, click **Redeploy** or **Restart**
2. Wait for the deployment to complete
3. Check the logs for any errors

### Step 5: Verify the Fix

1. **Check the health endpoint:**

   ```bash
   curl https://bgkwog8gg8k4o4w448so4wsg.168.231.111.202.sslip.io/health
   ```

   Expected response:

   ```json
   {
     "status": "ok",
     "gatewayUrl": "http://3.86.116.96:18789",
     "defaultAgent": "main",
     "model": "openclaw:main"
   }
   ```

2. **Test the chat interface:**
   - Open your app in a browser
   - Try sending a message
   - Should work without 502 errors

## What About the WebSocket Error?

The WebSocket error (`ws://localhost:8081/`) is Vite's Hot Module Replacement (HMR) trying to connect. This is a development feature that shouldn't affect production. It appears in the console but doesn't break functionality. The real issue was the 502 error from the gateway connection.

## Troubleshooting

### Still getting 502 errors?

1. **Check Coolify logs:**
   - Look for `[chat-gui] Gateway error:` messages
   - This will show the actual error from the gateway connection

2. **Verify environment variables were saved:**
   - In Coolify, check that `OPENCLAW_GATEWAY_URL` shows `http://3.86.116.96:18789`
   - Not `http://127.0.0.1:18789`

3. **Test from inside the container:**
   ```bash
   # Exec into the running container in Coolify
   curl http://3.86.116.96:18789/v1/models
   ```

### Gateway returns 401 Unauthorized?

- Check that `OPENCLAW_GATEWAY_TOKEN` is set correctly
- Verify the token hasn't expired
- Check gateway logs on the EC2 instance

### Connection timeout?

- AWS Security Group is likely blocking port 18789
- Or the gateway service isn't running on the EC2 instance

## Security Note

🔒 **Important:** The gateway token in this document should be kept secret. Consider:

- Rotating the token periodically
- Restricting the AWS Security Group to only allow your Coolify server's IP
- Using HTTPS if possible (requires SSL certificate on gateway)

## Files Updated

- [`COOLIFY_DEPLOYMENT.md`](COOLIFY_DEPLOYMENT.md) - Updated with correct configuration
- [`COOLIFY_ENV_VARS.md`](COOLIFY_ENV_VARS.md) - Quick reference for environment variables
- [`verify-gateway-access.sh`](verify-gateway-access.sh) - Script to test gateway connectivity

## Summary

The fix is simple: **Change `OPENCLAW_GATEWAY_URL` from `http://127.0.0.1:18789` to `http://3.86.116.96:18789` in Coolify's environment variables, then redeploy.**
