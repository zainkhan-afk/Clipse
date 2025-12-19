from sqlalchemy.orm import Session
from api.clipboard import models, auth
from datetime import datetime

from api.clipboard.schemas import ClipboardsResponse, ClipboardData \
                                , CurrentClipboardData, ClipboardAddMessageRequest

import uuid
import shutil
import os

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


def get_clipboards(db: Session, user_id: int):
    all_clipboards = db.query(models.Clipboard).filter(
        models.Clipboard.user_id == user_id
    ).all()

    return [ClipboardsResponse(**clipboard.to_dict()) for clipboard in all_clipboards]

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

def get_all_current_clipboard_data(db: Session, user_id: int, clipboard_id: int):
    current_clipboard = db.query(models.Clipboard).filter(
            models.Clipboard.user_id == user_id,
            models.Clipboard.id == clipboard_id,
        ).first()
    
    current_clipboard = ClipboardsResponse(**current_clipboard.to_dict())
    
    current_clipboard_data = db.query(models.ClipboardData).join(models.Clipboard).filter(
            models.Clipboard.user_id == user_id,
            models.Clipboard.id == clipboard_id,
        ).order_by(models.ClipboardData.created_at.desc()).all()
    
    current_clipboard_data = [ClipboardData(**cp_data.to_dict()) for cp_data in current_clipboard_data]

    return CurrentClipboardData(clipboard = current_clipboard, clipboard_data=current_clipboard_data)

def get_clipboard_data(db: Session, user_id: int, clipboard_id: int):
    all_clipboard_data = db.query(models.ClipboardData).join(models.Clipboard).filter(
            models.Clipboard.user_id == user_id,
            models.Clipboard.id == clipboard_id,
        ).all()
    
    # all_clipboard_data = db.query(models.Clipboard).filter(
    #         models.Clipboard.user_id == user_id,
    #         models.Clipboard.id == clipboard_id,
    #     ).all()
    
    return all_clipboard_data

# ----------------------------
# ADD DATA TO CLIPBOARD
# ----------------------------

def add_clipboard_data_text(db: Session, clipboard_id: int, message: ClipboardAddMessageRequest):
    data = models.ClipboardData(
        clipboard_id=clipboard_id,
        content=message.content,
        content_type = message.content_type,
        created_at=datetime.utcnow()
    )
    db.add(data)
    db.commit()
    db.refresh(data)
    return data


def add_clipboard_data_image(db: Session, clipboard_id: int, image: "UploadFile"):
    filename = f"{uuid.uuid4()}_{image.filename}"
    path = f"uploads/{filename}"

    with open(path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    msg = models.ClipboardData(
        clipboard_id=clipboard_id,
        content=path,
        content_type="image",
        created_at=datetime.utcnow()
    )

    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def delete_message(db: Session, clipboard_id: int, message_id: int):
    message = db.query(models.ClipboardData).join(models.Clipboard).filter(
            models.ClipboardData.id == message_id,
            models.ClipboardData.clipboard_id == clipboard_id,
        ).first()
    
    print("message", message.content, message.content_type)
    
    if message:
        image_path = None
        if message.content_type == "image":
            image_path = message.content
        db.delete(message)
        db.commit()
        if image_path:
            os.remove(image_path)
            print("Removing ", image_path)
        return {"detail": "Message deleted successfully"}