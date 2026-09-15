from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
import os

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

Base = declarative_base()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    USER = os.getenv("DB_USER") or os.getenv("SUPABASE_DB_USER") or os.getenv("user")
    PASSWORD = os.getenv("DB_PASSWORD") or os.getenv("SUPABASE_DB_PASSWORD") or os.getenv("password")
    HOST = os.getenv("DB_HOST") or os.getenv("SUPABASE_DB_HOST") or os.getenv("host")
    PORT = os.getenv("DB_PORT") or os.getenv("SUPABASE_DB_PORT") or os.getenv("port", "6543")
    DBNAME = os.getenv("DB_NAME") or os.getenv("SUPABASE_DB_NAME") or os.getenv("dbname", "postgres")

    missing = [
        name for name, value in {
            "user/DB_USER": USER,
            "password/DB_PASSWORD": PASSWORD,
            "host/DB_HOST": HOST,
        }.items() if not value
    ]
    if missing:
        raise RuntimeError(
            "Configura DATABASE_URL en Render con la URI de Supabase "
            "(o define DB_USER, DB_PASSWORD y DB_HOST): " + ", ".join(missing)
        )

    DATABASE_URL = (
        f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}"
        "?sslmode=require"
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 10},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()