import argparse
from pathlib import Path
from properties.log import app_logger
from properties.helper_psql import db_handler 

parser = argparse.ArgumentParser(description="Run FastAPI app")
parser.add_argument(
    "--port",
    type=int,
    default=8000,
    help="Port to run the server on (default: 8000)",
)
parser.add_argument(
    "--host",
    type=str,
    default="0.0.0.0",
    help="Host to bind the server (default: 0.0.0.0)",
)
parser.add_argument(
    "--reload",
    action="store_true",
    help="Enable auto-reload",
)

args = parser.parse_args()

# --- Application Startup/Shutdown Events (Lifecycle) ---

async def startup_db():
    """1. Establishes the SSH Tunnel and Connection Pool."""
    try:
        await db_handler.initialize()

        project_root = Path(__file__).resolve().parent.parent

        # 2. Read and execute the base SQL file
        sql_file_path = project_root / "properties" / "psql_tables.sql"
        if sql_file_path.exists():
            startup_sql = sql_file_path.read_text()
            await db_handler.execute_command(startup_sql)
            app_logger.info("✅ Startup SQL executed successfully.")
        else:
            app_logger.info("⚠️ startup.sql not found. Skipping database setup.")

        # 3. Apply idempotent migration files
        migrations_dir = project_root / "properties" / "migrations"
        if migrations_dir.exists():
            for migration_file in sorted(migrations_dir.glob("*.sql")):
                await db_handler.execute_command(migration_file.read_text())
                app_logger.info(f"✅ Applied migration: {migration_file.name}")

    except Exception as e:
        # If connection fails, log error and re-raise to stop the application
        app_logger.info(f"FATAL ERROR during startup: {e}")
        raise

async def shutdown_db():
    """Closes the SSH Tunnel and Connection Pool."""
    await db_handler.close()
