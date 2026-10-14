#!/usr/bin/env bash
# Pousse les variables de .env.local vers le projet Vercel lié (dossier .vercel).
# Usage : scripts/vercel-env-push.sh [production|preview|development] (défaut : production)
#         EXCLUDE="CLE1 CLE2" pour ignorer certaines variables. Les VERCEL_* sont toujours ignorées.
# Les valeurs ne sont jamais affichées. Les secrets sont marqués « sensitive » (illisibles ensuite dans le dashboard).
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
TARGET="${1:-production}"
SENSITIVE="SUPABASE_SERVICE_ROLE_KEY RESEND_API_KEY ADMIN_PASSWORD ADMIN_SESSION_SECRET"
EXCLUDE="${EXCLUDE:-}"

[ -f "$ENV_FILE" ] || { echo "Fichier $ENV_FILE introuvable." >&2; exit 1; }
[ -d .vercel ] || { echo "Projet non lié : lancez d'abord « npx vercel link »." >&2; exit 1; }

count=0
while IFS= read -r line || [ -n "$line" ]; do
  # ignore commentaires et lignes vides
  case "$line" in ''|\#*) continue ;; esac
  key="${line%%=*}"
  value="${line#*=}"
  # retire d'éventuels guillemets englobants
  value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
  [ -n "$key" ] || continue
  case "$key" in VERCEL_*) continue ;; esac
  case " $EXCLUDE " in *" $key "*) echo "· $key : exclue"; continue ;; esac
  if [ -z "$value" ]; then
    echo "· $key : vide, ignorée"
    continue
  fi
  flags="--force --yes"
  case " $SENSITIVE " in *" $key "*) flags="$flags --sensitive" ;; esac
  # shellcheck disable=SC2086
  if printf '%s' "$value" | npx --yes vercel@latest env add "$key" "$TARGET" $flags >/dev/null 2>&1; then
    echo "✓ $key → $TARGET"
    count=$((count + 1))
  else
    echo "✗ $key : échec" >&2
  fi
done < "$ENV_FILE"

echo "$count variable(s) poussée(s) vers $TARGET."
