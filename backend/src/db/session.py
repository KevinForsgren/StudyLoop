#!/usr/bin/env python3
"""
Database session management.
"""

import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Add src directory to Python path for module imports
sys.path.insert(0, '/home/kevin/Desktop/Github/StudyLoop/backend/src')

from config.settings import get_settings
from db.models import Base
class Database:
    """Database connection and management."""
    
    def __init__(self):
        settings = get_settings()
        self.engine = create_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
        # Create tables if they don't exist
        Base.metadata.create_all(bind=self.engine)
    
    def get_session(self) -> Session:
        """Get a new database session."""
        return self.SessionLocal()
    
    def get_session_context(self) -> Generator[Session, None, None]:
        """Get a database session with context manager."""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    def close(self):
        """Close database connection."""
        self.engine.dispose()
# Global database instance
db = Database()