# Documents réglementaires par métier

Une fiche par document que Passalio génère : mentions à faire figurer, statut de chaque mention, source, règles de remise et points ouverts. Ces fiches alimentent les configurations de `packages/trades`.

Les 6 fiches ont été vérifiées le 2026-10-22 contre le texte officiel en vigueur de `sources/` (base LEGI de la DILA, éditeur de Légifrance, à jour au 2026-10-21). Chaque fiche est passée par une boucle vérificateur adversarial puis correcteur jusqu'à un tour sans objection. Ce qui ne figure pas dans les sources est marqué « Non vérifié sur texte officiel » et listé dans « Points ouverts ». Reste à faire : comparer avec de vrais documents remplis par des professionnels.

| Métier                                                      | Document                                                                                    | Mentions | Obligatoires | Conditionnelles | Points ouverts | Modèle officiel      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------- | ------------ | --------------- | -------------- | -------------------- |
| [Ramonage](chimney-sweeping-certificate.md)                 | Certificat de ramonage                                                                      | 56       | 3            | 31              | 31             | Non                  |
| [Entretien poêle / insert](solid-fuel-stove-maintenance.md) | Attestation d'entretien, combustible solide à foyer fermé                                   | 68       | 15           | 43              | 42             | Non                  |
| [Entretien chaudière](boiler-maintenance.md)                | Attestation d'entretien de chaudière 4 à 400 kW                                             | 48       | 19           | 26              | 36             | Non                  |
| [Vidange ANC](septic-tank-emptying.md)                      | Bordereau de suivi, registre, bilan annuel                                                  | 27       | 19           | 2               | 38             | Modèles préfectoraux |
| [PAC / climatisation](heat-pump-air-conditioning.md)        | Attestation d'entretien 4 à 70 kW, fiche d'intervention fluides, contrat de mise en service | 69       | 21           | 30              | 35             | Oui                  |
| [Transverse](quotes-and-invoices.md)                        | Devis, information sur les prix, note de prestation, facture                                | 100      | 12           | 81              | 64             | Non                  |

## Règles de lecture

- **Obligatoire** : imposé par un texte cité. **Conditionnel** : obligatoire dans le cas indiqué. **Recommandé** : conseillé par un texte, sans obligation. **Usage, non sourcé** : pratique courante, sans texte.
- **Confiance** : « Texte officiel (LEGI 2026-10-21) » seulement si la citation a été comparée mot pour mot à un fichier de `sources/`. Sinon « Non vérifié sur texte officiel », avec un point ouvert.
- Une mention n'est rendue bloquante dans l'application que si elle est « Obligatoire » ou « Conditionnel » et « Texte officiel ».
