# AI Question Generator

A full-stack reviewer workflow for generating exactly five questions from supplied reading material:

- 2 theory MCQs
- 2 True/False questions
- 1 code-analysis question

Stack: React + Django REST Framework + MySQL + OpenAI Responses API.

## Architecture

React frontend -> Django REST API -> MySQL
                         |
                         -> OpenAI Responses API

The backend keeps the OpenAI API key private. The AI first generates questions and then a second AI pass checks whether each question is actually supported by the supplied material. A reviewer can edit and approve every question before publishing.

## Grounding rule

A question is considered failed if it tests information that the supplied reading material does not actually teach. The system stores source evidence and a grounding decision for every question.

## Setup

### 1. MySQL

```sql
CREATE DATABASE ai_question_generator
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and configure your MySQL credentials and OpenAI API key.

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Backend: http://127.0.0.1:8000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Workflow

1. Upload `.md`, `.markdown` or `.txt`.
2. Store the material in MySQL.
3. Generate exactly five questions.
4. Run a second AI grounding check.
5. Show questions and source evidence to the reviewer.
6. Reviewer edits and marks each question as reviewed.
7. Backend blocks approval until all five are reviewed and grounded.
8. Export the approved group.

## Trade-offs

- Synchronous generation is simpler for an assignment demo. Production could use Celery + Redis.
- Full material is sent to the model because assignment-sized Markdown is small. Large documents could use chunking + embeddings + retrieval.
- Authentication was not required, so it is omitted. Production should add reviewer accounts and permissions.
- The tagged exporter uses a placeholder tag syntax because the exact assignment-specific tag specification was not available in the files provided to this build. Replace `build_tagged_export()` in `questions/services.py` with the exact required tags if needed.

## Security

Never commit `.env` or API keys to GitHub.
