# AI Question Generator

A full-stack AI-powered reviewer workflow for generating exactly five questions from supplied reading material.

The system generates:

- **2 theory Multiple Choice Questions (MCQs)**
- **2 True/False questions**
- **1 code-analysis question**

Every generated question is checked against the supplied reading material before it can be approved. A human reviewer can inspect, edit, review, and approve the questions before they are exported.

---

## Technology Stack

- **Frontend:** React
- **Backend:** Django REST Framework
- **Database:** MySQL
- **AI:** OpenAI Responses API
- **Language:** Python / JavaScript
- **API:** REST

---

## Architecture

```text
                    ┌──────────────────┐
                    │  React Frontend  │
                    └────────┬─────────┘
                             │
                             │ REST API
                             ▼
                    ┌──────────────────┐
                    │ Django REST API  │
                    └───────┬─────┬────┘
                            │     │
                 ┌──────────┘     └──────────┐
                 ▼                           ▼
          ┌─────────────┐            ┌─────────────────┐
          │    MySQL    │            │ OpenAI Responses│
          │   Database  │            │      API        │
          └─────────────┘            └─────────────────┘
```

The OpenAI API key is kept on the backend and is never exposed to the React frontend.

---

## How It Works

The application follows this workflow:

```text
Reading Material
       │
       ▼
     Upload
       │
       ▼
 Store Material
       │
       ▼
Generate 5 Questions
       │
       ▼
AI Grounding Check
       │
       ▼
Human Reviewer
       │
       ▼
Edit / Review Questions
       │
       ▼
Approve Group
       │
       ▼
Export
```

The important design principle is that **AI generation is not the final step**. Questions must pass grounding checks and human review before they can be approved.

---

## Grounding Rule

The main requirement of the system is that a question must only test information that is actually taught in the supplied reading material.

For example, if the material teaches:

```python
numbers = [1, 2, 3]

for number in numbers:
    print(number)
```

then a question about iterating through the list is valid.

However, if the material never teaches `append()`, then a question such as:

```python
numbers.append(4)
```

should not be considered grounded.

The system therefore performs a separate AI grounding check after question generation.

For each question, the backend stores:

- Grounding decision
- Source evidence
- Review status
- Question content
- Correct answer

This allows the reviewer to understand why a question was considered supported by the material.

---

## Question Structure

Each generated group contains exactly five questions:

| Type | Quantity |
|---|---:|
| Theory MCQ | 2 |
| True/False | 2 |
| Code Analysis | 1 |
| **Total** | **5** |

The backend validates the generated group so that the required question structure is maintained.

---

# Setup

## 1. Clone the Repository

```bash
git clone https://github.com/Towqeerwani/AI-Question-Generator.git
cd AI-Question-Generator
```

---

## 2. MySQL Setup

Create the database:

```sql
CREATE DATABASE ai_question_generator
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

Configure the database credentials in the backend `.env` file.

---

## 3. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file using `.env.example` as a template.

Example:

```env
OPENAI_API_KEY=your_openai_api_key

DB_NAME=ai_question_generator
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=127.0.0.1
DB_PORT=3306
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Start Django:

```bash
python manage.py runserver
```

Backend:

```text
http://127.0.0.1:8000
```

Health check:

```text
GET /api/health/
```

Expected response:

```json
{
  "status": "ok"
}
```

---

## 4. Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health/` | Check backend health |
| GET | `/api/materials/` | List uploaded materials |
| POST | `/api/materials/upload/` | Upload reading material |
| GET | `/api/materials/<id>/` | Get a material |
| POST | `/api/materials/<id>/generate/` | Generate questions |
| GET | `/api/groups/<id>/` | Get generated question group |
| PATCH | `/api/questions/<id>/` | Edit/review a question |
| POST | `/api/groups/<id>/approve/` | Approve a question group |
| GET | `/api/groups/<id>/export/` | Export an approved group |

---

# Supported Input

The application accepts reading material in:

- `.md`
- `.markdown`
- `.txt`

The uploaded material is stored by the backend and used as the source for question generation and grounding.

---

# Reviewer Workflow

The reviewer is an important part of the system.

After generation:

1. Questions are displayed to the reviewer.
2. Grounding evidence is displayed.
3. The reviewer checks the question.
4. The reviewer can edit the question if necessary.
5. The reviewer marks the question as reviewed.
6. The backend verifies the question's grounding status.
7. The group can only be approved when all five questions satisfy the required review conditions.
8. The approved group can then be exported.

This prevents unreviewed AI-generated questions from being treated as final output.

---

# AI Workflow

The AI workflow consists of two major stages.

### Stage 1 — Question Generation

The reading material is provided to the OpenAI model with instructions to generate exactly:

```text
2 theory MCQs
2 True/False questions
1 code-analysis question
```

The generation step is constrained to the supplied material.

### Stage 2 — Grounding

A separate AI evaluation checks each question against the source material.

The evaluator determines whether the question is supported by the material and returns source evidence for the decision.

This separation was chosen so that generation and evaluation are treated as separate responsibilities.

---

# Design Decisions and Trade-offs

### Synchronous generation

The generation workflow is synchronous because it is simpler and easier to demonstrate for an assignment.

For a production system with large workloads, the generation process could be moved to a background queue using technologies such as Celery and Redis.

### Full material sent to the model

For this assignment, the reading materials are expected to be relatively small, so the complete material can be provided to the model.

For larger documents, a production implementation could use:

- Chunking
- Embeddings
- Vector search
- Retrieval-Augmented Generation (RAG)

### Authentication

Authentication was not required by the assignment, so it was intentionally omitted.

A production application should add:

- Reviewer accounts
- Authentication
- Authorization
- Role-based permissions

### Human review

AI output is not automatically treated as final.

The reviewer workflow was intentionally included because the assignment requires each question to be inspected, judged, and corrected before publication.

---

# Security

The OpenAI API key is stored on the backend and is never sent to the React frontend.

The `.env` file must **never be committed to GitHub**.

The repository should contain:

```text
.env.example
```

but not:

```text
.env
```

Example `.gitignore` entries:

```gitignore
.env
.venv/
venv/
__pycache__/
node_modules/
```

---

# Testing

The main workflow should be tested in the following order:

```text
1. Backend health check
2. Upload reading material
3. Retrieve material
4. Generate question group
5. Verify exactly five questions
6. Verify question types
7. Verify grounding results
8. Edit a question
9. Mark questions as reviewed
10. Approve the group
11. Export the approved group
```

An important grounding test is to provide material that teaches only a small set of concepts and verify that the system does not accept questions about concepts that were not taught.

---

# Example Reading Material

A demonstration input can be based on Python Lists.

The material teaches:

- What a Python list is
- Square-bracket syntax
- Lists storing multiple values
- List mutability
- Changing a list value
- Iterating through a list using a `for` loop
- Printing values while looping

This provides a simple example for demonstrating both valid and invalid grounded questions.

---

# Project Structure

```text
AI-Question-Generator/
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   └── ...
│
├── frontend/
│   ├── package.json
│   └── ...
│
├── .gitignore
└── README.md
```

---

# Demo Recording

The required demonstration recording covers:

1. Running the application from start to finish
2. Explaining the architecture and technology choices
3. Uploading reading material
4. Generating the five questions
5. Demonstrating grounding
6. Reviewing/editing questions
7. Approving and exporting the question group
8. Teaching one concept from the supplied reading material

Recording link:

**[Add Loom or Google Drive link here]**

---

# GitHub Repository

**Repository:**

https://github.com/Towqeerwani/AI-Question-Generator

---

# Conclusion

The main goal of this project is not simply to generate questions using an AI model. The system is designed as a **reviewer workflow** in which generated questions are checked against the supplied learning material and then reviewed by a human before approval.

This approach prioritizes correctness, grounding, and reviewer control over fully automated question generation.
