from sqlalchemy.orm import Session
from api.clipboard import models, auth
from datetime import datetime

from api.clipboard.schemas import ClipboardsResponse, ClipboardData \
                                , CurrentClipboardData, ClipboardAddMessageRequest

from api.clipboard.models import ContentType

import uuid
import shutil
import os

# ----------------------------
# CREATE CLIPBOARD
# ----------------------------

def create_clipboard(db: Session, user_id: int, name: str):
    existing_db = db.query(models.Clipboard).filter(models.Clipboard.name == name, models.Clipboard.user_id == user_id).one_or_none()
    if existing_db:
        return None
    
    
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


def get_clipboard_for_user(db: Session, user_id: int, clipboard_id: int):
    """Return the clipboard if it exists and belongs to the user, else None."""
    return db.query(models.Clipboard).filter(
        models.Clipboard.id == clipboard_id,
        models.Clipboard.user_id == user_id,
    ).first()


# ----------------------------
# DELETE CLIPBOARD DATA
# ----------------------------

def delete_all_messages(db: Session, clipboard_id: int):
    messages = db.query(models.ClipboardData).filter(
        models.ClipboardData.clipboard_id == clipboard_id,
    ).all()

    # Collect image files so they can be removed from disk after the rows are gone.
    image_paths = [
        message.content
        for message in messages
        if message.content_type == ContentType.image and message.content
    ]

    deleted_count = db.query(models.ClipboardData).filter(
        models.ClipboardData.clipboard_id == clipboard_id,
    ).delete(synchronize_session=False)
    db.commit()

    for path in image_paths:
        if os.path.exists(path):
            os.remove(path)

    return {"detail": "All messages deleted successfully", "deleted": deleted_count}

def delete_entire_clipboard(db: Session, clipboard_id: int):
    clipboard = db.query(models.Clipboard).filter(
        models.Clipboard.id == clipboard_id,
    ).first()

    if not clipboard:
        return None

    # Remove the clipboard's items (and their image files) first so the
    # foreign key from clipboard_data isn't left dangling.
    delete_all_messages(db, clipboard_id)

    db.delete(clipboard)
    db.commit()

    return {"detail": "Clipboard deleted successfully"}

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
    
    
    if message:
        image_path = None
        if message.content_type == ContentType.image:
            image_path = message.content
        db.delete(message)
        db.commit()
        if image_path:
            os.remove(image_path)
        return {"detail": "Message deleted successfully"}