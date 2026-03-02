# Backend

## Tests

Run unit tests:
```bash
pytest -q
```

Run integration tests (requires real services and credentials):
```bash
RUN_INTEGRATION_TESTS=1 pytest -q
```

Requirements:
- `pytest` installed in your environment
- `DATABASE_URL` set to a Postgres instance (Supabase-compatible)
