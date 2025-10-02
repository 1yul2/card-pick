import sqlite3

DB_NAME = "cards.db"

def get_connection():
    return sqlite3.connect(DB_NAME)

def add_card(name: str, team: str, icon: str, grade: str, wins: int = 0, losses: int = 0):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO cards (name, team, icon, grade, wins, losses) VALUES (?, ?, ?, ?, ?, ?)",
        (name, team, icon, grade, wins, losses)
    )
    conn.commit()
    conn.close()

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        team TEXT NOT NULL,
        icon TEXT NOT NULL,
        grade TEXT NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0
    )
    """)
    conn.commit()
    conn.close()

def get_all_cards():
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT name, team, icon, grade, wins, losses FROM cards")
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]