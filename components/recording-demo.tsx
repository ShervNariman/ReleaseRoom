"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Code2,
  FileCheck2,
  Github,
  MousePointer2,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

const timings = [900, 2500, 4400, 7000, 9300, 11400, 13200];

function IntegrationPill({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm">
      {icon}
      {label}
      <span className="size-1.5 rounded-full bg-emerald-500" />
    </div>
  );
}

function CheckItem({
  label,
  detail,
  state = "passed",
  emphasized = false,
}: {
  label: string;
  detail: string;
  state?: "passed" | "missing";
  emphasized?: boolean;
}) {
  const passed = state === "passed";
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-500 ${
        passed
          ? "border-slate-200 bg-white"
          : emphasized
            ? "border-amber-300 bg-amber-50 shadow-[0_0_0_4px_rgba(251,191,36,.10)]"
            : "border-amber-200 bg-amber-50/70"
      }`}
    >
      <div
        className={`grid size-8 shrink-0 place-items-center rounded-xl ${
          passed
            ? "bg-emerald-50 text-emerald-600"
            : "bg-amber-100 text-amber-700"
        }`}
      >
        {passed ? (
          <Check className="size-4" strokeWidth={3} />
        ) : (
          <TriangleAlert className="size-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-slate-900">
          {label}
        </p>
        <p className="truncate text-[11px] text-slate-500">{detail}</p>
      </div>
      <span
        className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
          passed
            ? "bg-emerald-50 text-emerald-700"
            : "bg-amber-100 text-amber-800"
        }`}
      >
        {passed ? "Passed" : "Missing"}
      </span>
    </div>
  );
}

function RecordingSequence({ onReplay }: { onReplay: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = timings.map((milliseconds, index) =>
      setTimeout(() => setPhase(index + 1), milliseconds),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const proofAdded = phase >= 5;
  const ready = phase >= 6;
  const evidenceOpen = phase >= 2;
  const formOpen = phase >= 4 && phase < 6;
  const introVisible = phase === 0;

  const cursorStyle = useMemo(() => {
    if (phase <= 1) return { left: "76%", top: "68%" };
    if (phase === 2 || phase === 3) return { left: "42%", top: "71%" };
    if (phase === 4) return { left: "79%", top: "76%" };
    if (phase === 5) return { left: "84%", top: "82%" };
    return { left: "72%", top: "18%" };
  }, [phase]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#eef1f6] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,58,237,.10),transparent_26rem),radial-gradient(circle_at_88%_82%,rgba(16,185,129,.08),transparent_24rem)]" />

      <div className="absolute inset-x-8 bottom-7 top-7 overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_28px_90px_rgba(15,23,42,.16)]">
        <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-xl bg-slate-950 text-white">
              <Rocket className="size-4" />
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-tight">Release Room</p>
              <p className="text-[10px] font-medium text-slate-400">
                Founder command center
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IntegrationPill
              label="GitHub"
              icon={<Github className="size-3.5" />}
            />
            <IntegrationPill
              label="Linear"
              icon={<FileCheck2 className="size-3.5" />}
            />
            <IntegrationPill
              label="Vercel"
              icon={
                <TriangleAlert className="size-3.5 rotate-180 fill-current" />
              }
            />
            <IntegrationPill
              label="Cursor"
              icon={<Code2 className="size-3.5" />}
            />
          </div>
        </div>

        <div className="grid h-[calc(100%-3.5rem)] grid-cols-[190px_1fr]">
          <aside className="border-r border-slate-200 bg-slate-50/80 p-4">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
              Workspace
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                ["Now", true],
                ["Releases", false],
                ["Policies", false],
                ["Integrations", false],
                ["Activity", false],
              ].map(([label, active]) => (
                <div
                  key={String(label)}
                  className={`rounded-xl px-3 py-2.5 text-[12px] font-semibold ${
                    active
                      ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="absolute bottom-12 left-12 w-[150px] rounded-2xl border border-violet-200 bg-violet-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">
                Private beta
              </p>
              <p className="mt-1 text-[10px] leading-4 text-violet-800">
                Built for small AI-native startup teams.
              </p>
            </div>
          </aside>

          <section className="relative overflow-hidden bg-[#f8fafc] p-6">
            <div
              className={`transition-all duration-700 ${
                evidenceOpen
                  ? "-translate-x-3 scale-[.98] opacity-30 blur-[1px]"
                  : "translate-x-0 scale-100 opacity-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600">
                    Release candidate
                  </p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-[-.04em]">
                    Team billing settings
                  </h1>
                  <p className="mt-1 text-[12px] text-slate-500">
                    Stripe recovery flow · production candidate
                  </p>
                </div>
                <div
                  className={`rounded-2xl border px-4 py-3 text-right transition-all duration-700 ${
                    ready
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-red-300 bg-red-50"
                  }`}
                >
                  <p
                    className={`text-[10px] font-bold uppercase tracking-[.18em] ${
                      ready ? "text-emerald-700" : "text-red-700"
                    }`}
                  >
                    Release decision
                  </p>
                  <div className="mt-1 flex items-center justify-end gap-2">
                    {ready ? (
                      <CheckCircle2 className="size-5 text-emerald-600" />
                    ) : (
                      <TriangleAlert className="size-5 text-red-600" />
                    )}
                    <p
                      className={`text-xl font-bold ${
                        ready ? "text-emerald-800" : "text-red-800"
                      }`}
                    >
                      {ready ? "READY" : "BLOCKED"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {[
                  ["Intent", true],
                  ["Engineering", true],
                  ["Experience", proofAdded],
                  ["Operations", true],
                  ["Launch", true],
                ].map(([label, passed]) => (
                  <div
                    key={String(label)}
                    className={`rounded-2xl border p-3 ${
                      passed
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-amber-300 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-600">
                        {label}
                      </span>
                      {passed ? (
                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                      ) : (
                        <Clock3 className="size-3.5 text-amber-700" />
                      )}
                    </div>
                    <p className="mt-3 text-[18px] font-bold text-slate-900">
                      {passed ? "Complete" : "1 missing"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-[1fr_240px] gap-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                        Human action queue
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">
                        One proof is still missing
                      </h2>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        proofAdded
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {proofAdded ? "0 actions" : "1 action"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2.5">
                    <CheckItem
                      label="CI and integration tests"
                      detail="GitHub Actions · 2m ago"
                    />
                    <CheckItem
                      label="Human code review"
                      detail="Approved by Maya · 4m ago"
                    />
                    <CheckItem
                      label="Vercel preview deployment"
                      detail="Preview healthy · 3m ago"
                    />
                    <CheckItem
                      label="Mobile failed-payment recovery"
                      detail={
                        proofAdded
                          ? "Verified at 390px · just now"
                          : "No evidence attached"
                      }
                      state={proofAdded ? "passed" : "missing"}
                      emphasized={!proofAdded && phase >= 1}
                    />
                  </div>
                  <button
                    className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold transition-all ${
                      proofAdded
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                    }`}
                  >
                    {proofAdded ? "Evidence complete" : "Open evidence room"}
                    {proofAdded ? (
                      <Check className="size-4" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                  </button>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
                    Release path
                  </p>
                  <div className="mt-5 space-y-4">
                    {["Intent", "Code", "Preview", "Approval", "Production"].map(
                      (step, index) => {
                        const completed = index < 3 || (ready && index === 3);
                        const current =
                          (!ready && index === 2) || (ready && index === 3);
                        return (
                          <div key={step} className="flex items-center gap-3">
                            <div
                              className={`grid size-7 place-items-center rounded-full border transition-all ${
                                completed
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                                  : current
                                    ? "border-violet-400 bg-violet-50 text-violet-700"
                                    : "border-slate-200 bg-slate-50 text-slate-400"
                              }`}
                            >
                              {completed ? (
                                <Check className="size-3.5" />
                              ) : (
                                <Circle className="size-3.5" />
                              )}
                            </div>
                            <span
                              className={`text-[12px] font-semibold ${
                                current ? "text-slate-950" : "text-slate-500"
                              }`}
                            >
                              {step}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`absolute inset-5 z-20 rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,.20)] transition-all duration-700 ${
                evidenceOpen
                  ? "translate-x-0 opacity-100"
                  : "translate-x-[110%] opacity-0"
              }`}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600">
                      Evidence room
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      Mobile failed-payment recovery
                    </h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      proofAdded
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {proofAdded ? "Passed" : "Required proof missing"}
                  </span>
                </div>

                <div className="grid flex-1 grid-cols-[1.15fr_.85fr] gap-5 p-6">
                  <div className="space-y-3">
                    <CheckItem
                      label="Desktop recovery state"
                      detail="Screenshot · 1440px · Vercel preview"
                    />
                    <CheckItem
                      label="Stripe failed-payment simulation"
                      detail="Integration test · GitHub Actions"
                    />
                    <CheckItem
                      label="Mobile recovery state"
                      detail={
                        proofAdded
                          ? "Manual proof · 390px · Sherv"
                          : "No proof has been recorded"
                      }
                      state={proofAdded ? "passed" : "missing"}
                      emphasized={!proofAdded}
                    />
                    <div
                      className={`overflow-hidden rounded-2xl border transition-all duration-500 ${
                        proofAdded
                          ? "max-h-24 border-emerald-200 bg-emerald-50 p-4 opacity-100"
                          : "max-h-0 border-transparent p-0 opacity-0"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                          <Sparkles className="size-4" />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-emerald-900">
                            Release policy satisfied
                          </p>
                          <p className="text-[11px] text-emerald-700">
                            All required experience evidence is present.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div
                      className={`transition-all duration-500 ${
                        formOpen
                          ? "opacity-100"
                          : proofAdded
                            ? "opacity-40"
                            : "opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-violet-600" />
                        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">
                          Add evidence
                        </p>
                      </div>
                      <label className="mt-4 block text-[10px] font-bold text-slate-500">
                        Observed proof
                      </label>
                      <div className="mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[12px] font-medium text-slate-800">
                        Mobile recovery verified at 390px
                      </div>
                      <label className="mt-3 block text-[10px] font-bold text-slate-500">
                        Source
                      </label>
                      <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[12px] text-slate-700">
                        <Play className="size-3.5 text-violet-600" />
                        Vercel preview recording
                      </div>
                      <label className="mt-3 block text-[10px] font-bold text-slate-500">
                        Result
                      </label>
                      <div className="mt-1 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-[12px] font-bold text-emerald-800">
                        <CheckCircle2 className="size-4" />
                        Passed
                      </div>
                      <button
                        className={`mt-4 w-full rounded-xl py-3 text-[12px] font-bold text-white transition-all ${
                          phase >= 5 ? "bg-emerald-600" : "bg-slate-950"
                        }`}
                      >
                        {phase >= 5 ? "Evidence saved" : "Save evidence"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="pointer-events-none absolute z-40 transition-all duration-[900ms] ease-in-out"
              style={cursorStyle}
            >
              <MousePointer2 className="size-7 fill-slate-950 text-white drop-shadow-[0_3px_5px_rgba(15,23,42,.35)]" />
              {phase === 2 || phase === 4 || phase === 5 ? (
                <span className="absolute -left-3 -top-3 size-12 animate-ping rounded-full border-2 border-violet-500/50" />
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <div
        className={`absolute inset-0 z-50 grid place-items-center bg-slate-950/90 px-12 text-center text-white transition-all duration-700 ${
          introVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div>
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-bold text-emerald-300">
            <CheckCircle2 className="size-4" />
            CI passed · Preview live · Review approved
          </div>
          <h2 className="mt-5 text-5xl font-semibold tracking-[-.05em]">
            Is the feature actually ready?
          </h2>
          <p className="mt-4 text-lg text-slate-300">
            Release Room finds the proof your toolchain missed.
          </p>
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-50 flex h-16 items-center justify-center bg-slate-950 text-white transition-transform duration-700 ${
          phase >= 7 ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <p className="text-lg font-semibold tracking-tight">
          Public build · private beta
          <span className="mx-3 text-slate-600">•</span>
          Looking for a few startup teams to pressure-test it.
        </p>
      </div>

      <button
        onClick={onReplay}
        className="absolute right-4 top-4 z-[60] rounded-full border border-white/20 bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold text-white opacity-0 hover:opacity-100"
      >
        Replay
      </button>
    </main>
  );
}

export function RecordingDemo() {
  const [run, setRun] = useState(0);
  return (
    <RecordingSequence
      key={run}
      onReplay={() => setRun((value) => value + 1)}
    />
  );
}
