import logging
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from database import init_db, get_all_cards, add_card, delete_card as db_delete_card, update_card as db_update_card, get_connection

logger = logging.getLogger("cardpick")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

app = FastAPI()

# DB 초기화
init_db()

app.mount("/static", StaticFiles(directory="static"), name="static")

# Helper to ensure card exists before update/delete
def _ensure_card_exists(card_id: int):
    logger.info("[ensure] checking card exists: id=%s", card_id)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM cards WHERE id = %s", (card_id,))
    found = cur.fetchone()
    cur.close()
    conn.close()
    logger.info("[ensure] result: %s", bool(found))
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


# Lightweight debug endpoint to verify IDs and DB connectivity
@app.get("/api/debug/dbcheck")
def dbcheck():
    logger.info("[dbcheck] checking DB connectivity")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS n FROM cards")
    row = cur.fetchone()
    cur.close()
    conn.close()
    n = row[0] if not isinstance(row, dict) else row.get("n")
    logger.info("[dbcheck] total cards=%s", n)
    return {"ok": True, "total": n}

@app.delete("/api/cards/delete/{card_id}")
def delete_card(card_id: int):
    logger.info("[delete] request received id=%s", card_id)
    try:
        _ensure_card_exists(card_id)
        db_delete_card(card_id)
        logger.info("[delete] success id=%s", card_id)
        return {"message": "Card deleted successfully", "id": card_id}
    except HTTPException as e:
        logger.warning("[delete] http error id=%s detail=%s", card_id, e.detail)
        raise
    except Exception as e:
        logger.exception("[delete] unexpected error id=%s", card_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/cards/{card_id}")
def delete_card_short(card_id: int):
    return delete_card(card_id)

@app.put("/api/cards/update/{card_id}")
def update_card(card_id: int, card: Card):
    logger.info("[update] request received id=%s payload=%s", card_id, card.dict())
    try:
        _ensure_card_exists(card_id)
        db_update_card(card_id, card.name, card.team, card.icon, card.grade, card.wins, card.losses)
        logger.info("[update] success id=%s", card_id)
        return {"message": "Card updated successfully", "id": card_id}
    except HTTPException as e:
        logger.warning("[update] http error id=%s detail=%s", card_id, e.detail)
        raise
    except Exception as e:
        logger.exception("[update] unexpected error id=%s", card_id)
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/cards/{card_id}")
def update_card_short(card_id: int, card: Card):
    return update_card(card_id, card)