"use client";

import { ArrowLeft, Link2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { createReleaseAction } from "./actions";

export default function NewReleasePage() {
  const [state, action, pending] = useActionState(createReleaseAction, {
    error: "",
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/releases"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Releases
      </Link>

      <p className="mt-8 text-sm font-semibold text-violet-700">
        NEW RELEASE ROOM
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">
        Turn a change into a decision
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
        Link the actual change once. Release Room uses the repository, commit,
        pull request, issue, and changed files to resolve the right policy and
        collect evidence without guessing.
      </p>

      <form
        action={action}
        className="mt-8 grid gap-6 rounded-3xl border border-slate-200 bg-white p-6"
      >
        <fieldset className="grid gap-5">
          <legend className="text-sm font-semibold text-slate-950">
            Customer change
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Title
              <input
                className="field mt-2"
                name="title"
                required
                maxLength={120}
                placeholder="Team billing settings"
                autoComplete="off"
              />
            </label>
            <label className="text-sm font-semibold">
              Owner
              <input
                className="field mt-2"
                name="owner"
                required
                maxLength={80}
                defaultValue="Sherv"
                autoComplete="name"
              />
            </label>
          </div>
          <label className="text-sm font-semibold">
            Summary
            <textarea
              className="field mt-2 min-h-24"
              name="summary"
              required
              maxLength={500}
              placeholder="What changes for the customer, including the failure or recovery path?"
            />
          </label>
        </fieldset>

        <fieldset className="grid gap-4 border-t border-slate-200 pt-6">
          <legend className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Link2 className="size-4 text-violet-600" aria-hidden />
            Change identity
          </legend>
          <p className="text-xs leading-5 text-slate-500">
            These values prevent evidence from one release being attached to
            another. Repository and commit are required; linked records improve
            live evidence coverage.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">
              Environment
              <input
                className="field mt-2"
                name="environment"
                required
                maxLength={40}
                defaultValue="Production"
              />
            </label>
            <label className="text-sm font-semibold">
              Repository
              <input
                className="field mt-2 font-mono text-xs"
                name="repository"
                required
                maxLength={200}
                placeholder="owner/repository"
                autoCapitalize="none"
                spellCheck={false}
              />
              <span className="mt-2 block text-xs font-normal text-slate-500">
                GitHub owner/repository or the repository URL.
              </span>
            </label>
            <label className="text-sm font-semibold">
              Branch
              <input
                className="field mt-2 font-mono text-xs"
                name="branch"
                required
                maxLength={160}
                placeholder="feature/billing"
                autoCapitalize="none"
                spellCheck={false}
              />
            </label>
            <label className="text-sm font-semibold">
              Commit SHA
              <input
                className="field mt-2 font-mono text-xs"
                name="commitSha"
                required
                minLength={7}
                maxLength={40}
                pattern="[a-fA-F0-9]{7,40}"
                placeholder="7d92ae1"
                autoCapitalize="none"
                spellCheck={false}
              />
              <span className="mt-2 block text-xs font-normal text-slate-500">
                A 7–40 character Git commit SHA.
              </span>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-semibold">
              PR URL
              <input
                className="field mt-2"
                type="url"
                name="prUrl"
                placeholder="https://github.com/…/pull/42"
              />
            </label>
            <label className="text-sm font-semibold">
              Linear issue URL
              <input
                className="field mt-2"
                type="url"
                name="linearUrl"
                placeholder="https://linear.app/…/issue/SHE-42/…"
              />
            </label>
            <label className="text-sm font-semibold">
              Preview URL
              <input
                className="field mt-2"
                type="url"
                name="previewUrl"
                placeholder="https://preview.example.com"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="grid gap-4 border-t border-slate-200 pt-6">
          <legend className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <ShieldCheck className="size-4 text-violet-600" aria-hidden />
            Policy scope
          </legend>
          <label className="text-sm font-semibold">
            Changed files
            <textarea
              className="field mt-2 min-h-32 font-mono text-xs"
              name="changedFiles"
              required
              maxLength={20_000}
              placeholder={
                "app/api/stripe/route.ts\ncomponents/billing/form.tsx"
              }
            />
            <span className="mt-2 block text-xs font-normal leading-5 text-slate-500">
              One repository-relative path per line or comma-separated. Release
              Room deduplicates the list and uses it to select the adaptive risk
              policy.
            </span>
          </label>
        </fieldset>

        {state.error ? (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}

        <button disabled={pending} className="button-primary">
          {pending ? "Creating…" : "Create release room"}
        </button>
      </form>
    </div>
  );
}
