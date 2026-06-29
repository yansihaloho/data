---
name: GitHub Push Config
description: Repo URL dan nama env var token untuk push ke GitHub saat user meminta
---

Ketika user minta push ke GitHub, gunakan:

- **Remote URL**: `https://github.com/yansihaloho/data`
- **Token env var**: `GITHUB_PERSONAL_ACCESS_TOKEN` (sudah tersedia di environment)

**How to apply:**
```bash
git remote set-url origin https://${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/yansihaloho/data.git
git push origin main
```

**Why:** User meminta agar config ini disimpan untuk digunakan di sesi mendatang saat mereka minta push.
