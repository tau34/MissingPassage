import { useState, useEffect } from "react";
import nlp from "compromise";

const defaultText = `Hey guys, we have a gift for you! We just need you to answer a few questions first, then you'll earn a nice reward. It's very quick and simple! It only takes a minute. So come on, click on the following link to claim your gift. Don't wait, time is running out! Click on the link and enjoy your free gift. Now hurry up!`;

const defaultProbs: Record<string, number> = {
  Noun: 0.5,
  Verb: 0.6,
  Adjective: 0.3,
  Adverb: 0.2,
  Preposition: 0.2,
  Conjunction: 0.15,
  Determiner: 0.05,
  Pronoun: 0.05,
  Modal: 0.1,
  Unknown: 0.1,
};

type Term = {
  text: string;
  tags: string[];
};

type TermJSON = {
  terms: Term[];
};

function App() {
  const [text, setText] = useState(localStorage.getItem("text") || defaultText);
  const [probs, setProbs] = useState(defaultProbs);
  const [maskMap, setMaskMap] = useState<boolean[]>([]);
  const [revealedIndexes, setRevealedIndexes] = useState<Set<number>>(new Set());
  const [tokens, setTokens] = useState<string[]>([]);
  const [probMultiplier, setProbMultiplier] = useState(1);
  const [showProbSettings, setShowProbSettings] = useState(false);

  const punctuationSet = new Set([",", ".", "!", "?"]);

  const generateMaskMap = (currentText: string, currentProbs: Record<string, number>) => {
    const doc = nlp(currentText);
    const termJSON: TermJSON[] = doc.terms().json() as TermJSON[];
    const termMap = new Map<string, string>();
    termJSON.forEach((item) => {
      const term = item.terms[0];
      if (term && term.text) {
        termMap.set(term.text, term.tags[0] ?? "Unknown");
      }
    });

    const newTokens = currentText.match(/\w+|[^\w\s]+|\s+/g) || [];
    setTokens(newTokens);

    const map = newTokens.map((tok) => {
      const isWord = /\w/.test(tok);
      if (!isWord || punctuationSet.has(tok.trim())) return false;
      const pos = termMap.get(tok.trim()) ?? "Unknown";
      return Math.random() < ((currentProbs[pos] ?? 0.1) * probMultiplier);
    });
    setMaskMap(map);
    setRevealedIndexes(new Set());
  };

  useEffect(() => {
    generateMaskMap(text, probs);
  }, [text, probs, probMultiplier]);

  const toggleReveal = (index: number) => {
    setRevealedIndexes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const masked = tokens.map((tok, i) => {
    const shouldMask = maskMap[i];
    const isRevealed = revealedIndexes.has(i);
    if (tok.length === 0) return <></>;
    if (shouldMask && !isRevealed) {
      return (
        <button
          key={i}
          onClick={() => toggleReveal(i)}
          className="inline-block mx-1 border-b-4 border-blue-500 bg-blue-100 text-blue-700 cursor-pointer select-none px-2 rounded transition hover:bg-blue-200"
          aria-label="Reveal hidden word"
          type="button"
        >
          _____
        </button>
      );
    }

    return (
      <span
        key={i}
        className="inline-block mx-[1px] text-gray-900 select-text"
        onClick={() => (shouldMask ? toggleReveal(i) : undefined)}
        style={{ cursor: shouldMask ? "pointer" : "default" }}
      >
        {tok}
      </span>
    );
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🧠 Missing Passage</h1>

      <label className="block mb-2 font-semibold">Edit your text:</label>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          localStorage.setItem("text", e.target.value);
        }}
        rows={6}
        className="w-full p-2 mb-6 border rounded shadow-sm resize-y"
      />

      <div className="mb-4 flex flex-col md:flex-row items-start gap-4">
        <label className="block font-semibold mb-1">Overall Masking Multiplier:</label>
        <input
          type="number"
          min={0.05}
          max={5}
          step={0.05}
          value={probMultiplier}
          onChange={(e) => setProbMultiplier(parseFloat(e.target.value))}
          className="w-32 border rounded px-2 py-1"
        />
        <input
          type="range"
          min={0.05}
          max={5}
          step={0.05}
          value={probMultiplier}
          onChange={(e) => setProbMultiplier(parseFloat(e.target.value))}
          className="w-32 border rounded px-2 py-1"
        />
      </div>

      <button
        onClick={() => setShowProbSettings(!showProbSettings)}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
      >
        {showProbSettings ? "Hide" : "Show"} POS Probability Settings
      </button>

      {showProbSettings && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {Object.keys(probs).map((pos) => (
            <div key={pos}>
              <label className="block text-sm font-medium">{pos}</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={probs[pos]}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (val >= 0 && val <= 1) {
                    setProbs({ ...probs, [pos]: val });
                  }
                }}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          ))}
        </div>
      )}
      <br />
      <button
        onClick={() => generateMaskMap(text, probs)}
        className="mb-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
      >
        Regenerate Mask
      </button>

      <h2 className="text-xl font-semibold mb-2">Preview:</h2>
      <div className="p-4 bg-white rounded shadow text-lg leading-relaxed flex flex-wrap">
        {masked}
      </div>
    </div>
  );
}

export default App
