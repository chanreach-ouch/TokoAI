from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/tokoai"
    REDIS_URL: str = "redis://localhost:6379/0"
    GEMINI_API_KEY: str = "mock_gemini_api_key"
    TIKTOK_APP_SECRET: str = "dev_secret_key_123"
    TIKTOK_ACCESS_TOKEN: str = "mock_tiktok_access_token"
    BAKONG_MERCHANT_ID: str = "tokoai@dev"
    BAKONG_ACCOUNT_NAME: str = "TOKOAI STORE"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
