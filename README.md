# sprinthr-performance

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-fkkrse72)

## Backend (Laravel + Docker + MySQL)

This workspace now includes a Laravel backend in [backend](backend) and a Docker stack in [docker-compose.yml](docker-compose.yml).

### Services

- Frontend nginx container built from the local Vite app
- Laravel PHP-FPM app container built from `backend/`
- MySQL 8.4 database service on host port 3311
- Nginx reverse proxy on http://localhost:8089

### Routing behavior

- http://localhost:8089/ -> Frontend app built into the frontend image
- http://localhost:8089/api/* -> Laravel backend
- http://localhost:8089/up -> Laravel health route

### Start backend stack

```bash
docker compose up -d --build
```

The backend container creates the test database and runs migrations on startup, so the app is usable from a fresh clone without a manual `php artisan migrate`.

### Useful commands

```bash
docker compose exec backend php artisan migrate
docker compose exec backend php artisan test
docker compose down
```

### Database defaults

- Host: `db` (inside Docker network) / `127.0.0.1` (from host)
- Port: `3306` (inside Docker) / `3311` (from host)
- Database: `gleent_affiliate`
- Username: `gleent_affiliate`
- Password: `gleent_affiliate`
