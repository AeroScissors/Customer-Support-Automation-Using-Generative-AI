from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # -----------------------------
    # Security
    # -----------------------------
    JWT_SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Single settings instance
settings = Settings()
