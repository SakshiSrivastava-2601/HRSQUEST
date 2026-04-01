from fastapi import HTTPException, status
import asyncpg
from typing import Optional, List, Dict, Any, Union
from fastapi import HTTPException
import asyncio
from properties.config import config
from properties.log import app_logger

# --- Configuration (Replace with your actual public access values) ---

PSQL_HOST = config["psql"]["psql_host"]
PSQL_USERNAME = config["psql"]["psql_username"]
PSQL_PASSWORD = config["psql"]["psql_password"]
PSQL_DBNAME = config["psql"]["psql_dbname"]
PSQL_PORT = config["psql"]["psql_port"]


# --- Database Handler Class (Direct Connection) ---


class AsyncDBHandler:
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self._is_initializing = False

    # --- Connection Status Checks ---

    async def is_pool_healthy(self) -> bool:
        """Checks the connection pool by running a simple query."""
        if not self.pool or self.pool.get_size() == 0:
            return False
        try:
            # Run a quick test query on the pool
            await self.pool.fetchval("SELECT 1;")
            return True
        except Exception:
            app_logger.warning("Pool health check failed.")
            return False

    async def initialize(self):
        """Initializes the asyncpg connection pool."""
        if self._is_initializing:
            await asyncio.sleep(0.5)
            return

        self._is_initializing = True
        app_logger.info("Starting database connection pool initialization...")

        try:
            # 1. Close any old resources
            if self.pool:
                await self.close()

            # 2. Create asyncpg Connection Pool, pointing directly to the server
            self.pool = await asyncpg.create_pool(
                user=PSQL_USERNAME,
                password=PSQL_PASSWORD,
                database=PSQL_DBNAME,
                host=PSQL_HOST,
                port=PSQL_PORT,
                min_size=1,
                max_size=10,
            )
            app_logger.info(
                "✅ asyncpg Connection Pool created successfully (Direct Access)."
            )

            # Test the connection pool
            await self.pool.fetchval("SELECT 1;")
            app_logger.info("✅ Connection pool test query successful.")

        except Exception as e:
            app_logger.error(
                f"❌ ERROR: Failed to create/test asyncpg pool: {e}", exc_info=True
            )
            await self.close()
            raise ConnectionError("Failed to connect to PostgreSQL directly.") from e
        finally:
            self._is_initializing = False

    async def close(self):
        """Closes the connection pool."""
        if self.pool:
            app_logger.info("Closing asyncpg pool...")
            await self.pool.close()
            self.pool = None

    async def _ensure_connection(self):
        """Checks pool health and attempts to re-initialize if connections are down."""
        if await self.is_pool_healthy():
            return

        app_logger.warning(
            "⚠️ Connection pool is unhealthy or lost. Attempting to re-initialize..."
        )
        try:
            await self.initialize()
            app_logger.info("✅ Re-initialization successful.")
        except Exception as e:
            app_logger.error(f"❌ Re-initialization failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=503,
                detail="Database connection is unavailable and could not be restored.",
            )

    # --- Utility Methods (The core logic is unchanged, only the checks were modified) ---

    async def fetch_one_row(self, query: str, *args) -> Optional[Dict[str, Any]]:
        """
        Executes a SELECT query and returns the first result as a dictionary, or None.
        """
        await self._ensure_connection()

        try:
            record = await self.pool.fetchrow(query, *args)
            return dict(record) if record else None

        except Exception as e:
            app_logger.error(f"Database error during single row fetch: {e}")
            await self.initialize()  # Attempt recovery
            # Retry the operation once after recovery
            record = await self.pool.fetchrow(query, *args)
            return dict(record) if record else None

    async def fetch_all_rows(self, query: str, *args) -> List[Dict[str, Any]]:
        """Executes a SELECT query with automatic retry/re-initialization."""
        await self._ensure_connection()
        try:
            records = await self.pool.fetch(query, *args)
            return [dict(record) for record in records]
        except (asyncpg.exceptions.PostgresError, ConnectionRefusedError) as e:
            app_logger.warning(
                f"Query execution failed after health check, retrying. Error: {e}"
            )
            await self.initialize()  # Rebuild pool if connection dropped mid-query
            records = await self.pool.fetch(query, *args)
            return [dict(record) for record in records]

    async def execute_command(self, query: str, *args) -> Union[str, None]:
        """Executes a command (INSERT, UPDATE, DELETE, etc.) with automatic retry/re-initialization."""
        await self._ensure_connection()
        try:
            return await self.pool.execute(query, *args)
        except (asyncpg.exceptions.PostgresError, ConnectionRefusedError) as e:
            app_logger.warning(
                f"Command execution failed after health check, retrying. Error: {e}"
            )
            await self.initialize()
            return await self.pool.execute(query, *args)

    async def insert_and_get_id(
        self, table_name: str, data: Dict[str, Any], id_column: str = None
    ) -> int:
        """
        Executes a generic INSERT query using a dictionary of column: value pairs
        and returns the generated primary key (ID) of the new record.

        Args:
            table_name: The name of the table (e.g., 'students').
            data: A dictionary where keys are database column names and values are the insertion data.
            id_column: The name of the primary key column to return (defaults to table_name_id if None).

        Returns:
            The integer ID of the newly inserted record.

        Raises:
            ValueError: If a unique constraint is violated.
        """
        await self._ensure_connection()

        # 1. Prepare Column Names and Placeholders
        columns = list(data.keys())
        # Creates placeholders like $1, $2, $3...
        placeholders = [f"${i+1}" for i in range(len(columns))]
        values = list(data.values())

        # 2. Determine the ID column to return
        # Default assumption: student_id for 'students', teacher_id for 'teachers', etc.
        id_column_name = id_column if id_column else f"{table_name}_id"

        # 3. Construct the dynamic SQL query
        query = f"""
        INSERT INTO {table_name} 
            ({', '.join(columns)}) 
        VALUES 
            ({', '.join(placeholders)})
        RETURNING {id_column_name};
        """

        try:
            # 4. Execute the query using the dynamically generated values
            record_id = await self.pool.fetchval(query, *values)
            app_logger.info(
                f"New record inserted into {table_name} with ID: {record_id}"
            )
            return record_id

        except asyncpg.exceptions.UniqueViolationError as e:
            app_logger.error(
                f"Insertion failed in table {table_name}: Unique constraint violation. Error: {e}"
            )
            raise ValueError(f"A unique value already exists in table {table_name}.")

        except Exception as e:
            app_logger.error(
                f"Database error during generic insertion into {table_name}: {e}"
            )
            # Attempt recovery and retry
            await self.initialize()

            # Retry the operation once after recovery
            record_id = await self.pool.fetchval(query, *values)
            app_logger.info(f"Retry successful. New record ID: {record_id}")
            return record_id

    # File: db_handler.py (Addition to AsyncDBHandler class)

    async def bulk_insert_command(
        self, table_name: str, records: List[Dict[str, Any]]
    ) -> Union[str, None]:
        """
        Executes a bulk INSERT command using asyncpg's executemany for high efficiency.

        Args:
            table_name: The name of the table to insert into.
            records: A list of dictionaries, where each dictionary represents a row
                     (key=column name, value=data).

        Returns:
            The status string of the execution (e.g., 'INSERT 0 100').

        Raises:
            HTTPException: If the database connection fails or input is invalid.
        """
        if not records:
            app_logger.info("No Records found for bulk insert")
            return True

        await self._ensure_connection()

        # 1. Standardize Inputs: All records must have the same columns
        columns = list(records[0].keys())
        # Prepare a list of value tuples for executemany
        values_list = [[record.get(col) for col in columns] for record in records]

        # 2. Construct the dynamic SQL query
        # Creates placeholders like $1, $2, $3... based on the number of columns
        placeholders = [f"${i+1}" for i in range(len(columns))]

        query = f"""
            INSERT INTO {table_name} 
                ({', '.join(columns)}) 
            VALUES 
                ({', '.join(placeholders)});
        """

        try:
            # 3. Execute the bulk command efficiently
            # We use self.pool.acquire() and execute conn.executemany for transactional efficiency
            async with self.pool.acquire() as conn:
                status_result = await conn.executemany(query, values_list)
                app_logger.info(
                    f"Bulk insert successful into {table_name}. Status: {status_result}"
                )
                return True

        except asyncpg.exceptions.PostgresError as e:
            app_logger.error(
                f"Database error during bulk insertion into {table_name}: {e}",
                exc_info=True,
            )
            # Re-raise the exception to be handled by the calling API route
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error during bulk insert: {e.diag.message_primary}",
            )
        except Exception as e:
            app_logger.error(
                f"Unexpected error during bulk insertion into {table_name}: {e}",
                exc_info=True,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred during bulk operation.",
            )

    async def fetch_exists(self, query: str) -> bool:
        """
        Returns True if query returns at least one row
        """
        conn = await self.pool.acquire()
        try:
            result = await conn.fetchrow(query)
            return bool(result)
        finally:
            await self.pool.release(conn)

    async def update_record(
        self,
        table_name: str,
        data: dict,
        condition_col: str,
        condition_val,
    ):
        if not data:
            raise ValueError("No fields provided to update")

        # Build SET clause using $1, $2, $3 ...
        set_parts = []
        values = []

        for idx, (key, value) in enumerate(data.items(), start=1):
            set_parts.append(f"{key} = ${idx}")
            values.append(value)

        # Condition placeholder (next index)
        condition_placeholder = f"${len(values) + 1}"
        values.append(condition_val)

        set_clause = ", ".join(set_parts)

        query = f"""
            UPDATE {table_name}
            SET {set_clause}
            WHERE {condition_col} = {condition_placeholder}
        """

        await self.pool.execute(query, *values)

        return condition_val
    
    async def fetch_all(self, query: str, *args):
        """
        Returns list of rows
        """
        rows = await self.pool.fetch(query, *args)

        # Convert Record objects to dict
        return [dict(row) for row in rows]
    
    async def fetch_one(self, query: str, *args):
        """
        Returns single row
        """
        row = await self.pool.fetchrow(query, *args)

        if row:
            return dict(row)

        return None
    
    async def fetch_exists(self, query: str, *args):
        """
        Returns True/False
        """
        row = await self.pool.fetchrow(query, *args)
        return row is not None


# Create a global instance of the handler
db_handler = AsyncDBHandler()


async def get_db_handler() -> AsyncDBHandler:
    """Dependency that ensures the database handler is initialized."""
    if db_handler.pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service unavailable. Check logs.",
        )
    return db_handler
