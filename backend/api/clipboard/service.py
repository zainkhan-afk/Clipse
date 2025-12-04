from sqlalchemy.orm import Session
from api.clipboard import models, auth
from datetime import datetime

# ----------------------------
# CREATE CLIPBOARD
# ----------------------------

def create_clipboard(db: Session, user_id: int, name: str):
    clipboard = models.Clipboard(
        user_id=user_id,
        name=name,
        created_at=datetime.utcnow()
    )
    db.add(clipboard)
    db.commit()
    db.refresh(clipboard)
    return clipboard

# ----------------------------
# ADD DEVICE TO USER ACCOUNT
# ----------------------------

def add_device(db: Session, user_id: int, device_name: str):
    device = models.Device(
    user_id=user_id,
    name=device_name,
    added_at=datetime.utcnow()
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device

# ----------------------------
# GET ALL CLIPBOARD DATA
# ----------------------------

def get_clipboard_data(db: Session, user_id: int):
    return db.query(models.ClipboardData).join(models.Clipboard).filter(
    models.Clipboard.user_id == user_id
    ).all()

# ----------------------------
# ADD DATA TO CLIPBOARD
# ----------------------------

def add_clipboard_data(db: Session, clipboard_id: int, content: str):
    data = models.ClipboardData(
    clipboard_id=clipboard_id,
    content=content,
    created_at=datetime.utcnow()
    )
    db.add(data)
    db.commit()
    db.refresh(data)
    return data
