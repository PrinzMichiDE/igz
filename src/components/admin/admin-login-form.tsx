"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      if (result.status === 429) {
        setError("Zu viele Login-Versuche. Bitte später erneut versuchen.");
      } else {
        setError("Login fehlgeschlagen");
      }
      return;
    }

    window.location.href = "/admin";
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-md space-y-4 rounded-xl border border-border bg-surface p-6">
      <h1 className="font-display text-2xl font-semibold text-primary">Admin Login</h1>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">E-Mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-lg border border-border px-3 text-sm"
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Passwort</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full rounded-lg border border-border px-3 text-sm"
          required
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
      >
        Anmelden
      </button>
    </form>
  );
}
