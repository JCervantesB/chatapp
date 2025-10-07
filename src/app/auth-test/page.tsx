"use client"

import { useState } from "react";
import { useSession, signUp, signIn, signOut } from "@/lib/auth-client";

export default function AuthTestPage() {
  const { data: session, error, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async () => {
    setMessage(null);
    try {
      const res = await signUp.email({ email, password, name: email.split("@")[0] });
      if (res.error) {
        setMessage(res.error.message || "Error en registro");
      } else {
        setMessage("Registro exitoso. Ahora inicia sesión.");
      }
    } catch (e: any) {
      setMessage(e?.message || "Error en registro");
    }
  };

  const handleSignIn = async () => {
    setMessage(null);
    try {
      const res = await signIn.email({ email, password });
      if (res.error) {
        setMessage(res.error.message || "Error al iniciar sesión");
      } else {
        setMessage("Inicio de sesión exitoso.");
      }
    } catch (e: any) {
      setMessage(e?.message || "Error al iniciar sesión");
    }
  };

  const handleSignOut = async () => {
    setMessage(null);
    try {
      await signOut();
      setMessage("Sesión cerrada.");
    } catch (e: any) {
      setMessage(e?.message || "Error al cerrar sesión");
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", padding: 16 }}>
      <h1>Prueba de Autenticación</h1>
      <p id="session-status">
        Estado de sesión: {isPending ? "cargando..." : session ? `activo (${session.user.email})` : "sin sesión"}
      </p>
      {error && <p style={{ color: "red" }}>{String(error)}</p>}
      {message && <p data-testid="message" style={{ color: "green" }}>{message}</p>}

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <label>
          Email
          <input
            data-testid="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>
        <label>
          Password
          <input
            data-testid="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4 }}
          />
        </label>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button data-testid="sign-up" onClick={handleSignUp} style={{ padding: "8px 12px" }}>
            Registrarse
          </button>
          <button data-testid="sign-in" onClick={handleSignIn} style={{ padding: "8px 12px" }}>
            Iniciar sesión
          </button>
          <button data-testid="sign-out" onClick={handleSignOut} style={{ padding: "8px 12px" }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}