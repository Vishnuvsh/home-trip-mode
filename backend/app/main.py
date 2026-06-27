from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

# ഇംപോർട്ടുകളിൽ നിന്ന് 'backend.' ഒഴിവാക്കി 'app.' എന്ന് നൽകി
from app import models, schemas
from app.database import engine, get_db

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Home Trip Mode API")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default port
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