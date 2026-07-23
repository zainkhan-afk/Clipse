from sqlalchemy.orm import Session
from sqlalchemy import or_
from api.clipboard import models, auth
from datetime import datetime, timedelta

from api.clipboard.schemas import ClipboardsResponse, ClipboardData \
                                , CurrentClipboardData, ClipboardAddMessageRequest

from api.clipboard.models import ContentType

import uuid
from vercel import blob


def _delete_blob(ref: str):
    """Best-effort removal of an image blob by pathname (or URL). Never lets a
    storage/network error break the DB operation."""
    if not ref:
        return
    try:
        blob.delete(ref)
    except Exception:
        pass


def _expiry_from(created_at: datetime, persistance):
    """expires_at for an item, given a clipboard's persistance (seconds).
    None/0 persistance means the item never expires."""
    if persistance and persistance > 0:
        return created_at + timedelta(seconds=persistance)
    return None

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


def update_clipboard(db: Session, clipboard_id: int, data):
    """Apply a partial settings update (name / persistance / color).

    Returns the updated clipboard, or None if the new name collides with
    another of the user's clipboards.
    """
    clipboard = db.query(models.Clipboard).filter(
        models.Clipboard.id == clipboard_id,
    ).first()
    if not clipboard:
        return None

    # Only touch fields the client actually sent.
    fields = data.model_dump(exclude_unset=True)

    new_name = fields.get("name")
    if new_name is not None and new_name != clipboard.name:
        clash = db.query(models.Clipboard).filter(
            models.Clipboard.user_id == clipboard.user_id,
            models.Clipboard.name == new_name,
            models.Clipboard.id != clipboard_id,
        ).first()
        if clash:
            return None

    for key, value in fields.items():
        setattr(clipboard, key, value)

    db.commit()
    db.refresh(clipboard)

    # A TTL change re-applies to every message that hasn't expired yet (already
    # expired messages keep their past expires_at, so they stay gone — no resurrection).
    if "persistance" in fields:
        _reapply_persistance(db, clipboard)

    return clipboard


def _reapply_persistance(db: Session, clipboard):
    now = datetime.utcnow()
    live = db.query(models.ClipboardData).filter(
        models.ClipboardData.clipboard_id == clipboard.id,
        or_(models.ClipboardData.expires_at.is_(None), models.ClipboardData.expires_at > now),
    ).all()
    for item in live:
        item.expires_at = _expiry_from(item.created_at, clipboard.persistance)
    db.commit()


# ----------------------------
# DELETE CLIPBOARD DATA
# ----------------------------

def delete_all_messages(db: Session, clipboard_id: int):
    messages = db.query(models.ClipboardData).filter(
        models.ClipboardData.clipboard_id == clipboard_id,
    ).all()

    # Collect image blobs so they can be removed from storage after the rows are gone.
    image_refs = [
        message.content
        for message in messages
        if message.content_type == ContentType.image and message.content
    ]

    deleted_count = db.query(models.ClipboardData).filter(
        models.ClipboardData.clipboard_id == clipboard_id,
    ).delete(synchronize_session=False)
    db.commit()

    for ref in image_refs:
        _delete_blob(ref)

    return {"detail": "All messages deleted successfully", "deleted": deleted_count}

def delete_user_account(db: Session, user_id: int):
    """Delete a user and everything they own: clipboards, their messages, image
    blobs (best-effort, inside delete_entire_clipboard), and devices."""
    clipboards = db.query(models.Clipboard).filter(models.Clipboard.user_id == user_id).all()
    for clipboard in clipboards:
        delete_entire_clipboard(db, clipboard.id)

    db.query(models.Device).filter(models.Device.user_id == user_id).delete(synchronize_session=False)

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        db.delete(user)
    db.commit()
    return {"detail": "Account deleted"}

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
# EXPIRY CLEANUP (cron)
# ----------------------------

def purge_expired(db: Session):
    """Permanently remove every message whose expires_at is in the past, and
    clean up the blobs of any expired images. Safe to run repeatedly (idempotent)."""
    now = datetime.utcnow()
    expired = db.query(models.ClipboardData).filter(
        models.ClipboardData.expires_at.isnot(None),
        models.ClipboardData.expires_at < now,
    ).all()

    if not expired:
        return 0

    for item in expired:
        if item.content_type == ContentType.image and item.content:
            _delete_blob(item.content)

    ids = [item.id for item in expired]
    db.query(models.ClipboardData).filter(
        models.ClipboardData.id.in_(ids)
    ).delete(synchronize_session=False)
    db.commit()

    return len(ids)


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

    now = datetime.utcnow()
    current_clipboard_data = db.query(models.ClipboardData).join(models.Clipboard).filter(
            models.Clipboard.user_id == user_id,
            models.Clipboard.id == clipboard_id,
            or_(models.ClipboardData.expires_at.is_(None), models.ClipboardData.expires_at > now),
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
    now = datetime.utcnow()
    clipboard = db.query(models.Clipboard).filter(models.Clipboard.id == clipboard_id).first()
    data = models.ClipboardData(
        clipboard_id=clipboard_id,
        content=message.content,
        content_type = message.content_type,
        created_at=now,
        expires_at=_expiry_from(now, clipboard.persistance if clipboard else None),
    )
    db.add(data)
    db.commit()
    db.refresh(data)
    return data


def add_clipboard_data_image(db: Session, clipboard_id: int, image: "UploadFile"):
    data = image.file.read()
    path = f"clipboards/{clipboard_id}/{uuid.uuid4()}_{image.filename}"

    # Private store: the blob URL is not publicly readable, so store the pathname
    # and serve bytes back through the authenticated image proxy route.
    result = blob.put(path, data, access="private")

    now = datetime.utcnow()
    clipboard = db.query(models.Clipboard).filter(models.Clipboard.id == clipboard_id).first()
    msg = models.ClipboardData(
        clipboard_id=clipboard_id,
        content=result.pathname,
        content_type="image",
        created_at=now,
        expires_at=_expiry_from(now, clipboard.persistance if clipboard else None),
    )

    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_clipboard_image(db: Session, user_id: int, message_id: int):
    """Fetch a private image blob for an owned message. Returns (bytes, content_type)
    or None if the message doesn't exist / isn't the user's / isn't an image."""
    message = db.query(models.ClipboardData).join(models.Clipboard).filter(
        models.ClipboardData.id == message_id,
        models.Clipboard.user_id == user_id,
        models.ClipboardData.content_type == ContentType.image,
    ).first()

    if not message:
        return None

    result = blob.get(message.content, access="private")
    return result.content, (result.content_type or "application/octet-stream")


def delete_message(db: Session, clipboard_id: int, message_id: int):
    message = db.query(models.ClipboardData).join(models.Clipboard).filter(
            models.ClipboardData.id == message_id,
            models.ClipboardData.clipboard_id == clipboard_id,
        ).first()
    
    
    if message:
        image_url = None
        if message.content_type == ContentType.image:
            image_url = message.content
        db.delete(message)
        db.commit()
        if image_url:
            _delete_blob(image_url)
        return {"detail": "Message deleted successfully"}