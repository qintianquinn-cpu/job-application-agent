"use client";

import { useState, useRef, useEffect } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  text: string;
  proposal?: string; // refined content waiting for approval
}

interface RefineChatProps {
  currentContent: string;
  contentType: "cv" | "cover-letter";
  onContentUpdated: (newContent: string) => void;
}

export default function RefineChat({
  currentContent,
  contentType,
  onContentUpdated,
}: RefineChatProps) {
  const profile = useProfileStore((s) => s.profile);
  const { language, jdLanguage, currentAnalysis } = useAppStore();
  const analysis = currentAnalysis;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [proposedContent, setProposedContent] = useState<string | null>(null);
  const [proposedExplanation, setProposedExplanation] = useState<string>("");
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // UI labels use the toggle; content generation uses JD-detected language
  const t = (en: string, zh: string) => (language === "zh-TW" ? zh : en);
  const outputLang = jdLanguage || language;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, proposedContent]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError("");
    setProposedContent(null);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/refine-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentContent: proposedContent || currentContent,
          contentType,
          userRequest: text,
          language: outputLang,
          profile,
          analysis,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Refinement failed" }));
        throw new Error(err.error || "Refinement failed");
      }

      const data = await res.json();

      // Store proposal — do NOT apply yet
      setProposedContent(data.refinedContent);
      setProposedExplanation(data.explanation || t("Changes proposed.", "已提出修改建議。"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refinement failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (proposedContent) {
      onContentUpdated(proposedContent);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "✅ " + t("Applied: ", "已套用：") + proposedExplanation,
        },
      ]);
      setProposedContent(null);
      setProposedExplanation("");
    }
  };

  const handleDismiss = () => {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: t("Proposal dismissed.", "已取消修改建議。"),
      },
    ]);
    setProposedContent(null);
    setProposedExplanation("");
  };

  // Count rounds
  const roundCount = messages.filter((m) => m.role === "user").length;

  return (
    <Card className="border-blue-200 h-full flex flex-col">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>💬</span>
            {t("Refine with AI", "AI 討論修改")}
          </CardTitle>
          {roundCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {t(`Round ${roundCount}`, `第 ${roundCount} 輪`)}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {t(
            "Tell the AI what to change. It will propose edits for you to review before applying.",
            "告訴 AI 你想改什麼，它會先提出修改建議，你確認後才套用到預覽。"
          )}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3 min-h-0">
        {/* Messages */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-xs rounded-lg px-3 py-2 max-w-[90%] ${
                  m.role === "user"
                    ? "bg-blue-100 text-blue-900 ml-auto"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <span className="text-[10px] font-semibold text-gray-400 block mb-0.5">
                  {m.role === "user" ? t("You", "你") : "🤖 AI"}
                </span>
                {m.text}
              </div>
            ))}

            {/* Proposal card */}
            {proposedContent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-base">📝</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-800">
                      {t("AI proposes changes", "AI 修改建議")}
                    </p>
                    <p className="text-xs text-green-700 mt-1">{proposedExplanation}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="text-xs h-8"
                    onClick={handleApply}
                  >
                    ✅ {t("Apply", "套用")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={handleDismiss}
                  >
                    {t("Dismiss", "取消")}
                  </Button>
                </div>
              </div>
            )}

            {loading && (
              <div className="bg-gray-100 text-gray-400 text-xs rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                  {t("Thinking...", "思考中...")}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-500 text-xs rounded-lg px-3 py-2">
                ❌ {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              loading
                ? t("Waiting...", "等待中...")
                : proposedContent
                  ? t("Apply or dismiss first, then continue...", "先確認或取消建議，再繼續修改...")
                  : t("e.g. Make the drone bullet more specific...", "例：把 drone 那段改得更具體...")
            }
            className="text-xs"
            disabled={loading || !!proposedContent}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={loading || !input.trim() || !!proposedContent}
          >
            {loading ? "..." : t("Send", "發送")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
