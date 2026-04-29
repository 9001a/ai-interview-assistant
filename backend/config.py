from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用配置"""
    # JWT 配置
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24小时
    
    # OpenAI 配置
    openai_api_key: Optional[str] = None
    
    # 数据库配置（Phase 2）
    database_url: Optional[str] = None
    
    # 邮件配置（可选）
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    
    class Config:
        env_file = ".env"


settings = Settings()
