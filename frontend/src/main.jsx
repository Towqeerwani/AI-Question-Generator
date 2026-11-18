import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = "http://127.0.0.1:8000/api";

function App() {
  const [file, setFile] = useState(null);
  const [material, setMaterial] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const upload = async () => {
    if (!file) return;
    setLoading(true); setError(""); setMessage("");
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch(`${API}/materials/upload/`, {
        method: "POST", body: form
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      setMaterial(data); setGroup(null);
      setMessage("Reading material uploaded.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const generate = async () => {
    if (!material) return;
    setLoading(true); setError(""); setMessage("Generating and grounding questions...");
    try {
      const response = await fetch(`${API}/materials/${material.id}/generate/`, {
        method: "POST"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");
      setGroup(data); setMessage("Five questions generated and checked.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const updateLocal = (id, payload) => {
    setGroup(current => ({
      ...current,
      questions: current.questions.map(q => q.id === id ? { ...q, ...payload } : q)
    }));
  };

  const saveQuestion = async (question) => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/questions/${question.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          options: question.options,
          answer: question.answer,
          explanation: question.explanation,
          reviewer_ok: question.reviewer_ok,
          reviewer_notes: question.reviewer_notes,
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed.");
      updateLocal(question.id, data);
      setMessage(`Question ${question.order} saved.`);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const approve = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/groups/${group.id}/approve/`, {
        method: "POST"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Approval failed.");
      setGroup(data); setMessage("Question group approved.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const allReviewed = group?.questions?.length === 5 &&
    group.questions.every(q => q.reviewer_ok);

  const allGrounded = group?.questions?.length === 5 &&
    group.questions.every(q => q.grounded);

  return (
    <main className="page">
      <header>
        <p className="eyebrow">AI Assessment Workflow</p>
        <h1>AI Question Generator</h1>
        <p className="subtitle">
          Generate, review and approve a five-question assessment.
        </p>
      </header>

      <section className="card">
        <h2>Reading material</h2>
        <input
          type="file"
          accept=".md,.markdown,.txt"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={upload} disabled={!file || loading}>
          Upload material
        </button>
        {material && <div className="success">Uploaded: <strong>{material.filename}</strong></div>}
      </section>

      {material && (
        <section className="card">
          <h2>Generate</h2>
          <button onClick={generate} disabled={loading}>Generate five questions</button>
        </section>
      )}

      {message && <div className="notice success">{message}</div>}
      {error && <div className="notice error">{error}</div>}

      {group && (
        <>
          <section className="status-card">
            <div><strong>Review:</strong> {allReviewed ? "All reviewed" : "Pending"}</div>
            <div><strong>Grounding:</strong> {allGrounded ? "All grounded" : "Correction required"}</div>
            <div><strong>Group:</strong> {group.status}</div>
          </section>

          {group.questions.map(question => (
            <QuestionCard
              key={question.id}
              question={question}
              onChange={updateLocal}
              onSave={saveQuestion}
              disabled={group.status === "approved"}
            />
          ))}

          <section className="card actions">
            <button
              className="primary"
              onClick={approve}
              disabled={loading || group.status === "approved" || !allReviewed || !allGrounded}
            >
              Approve question group
            </button>
            <button
              disabled={group.status !== "approved"}
              onClick={() => window.open(`${API}/groups/${group.id}/export/`, "_blank")}
            >
              Export tagged format
            </button>
            {!allReviewed && <p className="hint">Review and save all five questions first.</p>}
            {allReviewed && !allGrounded &&
              <p className="hint warning">Correct every ungrounded question before approval.</p>}
          </section>
        </>
      )}
    </main>
  );
}

function QuestionCard({ question, onChange, onSave, disabled }) {
  const update = (field, value) => onChange(question.id, { [field]: value });

  const updateOption = (index, value) => {
    const options = [...question.options];
    options[index] = value;
    update("options", options);
  };

  return (
    <section className="card question-card">
      <div className="question-header">
        <div>
          <span className="number">Question {question.order}</span>
          <span className="type">{question.qtype}</span>
        </div>
        <span className={question.grounded ? "badge good" : "badge bad"}>
          {question.grounded ? "Grounded" : "Needs correction"}
        </span>
      </div>

      {!question.grounded && (
        <div className="warning-box">
          <strong>Grounding feedback</strong>
          <p>{question.grounding_reason}</p>
        </div>
      )}

      <label>Question</label>
      <textarea value={question.question}
        onChange={e => update("question", e.target.value)} disabled={disabled} />

      {question.qtype === "MCQ" && (
        <>
          <label>Options</label>
          {question.options.map((option, index) => (
            <input key={index} value={option}
              onChange={e => updateOption(index, e.target.value)}
              disabled={disabled} />
          ))}
        </>
      )}

      <label>Answer</label>
      <input value={question.answer}
        onChange={e => update("answer", e.target.value)} disabled={disabled} />

      <label>Explanation</label>
      <textarea value={question.explanation}
        onChange={e => update("explanation", e.target.value)} disabled={disabled} />

      <div className="evidence">
        <strong>Source evidence</strong>
        <p>{question.source_excerpt}</p>
      </div>

      <label>Reviewer notes</label>
      <textarea value={question.reviewer_notes || ""}
        onChange={e => update("reviewer_notes", e.target.value)} disabled={disabled} />

      <label className="checkbox">
        <input type="checkbox" checked={question.reviewer_ok}
          onChange={e => update("reviewer_ok", e.target.checked)}
          disabled={disabled} />
        I reviewed and approve this question
      </label>

      <button onClick={() => onSave(question)} disabled={disabled}>Save review</button>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
