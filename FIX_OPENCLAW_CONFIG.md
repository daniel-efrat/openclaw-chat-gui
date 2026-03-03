# Fix OpenClaw Gateway Configuration

## The Problem Found!

In `~/.openclaw/openclaw.json`, the gateway is configured with:

```json
"gateway": {
  "port": 18789,
  "mode": "local",
  "bind": "loopback",    ← THIS IS THE PROBLEM
  ...
}
```

`"bind": "loopback"` makes the gateway listen only on `127.0.0.1` (localhost), which blocks external connections.

## The Fix

### Step 1: Edit the Configuration File

On your EC2 instance, run:

```bash
nano ~/.openclaw/openclaw.json
```

### Step 2: Find and Change the bind Setting

Look for the `"gateway"` section and change:

**FROM:**

```json
"gateway": {
  "port": 18789,
  "mode": "local",
  "bind": "loopback",
  "auth": {
    ...
  }
}
```

**TO:**

```json
"gateway": {
  "port": 18789,
  "mode": "local",
  "bind": "all",
  "auth": {
    ...
  }
}
```

Just change `"loopback"` to `"all"` on that one line.

### Step 3: Save the File

- Press `Ctrl+O` to save
- Press `Enter` to confirm
- Press `Ctrl+X` to exit

### Step 4: Restart the Gateway

Kill the current process and it should restart automatically:

```bash
kill 123751
```

Or if it doesn't restart automatically, check how it's supposed to be started:

```bash
# Check if there's a startup script
ps -fp 776  # (the parent process)

# Or check for nohup/screen/tmux sessions
screen -ls
tmux ls
```

### Step 5: Verify It's Working

After restarting, check that it's now listening on `0.0.0.0`:

```bash
sudo netstat -tlnp | grep 18789
```

**Expected output:**

```
tcp        0      0 0.0.0.0:18789           0.0.0.0:*               LISTEN      <PID>/openclaw-gat
```

Notice `0.0.0.0:18789` instead of `127.0.0.1:18789`

### Step 6: Test from Outside

From your local machine or Coolify server:

```bash
curl http://3.86.116.96:18789/v1/models
```

Should get a response (might be 401 without auth, which is fine).

## Alternative: Use sed to Change It

If you prefer a one-liner:

```bash
# Backup first
cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup

# Change loopback to all
sed -i 's/"bind": "loopback"/"bind": "all"/' ~/.openclaw/openclaw.json

# Verify the change
grep -A 3 '"gateway"' ~/.openclaw/openclaw.json

# Restart gateway
kill 123751
```

## After the Fix

Once the gateway is listening on `0.0.0.0:18789`, your Coolify chat app should work immediately - no need to redeploy or change anything in Coolify.

## Possible bind Values

According to OpenClaw documentation, the `bind` setting can be:

- `"loopback"` - Listen on 127.0.0.1 only (localhost)
- `"all"` - Listen on 0.0.0.0 (all interfaces)
- `"tailscale"` - Listen on Tailscale interface only

For your use case with Coolify on a different server, you need `"all"`.
