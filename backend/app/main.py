from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import re

# ഇംപോർട്ടുകളിൽ നിന്ന് 'backend.' ഒഴിവാക്കി 'app.' എന്ന് നൽകി
from app import models, schemas
from app.database import engine, get_db

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

# ═══════════════════════════════════════════════════════════════
# ⚡ AI Smart Quick-Add Engine (Natural Language Input)
# ═══════════════════════════════════════════════════════════════

def parse_natural_language_trip(prompt: str):
    text = prompt.lower()
    
    # 1. Determine Trip Type
    going_home_words = ["വീട്ടിൽ", "വീട്", "നാട്ടിൽ", "നാട്", "home", "veettil", "veedu", "nattil", "naattil", "house", "going home", "nattilekku"]
    returning_words = ["pg", "hostel", "returning", "തിരികെ", "ഹോസ്റ്റൽ", "room", "college", "campus", "back", "return", "thirike"]
    
    trip_type = "Going Home"
    if any(w in text for w in returning_words):
        trip_type = "Returning to PG"
    elif any(w in text for w in going_home_words):
        trip_type = "Going Home"
    elif "weekend" in text or "യാത്ര" in text or "trip" in text or "tour" in text:
        trip_type = "Weekend Trip"
        
    # 2. Determine Travel Date
    today = datetime.utcnow()
    target_date = today
    
    weekday_map = {
        0: ["തിങ്കൾ", "തിങ്കളാഴ്ച", "monday", "mon", "thinkal"],
        1: ["ചൊവ്വ", "ചൊവ്വാഴ്ച", "tuesday", "tue", "chovva"],
        2: ["ബുധൻ", "ബുധനാഴ്ച", "wednesday", "wed", "budhan"],
        3: ["വ്യാഴം", "വ്യാഴാഴ്ച", "thursday", "thu", "vyazham"],
        4: ["വെള്ളി", "വെള്ളിയാഴ്ച", "friday", "fri", "velli", "velliyazhcha"],
        5: ["ശനി", "ശനിയാഴ്ച", "saturday", "sat", "shani", "shaniyazhcha"],
        6: ["ഞായർ", "ഞായറാഴ്ച", "sunday", "sun", "njayar", "njayarazhcha"]
    }
    
    date_found = False
    if any(w in text for w in ["നാളെ", "tomorrow", "tmrw", "naale", "nale"]):
        target_date = today + timedelta(days=1)
        date_found = True
    elif any(w in text for w in ["മറ്റന്നാൾ", "day after tomorrow", "mattannal"]):
        target_date = today + timedelta(days=2)
        date_found = True
    elif any(w in text for w in ["ഇന്ന്", "today", "innu"]):
        target_date = today
        date_found = True
    else:
        for w_day, keywords in weekday_map.items():
            if any(k in text for k in keywords):
                current_w_day = today.weekday()
                days_ahead = w_day - current_w_day
                if days_ahead < 0 or (days_ahead == 0 and "next" in text):
                    days_ahead += 7
                target_date = today + timedelta(days=days_ahead)
                date_found = True
                break
                
    if not date_found:
        # Default to upcoming Friday if Going Home, or tomorrow if Returning
        if trip_type == "Going Home":
            days_ahead = 4 - today.weekday()
            if days_ahead < 0:
                days_ahead += 7
            target_date = today + timedelta(days=days_ahead)
        else:
            target_date = today + timedelta(days=1)
            
    # 3. Extract Custom Packing Items
    item_keywords = [
        (["ലാപ്ടോപ്പ്", "laptop", "lap", "macbook"], ("Electronics", "Laptop 💻")),
        (["ജാക്കറ്റ്", "jacket", "coat", "hoodie", "സ്വെറ്റർ", "sweater", "തണുപ്പ്"], ("Clothes (Laundry)", "Jacket 🧥")),
        (["ചാർജർ", "charger", "cable", "വയർ", "adapter"], ("Electronics", "Phone Charger 🔌")),
        (["ഹെഡ്‌ഫോൺ", "headphones", "earphones", "airpods", "ഇയർഫോൺ", "headset"], ("Electronics", "Headphones 🎧")),
        (["ഷൂ", "shoes", "sneakers", "ചെരുപ്പ്", "sandals", "boot"], ("Essentials", "Shoes 👟")),
        (["പുസ്തകം", "book", "books", "നോട്ടുബുക്ക്", "notes", "study", "പഠിക്കാൻ"], ("Essentials", "Study Notes 📚")),
        (["ഐഡി", "id", "card", "wallet", "പഴ്സ്", "അറ്റൻഡൻസ്"], ("Essentials", "Wallet / ID Card 🪪")),
        (["കണ്ണട", "glasses", "spectacles"], ("Essentials", "Glasses 👓")),
        (["വാട്ടർ ബോട്ടിൽ", "bottle", "water bottle", "കുപ്പി"], ("Essentials", "Water Bottle 💧")),
        (["ജീൻസ്", "jeans", "പാന്റ്സ്", "pants", "ട്രൗസർ"], ("Clothes (Laundry)", "Jeans 👖")),
        (["ഷർട്ട്", "shirt", "tshirt", "ടീഷർട്ട്", "തുണി", "clothes", " dress"], ("Clothes (Laundry)", "Clean Clothes 👕")),
        (["ടൂത്ത്ബ്രഷ്", "toothbrush", "paste", "ബ്രഷ്"], ("Essentials", "Toothbrush 🪥")),
        (["മെഡിസിൻ", "medicine", "pills", "മരുന്ന്", "ഗുളിക"], ("Essentials", "Medicines 💊")),
        (["കുട", "umbrella", "മഴ"], ("Essentials", "Umbrella ☂️")),
        (["കീ", "key", "keys", "താക്കോൽ"], ("Essentials", "Room Keys 🔑")),
    ]
    
    extracted = []
    for keywords, (cat, name) in item_keywords:
        if any(k in text for k in keywords):
            extracted.append((cat, name))
            
    # Ensure we at least have Laptop & Jacket if user typed the exact demo phrase and somehow missed
    if "ലാപ്ടോപ്പ്" in prompt and not any(name == "Laptop 💻" for _, name in extracted):
        extracted.append(("Electronics", "Laptop 💻"))
    if "ജാക്കറ്റ്" in prompt and not any(name == "Jacket 🧥" for _, name in extracted):
        extracted.append(("Clothes (Laundry)", "Jacket 🧥"))
        
    return trip_type, target_date, extracted

@app.post("/ai/quick-add", response_model=schemas.AIQuickAddResponse)
def ai_quick_add(request: schemas.AIQuickAddRequest, db: Session = Depends(get_db)):
    trip_type, target_date, extracted_items = parse_natural_language_trip(request.prompt)
    
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
    
    return schemas.AIQuickAddResponse(
        trip=db_trip,
        detected_type=trip_type,
        detected_date_str=date_str,
        extracted_items=extracted_names,
        ai_summary=summary_msg
    )