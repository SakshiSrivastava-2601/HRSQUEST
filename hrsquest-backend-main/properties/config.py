import os
import sys
from properties.log import app_logger
from configparser import ConfigParser
import asyncio

# Optional direct fallbacks for local development.
# If you prefer, you can paste Razorpay credentials here and restart the backend.
MANUAL_RAZORPAY_KEY_ID = "rzp_test_SWLuMXRniwZFSB"
MANUAL_RAZORPAY_KEY_SECRET = "Fo61POkEttKwJQ6HKukIRjhZ"
MANUAL_RAZORPAY_WEBHOOK_SECRET = "my_webhook_secret"

def configurations():
    config = ConfigParser()
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.ini")
    is_file_exists = os.path.isfile(config_path)
    
    # If the config file is missing
    if not is_file_exists:
        app_logger.error(f'Configuration file is missing.')
        sys.exit(0)

    # Read the configuration file
    config_files = config.read(config_path)
    
    # If the file cannot be read or is invalid
    if not config_files:
        print(f"Failed to read configuration file")
        sys.exit(0)

    return config

config = configurations()


def _read_config_or_env(
    section: str,
    option: str,
    env_key: str,
    default: str = "",
    manual_value: str = "",
) -> str:
    env_value = os.getenv(env_key, "").strip()
    if env_value:
        return env_value

    if str(manual_value).strip():
        os.environ[env_key] = str(manual_value).strip()
        return str(manual_value).strip()

    if config.has_section(section):
        value = config.get(section, option, fallback="").strip()
        if value:
            os.environ[env_key] = value
            return value

    return default


# Module-level values so other modules can reliably import them from properties.config
RAZORPAY_KEY_ID = _read_config_or_env(
    "razorpay",
    "key_id",
    "RAZORPAY_KEY_ID",
    manual_value=MANUAL_RAZORPAY_KEY_ID,
)
RAZORPAY_KEY_SECRET = _read_config_or_env(
    "razorpay",
    "key_secret",
    "RAZORPAY_KEY_SECRET",
    manual_value=MANUAL_RAZORPAY_KEY_SECRET,
)
RAZORPAY_WEBHOOK_SECRET = _read_config_or_env(
    "razorpay",
    "webhook_secret",
    "RAZORPAY_WEBHOOK_SECRET",
    manual_value=MANUAL_RAZORPAY_WEBHOOK_SECRET,
)

# Optional: promote selected config.ini values to environment variables.
# This keeps local/dev setup simple while still allowing env vars to override config.ini.
try:
    if RAZORPAY_KEY_ID:
        os.environ["RAZORPAY_KEY_ID"] = RAZORPAY_KEY_ID
    if RAZORPAY_KEY_SECRET:
        os.environ["RAZORPAY_KEY_SECRET"] = RAZORPAY_KEY_SECRET
    if RAZORPAY_WEBHOOK_SECRET:
        os.environ["RAZORPAY_WEBHOOK_SECRET"] = RAZORPAY_WEBHOOK_SECRET

    if config.has_section("auth"):
        if not os.getenv("HRSQUEST_JWT_SECRET"):
            secret = config.get("auth", "jwt_secret", fallback="").strip()
            if secret:
                os.environ["HRSQUEST_JWT_SECRET"] = secret
        if not os.getenv("HRSQUEST_ACCESS_TOKEN_EXPIRE_MINUTES"):
            mins = config.get("auth", "access_token_expire_minutes", fallback="").strip()
            if mins:
                os.environ["HRSQUEST_ACCESS_TOKEN_EXPIRE_MINUTES"] = mins
        if not os.getenv("HRSQUEST_REFRESH_TOKEN_EXPIRE_DAYS"):
            days = config.get("auth", "refresh_token_expire_days", fallback="").strip()
            if days:
                os.environ["HRSQUEST_REFRESH_TOKEN_EXPIRE_DAYS"] = days
except Exception:
    # Never fail app startup due to optional config parsing.
    pass

async def run_async_tasks(*tasks) -> list:
    """
    Runs the async functions or methods concurrently using asynio.gather method and returns results in list
    where each element will be output of function/method in respective order of functions/methods passed

    :Example:
    >>> async def test1():
            return "test1_out"
        async def test2():
            return "test2_out","test2_out"
        async def test3():
            return "test3_out","test3_out","test3_out"
        out1,out2,out3 = await run_async_tasks(test1(),test2(),test3())
    >>> ["test1_out",("test2_out","test2_out"),("test3_out","test3_out","test3_out")]
    """
    return await asyncio.gather(*tasks)
