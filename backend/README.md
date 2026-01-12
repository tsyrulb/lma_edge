# CovenantOps Backend

## Requirements
- Python 3.10+

## Local dev
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API base: `http://localhost:8000/api`

