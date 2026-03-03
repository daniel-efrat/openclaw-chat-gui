# Deploying to Coolify

This guide explains how to deploy the Claw Chat GUI to Coolify.

## Prerequisites

- A Coolify instance (self-hosted or cloud)
- Access to your OpenClaw gateway
- Your OpenClaw gateway token

## Deployment Methods

### Method 1: Deploy from Git Repository (Recommended)

1. **Create a New Resource in Coolify**
   - Log in to your Coolify dashboard
   - Click "Add Resource" or "New Application"
   - Select "Public Repository" or "Private Repository" (if you have SSH keys configured)

2. **Configure the Repository**
   - **Git Repository URL**: `https://github.com/daniel-clawd/claw-chat-gui.git`
   - **Branch**: `main` (or your preferred branch)
   - **Build Pack**: Docker
   - **Dockerfile Location**: `Dockerfile` (in root)

3. **Set Environment Variables**
   
   Navigate to the Environment Variables section and add:
   
   | Variable | Value | Required |
   |----------|-------|----------|
   | `OPENCLAW_GATEWAY_URL` | Your gateway URL (e.g., `http://gateway.example.com:18789`) | Yes |
   | `OPENCLAW_GATEWAY_TOKEN` | Your gateway bearer token | Yes |
   | `OPENCLAW_AGENT_ID` | Agent ID (default: `main`) | No |
   | `OPENCLAW_MODEL` | Model name (default: `openclaw:main`) | No |
   | `OPENCLAW_USER` | User identifier (default: `chat-gui`) | No |
   | `PORT` | Port number (default: `4000`) | No |

4. **Configure Port Mapping**
   - **Application Port**: `4000` (or whatever you set in PORT env var)
   - **Public Port**: Choose your desired port or let Coolify assign one
   - Enable **HTTPS** if you want SSL termination (recommended)

5. **Deploy**
   - Click "Deploy" or "Save & Deploy"
   - Wait for the build to complete (first build may take 3-5 minutes)
   - Once deployed, access your application at the provided URL

### Method 2: Deploy with Docker Compose

If your Coolify instance supports Docker Compose:

1. **Create a New Resource**
   - Select "Docker Compose" as the deployment type

2. **Use the provided docker-compose.yml**
   - Upload or paste the `docker-compose.yml` from this repository

3. **Set Environment Variables** (same as Method 1)

4. **Deploy**

## Post-Deployment

### Accessing Your Application

After deployment, Coolify will provide you with a URL like:
- `http://your-app.coolify.example.com` (with HTTP)
- `https://your-app.coolify.example.com` (with HTTPS enabled)

### Health Check

The application includes a health check endpoint at `/health`. You can verify deployment:

```bash
curl https://your-app.coolify.example.com/health
```

Expected response:
```json
{
  "status": "ok",
  "gatewayUrl": "http://your-gateway-url:18789",
  "defaultAgent": "main",
  "model": "openclaw:main"
}
```

### Chat History Persistence

The application stores chat history in `/app/chat-history.json` inside the container. For persistence across deployments:

1. In Coolify, go to your application settings
2. Navigate to "Storage" or "Volumes"
3. Add a persistent volume:
   - **Source**: Create a new volume (e.g., `chat-gui-data`)
   - **Destination**: `/app/chat-history.json`

## Troubleshooting

### Build Fails

**Issue**: Build fails during npm install
- **Solution**: Check Coolify build logs. Usually caused by network issues. Retry the deployment.

**Issue**: Frontend build fails
- **Solution**: Ensure sufficient memory is allocated (at least 512MB for Node.js builds)

### Application Doesn't Start

**Issue**: Container starts but crashes immediately
- **Solution**: Check runtime logs in Coolify. Common causes:
  - Missing `OPENCLAW_GATEWAY_TOKEN` environment variable
  - Invalid gateway URL

### Can't Connect to Gateway

**Issue**: Application works but can't reach OpenClaw gateway
- **Solution**: 
  - Verify `OPENCLAW_GATEWAY_URL` is accessible from the container
  - If gateway is on localhost, you need to use the host network or proper DNS
  - Check if gateway requires specific network configuration

### Port Already in Use

**Issue**: Coolify shows port conflict
- **Solution**: 
  - Change the public port in Coolify settings
  - Or change `PORT` environment variable to a different value

## Updating Your Deployment

Coolify can automatically redeploy on git push:

1. Go to your application settings in Coolify
2. Enable "Automatic Deployment" or "Webhook"
3. Configure GitHub webhook (if using GitHub) with the provided URL
4. Every push to your configured branch will trigger a rebuild

## Manual Redeploy

To manually redeploy:
1. Go to your application in Coolify
2. Click "Redeploy" or "Restart"
3. Choose "Force Rebuild" if you want to rebuild from scratch

## Environment-Specific Notes

### Gateway on Same Server

If your OpenClaw gateway runs on the same server as Coolify:
- Use `http://host.docker.internal:18789` (on Docker Desktop)
- Or use the server's actual IP/hostname instead of `localhost`

### Gateway Behind VPN

If your gateway is only accessible via VPN:
- Ensure Coolify server has VPN access
- Or deploy gateway and chat-gui on the same private network

### Using Custom Domain

1. In Coolify, go to application settings
2. Add your custom domain under "Domains"
3. Configure DNS A/CNAME record pointing to Coolify server
4. Enable "Automatic SSL" for free Let's Encrypt certificate

## Security Recommendations

1. **Always use HTTPS** in production (enable in Coolify)
2. **Keep gateway token secret** - never commit it to git
3. **Restrict gateway access** - use firewall rules if possible
4. **Regular updates** - keep dependencies updated
5. **Monitor logs** - check Coolify logs for suspicious activity

## Support

If you encounter issues:
1. Check Coolify application logs
2. Check the health endpoint: `/health`
3. Verify all environment variables are set correctly
4. Ensure gateway is accessible from the deployment environment

---

## Quick Reference

**Dockerfile**: `Dockerfile` (in project root)  
**Port**: 4000  
**Health Check**: `GET /health`  
**API Endpoints**: `/api/*`  
**Static Files**: Served from `/dist` by Express

**Minimum Resources**:
- CPU: 0.5 cores
- RAM: 512 MB
- Disk: 1 GB

**Recommended Resources**:
- CPU: 1 core
- RAM: 1 GB
- Disk: 2 GB
