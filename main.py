from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3
from database import init_db, get_all_cards, add_card

app = FastAPI()

# DB 초기화
init_db()

app.mount("/static", StaticFiles(directory="."), name="static")

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
    wins: int = 0
    losses: int = 0

@app.post("/api/cards/add")
def create_card(card: Card):
    add_card(card.name, card.team, card.icon, card.wins, card.losses)
    return {"message": "Card added successfully"}