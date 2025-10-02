from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from database import init_db, get_all_cards, add_card, get_connection

app = FastAPI()

# DB 초기화
init_db()

app.mount("/static", StaticFiles(directory="static"), name="static")

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
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM cards WHERE id = %s", (card_id,))
    conn.commit()
    conn.close()
    return {"message": "Card deleted successfully"}

@app.put("/api/cards/update/{card_id}")
def update_card(card_id: int, card: Card):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE cards
        SET name = %s, team = %s, icon = %s, grade = %s, wins = %s, losses = %s
        WHERE id = %s
    """, (card.name, card.team, card.icon, card.grade, card.wins, card.losses, card_id))
    conn.commit()
    conn.close()
    return {"message": "Card updated successfully"}