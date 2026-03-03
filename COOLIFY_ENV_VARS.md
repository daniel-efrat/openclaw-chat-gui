# Coolify Environment Variables Configuration

## Required Environment Variables

Set these in your Coolify application settings:

```
OPENCLAW_GATEWAY_URL=http://3.86.116.96:18789
OPENCLAW_GATEWAY_TOKEN=75ea6dfc861382674d19b2f1ed202ab02311d4ea04e81936
OPENCLAW_AGENT_ID=main
OPENCLAW_MODEL=openclaw:main
OPENCLAW_USER=chat-gui
PORT=4000
```

## How to Set in Coolify

1. Go to your application in Coolify dashboard
2. Navigate to "Environment Variables" or "Settings" → "Environment"
3. Add each variable above (one per line or using the UI)
4. Click "Save" or "Update"
5. Redeploy your application

## Important Notes

⚠️ **DO NOT use `localhost` or `127.0.0.1` for `OPENCLAW_GATEWAY_URL`**

When running in Docker/Coolify, `localhost` refers to the container itself, not your host machine. Always use:

- The actual public IP address (like `3.86.116.96`)
- Or a hostname/domain name if available

## Verify Configuration

After deployment, check the health endpoint:

```bash
curl https://your-app.coolify.domain/health
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

If you see `"status": "missing-token"`, the `OPENCLAW_GATEWAY_TOKEN` is not set correctly.

## Security Considerations

🔒 **Never commit these values to git!**

The `.env` file is already in `.gitignore`, but make sure you:

- Only set these values in Coolify's environment variable settings
- Keep your gateway token secret
- Ensure your EC2 security group allows traffic from Coolify to port 18789
