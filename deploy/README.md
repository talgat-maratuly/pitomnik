# Deploy

| Variable | Example |
|----------|---------|
| `FRONTEND_URL` | `https://pitomnik.gpartners.kz` |
| `API_PUBLIC_URL` | `https://pitomnik.gpartners.kz` |

## PostgreSQL

Production: **PostgreSQL 18** (`postgres:18-alpine`).

Data volume mount: `/var/lib/postgresql` (PG 18+ requirement; do not use legacy `/var/lib/postgresql/data`).

### Upgrade 16 → 18 (existing server)

Major version upgrade is not automatic. Before redeploy:

```bash
# on server, dump from running PG 16 container
docker exec pitomnik-postgres pg_dumpall -U postgres > pitomnik-backup.sql

# stop stack, remove old postgres container/volume if needed, deploy new compose
docker compose down
# optional: docker volume rm pitomnik_postgres_data  # only if you have a backup!

docker compose up -d
docker exec -i pitomnik-postgres psql -U postgres < pitomnik-backup.sql
```

## nginx / SSL

```bash
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d pitomnik.gpartners.kz
```
