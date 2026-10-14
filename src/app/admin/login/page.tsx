import { redirect } from "next/navigation";
import { isAdmin, isAdminConfigured } from "@/lib/auth";
import { login } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { e } = await searchParams;
  const configured = isAdminConfigured();

  return (
    <div className="login">
      <div className="eyebrow">L’atelier Carnet Plein</div>
      <h1>Pilotage.</h1>
      <p style={{ fontSize: 13, margin: 0 }}>Réservé à l’équipe.</p>
      {!configured && (
        <div className="setup-warning">
          <b>Configuration manquante.</b> Définissez <code>ADMIN_PASSWORD</code> (et <code>ADMIN_SESSION_SECRET</code>) dans les variables
          d’environnement, puis redéployez.
        </div>
      )}
      <form action={login}>
        <label className="field">
          Mot de passe
          <input type="password" name="password" required autoFocus autoComplete="current-password" disabled={!configured} />
        </label>
        {e && (
          <p className="error" role="alert">
            Mot de passe incorrect.
          </p>
        )}
        <button className="btn block" type="submit" disabled={!configured}>
          Entrer →
        </button>
      </form>
    </div>
  );
}
