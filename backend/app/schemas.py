from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# --- Auth / User Schemas ---

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Trip Schemas ---

class TripBase(BaseModel):
    trip_type: str  # "Going Home" or "Returning"

class TripCreate(TripBase):
    trip_date: Optional[datetime] = None
    status: Optional[str] = "Pending"

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

class ChecklistItemCreate(BaseModel):
    category: str = "Essentials"
    item_name: str

class ChecklistItemResponse(ChecklistItemBase):
    id: int
    trip_id: int
    model_config = {"from_attributes": True}

class ClothingItemBase(BaseModel):
    item_name: str
    is_clean: bool = True

class ClothingItemCreate(ClothingItemBase):
    pass

class ClothingItemResponse(ClothingItemBase):
    id: int
    user_id: int
    model_config = {"from_attributes": True}

# --- Expenses Schemas ---

class ExpenseBase(BaseModel):
    description: str
    amount: float

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int
    trip_id: int
    expense_date: datetime
    model_config = {"from_attributes": True}

# --- Itinerary Schemas ---

class ItineraryBase(BaseModel):
    day_number: int
    time_label: str
    activity: str

class ItineraryCreate(ItineraryBase):
    pass

class ItineraryResponse(ItineraryBase):
    id: int
    trip_id: int
    model_config = {"from_attributes": True}

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
    checklist: List[ChecklistItemResponse] = []