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
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ], # Vite dev server ports
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
    db_trip = models.Trip(**trip.dict(), user_id=user_id)
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)

    # 2. Generate Default Checklist
    default_items = [
        ("Electronics", "Phone Charger"), ("Electronics", "Laptop"),
        ("Essentials", "Toothbrush"), ("Essentials", "Wallet/ID")
    ]
    
    for category, name in default_items:
        db_item = models.ChecklistItem(trip_id=db_trip.id, category=category, item_name=name)
        db.add(db_item)

    # 3. If "Going Home", automatically add dirty clothes to checklist
    if trip.trip_type == "Going Home":
        dirty_clothes = db.query(models.ClothingItem).filter(
            models.ClothingItem.user_id == user_id, 
            models.ClothingItem.is_clean == False
        ).all()
        
        for cloth in dirty_clothes:
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

@app.get("/trips/{trip_id}/checklist", response_model=list[schemas.ChecklistItemResponse])
def get_trip_checklist(trip_id: int, db: Session = Depends(get_db)):
    items = db.query(models.ChecklistItem).filter(models.ChecklistItem.trip_id == trip_id).all()
    return items

# ═══════════════════════════════════════════════════════════════
# ⚡ AI Smart Quick-Add Engine (Natural Language Input)
# ═══════════════════════════════════════════════════════════════

def parse_trip_with_gemini(prompt: str):
    if not GEMINI_API_KEY or GEMINI_API_KEY == "put_your_api_key_here":
        raise HTTPException(status_code=500, detail="Gemini API Key is missing. Please configure it in .env file.")
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
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
            
    # 3. If Going Home, add dirty clothes
    if trip_type == "Going Home":
        dirty_clothes = db.query(models.ClothingItem).filter(
            models.ClothingItem.user_id == request.user_id, 
            models.ClothingItem.is_clean == False
        ).all()
        for cloth in dirty_clothes:
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