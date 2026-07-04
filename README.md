# sprinthr-performance

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-fkkrse72)

## Backend (Laravel + Docker + MySQL)

This workspace now includes a Laravel backend in [backend](backend) and a Docker stack in [docker-compose.yml](docker-compose.yml).

### Services

- Frontend Vite dev server container (serves ./src)
- Laravel PHP-FPM app container
- Nginx reverse proxy on http://localhost:8080
- MySQL 8.4 on host port 3307

### Routing behavior

- http://localhost:8080/ -> Frontend app from ./src (Vite)
- http://localhost:8080/api/* -> Laravel backend
- http://localhost:8080/up -> Laravel health route

### Start backend stack

```bash
docker compose up -d --build
```

The backend container creates the local SQLite file and runs migrations on startup, so the app is usable from a fresh clone without a manual `php artisan migrate`.

### Useful commands

```bash
docker compose exec app php artisan migrate
docker compose exec app php artisan test
docker compose down
```

### Database defaults

- Host: `db` (inside Docker network) / `127.0.0.1` (from host)
- Port: `3306` (inside Docker) / `3307` (from host)
- Database: `sprinthr`
- Username: `sprinthr`
- Password: `sprinthr`
