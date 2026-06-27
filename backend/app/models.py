from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    trips = relationship("Trip", back_populates="owner")
    clothes = relationship("ClothingItem", back_populates="owner")

class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    trip_type = Column(String) # "Going Home" or "Returning"
    trip_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="Pending") # Pending, Completed
    
    owner = relationship("User", back_populates="trips")
    checklist = relationship("ChecklistItem", back_populates="trip")

class ChecklistItem(Base):
    __tablename__ = "checklist_items"
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    category = Column(String) # Clothes, Electronics, Essentials
    item_name = Column(String)
    is_completed = Column(Boolean, default=False)
    
    trip = relationship("Trip", back_populates="checklist")

class ClothingItem(Base):
    __tablename__ = "clothes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    item_name = Column(String)
    is_clean = Column(Boolean, default=True)
    
    owner = relationship("User", back_populates="clothes")