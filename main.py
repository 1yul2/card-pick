from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from database import init_db, get_all_cards, add_card, delete_card as db_delete_card, update_card as db_update_card, get_connection

app = FastAPI()

# DB 초기화
init_db()

app.mount("/static", StaticFiles(directory="static"), name="static")

# Helper to ensure card exists before update/delete
def _ensure_card_exists(card_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM cards WHERE id = %s", (card_id,))
    found = cur.fetchone()
    cur.close()
    conn.close()
    if not found:
        raise HTTPException(status_code=404, detail="Card not found")

@app.get("/")
async def root():
    return FileResponse("index.html")

@app.get("/api/cards")
def get_cards():
    return get_all_cards()

class Card(BaseModel):
    name: str
    team: str
    icon: str
    grade: str
    wins: int = 0
    losses: int = 0

@app.post("/api/cards/add")
def create_card(card: Card):
    add_card(card.name, card.team, card.icon, card.grade, card.wins, card.losses)
    return {"message": "Card added successfully"}

@app.get("/adminpage")
async def admin_page():
    return FileResponse("admin.html")

@app.delete("/api/cards/delete/{card_id}")
def delete_card(card_id: int):
    try:
        _ensure_card_exists(card_id)
        db_delete_card(card_id)
        return {"message": "Card deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/cards/update/{card_id}")
def update_card(card_id: int, card: Card):
    try:
        _ensure_card_exists(card_id)
        db_update_card(card_id, card.name, card.team, card.icon, card.grade, card.wins, card.losses)
        return {"message": "Card updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))