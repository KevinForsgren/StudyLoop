#!/usr/bin/env python3
"""
Application configuration settings.
"""

import sys
from pydantic import Field
from pydantic_settings import BaseSettings

# Add src directory to Python path for module imports
sys.path.insert(0, '/home/kevin/Desktop/Github/StudyLoop/src')
class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server settings
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./studyloop.db", env="DATABASE_URL")
    
    # Security
    SECRET_KEY: str = Field(default="your-secret-key-here-change-this-in-production", env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # CORS
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000", env="ALLOWED_ORIGINS")
    
    # AI Integration (for future phases)
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", env="OLLAMA_BASE_URL")
    OLLAMA_MODEL: str = Field(default="llama2", env="OLLAMA_MODEL")
    
    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
def get_settings() -> Settings:
    """Get application settings instance."""
    return Settings()