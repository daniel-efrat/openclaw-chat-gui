# Diagnosing the 502 Error

## Current Status ✅

Your Coolify deployment is **correctly configured**:

- ✅ `OPENCLAW_GATEWAY_URL` is set to `http://3.86.116.96:18789`
- ✅ Environment variables are loaded correctly
- ✅ The application is running

**Proof:** The `/health` endpoint returns:

```json
{
  "status": "ok",
  "gatewayUrl": "http://3.86.116.96:18789",
  "defaultAgent": "main",
  "model": "openclaw:main"
}
```

## The Problem 🔴

The 502 error means your **Coolify server cannot connect to your EC2 gateway** at `3.86.116.96:18789`.

This is a **network connectivity issue**, not a configuration issue.

## Root Cause

Your EC2 instance's **AWS Security Group** is likely blocking incoming connections on port 18789 from your Coolify server.

## The Fix

### Step 1: Find Your Coolify Server's IP Address

You need to know what IP address your Coolify server is using. This is the IP that needs to be allowed in the AWS Security Group.

**Option A:** Check in Coolify logs or settings for the server IP

**Option B:** From your Coolify server, run:

```bash
curl ifconfig.me
```

Let's call this IP: `COOLIFY_IP`

### Step 2: Update AWS Security Group

1. **Go to AWS EC2 Console:** https://console.aws.amazon.com/ec2/
2. **Find your instance:** `ip-172-31-84-20` (the one at `3.86.116.96`)
3. **Click on the instance** → Go to the **Security** tab
4. **Click on the Security Group** (it will be a link like `sg-xxxxx`)
5. **Edit Inbound Rules** → Click "Edit inbound rules"
6. **Add a new rule:**
   - **Type:** Custom TCP
   - **Port range:** 18789
   - **Source:** Custom → Enter your Coolify server's IP (e.g., `COOLIFY_IP/32`)
   - **Description:** "Allow Coolify to access OpenClaw gateway"
7. **Save rules**

### Step 3: Test Connectivity

After updating the security group, test from your Coolify server:

```bash
# This should work now
curl http://3.86.116.96:18789/v1/models
```

Expected: Should get a response (might be 401 without auth, which is fine)

### Step 4: Redeploy (if needed)

If the app still shows 502 after fixing the security group:

1. Go to Coolify
2. Click "Restart" (not full redeploy needed)
3. Test the chat interface

## Alternative: Allow All IPs (Less Secure)

If you're not sure of the Coolify server IP or want to test quickly:

**In AWS Security Group, add:**

- **Type:** Custom TCP
- **Port range:** 18789
- **Source:** Anywhere-IPv4 → `0.0.0.0/0`
- **Description:** "Temporary - allow all IPs to access gateway"

⚠️ **Warning:** This allows anyone on the internet to access your gateway on port 18789. Only use for testing, then restrict to specific IPs.

## How to Check if Security Group is the Issue

### From your EC2 instance (where gateway runs):

```bash
# Check if the gateway is listening
sudo netstat -tlnp | grep 18789
# or
sudo ss -tlnp | grep 18789
```

Expected: Should show the gateway process listening on port 18789

### From your Coolify server:

```bash
# Test if port is reachable
timeout 5 bash -c "cat < /dev/null > /dev/tcp/3.86.116.96/18789" && echo "Port is open" || echo "Port is blocked"
```

If it says "Port is blocked" → Security Group issue

## Still Not Working?

### Check Gateway Logs on EC2

SSH into your EC2 instance and check the gateway logs:

```bash
# Find the gateway process
ps aux | grep openclaw

# Check logs (location depends on how you're running it)
# Common locations:
journalctl -u openclaw-gateway -f
# or
tail -f /var/log/openclaw-gateway.log
# or wherever your logs are
```

### Check Coolify Application Logs

In Coolify, check the application logs for errors like:

```
[chat-gui] Gateway error: fetch failed
[chat-gui] Gateway error: connect ETIMEDOUT
```

This confirms it's a network connectivity issue.

## Summary

The configuration is correct. The issue is that your Coolify server cannot reach your EC2 gateway because:

1. **AWS Security Group** is blocking port 18789
2. Or the gateway isn't running on the EC2 instance
3. Or there's a firewall on the EC2 instance blocking the port

**Most likely:** AWS Security Group needs to allow inbound traffic on port 18789 from your Coolify server's IP.
