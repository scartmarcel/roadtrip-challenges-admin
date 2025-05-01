import Head from 'next/head';
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ChallengeApp() {
  const [challenges, setChallenges] = useState([]);

  const [step, setStep] = useState("choosePlayer");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPoints, setSelectedPoints] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [currentChallenge, setCurrentChallenge] = useState(null);

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
            onClick={async () => {
              if (codeInput === "0301") {
                await fetchChallenges();
                const filtered = challenges.filter(
                  (c) => c.status === null && c.points === selectedPoints
                );
                if (filtered.length === 0) {
                  alert("Keine passende Challenge gefunden.");
                  setStep("idle");
                  return;
                }
                const chosen = filtered[Math.floor(Math.random() * filtered.length)];
                const challengeWithPlayer = Object.assign({}, chosen, { player: selectedPlayer });
                console.log("Aktueller Spieler:", selectedPlayer);
                console.log("Setzte Challenge:", challengeWithPlayer);
                setCurrentChallenge(challengeWithPlayer);
                console.log("NEUE CHALLENGE:", challengeWithPlayer);
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
                console.log("✅ Erledigt wurde geklickt");
                console.log("→ Versuche Update:", {
                  id: currentChallenge.id,
                  player: currentChallenge.player,
                });
                await fetchChallenges(); // Lade alle aktuellen Challenges erneut
                const { error } = await supabase
                  .from("challenges")
                  .update({ status: "done", player: currentChallenge.player })
                  .eq("id", currentChallenge.id);
                if (error) {
                  console.error("❌ Supabase-Fehler:", error.message);
                } else {
                  console.log("✅ Challenge erfolgreich aktualisiert");
                }
                setCurrentChallenge(null);
                setStep("feedback");
                fetchChallenges();
                setTimeout(() => setStep("choosePlayer"), 1500);
              }}
            >
              ✅ Erledigt
            </button>
            <button
              className="px-3 py-1 bg-red-500 text-white rounded"
              onClick={async () => {
                console.log("❌ Fehlgeschlagen wurde geklickt");
                console.log("→ Versuche Update:", {
                  id: currentChallenge.id,
                  player: currentChallenge.player,
                });
                await fetchChallenges();
                const { error } = await supabase
                  .from("challenges")
                  .update({ status: "failed", player: currentChallenge.player })
                  .eq("id", currentChallenge.id);
                if (error) {
                  console.error("❌ Supabase-Fehler:", error.message);
                } else {
                  console.log("✅ Challenge erfolgreich aktualisiert");
                }
                setCurrentChallenge(null);
                setStep("feedback");
                fetchChallenges();
                setTimeout(() => setStep("choosePlayer"), 1500);
              }}
            >
              ❌ Fehlgeschlagen
            </button>
          </div>
        </div>
      )}

      {step === "feedback" && (
        <div className="bg-white p-4 rounded-xl shadow text-green-700 text-center font-semibold">
          Status gespeichert!
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