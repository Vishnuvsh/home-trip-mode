from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import re
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY != "put_your_api_key_here":
    genai.configure(api_key=GEMINI_API_KEY)
    

from app import models, schemas
from app.database import engine, get_db
from app.auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Home Trip Mode API")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins (Vercel, Localhost, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ═══════════════════════════════════════════════════════════════
# 🔐 Authentication
# ═══════════════════════════════════════════════════════════════

@app.post("/auth/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/auth/login", response_model=schemas.Token)
def login_for_access_token(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username, "user_id": db_user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/trips/", response_model=schemas.TripResponse)
def create_trip(trip: schemas.TripCreate, user_id: int, db: Session = Depends(get_db)):
    # 1. Create the Trip
    trip_data = trip.dict(exclude_none=True)
    db_trip = models.Trip(**trip_data, user_id=user_id)
    db.add(db_trip)
    db.commit()
    # 2. Generate Default Checklist
    default_items = [
        ("Electronics", "Phone Charger"), ("Electronics", "Laptop"),
        ("Essentials", "Toothbrush"), ("Essentials", "Wallet/ID")
    ]
    
    for category, name in default_items:
        db_item = models.ChecklistItem(trip_id=db_trip.id, category=category, item_name=name)
        db.add(db_item)

    # 3. Handle Clothes based on trip type
    if trip.trip_type == "Going Home":
        clothes_to_pack = db.query(models.ClothingItem).filter(
            models.ClothingItem.user_id == user_id, 
            models.ClothingItem.is_clean == False
        ).all()
    elif trip.trip_type == "Returning" or trip.trip_type == "Returning to PG":
        clothes_to_pack = db.query(models.ClothingItem).filter(
            models.ClothingItem.user_id == user_id, 
            models.ClothingItem.is_clean == True
        ).all()
    else:
        clothes_to_pack = []
        
    for cloth in clothes_to_pack:
        db_item = models.ChecklistItem(
            trip_id=db_trip.id, 
            category="Clothes (Laundry)", 
            item_name=cloth.item_name
        )
        db.add(db_item)

    db.commit()
    return db_trip

@app.get("/laundry/stats/{user_id}")
def get_laundry_stats(user_id: int, db: Session = Depends(get_db)):
    clean_count = db.query(models.ClothingItem).filter_by(user_id=user_id, is_clean=True).count()
    dirty_count = db.query(models.ClothingItem).filter_by(user_id=user_id, is_clean=False).count()
    return {"clean": clean_count, "dirty": dirty_count}

@app.get("/trips/user/{user_id}", response_model=list[schemas.TripResponse])
def get_user_trips(user_id: int, db: Session = Depends(get_db)):
    trips = db.query(models.Trip).filter(models.Trip.user_id == user_id).order_by(models.Trip.trip_date.desc()).all()
    return trips

@app.get("/trips/{trip_id}/checklist", response_model=list[schemas.ChecklistItemResponse])
def get_trip_checklist(trip_id: int, db: Session = Depends(get_db)):
    items = db.query(models.ChecklistItem).filter(models.ChecklistItem.trip_id == trip_id).all()
    return items

@app.get("/trips/{trip_id}", response_model=schemas.TripResponse)
def get_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@app.put("/checklist/{item_id}/toggle", response_model=schemas.ChecklistItemResponse)
def toggle_checklist_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ChecklistItem).filter(models.ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    item.is_completed = not item.is_completed
    db.commit()
    db.refresh(item)
    return item

@app.post("/trips/{trip_id}/checklist", response_model=schemas.ChecklistItemResponse)
def add_checklist_item(trip_id: int, item: schemas.ChecklistItemCreate, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db_item = models.ChecklistItem(
        trip_id=trip_id,
        category=item.category,
        item_name=item.item_name,
        is_completed=False
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/checklist/{item_id}")
def delete_checklist_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ChecklistItem).filter(models.ChecklistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")
    db.delete(item)
    db.commit()
    return {"message": "Checklist item deleted successfully"}

@app.get("/clothing/user/{user_id}", response_model=list[schemas.ClothingItemResponse])
def get_user_clothing(user_id: int, db: Session = Depends(get_db)):
    items = db.query(models.ClothingItem).filter(models.ClothingItem.user_id == user_id).all()
    return items

@app.post("/clothing/user/{user_id}", response_model=schemas.ClothingItemResponse)
def add_clothing_item(user_id: int, item: schemas.ClothingItemCreate, db: Session = Depends(get_db)):
    db_item = models.ClothingItem(user_id=user_id, item_name=item.item_name, is_clean=item.is_clean)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.put("/clothing/{item_id}/toggle", response_model=schemas.ClothingItemResponse)
def toggle_clothing_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ClothingItem).filter(models.ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    item.is_clean = not item.is_clean
    db.commit()
    db.refresh(item)
    return item

@app.delete("/clothing/{item_id}")
def delete_clothing_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.ClothingItem).filter(models.ClothingItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

@app.delete("/trips/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    # Delete associated checklist items first
    db.query(models.ChecklistItem).filter(models.ChecklistItem.trip_id == trip_id).delete()
    db.delete(trip)
    db.commit()
    return {"message": "Trip deleted successfully"}

# ═══════════════════════════════════════════════════════════════
# 💰 Expenses & Budget
# ═══════════════════════════════════════════════════════════════

@app.get("/trips/{trip_id}/expenses", response_model=list[schemas.ExpenseResponse])
def get_trip_expenses(trip_id: int, db: Session = Depends(get_db)):
    return db.query(models.Expense).filter(models.Expense.trip_id == trip_id).order_by(models.Expense.expense_date.desc()).all()

@app.post("/trips/{trip_id}/expenses", response_model=schemas.ExpenseResponse)
def add_expense(trip_id: int, expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.Expense(trip_id=trip_id, **expense.dict())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return {"message": "Expense deleted"}

# ═══════════════════════════════════════════════════════════════
# 🗓️ Trip Itinerary (Daily Planner)
# ═══════════════════════════════════════════════════════════════

@app.get("/trips/{trip_id}/itinerary", response_model=list[schemas.ItineraryResponse])
def get_trip_itinerary(trip_id: int, db: Session = Depends(get_db)):
    return db.query(models.ItineraryItem).filter(models.ItineraryItem.trip_id == trip_id).order_by(models.ItineraryItem.day_number, models.ItineraryItem.id).all()

@app.post("/trips/{trip_id}/itinerary", response_model=schemas.ItineraryResponse)
def add_itinerary_item(trip_id: int, item: schemas.ItineraryCreate, db: Session = Depends(get_db)):
    db_item = models.ItineraryItem(trip_id=trip_id, **item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/itinerary/{item_id}")
def delete_itinerary_item(item_id: int, db: Session = Depends(get_db)):
    db_item = db.query(models.ItineraryItem).filter(models.ItineraryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    db.delete(db_item)
    db.commit()
    return {"message": "Item deleted"}

# ═══════════════════════════════════════════════════════════════
# ⚡ AI Smart Quick-Add Engine (Natural Language Input)
# ═══════════════════════════════════════════════════════════════

def parse_trip_with_gemini(prompt: str):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "put_your_api_key_here":
        raise HTTPException(status_code=500, detail="Gemini API Key is missing. Please configure it in .env file.")
        
    try:
        model = genai.GenerativeModel('gemini-3.6-flash', generation_config={"response_mime_type": "application/json"})
        today = datetime.utcnow().strftime("%Y-%m-%d")
        
        sys_prompt = f"""You are an AI Smart Packing Assistant. Today's date is {today}.
User request (in Malayalam/Manglish/English): "{prompt}"

Determine:
1. trip_type: "Going Home", "Returning to PG", or "Weekend Trip"
2. target_date: The date they plan to travel in YYYY-MM-DD format based on context (e.g. tomorrow, friday). If unclear, use today.
3. extracted_items: A list of specific items to pack based on their request. Use emojis in the item_name! Categories can be "Clothes (Laundry)", "Electronics", "Essentials", "Misc".
   For example, if they mention rain, add an Umbrella. If they mention N days, add "Clothes for N days". If they mention train/snacks, add snacks.

Return ONLY valid JSON strictly in this exact structure:
{{
  "trip_type": "string",
  "target_date": "YYYY-MM-DD",
  "extracted_items": [
     {{"category": "string", "item_name": "string"}}
  ]
}}
"""
        response = model.generate_content(sys_prompt)
        data = json.loads(response.text)
        
        trip_type = data.get("trip_type", "Going Home")
        
        try:
            target_date = datetime.strptime(data.get("target_date", today), "%Y-%m-%d")
        except:
            target_date = datetime.utcnow()
            
        extracted_items = []
        for item in data.get("extracted_items", []):
            extracted_items.append((item.get("category", "Misc"), item.get("item_name", "Item")))
            
        return trip_type, target_date, extracted_items
        
    except Exception as e:
        print(f"Gemini error: {e}")
        raise HTTPException(status_code=500, detail="Gemini AI failed to process the request.")

@app.post("/ai/quick-add", response_model=schemas.AIQuickAddResponse)
def ai_quick_add(request: schemas.AIQuickAddRequest, db: Session = Depends(get_db)):
    trip_type, target_date, extracted_items = parse_trip_with_gemini(request.prompt)
    
    # 1. Create the Trip
    db_trip = models.Trip(
        user_id=request.user_id,
        trip_type=trip_type,
        trip_date=target_date,
        status="Planned"
    )
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    
    # 2. Generate Default Essentials + Custom Extracted Items
    default_items = [
        ("Electronics", "Phone Charger"), ("Electronics", "Laptop"),
        ("Essentials", "Toothbrush"), ("Essentials", "Wallet/ID")
    ]
    
    added_item_names = set()
    for category, name in default_items:
        db_item = models.ChecklistItem(trip_id=db_trip.id, category=category, item_name=name)
        db.add(db_item)
        added_item_names.add(name.lower())
        
    for category, name in extracted_items:
        # Avoid exact duplicate item names
        clean_name = name.split(" ")[0].lower() # e.g. "laptop" from "Laptop 💻"
        if not any(clean_name in existing for existing in added_item_names):
            db_item = models.ChecklistItem(trip_id=db_trip.id, category=category, item_name=name)
            db.add(db_item)
            added_item_names.add(clean_name)
            
    # 3. Handle Clothes based on trip type
    if trip_type == "Going Home":
        clothes_to_pack = db.query(models.ClothingItem).filter(
            models.ClothingItem.user_id == request.user_id, 
            models.ClothingItem.is_clean == False
        ).all()
    elif trip_type == "Returning" or trip_type == "Returning to PG":
        clothes_to_pack = db.query(models.ClothingItem).filter(
            models.ClothingItem.user_id == request.user_id, 
            models.ClothingItem.is_clean == True
        ).all()
    else:
        clothes_to_pack = []
        
    for cloth in clothes_to_pack:
        if cloth.item_name.lower() not in added_item_names:
            db_item = models.ChecklistItem(
                trip_id=db_trip.id, 
                category="Clothes (Laundry)", 
                item_name=cloth.item_name
            )
            db.add(db_item)
            added_item_names.add(cloth.item_name.lower())
                
    db.commit()
    
    date_str = target_date.strftime("%A, %d %b %Y")
    extracted_names = [name for _, name in extracted_items]
    if not extracted_names:
        extracted_names = ["Default Essentials (Charger, Toothbrush, ID...)"]
        
    summary_msg = f"✨ AI Smart Analysis: Detected '{trip_type}' for {date_str}. Automatically added {len(extracted_items)} custom items ({', '.join(extracted_names)}) along with your hostel essentials!"
    
    # fetch checklist items for this trip
    created_items = db.query(models.ChecklistItem).filter(models.ChecklistItem.trip_id == db_trip.id).all()
    
    return schemas.AIQuickAddResponse(
        trip=db_trip,
        detected_type=trip_type,
        detected_date_str=date_str,
        extracted_items=extracted_names,
        ai_summary=summary_msg,
        checklist=created_items
    )