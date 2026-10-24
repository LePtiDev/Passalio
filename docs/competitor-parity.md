# Parité concurrents : Ramio, Ramonia, OpenFire

Relevé du 21 octobre 2026. Ramonia : compte d'essai créé et testé (deux interventions, attestations et facture produites). Ramio : compte d'essai créé et testé (certificat sur une chaudière gaz, facture, email au client). OpenFire : site et grille tarifaire, car il n'existe pas d'essai en libre-service, seulement une démo avec un commercial. Version vivante et commentable : [document Passalio — parité concurrents](https://claude.ai/artifact/7NCqYfBcvEoKv7Atr6U2wk).

La V1 couvre 10 des 13 fonctions de base. Passalio est le moins cher dès deux techniciens. Il manque trois fonctions que les concurrents proposent : la facture, le rappel la veille du rendez-vous, la relance des impayés.

Le point fort confirmé : aucune « attestation d'entretien » vue chez les concurrents ne contient ce que demande l'arrêté du 15 septembre 2009 (mesure du CO, rendement, conseils). Celle de Ramonia est l'attestation de ramonage avec un autre titre. Ramio produit un « certificat de ramonage » même pour l'entretien d'une chaudière gaz.

## Tarifs

| Logiciel                                   | Base sans engagement    | À l'année                                | Utilisateur en plus              | 1 tech. (€/mois) | 3 tech. (€/mois) | 5 tech. (€/mois) | Essai                               | SMS                                      |
| ------------------------------------------ | ----------------------- | ---------------------------------------- | -------------------------------- | ---------------- | ---------------- | ---------------- | ----------------------------------- | ---------------------------------------- |
| Passalio                                   | 29 € HT (Solo)          | 290 € HT/an (Solo), 490 € HT/an (Équipe) | Équipe 49 € HT, bureau inclus    | 29 HT            | 49 HT            | 49 HT            | 14 jours, sans carte                | option (V2)                              |
| [Ramio](https://www.ramio.fr/)             | 39 € HT                 | 35 € HT/mois                             | 19 € HT (16 € à l'année)         | 39 HT            | 77 HT            | 115 HT           | 14 jours, sans carte                | 0,05 € (packs de 5 € à 45 €), 20 offerts |
| [Ramonia](https://ramonia.pro/)            | 79 € (franchise de TVA) | 67 €/mois, 804 € payés d'un coup         | impossible (un seul utilisateur) | 79               | non proposé      | non proposé      | 14 jours, sans carte, sans le vocal | 100/mois inclus, puis 0,10 €             |
| [OpenFire](https://openfire.fr/nos-tarifs) | 30 € HT (1 utilisateur) | engagement 12 mois possible              | 35 € HT par utilisateur (2 à 30) | 30 HT            | 105 HT           | 175 HT           | aucun, démo avec un commercial      | dès 0,10 €, signature Yousign dès 1 €    |

- Passalio affiche ses prix hors taxes, comme Ramio et OpenFire (CGV de Ramio), et reste en franchise de TVA tant que le seuil n'est pas atteint (ADR 0014). Ramonia est en franchise de TVA : le prix affiché est le prix payé.
- Ramonia : la secrétaire vocale ne fait pas partie de l'essai. 200 minutes par mois incluses, puis 0,25 €/min.
- OpenFire : frais d'installation sur devis, en plus de l'abonnement.

## Fonctions

« Oui » : vu dans l'application ou annoncé par l'éditeur. « ? » : impossible à vérifier sans compte. « Non » : absent de l'application ou de l'offre.

| Fonction                                    | Ramio                                    | Ramonia                         | OpenFire       | Passalio              | Écart                  |
| ------------------------------------------- | ---------------------------------------- | ------------------------------- | -------------- | --------------------- | ---------------------- |
| Fiches client, lieu, appareil               | Oui                                      | Oui, sans lieu distinct         | Oui            | V1                    | parité                 |
| Attestation de ramonage (décret 2023-641)   | Oui (testée)                             | Oui (testée)                    | Oui            | V1                    | parité                 |
| Attestation d'entretien d'appareil conforme | Non (certificat de ramonage seul)        | Non (titre seul, voir plus bas) | ?              | V1                    | **avance**             |
| Signature du client sur le téléphone        | Oui                                      | Oui (testée)                    | Oui            | V1                    | parité                 |
| Photos jointes                              | Oui                                      | Oui                             | Oui            | V1                    | parité                 |
| PDF envoyé par email                        | Oui                                      | Oui (testé)                     | Oui            | V1                    | parité                 |
| Relance annuelle automatique                | Oui (email, SMS)                         | Oui (email, SMS en un geste)    | Oui            | V1 (email)            | parité                 |
| Planning et tournée                         | Oui + tournée optimisée                  | Oui + carte IGN, Waze, Maps     | Oui + tournées | V1 (simple)           | parité, sans tournées  |
| Un compte par technicien, droits            | Oui                                      | Non (un seul utilisateur)       | Oui            | V1                    | **avance sur Ramonia** |
| Import du fichier clients                   | Oui (CSV)                                | Oui (CSV, Excel)                | ?              | V1                    | parité                 |
| Facture créée avec l'intervention           | Non, saisie à part (testée)              | Oui (brouillon, testée)         | Oui            | V2                    | manque                 |
| Rappel la veille du rendez-vous             | Oui (SMS)                                | Non vu                          | ?              | V1.1 (email)          | manque face à Ramio    |
| Relance des factures impayées               | Oui (3 emails)                           | Non vu                          | ?              | V2                    | manque face à Ramio    |
| Hors ligne complet                          | Oui (Ramio Terrain)                      | Oui (données sur l'appareil)    | Oui            | V1                    | parité                 |
| SMS                                         | Oui (0,05 €)                             | Oui (100/mois inclus)           | Oui (0,10 €)   | V2 (option)           | retard                 |
| Devis signé                                 | Oui (à distance)                         | Non                             | Oui            | V2                    | retard                 |
| Prise de rendez-vous en ligne               | Oui                                      | Oui (page de réservation)       | Oui            | V2                    | retard                 |
| Demande d'avis Google après l'intervention  | Oui (SMS)                                | Oui (email automatique)         | ?              | Non prévu             | **nouveau manque**     |
| Secrétaire vocale IA                        | Non                                      | Oui (abonnés seulement)         | Non            | Non                   | hors périmètre         |
| Facture électronique (sept. 2027)           | Préparée (SIREN, TVA, IBAN)              | ?                               | Oui (annoncé)  | V2                    | à surveiller           |
| Données hébergées en Europe                 | Oui                                      | Oui                             | ?              | V1                    | parité                 |
| Techniciens illimités à prix fixe (49 € HT) | Non                                      | Non                             | Non            | V1                    | **avance**             |
| Dictée des observations                     | Non                                      | Oui (bouton « Dicter »)         | Non            | V1.1                  | retard sur Ramonia     |
| Photo de la plaque, carnet papier (IA)      | Non (photo du carnet envoyée à l'équipe) | Non                             | Non            | V1.1                  | avance                 |
| Suivi d'arrivée                             | SMS « j'arrive »                         | Bouton « J'y vais »             | Non            | V1.1                  | parité à venir         |
| QR code                                     | Sur le certificat, vers l'espace client  | Non                             | Non            | V1.1 (sur l'appareil) | avance                 |

## Ce que montre l'essai de Ramonia

Captures et PDF : dossier `concurrents/ramonia/` des fichiers du projet.

- **Inscription** : nom, email, entreprise, téléphone, régime de TVA. SIRET et assurance ne sont demandés qu'à la première attestation, qui est bloquée sans eux. Connexion par lien magique ou Google, sans mot de passe.
- **Intervention en 5 étapes** : travaux, conduits, constat, photos, récapitulatif. Prestations à cocher (ramonage, tirage, nettoyage, fumigène, débistrage), encrassement léger, moyen ou fort, anomalies prédéfinies (bistre, fissure, nid, chapeau, tubage, tirage, joint), remarque tapée ou dictée.
- **Attestation de ramonage** : une page, propre, conforme au décret 2023-641 (conduit désigné, vacuité, SIRET, assurance, qualification). Pas de numéro d'attestation. La signature du professionnel reste vide s'il ne l'a pas dessinée dans les réglages. Elle indique le prochain ramonage et le lien de réservation.
- **Attestation d'entretien** : choisir « Entretien » au rendez-vous change seulement le titre. Pas de mesure de CO, pas de rendement, pas de NOx, et le texte cité reste l'article R. 1331-75 sur le ramonage. Elle n'est pas conforme à l'arrêté du 15 septembre 2009.
- **Facture** : créée en brouillon avec l'attestation, numérotée `FAC-2026-001`. Le montant de 80 € est découpé tout seul en trois lignes de 26,67 €. Elle porte l'indemnité de 40 € pour frais de recouvrement, qui ne s'applique pas aux particuliers.
- **Emails au client** : attestation en pièce jointe, puis demande d'avis automatique.
- **Données** : stockées sur l'appareil, export JSON à faire soi-même. Une attestation envoyée peut être supprimée depuis la liste des documents.
- **Un seul utilisateur** : aucune gestion d'équipe ni de droits dans l'application, malgré le site.

## Ce que montre l'essai de Ramio

Certificat et facture en PDF, captures : dossier `concurrents/ramio/` des fichiers du projet.

- **Inscription** : email et mot de passe, case anti-robot Cloudflare. Essai de 14 jours sans carte.
- **Certificat** : formulaire riche, listes de contrôle par appareil (poêle, chaudière bois, gaz, dépannage), anomalies, signatures, QR code vers l'espace client. Numéroté `CERT-2026-0001`, deux pages.
- **Entretien de chaudière gaz** : la nature « Entretien + Ramonage » produit quand même un « CERTIFICAT DE RAMONAGE ». Pas de mesure de CO ni de rendement, et les conseils parlent de bois en bûches. Non conforme à l'arrêté du 15 septembre 2009.
- **Email au client** : certificat en pièce jointe. Le message commence par « Bonjour {civilite} Testclient » : variable non remplacée.
- **Facture** : à saisir à part, le lien depuis le certificat ne reprend même pas le client. TVA à 20 % par défaut. En franchise de TVA, le PDF n'affiche pas la mention « TVA non applicable, art. 293 B du CGI », mais garde la mention d'attestation de TVA à taux réduit. Indemnité de 40 € pour frais de recouvrement, comme Ramonia.
- **Équipe** : comptes par technicien avec droits fins (clients, suppression, finances, stock, SMS).
- **Relances** : rappel automatique 15 jours avant la date anniversaire (SMS, email ou les deux), rappel SMS 48 h avant le rendez-vous, créneaux proposés selon la proximité.
- **SMS** : 20 crédits offerts, nom d'expéditeur, campagnes.
- **Autres** : décharges, diagnostics, devis, contrats, stock, dépenses, statistiques, export CSV des factures.

## Autres concurrents cités par Ramio

Gazoleen (racheté par Nomadia, 35 à 60 € par utilisateur), MyTour (20 €/mois, sans signature ni SMS), InterFast (généraliste BTP). À ajouter au tableau si un ramoneur interrogé les utilise.

## Recommandations

1. Ajouter à la V1 une facture simple, numérotée, envoyée avec l'attestation. Ligne unique par prestation, mentions adaptées aux particuliers.
2. Avancer en V1 le rappel la veille par email. Le SMS reste une option payante en V2.
3. Relance des impayés en V1.1, juste après la facture.
4. Faire de l'attestation d'entretien conforme (CO, rendement, conseils) un argument de vente : ni Ramio ni Ramonia ne l'ont.
5. Soigner la facture : créée depuis l'intervention, mentions justes selon le régime de TVA, pas d'indemnité de 40 € pour un particulier. Les deux concurrents testés se trompent.
6. Envisager en V1.1 la demande d'avis Google après l'intervention : Ramio et Ramonia l'ont, le coût est faible.
7. Garder hors V1 : devis, prise de rendez-vous en ligne, tournées, secrétaire IA.

## Reste à vérifier

- [x] Ramio : compte d'essai, PDF du certificat, attestation d'entretien (absente), facture électronique (champs prêts).
- [ ] OpenFire : attestation d'entretien distincte et import, seulement par une démo commerciale.
- [x] Ramonia : supplément par technicien (aucun, un seul utilisateur), rappel la veille (non vu), devis (non), HT ou TTC (franchise de TVA).
- [x] Ramio : hors ligne (oui), import (CSV), prix des SMS (0,05 €), HT.
- [x] OpenFire : SMS (dès 0,10 €), engagement (avec ou sans).
