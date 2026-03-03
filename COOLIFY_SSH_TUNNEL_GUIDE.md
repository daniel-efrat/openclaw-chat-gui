# Coolify → EC2 Gateway via SSH Tunnel (Recommended)

This keeps the OpenClaw gateway bound to `127.0.0.1` on the EC2 instance and exposes it safely to your Coolify app via an SSH tunnel.

## Overview

- EC2 gateway remains **loopback-only** (secure)
- Coolify server creates an SSH tunnel to EC2
- Coolify app connects to **localhost** on the Coolify server

## Steps

### 1) Create a dedicated SSH key on the Coolify server

On your **Coolify server**:

```bash
ssh-keygen -t ed25519 -f /root/.ssh/openclaw_gateway -N ""
```

### 2) Add the public key to your EC2 instance

On your **Coolify server**:

```bash
cat /root/.ssh/openclaw_gateway.pub
```

Copy that output and add it to **EC2** user `ubuntu`:

```bash
# On your EC2 instance
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# paste the key on a new line, save
chmod 600 ~/.ssh/authorized_keys
```

### 3) Create a systemd service on the Coolify server to keep the tunnel alive

On your **Coolify server**, create:

```bash
nano /etc/systemd/system/openclaw-tunnel.service
```

Paste this (update EC2 IP if it changes):

```ini
[Unit]
Description=OpenClaw Gateway SSH Tunnel
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/bin/ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -i /root/.ssh/openclaw_gateway \
  -N -L 18789:127.0.0.1:18789 ubuntu@3.86.116.96
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
systemctl daemon-reload
systemctl enable --now openclaw-tunnel
systemctl status openclaw-tunnel --no-pager
```

### 4) Update Coolify app environment

Set:

```
OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
```

Then **restart** your Coolify app.

## Verify

On the **Coolify server**:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:18789/v1/models
```

Expected: `HTTP 401` or `HTTP 200` (both mean reachable).

## Notes

- This avoids opening port 18789 to the public internet.
- If your Coolify server runs in Docker, ensure the container can reach the host’s localhost (default in Coolify). If not, set `OPENCLAW_GATEWAY_URL` to the host IP instead of `127.0.0.1`.

OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789
