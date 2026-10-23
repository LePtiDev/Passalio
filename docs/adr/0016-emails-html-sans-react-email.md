# 0016 — E-mails : gabarits HTML écrits à la main, envoi par l'API Resend

- Date : 2026-10-23
- Statut : accepté

## Contexte

L'architecture prévoyait Resend et React Email. Les trois premiers e-mails (lien de connexion, mot de passe oublié, invitation) suivent une seule mise en page, validée en maquette par Quentin le 2026-10-23. React Email ajouterait React et son rendu serveur au Worker de l'API pour trois gabarits.

## Décision

- Les gabarits sont dans `packages/emails` : une mise en page en tableaux HTML avec styles en ligne (lisible par Gmail et Outlook), une version texte, les textes dans `fr.ts`. Tout ce qui vient d'un utilisateur est échappé.
- Les images (logo blanc, icônes) sont des PNG servis par l'application sous `/email/`, jamais en SVG.
- L'API appelle `POST https://api.resend.com/emails` avec `fetch`, sans SDK. La clé est un secret Cloudflare `RESEND_API_KEY`, en droit « envoi seul » sur le domaine `passalio.com`, région Irlande.
- `EMAIL_DELIVERY` vaut `log` en local et `resend` en staging et en production. Sans clé, l'envoi est refusé, jamais écrit dans les logs.
- Les logs gardent le type d'e-mail et l'identifiant Resend, jamais l'adresse.

## Conséquences

- Pas de prévisualisation React Email : les captures se font en ouvrant le HTML rendu.
- Si les gabarits se multiplient (relances, envoi d'attestation), on réévaluera React Email.
