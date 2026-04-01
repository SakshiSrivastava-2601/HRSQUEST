import logging
import logging.handlers
import os

LOG_DIR = "logs"
LOG_FILE_NAME = "hrsquest.log"
LOG_PATH = os.path.join(LOG_DIR, LOG_FILE_NAME)

def setup_logger(log_name: str = "app_logger"):
    """
    Configures and returns a logger with daily file rotation.

    The active log file is named hrsquest.log.
    Older logs are archived with a date suffix (e.g., hrsquest.log.2025-12-08).
    """
    
    # 1. Create the logs directory if it doesn't exist
    if not os.path.exists(LOG_DIR):
        os.makedirs(LOG_DIR)
        print(f"Created logging directory: {LOG_DIR}")

    # 2. Get the root logger instance
    logger = logging.getLogger(log_name)
    logger.setLevel(logging.INFO) # Set the minimum logging level

    # Prevent handlers from being added multiple times if setup_logger is called repeatedly
    if not logger.handlers:
        
        # 3. Create a TimedRotatingFileHandler for daily rotation
        # when="midnight" ensures rotation happens at the start of the day.
        # backupCount=7 keeps the logs for the last 7 days.
        file_handler = logging.handlers.TimedRotatingFileHandler(
            filename=LOG_PATH,
            when="midnight",
            interval=1,
            backupCount=7, 
            encoding='utf-8',
            delay=False  # Start rotation checks immediately
        )
        
        # 4. Define the log message format
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(formatter)
        
        # 5. Add the handler to the logger
        logger.addHandler(file_handler)
        
        # Optional: Add a console handler for immediate feedback during development
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger

# Create a globally accessible logger instance for use across your application
app_logger = setup_logger()