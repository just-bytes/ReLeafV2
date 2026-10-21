from fastapi import FastAPI

app = FastAPI(title="ReLeaf API")


@app.get("/health")
def health():
    return {"status": "ok"}
