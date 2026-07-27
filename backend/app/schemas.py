from pydantic import BaseModel  # type: ignore
from datetime import datetime
from typing import Optional, List

# --- Trip Schemas ---

class TripBase(BaseModel):
    trip_type: str  # "Going Home" or "Returning"

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    id: int
    user_id: int
    trip_date: datetime
    status: str

    # This config tells Pydantic to read data even if it's not a standard dictionary 
    # (specifically, it reads the SQLAlchemy database models)
    model_config = {"from_attributes": True}


# --- Optional: Schemas for future features (Checklist & Clothes) ---

class ChecklistItemBase(BaseModel):
    category: str
    item_name: str
    is_completed: bool = False

class ChecklistItemResponse(ChecklistItemBase):
    id: int
    trip_id: int
    model_config = {"from_attributes": True}

class ClothingItemBase(BaseModel):
    item_name: str
    is_clean: bool = True

# --- AI Smart Quick-Add Schemas ---

class AIQuickAddRequest(BaseModel):
    prompt: str
    user_id: int = 1

class AIQuickAddResponse(BaseModel):
    trip: TripResponse
    detected_type: str
    detected_date_str: str
    extracted_items: List[str]
    ai_summary: str