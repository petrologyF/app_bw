"use client";

import { useState, useCallback, useMemo } from "react";
import { AlignLeft, Copy, Check, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CleanOptions {
  removeLeadingTrailing: boolean;
  removeBlankLines: boolean;
  removeExtraSpaces: boolean;
  removeTabs: boolean;
  normalizeLineBreaks: boolean;
  toLowerCase: boolean;
  toUpperCase: boolean;
  removeNumbers: boolean;
  removeSymbols: boolean;
}

const DEFAULT_OPTIONS: CleanOptions = {
  removeLeadingTrailing: true,
  removeBlankLines: false,
  removeExtraSpaces: false,
  removeTabs: true,
  normalizeLineBreaks: true,
  toLowerCase: false,
  toUpperCase: false,
  removeNumbers: false,
  removeSymbols: false,
};

function cleanText(input: string, opts: CleanOptions): string {
  let text = input;

  if (opts.normalizeLineBreaks) {
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }

  if (opts.removeTabs) {
    text = text.replace(/\t/g, " ");
  }

  if (opts.removeExtraSpaces) {
    text = text.replace(/[ \t]+/g, " ");
  }

  if (opts.removeLeadingTrailing) {
    text = text
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  }

  if (opts.removeBlankLines) {
    text = text
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join("\n");
  }

  if (opts.removeNumbers) {
    text = text.replace(/\d/g, "");
  }

  if (opts.removeSymbols) {
    text = text.replace(/[^\w\s\u3000-\u9fff\uff00-\uffef]/g, "");
  }

  if (opts.toLowerCase) {
    text = text.toLowerCase();
  } else if (opts.toUpperCase) {
    text = text.toUpperCase();
  }

  return text;
}

const OPTIONS_CONFIG: {
  key: keyof CleanOptions;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    key: "removeLeadingTrailing",
    label: "Remove Leading/Trailing Spaces",
    description: "Removes whitespace at the start and end of each line",
    color: "teal",
  },
  {
    key: "removeBlankLines",
    label: "Remove Blank Lines",
    description: "Removes lines that contain only whitespace",
    color: "teal",
  },
  {
    key: "removeExtraSpaces",
    label: "Remove Extra Spaces",
    description: "Condenses multiple continuous spaces into a single space",
    color: "teal",
  },
  {
    key: "removeTabs",
    label: "Convert Tabs to Spaces",
    description: "Replaces tab characters (\\t) with spaces",
    color: "teal",
  },
  {
    key: "normalizeLineBreaks",
    label: "Normalize Line Breaks",
    description: "Unifies CRLF to LF",
    color: "teal",
  },
  {
    key: "toLowerCase",
    label: "To Lowercase",
    description: "Converts English letters to lowercase",
    color: "sky",
  },
  {
    key: "toUpperCase",
    label: "To Uppercase",
    description: "Converts English letters to uppercase",
    color: "sky",
  },
  {
    key: "removeNumbers",
    label: "Remove Numbers",
    description: "Removes all digits (0-9)",
    color: "rose",
  },
  {
    key: "removeSymbols",
    label: "Remove Symbols",
    description: "Removes everything except alphanumeric chars, spaces, and Japanese text",
    color: "rose",
  },
];

export default function TextCleanerPage() {
  const [input, setInput] = useState(
    "  Hello,   World!\t\r\nThis has extra   spaces.  \n\n  Blank lines above.  \n\n\tTabbed content\t"
  );
  const [options, setOptions] = useState<CleanOptions>(DEFAULT_OPTIONS);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => cleanText(input, options), [input, options]);

  const toggleOption = useCallback((key: keyof CleanOptions) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Mutually exclusive: lower/upper
      if (key === "toLowerCase" && next.toLowerCase) next.toUpperCase = false;
      if (key === "toUpperCase" && next.toUpperCase) next.toLowerCase = false;
      return next;
    });
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const countChars = (str: string) => ({
    chars: str.length,
    lines: str.split("\n").length,
    words: str.trim() ? str.trim().split(/\s+/).length : 0,
  });

  const inStats = countChars(input);
  const outStats = countChars(output);
  const removedChars = input.length - output.length;

  return (
    <div className="p-4 md:p-6 w-full max-w-[1400px] mx-auto h-screen flex flex-col space-y-6 overflow-hidden">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-extrabold text-white bg-gradient-to-r from-teal-400 to-cyan-400 text-transparent bg-clip-text">
          Text Cleaner
        </h2>
        <p className="text-zinc-400 text-sm mt-0.5">Apply text formatting and cleaning at once</p>
      </div>
      <Separator className="bg-zinc-800/50" />

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[280px_1fr_1fr] gap-4 overflow-hidden">
        {/* Options panel */}
        <div className="overflow-y-auto space-y-1 pr-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Clean Options
            </p>
            <button
              onClick={() => setOptions(DEFAULT_OPTIONS)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
          {OPTIONS_CONFIG.map((opt) => (
            <div
              key={opt.key}
              onClick={() => toggleOption(opt.key)}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                options[opt.key]
                  ? "bg-teal-500/10 border-teal-500/30"
                  : "bg-zinc-800/40 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <Switch
                checked={options[opt.key]}
                onCheckedChange={() => toggleOption(opt.key)}
                className="flex-shrink-0 mt-0.5"
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <p className={`text-sm font-medium ${options[opt.key] ? "text-zinc-100" : "text-zinc-400"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">{opt.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between flex-shrink-0">
            <Label className="text-zinc-300">Input Text</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-xs font-mono">
                {inStats.chars} chars / {inStats.lines} lines
              </Badge>
              <button
                onClick={() => setInput("")}
                className="text-zinc-600 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
            placeholder="Type or paste text here..."
          />
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Label className="text-zinc-300">Cleaned Text</Label>
              {removedChars > 0 && (
                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">
                  -{removedChars} chars
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-xs font-mono">
                {outStats.chars} chars / {outStats.lines} lines
              </Badge>
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="h-7 border-teal-500/30 text-teal-400 hover:bg-teal-500/10 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 text-sm font-mono resize-none focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
