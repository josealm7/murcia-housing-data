import os

import psycopg
from dotenv import load_dotenv

load_dotenv()


def main():
    connection = psycopg.connect(
        host=os.getenv("DB_HOST"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )

    print("Conexión a PostgreSQL correcta.")

    connection.close()


if __name__ == "__main__":
    main()
