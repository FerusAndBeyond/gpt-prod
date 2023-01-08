from datetime import datetime
from typing import Optional
import json
from string import Template
import databases
from pydantic import BaseModel
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import openai
# dotenv for injection of env-variables from .env
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = "sqlite:///./items.db"
database = databases.Database(DATABASE_URL)

openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

OPENAI_KWARGS = dict(
    model="text-davinci-003",
    max_tokens=512,
    temperature=0.3
)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NOTE_PARSING_TEMPLATE = Template("""
Ignore previous instuctions. Your task is to parse the notes below and output a single JSON array, nothing else, of items
containing information about different parts of the notes where information has been extracted, separated and categorized.
Information that should be added:
{
    "link": an url if specified
    "description": any provided description
    "type": any of [todo, reminder, post]
}
The type "post" is for content that isn't a todo or reminder.
Add null when there is no value.

Below the notes are shown:

<notes>
$notes
</notes>

Parsed JSON:""")

# could add other things, such as weather to spice up the final output
ITEM_SUMMARIZING_TEMPLATE = Template("""
Ignore previous instuctions. Summarize the following items in JSON into a succinct text both summarizing the items, what needs to be done, what day it is, etc. but also
providing motivational words to the reader. Time is $time.

JSON: 

$json

Output:""")

@app.on_event("startup")
async def startup():
    await database.connect()
    await database.execute("""
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            created DATETIME DEFAULT CURRENT_TIMESTAMP,
            description text,
            type text,
            link text,
            finished DATETIME DEFAULT null -- For to-do
        );
    """)

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

def parse_notes(notes):
    prompt = NOTE_PARSING_TEMPLATE.substitute(notes=notes)
    response = openai.Completion.create(
        prompt=prompt,
        **OPENAI_KWARGS
    )
    res = response["choices"][0]["text"]
    return json.loads(res)

def parse_json(json):
    response = openai.Completion.create(
        prompt=ITEM_SUMMARIZING_TEMPLATE.substitute(json=json, time=datetime.now().strftime("%Y-%m-%d %H:%M, %A")),
        **OPENAI_KWARGS
    )
    return response["choices"][0]["text"]

@app.get("/summarize")
async def summarize_items():
    items = await get_items()
    items = [dict(item) for item in items]
    return parse_json(json.dumps(items, indent=True))

@app.get("/item")
async def items():
    return await get_items()

class ItemPatch(BaseModel):
    description: Optional[str]
    type: Optional[str]
    finished: Optional[datetime]

@app.delete("/item/{id}")
async def delete_item(id):
    await database.execute(f"""
        DELETE FROM items
        where id = :id
    """, dict(id=id))

@app.patch("/item/{id}")
async def patch_item(id, item: ItemPatch):
    item = item.dict(exclude_unset=True)
    keys=  ",\n".join([f"{k}=:{k}" for k in item.keys()])
    await database.execute(f"""
        UPDATE items SET
            {keys}
        where id = :id
    """, { "id": id, **item })

class Notes(BaseModel):
    text: str

@app.post("/notes")
async def post_notes(note: Notes):
    items = parse_notes(note.text)
    await database.execute_many("""
        INSERT INTO items(description, type, link)
        VALUES(:description, :type, :link)
    """, items)
    return (await get_items())

async def get_items():
    data = (await database.fetch_all("""
        SELECT *
        FROM items
        WHERE finished is null
    """))
    return data
