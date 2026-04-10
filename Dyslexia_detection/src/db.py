import os
import psycopg2


def get_connection():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "dyslexia_db"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "yourpassword"),
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=os.getenv("POSTGRES_PORT", "5432"),
    )
