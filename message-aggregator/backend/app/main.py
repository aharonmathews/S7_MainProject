from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.services.aggregator import MessageAggregator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

aggregator = MessageAggregator()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Message Aggregator API!"}

@app.get("/messages")
async def get_messages(
    platforms: str = Query(default="telegram,twitter"),
    twitter_keyword: str = Query(default="python"),
    limit: int = Query(default=20)
):
    platform_list = [p.strip() for p in platforms.split(",")]
    messages = aggregator.aggregate_messages(platform_list, twitter_keyword, limit)
    return {"messages": messages, "count": len(messages)}