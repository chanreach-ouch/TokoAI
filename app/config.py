from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    GEMINI_API_KEY: str
    TIKTOK_APP_SECRET: str
    TIKTOK_ACCESS_TOKEN: str
    BAKONG_MERCHANT_ID: str
    BAKONG_ACCOUNT_NAME: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
