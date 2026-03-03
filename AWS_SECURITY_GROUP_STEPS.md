# Step-by-Step: Add Port 18789 to AWS Security Group

## You're Already Here! ✅

You're on the right page showing the Security Group for your EC2 instance.

## Follow These Steps:

### 1. Click on the Security Group Link

Click on the blue link: **`sg-0d8ed35c90e99da59 (launch-wizard-1)`**

This will open the Security Group details page.

### 2. Click "Edit inbound rules"

On the Security Group page, you'll see a button that says **"Edit inbound rules"** - click it.

### 3. Click "Add rule"

A button will appear that says **"Add rule"** - click it to add a new row.

### 4. Fill in the New Rule

In the new row that appears, fill in these fields:

| Field           | Value              | How to Set                                          |
| --------------- | ------------------ | --------------------------------------------------- |
| **Type**        | Custom TCP         | Select from dropdown                                |
| **Port range**  | `18789`            | Type this number                                    |
| **Source**      | Anywhere-IPv4      | Select from dropdown, then it will show `0.0.0.0/0` |
| **Description** | `OpenClaw Gateway` | Type this (optional but helpful)                    |

### 5. Save Rules

Click the **"Save rules"** button at the bottom right.

## Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│ Inbound rules                                    [Edit ▼]   │
├─────────────────────────────────────────────────────────────┤
│ Type          │ Port range │ Source      │ Description      │
├─────────────────────────────────────────────────────────────┤
│ SSH           │ 22         │ 0.0.0.0/0   │ (existing)       │
│ Custom TCP    │ 18789      │ 0.0.0.0/0   │ OpenClaw Gateway │ ← NEW
└─────────────────────────────────────────────────────────────┘
                                            [Save rules]
```

## After Saving

1. The rule will be active immediately (no restart needed)
2. Go back to your chat app and try sending a message
3. The 502 error should be gone!

## Security Note

⚠️ Using `0.0.0.0/0` (Anywhere) means anyone on the internet can access port 18789 on your EC2 instance.

**For better security (optional, do later):**

1. Find your Coolify server's IP address
2. Come back to this security group
3. Edit the rule and change Source from `0.0.0.0/0` to `YOUR_COOLIFY_IP/32`

But for now, let's just get it working with `0.0.0.0/0`.

## Quick Reference

- **Security Group:** `sg-0d8ed35c90e99da59`
- **Instance:** `i-0d84db65c13a7e2f5`
- **Port to open:** `18789`
- **Protocol:** TCP
- **Source:** `0.0.0.0/0` (Anywhere-IPv4)
