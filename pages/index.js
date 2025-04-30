import Head from 'next/head';
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ChallengeApp() {
  const [challenges, setChallenges] = useState([]);
  const [newChallengeText, setNewChallengeText] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [newPoints, setNewPoints] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const [step, setStep] = useState("idle");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPoints, setSelectedPoints] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [currentChallenge, setCurrentChallenge] = useState(null);

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("Fehler beim Laden:", error.message);
    } else {
      setChallenges(data);
    }
  };

  const submitChallenge = async () => {
    if (!newChallengeText.trim() || !newAuthor.trim()) return;

    const parsedPoints = parseInt(newPoints);
    if (isNaN(parsedPoints) || parsedPoints < 1 || parsedPoints > 5) {
      alert("Punkte müssen zwischen 1 und 5 liegen.");
      return;
    }

    const newChallenge = {
      text: newChallengeText.trim(),
      points: parsedPoints,
      author: newAuthor.trim(),
      date: new Date().toISOString(),
      status: null,
      player: null,
    };

    const { error } = await supabase.from("challenges").insert([newChallenge]);

    if (error) {
      console.error("Fehler beim Speichern der Challenge:", error.message);
      return;
    }

    await fetchChallenges();
    setNewChallengeText("");
    setNewAuthor("");
    setNewPoints(1);
    setShowForm(false);
  };

  const updateChallengeStatus = async (challengeId, status) => {
    const { error } = await supabase
      .from("challenges")
      .update({ status })
      .eq("id", challengeId);

    if (error) {
      console.error("Fehler beim Aktualisieren:", error.message);
    } else {
      fetchChallenges();
    }
  };

  const totalPoints = challenges.reduce((acc, c) => {
    if (c.status === "done" && c.player) {
      acc[c.player] = (acc[c.player] || 0) + c.points;
    }
    return acc;
  }, {});

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 gap-6 bg-gradient-to-br from-cyan-400 to-cyan-100 font-sans text-center">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * {
            font-family: 'Inter', sans-serif;
          }
        `}</style>
      </Head>
      <h1 className="text-3xl font-bold mb-6">🎒 Roadtrip Challenge Picker</h1>

      <button
        onClick={() => setShowAll(!showAll)}
        className="w-full max-w-xs mb-2 px-4 py-2 rounded-xl shadow-md bg-white hover:bg-cyan-200 transition font-semibold"
      >
        {showAll ? "Challenge-Liste verbergen" : "Alle Challenges anzeigen"}
      </button>

      {step === "idle" && (
        <button
          onClick={() => setStep("choosePlayer")}
          className="w-full max-w-xs mb-2 px-4 py-2 rounded-xl shadow-md bg-white hover:bg-cyan-200 transition font-semibold"
        >
          Challenge ziehen
        </button>
      )}

      {step === "choosePlayer" && (
        <div className="flex gap-4 mb-4 justify-center">
          <button
            onClick={() => {
              setSelectedPlayer("Paul");
              setStep("choosePoints");
            }}
            className="w-full max-w-xs mb-2 px-4 py-2 rounded-xl shadow-md bg-white hover:bg-cyan-200 transition font-semibold"
          >
            Paul wählt
          </button>
          <button
            onClick={() => {
              setSelectedPlayer("Marcel");
              setStep("choosePoints");
            }}
            className="w-full max-w-xs mb-2 px-4 py-2 rounded-xl shadow-md bg-white hover:bg-cyan-200 transition font-semibold"
          >
            Marcel wählt
          </button>
        </div>
      )}

      {step === "choosePoints" && (
        <div className="flex gap-2 mb-4 justify-center">
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              onClick={() => {
                setSelectedPoints(p);
                setStep("enterCode");
              }}
              className="w-full max-w-[4rem] px-3 py-1 rounded-xl shadow-md bg-white hover:bg-cyan-200 transition font-semibold"
            >
              {p} Punkte
            </button>
          ))}
        </div>
      )}

      {step === "enterCode" && (
        <div className="mb-4 flex justify-center">
          <input
            type="password"
            placeholder="Geheimcode eingeben"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className="border p-2 rounded mr-2"
          />
          <button
            onClick={() => {
              if (codeInput === "0301") {
                const filtered = challenges.filter(
                  (c) => c.status === null && c.points === selectedPoints
                );
                if (filtered.length === 0) {
                  alert("Keine passende Challenge gefunden.");
                  setStep("idle");
                  return;
                }
                const chosen = filtered[Math.floor(Math.random() * filtered.length)];
                setCurrentChallenge({ ...chosen, player: selectedPlayer });
                setStep("result");
              } else {
                setStep("idle");
              }
            }}
            className="w-full max-w-xs mb-2 px-4 py-2 rounded-xl shadow-md bg-white hover:bg-cyan-200 transition font-semibold"
          >
            Bestätigen
          </button>
        </div>
      )}

      {step === "result" && currentChallenge && (
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md text-center mb-4">
          <p className="text-xl font-semibold mb-2">{currentChallenge.text}</p>
          <p className="text-sm text-gray-500">Punkte: {currentChallenge.points}</p>
          <p className="text-xs text-gray-400">Zuständig: {currentChallenge.player}</p>
          <div className="flex gap-2 mt-4 justify-center">
            <button
              className="px-3 py-1 bg-green-500 text-white rounded"
              onClick={async () => {
                await supabase
                  .from("challenges")
                  .update({ status: "done", player: currentChallenge.player })
                  .eq("id", currentChallenge.id);
                setCurrentChallenge(null);
                setStep("idle");
                fetchChallenges();
              }}
            >
              ✅ Erledigt
            </button>
            <button
              className="px-3 py-1 bg-red-500 text-white rounded"
              onClick={async () => {
                await supabase
                  .from("challenges")
                  .update({ status: "failed", player: currentChallenge.player })
                  .eq("id", currentChallenge.id);
                setCurrentChallenge(null);
                setStep("idle");
                fetchChallenges();
              }}
            >
              ❌ Fehlgeschlagen
            </button>
          </div>
        </div>
      )}

      <button onClick={() => setShowForm(!showForm)} className="w-full max-w-xs mb-2 px-4 py-2 rounded-xl shadow-md bg-white hover:bg-cyan-200 transition font-semibold">
        {showForm ? "Challenge-Formular verbergen" : "Neue Challenge einreichen"}
      </button>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4">Neue Challenge einreichen</h2>

          <label className="block mb-1">Challenge Text</label>
          <textarea
            value={newChallengeText}
            onChange={(e) => setNewChallengeText(e.target.value)}
            className="mb-4 w-full border rounded p-2"
          />

          <label className="block mb-1">Dein Name</label>
          <input
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            className="mb-4 w-full border rounded p-2"
          />

          <label className="block mb-1">Punkte (1-5)</label>
          <input
            type="number"
            value={newPoints}
            onChange={(e) => setNewPoints(e.target.value)}
            min={1}
            max={5}
            className="mb-4 w-full border rounded p-2"
          />

          <button onClick={submitChallenge} className="px-4 py-2 bg-cyan-500 text-white rounded shadow">
            Challenge hinzufügen
          </button>
        </div>
      )}

      {showAll && (
        <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4">Alle Challenges</h2>
          {challenges.map((c, i) => (
            <div key={i} className="border-b py-2">
              <p className="font-medium">{c.text}</p>
              <p className="text-xs text-gray-600">
                Punkte: {c.points} | Von: {c.author} | Am: {new Date(c.date).toLocaleString()} | Spieler: {c.player || "-"}
              </p>
              <p className="text-xs mb-1">
                Status: {c.status === "done" ? "✅ Erledigt" : c.status === "failed" ? "❌ Fehlgeschlagen" : "⏳ Offen"}
              </p>
              <div className="flex gap-2 mt-1 justify-center">
                <button onClick={() => updateChallengeStatus(c.id, "done")} className="text-green-600">✅</button>
                <button onClick={() => updateChallengeStatus(c.id, "failed")} className="text-red-600">❌</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md mt-6">
        <h2 className="text-lg font-semibold mb-2">🏆 Leaderboard</h2>
        <p>Paul: {totalPoints["Paul"] || 0} Punkte</p>
        <p>Marcel: {totalPoints["Marcel"] || 0} Punkte</p>
      </div>
    </div>
  );
}