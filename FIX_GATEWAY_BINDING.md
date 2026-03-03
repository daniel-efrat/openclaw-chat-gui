# Fix: Gateway Listening on Localhost Only

## The Problem Found! 🎯

Your OpenClaw gateway is running, but it's listening on `127.0.0.1:18789` (localhost only):

```
tcp        0      0 127.0.0.1:18789         0.0.0.0:*               LISTEN      123751/openclaw-gat
```

This means it **only accepts connections from the same EC2 instance**, not from external servers like your Coolify deployment.

## The Fix

You need to configure the gateway to listen on `0.0.0.0:18789` (all network interfaces) instead of `127.0.0.1:18789`.

### Step 1: Find the Gateway Configuration

The OpenClaw gateway configuration is likely in one of these locations:

```bash
# Common locations - check these on your EC2 instance:
ls -la ~/.openclaw/
ls -la /etc/openclaw/
ls -la ~/openclaw/
cat ~/.openclaw/config.yaml
cat /etc/openclaw/config.yaml
```

Or check how the gateway is started:

```bash
# Find the process
ps aux | grep openclaw-gat

# Check systemd service if it's running as a service
systemctl status openclaw-gateway
journalctl -u openclaw-gateway -n 50
```

### Step 2: Update the Configuration

Look for a configuration setting like:

**Current (WRONG):**

```yaml
host: 127.0.0.1
port: 18789
```

or

```yaml
bind: 127.0.0.1:18789
```

or

```yaml
listen: 127.0.0.1:18789
```

**Change to (CORRECT):**

```yaml
host: 0.0.0.0
port: 18789
```

or

```yaml
bind: 0.0.0.0:18789
```

or

```yaml
listen: 0.0.0.0:18789
```

### Step 3: Restart the Gateway

After updating the configuration:

```bash
# If running as a systemd service:
sudo systemctl restart openclaw-gateway

# Or if running manually, find and kill the process:
sudo kill 123751  # (the PID from netstat output)

# Then start it again with the new configuration
```

### Step 4: Verify the Fix

After restarting, check that it's now listening on `0.0.0.0`:

```bash
sudo netstat -tlnp | grep 18789
```

**Expected output (CORRECT):**

```
tcp        0      0 0.0.0.0:18789           0.0.0.0:*               LISTEN      <PID>/openclaw-gat
```

Notice `0.0.0.0:18789` instead of `127.0.0.1:18789`

### Step 5: Test from Coolify

Once the gateway is listening on `0.0.0.0`, your Coolify app should work immediately (no need to redeploy).

## Alternative: Use SSH Tunnel (Temporary Workaround)

If you can't change the gateway configuration right now, you can use an SSH tunnel as a temporary workaround:

```bash
# On your Coolify server, run:
ssh -L 18789:127.0.0.1:18789 ubuntu@3.86.116.96 -N -f
```

Then change `OPENCLAW_GATEWAY_URL` in Coolify to `http://localhost:18789`

⚠️ This is NOT recommended for production - fix the gateway binding instead.

## Common OpenClaw Gateway Configurations

### If using environment variables:

```bash
# Check current environment
ps aux | grep openclaw-gat
# or
systemctl show openclaw-gateway | grep Environment
```

Look for variables like:

- `OPENCLAW_HOST=127.0.0.1` → Change to `OPENCLAW_HOST=0.0.0.0`
- `OPENCLAW_BIND=127.0.0.1:18789` → Change to `OPENCLAW_BIND=0.0.0.0:18789`

### If using command-line flags:

The gateway might be started with a flag like:

```bash
openclaw-gateway --host 127.0.0.1 --port 18789
```

Change to:

```bash
openclaw-gateway --host 0.0.0.0 --port 18789
```

## Security Note

Once the gateway is listening on `0.0.0.0:18789`, it will be accessible from the internet (since you opened port 18789 in the AWS Security Group).

**Make sure:**

1. The gateway requires authentication (bearer token) - ✅ You have this
2. Consider restricting the AWS Security Group to only your Coolify server's IP
3. Consider using HTTPS/TLS if the gateway supports it

## Summary

**The issue:** Gateway is bound to `127.0.0.1` (localhost only)  
**The fix:** Reconfigure gateway to bind to `0.0.0.0` (all interfaces)  
**How:** Update gateway config file or startup command, then restart the gateway

