from api.core.database import Base, engine
from api.clipboard import models
# from api.notifications import models as notifications_models  # if you want both apps

# Create all tables
Base.metadata.create_all(bind=engine)

print("Tables created successfully!")

