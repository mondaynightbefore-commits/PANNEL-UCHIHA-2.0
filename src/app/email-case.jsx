import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Download, Copy, RefreshCw } from "lucide-react";

// --- Helpers ---
const EMAIL_REGEX = /.+@.+\..+/;

function letterPositions(str) {
  const pos = [];
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if ((ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z")) pos.push(i);
  }
  return pos;
}

function flipCases(base, positions, mask) {
  // mask is a BigInt bitmask mapping to positions[]
  const arr = base.split("");
  for (let b = 0n; b < BigInt(positions.length); b++) {
    const on = (mask >> b) & 1n;
    if (on === 1n) {
      const idx = positions[Number(b)];
      const ch = arr[idx];
      arr[idx] = ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase();
    }
  }
  return arr.join("");
}

function sampleUniqueBigInt(maxExclusive, k) {
  // Reservoir-like sampling using a Set of BigInt indices
  const set = new Set();
  while (set.size < k) {
    // generate a random BigInt in [0, maxExclusive)
    const rand = BigInt.asUintN(64, BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
    const pick = rand % maxExclusive;
    set.add(pick);
  }
  return Array.from(set);
}

export default function App() {
  const [email, setEmail] = useState("mondaynightbefore@gmail.com");
  const [qty, setQty] = useState(10);
  const [variations, setVariations] = useState([]);
  const [useCustom, setUseCustom] = useState(false);
  const [customIndexes, setCustomIndexes] = useState("");

  const allLetterPositions = useMemo(() => letterPositions(email), [email]);
  const customPositions = useMemo(() => {
    if (!useCustom) return allLetterPositions;
    const parts = customIndexes
      .split(/[ ,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n >= 0 && n < email.length);
    return parts.length ? parts : allLetterPositions;
  }, [useCustom, customIndexes, email, allLetterPositions]);

  const lettersCount = customPositions.length;
  const totalPossible = useMemo(() => {
    // 2^n using BigInt
    return 1n << BigInt(lettersCount);
  }, [lettersCount]);

  const totalDisplay = useMemo(() => {
    // format BigInt with commas
    const s = totalPossible.toString();
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }, [totalPossible]);

  const generate = () => {
    if (!EMAIL_REGEX.test(email)) {
      alert("Please enter a valid email (e.g., name@example.com)");
      return;
    }
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) {
      alert("Quantity must be a positive number");
      return;
    }

    const max = totalPossible; // BigInt
    const want = BigInt(Math.min(n, 5000)); // safety cap

    let picks = [];

    // If the space is small (<= 1e5), enumerate from 0 upward for consistency
    if (max <= 100000n) {
      const upto = Number(max < want ? max : want);
      picks = Array.from({ length: upto }, (_, i) => BigInt(i));
    } else {
      // otherwise sample uniformly at random
      picks = sampleUniqueBigInt(max, Number(want));
    }

    const base = email;
    const pos = customPositions;

    const out = picks.map((mask) => flipCases(base, pos, mask));
    setVariations(out);
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(variations.join("\n"));
    } catch (e) {
      console.error(e);
      alert("Copy failed. Your browser might block clipboard access.");
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([variations.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email_case_variations.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const reset = () => setVariations([]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white p-4">
      <div className="max-w-3xl mx-auto py-8">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-center mb-2 text-cyan-300"
        >
          TG Gangster — Email Case Variation Generator
        </motion.h1>
        <p className="text-center text-zinc-300 mb-8">
          Give any email. We'll flip letter cases across the address to generate unique variations.
        </p>

        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Enter Email Address</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-zinc-800/60 border-zinc-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-zinc-900/60 rounded-2xl p-4 text-center shadow">
                <div className="text-sm text-zinc-400">TOTAL POSSIBLE</div>
                <div className="text-2xl font-semibold mt-1">{totalDisplay}</div>
              </div>
              <div className="bg-zinc-900/60 rounded-2xl p-4 text-center shadow">
                <div className="text-sm text-zinc-400">GENERATED</div>
                <div className="text-2xl font-semibold mt-1">{variations.length}</div>
              </div>
              <div className="bg-zinc-900/60 rounded-2xl p-4 text-center shadow">
                <div className="text-sm text-zinc-400">LETTERS</div>
                <div className="text-2xl font-semibold mt-1">{letterPositions(email).length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-zinc-400">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  max={5000}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="bg-zinc-800/60 border-zinc-700 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={generate} className="flex-1">Generate</Button>
                <Button onClick={reset} variant="secondary" className="flex-1" title="Clear">
                  <RefreshCw className="w-4 h-4 mr-2" /> Reset
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Switch checked={useCustom} onCheckedChange={setUseCustom} id="custom" />
              <label htmlFor="custom" className="text-sm text-zinc-300">Custom letter positions</label>
            </div>
            {useCustom && (
              <div className="space-y-1">
                <p className="text-xs text-zinc-400">
                  Provide index numbers (0-based) for the characters whose case can flip. Separate with space or comma.
                </p>
                <Input
                  value={customIndexes}
                  onChange={(e) => setCustomIndexes(e.target.value)}
                  placeholder="e.g., 0 1 2 5 7 9"
                  className="bg-zinc-800/60 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500">Tip: indexes refer to the full email string, including the domain.</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={copyAll} variant="secondary">
                <Copy className="w-4 h-4 mr-2" /> Copy All
              </Button>
              <Button onClick={downloadTxt} variant="secondary">
                <Download className="w-4 h-4 mr-2" /> Download TXT
              </Button>
            </div>

            <div className="mt-4 max-h-80 overflow-auto bg-zinc-950/40 border border-zinc-800 rounded-2xl p-3">
              {variations.length === 0 ? (
                <p className="text-sm text-zinc-500">No variations yet. Click Generate to create some.</p>
              ) : (
                <ol className="text-sm space-y-2">
                  {variations.map((v, i) => (
                    <li key={i} className="truncate px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800">{v}</li>
                  ))}
                </ol>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-zinc-500 text-center mt-6">
          Note: Case-insensitive handling varies by provider. Gmail ignores case in the username. This tool simply flips letter cases across the whole address.
        </p>
      </div>
    </div>
  );
}
