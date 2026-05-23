import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { callAI } from "@/lib/ai.functions";
import { Sparkles, Target, BarChart3, PenLine, Send, Loader2, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/ai")({
  component: () => <RequireAuth><AIAdvisor /></RequireAuth>,
});

type Mode = "university_match" | "profile_analyzer" | "essay_coach";

function AIAdvisor() {
  const { profile } = useAuth();
  const ai = useServerFn(callAI);
  const [mode, setMode] = useState<Mode>("university_match");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [summary, setSummary] = useState("");

  const send = async (overrideMode?: Mode, overrideInput?: string) => {
    const m = overrideMode || mode;
    const userMsg = overrideInput || input;
    if (!userMsg.trim() || !profile) return;
    setLoading(true); setResult(null); setSummary("");

    const systemPrompts: Record<Mode, string> = {
      university_match: `You are an elite admissions advisor for Uzbek students. Based on the user's profile, recommend 6-9 universities. Use the suggest_universities tool to return structured JSON.`,
      profile_analyzer: `You are a brutally honest admissions analyst. Analyze the user's profile and identify strengths, gaps, and an overall verdict using the analyze_profile tool.`,
      essay_coach: `You are an Ivy League essay coach. Critique the user's essay text, identify strengths and weaknesses, and suggest a rewrite using the coach_essay tool.`,
    };

    const tools: Record<Mode, any> = {
      university_match: { name: "suggest_universities", description: "Return university recommendations.", parameters: { type: "object", properties: {
        summary: { type: "string" }, universities: { type: "array", items: { type: "object", properties: {
          name: { type: "string" }, country: { type: "string" }, flag: { type: "string" }, acceptance_rate: { type: "number" },
          match_level: { type: "string", enum: ["Safety", "Match", "Reach"] }, fit_score: { type: "number" },
          why_good_fit: { type: "string" }, main_concern: { type: "string" }, deadline: { type: "string" },
        }, required: ["name", "country", "match_level", "fit_score", "why_good_fit", "main_concern"] } },
        next_steps: { type: "array", items: { type: "string" } },
      }, required: ["summary", "universities", "next_steps"] } },
      profile_analyzer: { name: "analyze_profile", description: "Analyze the profile.", parameters: { type: "object", properties: {
        summary: { type: "string" }, overall_score: { type: "number" },
        strong_points: { type: "array", items: { type: "string" } },
        gaps: { type: "array", items: { type: "object", properties: {
          area: { type: "string" }, current: { type: "string" }, target: { type: "string" },
          how_to_fix: { type: "string" }, priority: { type: "string", enum: ["High", "Medium", "Low"] }, time_estimate: { type: "string" },
        }, required: ["area", "current", "target", "how_to_fix", "priority", "time_estimate"] } },
        verdict: { type: "string" },
      }, required: ["summary", "overall_score", "strong_points", "gaps", "verdict"] } },
      essay_coach: { name: "coach_essay", description: "Coach the essay.", parameters: { type: "object", properties: {
        summary: { type: "string" }, score: { type: "number" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "object", properties: {
          issue: { type: "string" }, quoted_text: { type: "string" }, fix: { type: "string" },
        }, required: ["issue", "quoted_text", "fix"] } },
        suggested_rewrite: { type: "string" }, tone: { type: "string" }, word_count_note: { type: "string" }, verdict: { type: "string" },
      }, required: ["summary", "score", "strengths", "weaknesses", "verdict"] } },
    };

    const profileContext = `User profile:
- Name: ${profile.full_name}
- Type: ${profile.user_type}
- GPA: ${profile.gpa}/${profile.gpa_scale}
- SAT: ${profile.sat || "N/A"}
- IELTS: ${profile.ielts || "N/A"}
- TOEFL: ${profile.toefl || "N/A"}
- Target countries: ${(profile.target_countries || []).join(", ")}
- Dream universities: ${(profile.dream_universities || []).join(", ")}
- Intended major: ${profile.intended_major}
- Extracurriculars: ${(profile.extracurriculars || []).join(", ")}
- Bio: ${profile.bio}`;

    try {
      const data = await ai({
        data: {
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompts[m] + "\n\n" + profileContext },
            { role: "user", content: userMsg },
          ],
          tools: [{ type: "function", function: tools[m] }],
          tool_choice: { type: "function", function: { name: tools[m].name } },
        },
      });
      const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      const parsed = args ? JSON.parse(args) : null;
      setResult(parsed); setSummary(parsed?.summary || "");
    } catch (e: any) {
      const status = e?.status || e?.cause?.status;
      if (status === 402) toast.error("Add credits to your Lovable AI workspace.");
      else if (status === 429) toast.error("Rate limited — try again in a moment.");
      else toast.error(e?.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const STARTERS = [
    { m: "university_match" as Mode, icon: Target, title: "Find universities that match my profile", text: "Suggest universities for me based on my profile." },
    { m: "profile_analyzer" as Mode, icon: BarChart3, title: "Analyze my profile — what am I missing?", text: "Analyze my profile and tell me what gaps I have." },
    { m: "essay_coach" as Mode, icon: PenLine, title: "Coach me on my essay", text: "Coach me. Here's my essay: [paste your essay here]" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)]">
      {/* Left: chat */}
      <div className="lg:w-[55%] flex flex-col border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3"><Sparkles className="size-5 text-primary" /><h1 className="text-xl font-bold">AI Advisor</h1></div>
          <Tabs value={mode} onValueChange={v => setMode(v as Mode)}>
            <TabsList className="w-full">
              <TabsTrigger value="university_match" className="flex-1"><Target className="size-4 mr-1.5" />Match</TabsTrigger>
              <TabsTrigger value="profile_analyzer" className="flex-1"><BarChart3 className="size-4 mr-1.5" />Analyze</TabsTrigger>
              <TabsTrigger value="essay_coach" className="flex-1"><PenLine className="size-4 mr-1.5" />Essay</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!result && !loading && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Start with a prompt:</p>
              {STARTERS.map(p => {
                const Icon = p.icon;
                return (
                  <button key={p.title} onClick={() => { setMode(p.m); setInput(p.text); send(p.m, p.text); }}
                    className="w-full text-left surface-card p-4 hover:border-primary/40 transition-colors flex items-start gap-3">
                    <Icon className="size-5 text-primary mt-0.5 shrink-0" />
                    <div className="font-medium">{p.title}</div>
                  </button>
                );
              })}
            </div>
          )}
          {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Thinking…</div>}
          {summary && <div className="surface-card p-4 text-sm leading-relaxed">{summary}</div>}
        </div>

        <div className="p-3 border-t border-border flex gap-2">
          <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything..." rows={2}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <Button onClick={() => send()} disabled={loading} className="bg-primary hover:bg-accent self-end">
            <Send className="size-4" />
          </Button>
        </div>
      </div>

      {/* Right: results panel */}
      <div className="flex-1 overflow-y-auto p-6 bg-surface/30">
        {!result ? <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
          <Sparkles className="size-12 text-primary/40 mb-3" />
          <p>Results will appear here.</p>
        </div> : (
          <>
            {mode === "university_match" && <MatchPanel data={result} />}
            {mode === "profile_analyzer" && <AnalyzerPanel data={result} />}
            {mode === "essay_coach" && <EssayPanel data={result} />}
          </>
        )}
      </div>
    </div>
  );
}

function MatchPanel({ data }: any) {
  const counts = { Safety: 0, Match: 0, Reach: 0 };
  (data.universities || []).forEach((u: any) => counts[u.match_level as keyof typeof counts]++);
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex gap-2">
        <span className="px-3 py-1.5 rounded-full bg-success/15 text-success text-xs font-semibold">{counts.Safety} Safety</span>
        <span className="px-3 py-1.5 rounded-full bg-info/15 text-info text-xs font-semibold">{counts.Match} Match</span>
        <span className="px-3 py-1.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">{counts.Reach} Reach</span>
      </div>
      <div className="space-y-3">
        {(data.universities || []).map((u: any, i: number) => (
          <div key={i} className="surface-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="font-semibold">{u.flag || ""} {u.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{u.country} {u.acceptance_rate && `· ${u.acceptance_rate}% acceptance`} {u.deadline && `· ${u.deadline}`}</div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${u.match_level === "Safety" ? "bg-success/15 text-success" : u.match_level === "Match" ? "bg-info/15 text-info" : "bg-primary/15 text-primary"}`}>{u.match_level}</span>
                <div className="text-2xl font-bold mt-1">{u.fit_score}</div>
              </div>
            </div>
            <div className="text-sm mt-3 flex gap-2"><CheckCircle2 className="size-4 text-success mt-0.5 shrink-0" /><span>{u.why_good_fit}</span></div>
            <div className="text-sm mt-1 flex gap-2"><AlertTriangle className="size-4 text-gold mt-0.5 shrink-0" /><span>{u.main_concern}</span></div>
          </div>
        ))}
      </div>
      {data.next_steps?.length > 0 && (
        <div className="surface-card p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> Next steps</h3>
          <ol className="space-y-1.5 text-sm">{data.next_steps.map((s: string, i: number) => <li key={i} className="flex gap-2"><span className="text-primary">{i + 1}.</span> {s}</li>)}</ol>
        </div>
      )}
    </div>
  );
}

function AnalyzerPanel({ data }: any) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="surface-card p-6 flex items-center gap-6">
        <div className="size-24 rounded-full border-4 border-primary flex items-center justify-center">
          <div><div className="text-3xl font-bold">{data.overall_score}</div><div className="text-[10px] text-muted-foreground text-center">/100</div></div>
        </div>
        <div className="flex-1"><div className="text-xs text-muted-foreground">Overall Profile Score</div><div className="font-semibold mt-1">{data.verdict}</div></div>
      </div>

      {data.strong_points?.length > 0 && (
        <div className="surface-card p-4">
          <h3 className="font-semibold mb-2 text-success">Strong points</h3>
          <div className="space-y-1.5">{data.strong_points.map((p: string, i: number) => <div key={i} className="flex gap-2 text-sm"><CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" /> {p}</div>)}</div>
        </div>
      )}

      {data.gaps?.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Gaps to address</h3>
          {data.gaps.map((g: any, i: number) => (
            <div key={i} className="surface-card p-4">
              <div className="flex justify-between items-start">
                <div className="font-semibold flex items-center gap-2"><AlertTriangle className="size-4 text-gold" /> {g.area}</div>
                <span className={`text-xs px-2 py-0.5 rounded ${g.priority === "High" ? "bg-primary/20 text-primary" : "bg-gold/20 text-gold"}`}>{g.priority}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Now: {g.current} → Target: {g.target}</div>
              <div className="text-sm mt-2">{g.how_to_fix}</div>
              <div className="text-xs text-info mt-2">⏱ {g.time_estimate}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EssayPanel({ data }: any) {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="surface-card p-6 flex items-center gap-6">
        <div className="size-24 rounded-full border-4 border-primary flex items-center justify-center">
          <div><div className="text-3xl font-bold">{data.score}</div><div className="text-[10px] text-muted-foreground text-center">/100</div></div>
        </div>
        <div className="flex-1"><div className="text-xs text-muted-foreground">Essay Score</div><div className="font-semibold mt-1">{data.verdict}</div></div>
      </div>

      {data.strengths?.length > 0 && (
        <div className="surface-card p-4">
          <h3 className="font-semibold mb-2 text-success">Strengths</h3>
          <div className="flex flex-wrap gap-1.5">{data.strengths.map((s: string, i: number) => <span key={i} className="px-2 py-1 text-xs rounded bg-success/10 text-success">{s}</span>)}</div>
        </div>
      )}

      {data.weaknesses?.map((w: any, i: number) => (
        <div key={i} className="surface-card p-4">
          <div className="font-semibold text-primary">{w.issue}</div>
          <blockquote className="border-l-2 border-primary pl-3 my-2 text-sm italic text-muted-foreground">"{w.quoted_text}"</blockquote>
          <div className="text-sm">{w.fix}</div>
        </div>
      ))}

      {data.suggested_rewrite && (
        <div className="surface-card p-4 bg-info/5 border-info/20">
          <h3 className="font-semibold mb-2 text-info">Suggested rewrite</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.suggested_rewrite}</p>
        </div>
      )}

      <div className="flex gap-2 text-xs">
        {data.tone && <span className="px-2 py-1 rounded bg-surface-2">Tone: {data.tone}</span>}
        {data.word_count_note && <span className="px-2 py-1 rounded bg-surface-2">{data.word_count_note}</span>}
      </div>
    </div>
  );
}
