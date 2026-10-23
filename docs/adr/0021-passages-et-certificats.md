# 0021 — Passages et certificats de ramonage signés hors ligne

- Date : 2026-10-23
- Statut : accepté

## Contexte

Le technicien remplit et signe le certificat de ramonage chez le client, souvent sans réseau. Chaque certificat porte un numéro unique dans l'entreprise, et un document signé ne doit plus jamais changer. Deux téléphones hors ligne ne peuvent pas partager un compteur.

## Décision

- Un passage (`interventions`, contexte `scheduling`) est une visite planifiée ou faite chez un client, à un lieu, par un technicien, avec les appareils prévus. Il se crée et se modifie par la synchronisation (`create_intervention`, `update_intervention`, `cancel_intervention`, `complete_intervention`). Le secrétariat, l'administrateur et le propriétaire gèrent les passages de tous ; un technicien seulement les siens (`interventions:write-own`), sans pouvoir les confier à un autre.
- Un certificat (`documents`, contexte `compliance`) se crée une seule fois, signé, par la modification `sign_document`. Il n'existe ni modification ni suppression : rejouer le même envoi ne change rien. Une erreur se corrige par un nouveau certificat qui annule l'ancien (`cancels_document_id`, un seul par certificat).
- Numérotation par blocs : chaque téléphone réserve 20 numéros consécutifs quand il a du réseau (`POST /api/document-number-blocks`) et en redemande sous 5. Le serveur n'accepte un numéro que s'il est dans un bloc réservé par la même personne dans la même entreprise, et jamais deux fois (index unique). Le préfixe est celui de l'entreprise au moment de la réservation.
- Le contenu du certificat est validé par `packages/trades` (schéma versionné et règles tirées de `docs/regulatory/chimney-sweeping-certificate.md`) avant d'être stocké en JSON, puis l'appareil reçoit la date du dernier ramonage et la prochaine échéance (date d'achèvement + 12 mois).
- Un technicien ne reçoit à la synchronisation que les certificats qu'il a signés (`documents:read-own`).

## Conséquences

Des numéros réservés peuvent rester inutilisés (téléphone perdu) : la suite des numéros peut avoir des trous, mais jamais de doublon. Le contenu signé vient du téléphone, le serveur le vérifie sans le recalculer. Le PDF et son empreinte arrivent dans une PR suivante, dans des colonnes à part pour ne jamais toucher au contenu signé.
