"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { signIn } from "@/lib/actions/auth";
import { UID_EXAMPLE, normaliseUid, parseUid } from "@/lib/uid";
import { btnClass } from "@/components/ui";

type Hostel = { id: string; name: string; crest: string; color: string };

export function EnrolForm({ hostels }: { hostels: Hostel[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"new" | "return">("new");
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const parsed = parseUid(uid);
  const hostel = hostels.find((h) => h.id === hostelId);
  const uidTouched = uid.length >= 10;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await signIn({ name: mode === "new" ? name : "", uid, hostelId: mode === "new" ? hostelId : "" });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/board");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="w-full max-w-[460px]" noValidate>
      <div className="mb-6 flex border border-ink-500" role="tablist" aria-label="Enrolment">
        {(
          [
            ["new", "入学", "Enrol"],
            ["return", "帰還", "Return"],
          ] as const
        ).map(([key, kanji, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={cn(
              "flex-1 py-2.5 font-display text-[13px] tracking-wider transition-colors",
              mode === key ? "bg-bone text-paper-ink" : "text-fg-muted hover:text-fg",
            )}
          >
            <span className="kanji mr-1.5 text-[15px]">{kanji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Live student card */}
      <div className="paper paper-frame relative mb-7 overflow-hidden px-6 pb-5 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] text-paper-muted">JUJUTSU HIGH · 学生証</p>
            <p className="mt-2 font-display text-[22px] leading-tight">
              {mode === "new" ? name.trim() || "Your name" : parsed ? "Welcome back" : "Sorcerer"}
            </p>
          </div>
          <span className="seal size-12 rotate-[-8deg] text-[24px]">{hostel?.crest ?? "呪"}</span>
        </div>
        <p
          className={cn(
            "mt-4 font-mono text-[26px] font-semibold tracking-[0.12em]",
            parsed ? "text-paper-ink" : "text-paper-muted/60",
          )}
        >
          {normaliseUid(uid) || UID_EXAMPLE}
        </p>
        <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-paper-ink/15 pt-3 text-[11px]">
          {[
            ["Batch", parsed ? String(parsed.year) : "—"],
            ["Course", parsed ? parsed.course : "—"],
            ["No.", parsed ? parsed.number : "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono uppercase tracking-widest text-paper-muted">{k}</dt>
              <dd className="font-display text-[15px]">{v}</dd>
            </div>
          ))}
        </dl>
        {parsed && <p className="mt-2 text-[12px] text-paper-muted">{parsed.courseName}</p>}
      </div>

      <div className="flex flex-col gap-5">
        {mode === "new" && (
          <Field label="Name" hint="As it should appear on the rankings.">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={80}
              placeholder="Yuji Itadori"
              className={inputCls}
            />
          </Field>
        )}

        <Field
          label="Student UID"
          hint={
            uidTouched && !parsed ? (
              <span className="text-blood-bright">Year, course, then 5 digits — like {UID_EXAMPLE}.</span>
            ) : (
              <>Year · course · number, e.g. {UID_EXAMPLE}</>
            )
          }
        >
          <input
            value={uid}
            onChange={(e) => setUid(normaliseUid(e.target.value).slice(0, 11))}
            autoCapitalize="characters"
            autoComplete="username"
            spellCheck={false}
            inputMode="text"
            placeholder={UID_EXAMPLE}
            aria-invalid={uidTouched && !parsed}
            className={cn(inputCls, "font-mono text-[18px] tracking-[0.14em]")}
          />
        </Field>

        {mode === "new" && (
          <fieldset>
            <legend className="mb-2 text-[13px] font-bold">Hostel</legend>
            <div className="grid grid-cols-4 gap-2">
              {hostels.map((h) => {
                const on = h.id === hostelId;
                return (
                  <button
                    key={h.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setHostelId(h.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 border py-2.5 transition-all",
                      on ? "border-transparent bg-ink-700" : "border-ink-600 hover:border-ink-400",
                    )}
                    style={on ? { boxShadow: `0 0 0 1.5px ${h.color}, 0 0 18px -4px ${h.color}` } : undefined}
                  >
                    <span className="kanji text-[24px]" style={{ color: on ? h.color : undefined }}>
                      {h.crest}
                    </span>
                    <span className="max-w-full truncate px-1 text-[11px] text-fg-muted">{h.name}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {error && (
          <p role="alert" className="border-l-2 border-blood bg-blood/10 px-3 py-2 text-[14px]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !parsed || (mode === "new" && (name.trim().length < 2 || !hostelId))}
          className={btnClass("blood", "lg", "mt-1 w-full")}
        >
          {pending ? "Binding…" : mode === "new" ? "Enrol as a sorcerer" : "Return to the board"}
        </button>
        <p className="text-center text-[12px] text-fg-faint">
          Prototype sign-in: your UID identifies you, it does not authenticate you.
        </p>
      </div>
    </form>
  );
}

const inputCls =
  "h-12 w-full border border-ink-500 bg-ink-800 px-3.5 text-[16px] text-fg placeholder:text-fg-faint focus:border-cursed focus:outline-none focus:ring-2 focus:ring-cursed/30";

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-fg-faint">{hint}</span>}
    </label>
  );
}
