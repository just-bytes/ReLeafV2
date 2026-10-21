from fastapi import APIRouter, FastAPI

app = FastAPI(title="ReLeaf API")
api = APIRouter(prefix="/api")


@api.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api)
