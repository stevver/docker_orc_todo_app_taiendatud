# Todo App (Compose + Redis)

Mitme konteineriga TODO rakendus: **Nginx → Frontend (React) → API (Node.js) → Postgres + Redis (cache)**

## Käivitamine
**Prod (soovitatav):**
```bash
./deploy.sh prod
# Ava hostis: http://localhost:8080
```

**Dev:**
```bash
./deploy.sh dev
```

**Peata/staatus/logid:**
```bash
./deploy.sh stop
./deploy.sh status
./deploy.sh logs
```

## Kiirkontroll (VM)
```bash
docker compose ps
curl http://localhost/health
curl http://localhost/api/todos
```

## Cache test (Redis)
Terminal A (logid):
```bash
docker compose logs -f --tail=0 api
```
Terminal B (päringud):
```bash
curl http://localhost/api/todos   # 1. kord -> MISS
curl http://localhost/api/todos   # 2. kord -> HIT
```

## Esitamiseks (3 screenshoti)
1) API logid: **Cache MISS** ja **Cache HIT**
2) `docker compose ps` – kõik **healthy**
3) Brauseris UI + terminalis kaks `curl` (HIT kiirem)
4) Pildid on eraldi kaustas nimega "Screenshots"
