# 🚨 QUICK FIX - Production 502 Error

## The Problem

Your app can't connect to the OpenClaw gateway because it's using `localhost` which doesn't work in Docker.

## The Solution (3 Steps)

### 1️⃣ Go to Coolify

Open your Coolify dashboard → Your chat-gui app → Environment Variables

### 2️⃣ Change This Variable

Find: `OPENCLAW_GATEWAY_URL`

**OLD (WRONG):**

```
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
```

**NEW (CORRECT):**

```
OPENCLAW_GATEWAY_URL=http://3.86.116.96:18789
```

### 3️⃣ Redeploy

Click "Redeploy" or "Restart" in Coolify

---

## That's It!

After redeploying, your app should work. The 502 error will be gone.

## Verify It Worked

Visit: `https://your-app-url/health`

Should show:

```json
{
  "status": "ok",
  "gatewayUrl": "http://3.86.116.96:18789",
  ...
}
```

---

## Why This Fixes It

- `127.0.0.1` = the container itself (wrong)
- `3.86.116.96` = your EC2 instance where the gateway runs (correct)

Docker containers can't use `localhost` to reach services on the host machine. You must use the actual IP address.

---

## Still Not Working?

Check [`FIX_PRODUCTION_ERRORS.md`](FIX_PRODUCTION_ERRORS.md) for detailed troubleshooting.



