from sqlalchemy import Column, Integer, String, Boolean
from api.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, unique=False, index=False, nullable=False)
    last_name = Column(String, unique=False, index=False, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)
