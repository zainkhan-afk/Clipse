from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from api.core.database import Base
from datetime import datetime
import enum

class ContentType(enum.Enum):
    text = "text"
    image = "image"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)

    clipboards = relationship("Clipboard", back_populates="user")
    devices = relationship("Device", back_populates="user")


class Clipboard(Base):
    __tablename__ = "clipboards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    persistance = Column(Integer, nullable=True)

    user = relationship("User", back_populates="clipboards")
    data = relationship("ClipboardData", back_populates="clipboard")


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    added_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="devices")


class ClipboardData(Base):
    __tablename__ = "clipboard_data"

    id = Column(Integer, primary_key=True, index=True)
    clipboard_id = Column(Integer, ForeignKey("clipboards.id"), nullable=False)
    content_type = Column(Enum(ContentType, name="content_type_enum"), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    clipboard = relationship("Clipboard", back_populates="data")
