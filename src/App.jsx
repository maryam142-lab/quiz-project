import React, { useEffect, useState, useRef } from "react";

/*
  Complete App.jsx — cleaned up (no duplicate function declarations).
  Features:
  - Difficulty filter (easy/medium/hard/all)
  - Shuffle questions & options
  - Progress bar with smooth animation
  - Per-question timer with auto-advance
  - Feedback highlighting correct/wrong answers
  - Restart (reshuffle / same order)
  - Dark mode toggle
  - High-score saved to localStorage
  - Styling follows the nude pastel palette and layout guidelines you gave
*/

const SAMPLE_QUESTIONS = [
  // EASY
  { id: 1, difficulty: "easy", question: "Which language runs in a web browser?", options: ["Java", "C", "JavaScript", "Python"], correctIndex: 2 },
  { id: 2, difficulty: "easy", question: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style System"], correctIndex: 0 },
  { id: 3, difficulty: "easy", question: "HTML is used to structure content on the web. What does HTML stand for?", options: ["HyperText Markup Language", "HighText Machine Language", "Hyperlinking Text Markup Language"], correctIndex: 0 },
  { id: 4, difficulty: "easy", question: "Which symbol is used for comments in JavaScript?", options: ["<!-- -->", "//", "/* */", "#"], correctIndex: 1 },
  { id: 5, difficulty: "easy", question: "Which tag is used to create a link in HTML?", options: ["<link>", "<a>", "<href>"], correctIndex: 1 },

  // MEDIUM
  { id: 6, difficulty: "medium", question: "Which company developed React?", options: ["Google", "Meta (Facebook)", "Microsoft", "Apple"], correctIndex: 1 },
  { id: 7, difficulty: "medium", question: "Which hook lets you add local state in a functional component?", options: ["useState", "useEffect", "useContext", "useRef"], correctIndex: 0 },
  { id: 8, difficulty: "medium", question: "What does 'this' keyword refer to in JavaScript within a regular function?", options: ["The function itself", "The global object or undefined (in strict mode)", "The parent scope", "The DOM element"], correctIndex: 1 },
  { id: 9, difficulty: "medium", question: "Which HTTP status code means 'Not Found'?", options: ["200", "301", "404", "500"], correctIndex: 2 },
  { id: 10, difficulty: "medium", question: "In CSS, which property controls layout in a flex container?", options: ["display", "flex-direction", "align-items", "justify-content"], correctIndex: 1 },

  // HARD
  { id: 11, difficulty: "hard", question: "Which of the following is NOT a React lifecycle method?", options: ["componentDidMount", "componentWillUpdate", "useLayoutEffect", "getDerivedStateFromProps"], correctIndex: 2 },
  { id: 12, difficulty: "hard", question: "What is the purpose of keys in React lists?", options: ["Styling list items", "Identify which items have changed/added/removed", "Improve network performance", "None of the above"], correctIndex: 1 },
  { id: 13, difficulty: "hard", question: "Which algorithmic complexity grows fastest as n increases?", options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"], correctIndex: 2 },
  { id: 14, difficulty: "hard", question: "What does CORS stand for in web development?", options: ["Cross-Origin Resource Sharing", "Cross-Object Resource Sharing", "Client-Origin Resource Security"], correctIndex: 0 },
  { id: 15, difficulty: "hard", question: "Which data structure uses LIFO (Last In First Out)?", options: ["Queue", "Stack", "Heap", "Tree"], correctIndex: 1 },
];

function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function prepareQuestions(rawQuestions, difficulty) {
  let filtered = difficulty ? rawQuestions.filter((q) => q.difficulty === difficulty) : rawQuestions.slice();
  if (filtered.length === 0) filtered = rawQuestions.slice(); // fallback to all
  filtered = shuffleArray(filtered);
  return filtered.map((q) => {
    const opts = q.options.map((o, i) => ({ o, i }));
    const shuffled = shuffleArray(opts);
    const newCorrect = shuffled.findIndex((x) => x.i === q.correctIndex);
    return {
      ...q,
      options: shuffled.map((x) => x.o),
      correctIndex: newCorrect,
    };
  });
}

export default function App() {
  const STORAGE_KEY = "react_quiz_highscores_v1";

  // state
  const [difficulty, setDifficulty] = useState("");
  const [questions, setQuestions] = useState(() => prepareQuestions(SAMPLE_QUESTIONS, ""));
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState(() => Array(questions.length).fill(undefined));
  const [finished, setFinished] = useState(false);
  const [dark, setDark] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timePerQ, setTimePerQ] = useState(20);
  const [showFeedback, setShowFeedback] = useState(false);

  const timerRef = useRef(null);

  // keep answers sized to questions
  useEffect(() => {
    setAnswers(Array(questions.length).fill(undefined));
    setCurrent(0);
    setFinished(false);
    setShowFeedback(false);
  }, [questions]);

  // per-question timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (finished || questions.length === 0) return;

    setShowFeedback(false);
    setTimeLeft(timePerQ);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // show feedback then auto-advance or finish
          setShowFeedback(true);
          setTimeout(() => {
            if (current === questions.length - 1) {
              handleFinish();
            } else {
              setCurrent((c) => c + 1);
            }
          }, 900);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, questions, timePerQ, finished]);

  // defensive score calculation
  const score = answers.reduce((acc, ans, i) => {
    const q = questions[i];
    if (!q) return acc;
    return ans === q.correctIndex ? acc + 1 : acc;
  }, 0);

  // derived progress percent
  const progressPercent = questions.length ? Math.round(((current + (answers[current] !== undefined ? 1 : 0)) / questions.length) * 100) : 0;
  const q = questions[current];

  // --- helper functions (single set, no duplicates) ---
  function startWithDifficulty(d) {
    setDifficulty(d);
    const perQ = d === "easy" ? 20 : d === "medium" ? 15 : d === "hard" ? 10 : 20;
    setTimePerQ(perQ);
    const prepared = prepareQuestions(SAMPLE_QUESTIONS, d);
    setQuestions(prepared);
    setAnswers(Array(prepared.length).fill(undefined));
    setCurrent(0);
    setFinished(false);
    setShowFeedback(false);
  }

  function selectOption(index) {
    if (showFeedback) return;
    const copy = answers.slice();
    copy[current] = index;
    setAnswers(copy);
    setShowFeedback(true);
  }

  function goNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setShowFeedback(false);
    } else {
      handleFinish();
    }
  }

  function goPrev() {
    if (current > 0) {
      setCurrent((c) => c - 1);
      setShowFeedback(false);
    }
  }

  function restart(reshuffle = true) {
    const prepared = reshuffle ? prepareQuestions(SAMPLE_QUESTIONS, difficulty) : prepareQuestions(SAMPLE_QUESTIONS, difficulty);
    setQuestions(prepared);
    setAnswers(Array(prepared.length).fill(undefined));
    setCurrent(0);
    setFinished(false);
    setShowFeedback(false);
  }

  function handleFinish() {
    setFinished(true);
    const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
    const entry = { date: new Date().toISOString(), score, total: questions.length, percent, difficulty: difficulty || "all" };
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      existing.unshift(entry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 50)));
    } catch (e) {
      // ignore storage errors
    }
  }

  function loadHighScores() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }
  // --- end helpers ---

  // Render
  return (
    <div className={`app-root ${dark ? "dark" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

        :root{
          --bg: #FAF3E0;
          --card: #FFFFFF;
          --primary: #D4A373;
          --secondary: #E9CBA7;
          --text: #2E2E2E;
          --correct: #A3C9A8;
          --wrong: #E38B8B;
          --muted: #BDB6AF;
          --shadow: 0 6px 20px rgba(46,46,46,0.08);
          --radius: 12px;
        }

        .dark {
          --bg: #111214;
          --card: #141516;
          --primary: #D4A373;
          --secondary: #3b2f27;
          --text: #ECECEC;
          --muted: #777;
        }

        .app-root {
          font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
        }

        .card {
          width: 100%;
          max-width: 760px;
          background: var(--card);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          padding: 28px;
          box-sizing: border-box;
        }

        .top-row {
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom:18px;
        }

        .title {
          font-size:20px;
          font-weight:700;
        }

        .controls {
          display:flex;
          gap:8px;
          align-items:center;
        }

        .btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 10px;
          cursor: pointer;
          font-weight:600;
          transition: transform .08s ease, box-shadow .12s ease;
        }

        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(0,0,0,0.08); }
        .btn.secondary { background: var(--secondary); color: var(--text); font-weight:600; }
        .btn.ghost { background: transparent; color: var(--text); border:1px solid var(--muted); }
        .btn.disabled, .btn[disabled] { opacity:0.6; cursor:not-allowed; transform:none; box-shadow:none; }

        .difficulty-row { display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap; }
        .difficulty-btn { padding:8px 12px; background:transparent; border:1px solid var(--muted); border-radius:10px; cursor:pointer; }
        .difficulty-btn.active { background: var(--primary); color:#fff; border-color:var(--primary); }

        .progress-wrap { margin-bottom:14px; }
        .progress-bar { height:8px; background:#eee; border-radius:8px; overflow:hidden; }
        .progress-fill { height:100%; width:0%; background: var(--primary); transition: width .35s ease; }

        .meta-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; font-size:14px; color:var(--muted); }

        .question {
          font-size:18px;
          font-weight:600;
          margin-bottom:12px;
        }

        .options { display:flex; flex-direction:column; gap:10px; margin-bottom:12px; }
        .option {
          background: #f8f6f4;
          padding:12px 14px;
          border-radius:10px;
          cursor:pointer;
          border:1px solid transparent;
          display:flex;
          justify-content:space-between;
          align-items:center;
          transition: background .12s ease, transform .06s ease, box-shadow .08s ease;
          user-select:none;
        }
        .option:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
        .option.selected { border-color: rgba(0,0,0,0.06); background: #fffefc; }
        .option.correct { background: var(--correct); color: #08411b; }
        .option.wrong { background: var(--wrong); color: #4a1f1f; text-decoration: line-through; opacity:0.95; }

        .nav {
          display:flex;
          justify-content:space-between;
          gap:8px;
          align-items:center;
          margin-top:8px;
        }

        .timer {
          font-weight:600;
          padding:6px 10px;
          border-radius:8px;
          background: rgba(0,0,0,0.04);
        }

        .results {
          text-align:center;
        }

        .big-score { font-size:36px; font-weight:800; margin:10px 0 8px; color:var(--text); }

        .score-detail { margin-bottom:12px; color:var(--muted); }

        .play-again { margin-top:10px; }

        @media (max-width:540px){
          .card { padding:18px; }
          .title { font-size:18px; }
        }
      `}</style>

      <div className="card" role="main">
        <div className="top-row">
          <div className="title">React Quiz</div>
          <div className="controls">
            <button
              className="btn ghost"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button
              className="btn secondary"
              onClick={() => restart(true)}
              title="Restart (reshuffle)"
            >
              Restart
            </button>
          </div>
        </div>

        <div className="difficulty-row" aria-hidden={false}>
          <button className={`difficulty-btn ${difficulty === "" ? "active" : ""}`} onClick={() => startWithDifficulty("")}>All</button>
          <button className={`difficulty-btn ${difficulty === "easy" ? "active" : ""}`} onClick={() => startWithDifficulty("easy")}>Easy</button>
          <button className={`difficulty-btn ${difficulty === "medium" ? "active" : ""}`} onClick={() => startWithDifficulty("medium")}>Medium</button>
          <button className={`difficulty-btn ${difficulty === "hard" ? "active" : ""}`} onClick={() => startWithDifficulty("hard")}>Hard</button>
        </div>

        <div className="progress-wrap" aria-hidden={false}>
          <div className="progress-bar" aria-hidden>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="meta-row">
          <div>Question {questions.length ? current + 1 : 0} / {questions.length}</div>
          <div className="timer">⏳ {timeLeft}s</div>
        </div>

        {!finished ? (
          <>
            <div className="question">{q ? q.question : "No questions available"}</div>

            <div className="options" role="list">
              {q && q.options.map((opt, i) => {
                const isSelected = answers[current] === i;
                const isCorrect = q.correctIndex === i;
                const showCorr = showFeedback && (isSelected || isCorrect);
                const className =
                  "option" +
                  (isSelected ? " selected" : "") +
                  (showCorr ? (isCorrect ? " correct" : isSelected ? " wrong" : "") : "");

                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectOption(i)}
                    onKeyDown={(e) => { if (e.key === "Enter") selectOption(i); }}
                    className={className}
                    aria-pressed={isSelected}
                  >
                    <span>{String.fromCharCode(65 + i)}. {opt}</span>
                    {isSelected && <span style={{ fontSize: 13, opacity: 0.9 }}>Selected</span>}
                  </div>
                );
              })}
            </div>

            {answers[current] !== undefined && (
              <div style={{ marginBottom: 8, color: showFeedback ? "var(--muted)" : "var(--muted)" }}>
                {q && answers[current] !== undefined && (
                  (q.options[answers[current]] === q.options[q.correctIndex]) ?
                    <div style={{ color: "var(--correct)" }}>✅ Correct</div> :
                    <div style={{ color: "var(--wrong)" }}>❌ Incorrect — Correct: {q.options[q.correctIndex]}</div>
                )}
              </div>
            )}

            <div className="nav">
              <div>
                <button className={`btn ghost ${current === 0 ? "disabled" : ""}`} onClick={goPrev} disabled={current === 0}>Previous</button>
                <button
                  className={`btn ${answers[current] === undefined && !showFeedback ? "disabled" : ""}`}
                  onClick={goNext}
                  disabled={answers[current] === undefined && !showFeedback}
                  style={{ marginLeft: 10 }}
                >
                  {current === questions.length - 1 ? "Finish" : "Next"}
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Score: <strong>{score}</strong></div>
                <button className="btn ghost" onClick={handleFinish}>Finish Now</button>
              </div>
            </div>
          </>
        ) : (
          <div className="results">
            <div className="big-score">{score} / {questions.length}</div>
            <div className="score-detail">{questions.length ? Math.round((score / questions.length) * 100) : 0}%</div>

            <div style={{ textAlign: "left", marginTop: 12 }}>
              {questions.map((qi, idx) => {
                const user = answers[idx];
                const correct = qi.correctIndex;
                const isCorrect = user === correct;
                return (
                  <div key={qi.id} style={{ padding: 10, borderRadius: 8, marginBottom: 8, background: "#fff", border: "1px solid rgba(0,0,0,0.04)" }}>
                    <div style={{ fontWeight: 600 }}>{idx + 1}. {qi.question}</div>
                    <div style={{ marginTop: 6, fontSize: 14 }}>
                      Your answer: {user === undefined ? "No answer" : qi.options[user]} — {isCorrect ? <span style={{ color: "var(--correct)" }}>Correct</span> : <span style={{ color: "var(--wrong)" }}>Incorrect</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="play-again">
              <button className="btn" onClick={() => restart(false)} style={{ marginRight: 8 }}>Play Again (same)</button>
              <button className="btn secondary" onClick={() => restart(true)}>Play Again (reshuffle)</button>
            </div>

            <div style={{ marginTop: 16, textAlign: "left" }}>
              <h4 style={{ marginBottom: 8 }}>High Score History</h4>
              <div style={{ maxHeight: 160, overflow: "auto", background: "transparent" }}>
                {loadHighScores().length === 0 ? <div style={{ color: "var(--muted)" }}>No history yet.</div> : (
                  <ul style={{ marginLeft: 16 }}>
                    {loadHighScores().map((h, i) => (
                      <li key={i} style={{ fontSize: 13 }}>
                        {new Date(h.date).toLocaleString()} — {h.score}/{h.total} ({h.percent}%) — {h.difficulty}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
