import os
import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine, text


@pytest.mark.skipif(
    not os.getenv("RUN_INTEGRATION_TESTS"),
    reason="Set RUN_INTEGRATION_TESTS=1 to run integration tests.",
)
def test_petition_run_flow_postgres():
    """
    Integration test for petition run status transitions.
    Requires DATABASE_URL to point at Postgres (Supabase-compatible).
    """
    database_url = os.getenv("DATABASE_URL")
    assert database_url, "DATABASE_URL must be set"

    engine = create_engine(database_url)
    run_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    application_id = str(uuid.uuid4())
    criteria_id = "awards"

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            conn.execute(text("""
                INSERT INTO petition_runs (id, user_id, application_id, criteria_id, status, created_at)
                VALUES (:id, :user_id, :application_id, :criteria_id, :status, :created_at)
            """), {
                "id": run_id,
                "user_id": user_id,
                "application_id": application_id,
                "criteria_id": criteria_id,
                "status": "generating",
                "created_at": datetime.now(timezone.utc),
            })

            conn.execute(text("""
                UPDATE petition_runs
                SET status = :status
                WHERE id = :id
            """), {"id": run_id, "status": "ready"})

            result = conn.execute(text("""
                SELECT status FROM petition_runs WHERE id = :id
            """), {"id": run_id}).fetchone()

            assert result is not None
            assert result[0] == "ready"
        finally:
            trans.rollback()
