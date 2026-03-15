# Académie de Musique Les Hirondelles — Fictional Seed Data
> Descriptive reference for building realistic import/seed scripts.
> All names, addresses, and data are fictional.

---

## 1. The Academy

**Name:** Académie de Musique Les Hirondelles
**Location:** 14 rue des Mélodies, 67000 Strasbourg (Zone B — Académie de Strasbourg)
**Founded:** 2011
**Director:** Hélène Marchand (also principal piano teacher)
**Admin contact:** secretariat@hirondelles-musique.fr
**Phone:** 03 88 45 12 67

---

## 2. Pricing Structure

### Base Yearly Subscription: **€680/an**
Includes:
- 1 cours individuel d'instrument (30 min/semaine, 32 semaines hors vacances)
- 1 cours de formation musicale en groupe (1h/semaine)

### Options annuelles (add-ons)
| Option | Prix/an |
|--------|---------|
| 2ème instrument individuel | +€420 |
| 3ème instrument individuel | +€360 (dégressif) |
| Cours d'orchestre en groupe (instrument) | +€200 |
| Chorale Les Hirondelles | +€140 |
| Atelier Jazz (trimestriel) | +€90/trimestre (€270/an) |

### Réductions
| Règle | Détail |
|-------|--------|
| Instrument à vent de cuivre (brass) | -15% sur le cours individuel |
| 2ème enfant de la fratrie | -5% sur l'abonnement de base |
| 3ème enfant et au-delà | -30% sur l'abonnement de base |
| Élève adulte (>25 ans) | Pas de cours FM obligatoire, tarif à la carte |

**SubscriptionPlan** à créer dans la base :
- Nom : "Formule Standard 2025-2026"
- Prix annuel : 680.00
- Cours individuels inclus : 1
- Cours de groupe inclus : 1
- Prix extra cours individuel : 420.00 (2ème), 360.00 (3ème)
- Prix orchestre : 200.00/an
- Prix chorale : 140.00/an

**FamilyDiscountRules** :
- Rang 2 → -5%
- Rang 3 et + → -30%

**InstrumentCategoryDiscount** :
- Catégorie "Cuivres" → -15%

---

## 3. Salles (Rooms)

| Nom | Couleur | Capacité | Notes |
|-----|---------|----------|-------|
| Salle Chopin | #4f46e5 | 2 | Piano à queue Yamaha C3, piano droit |
| Salle Cordes | #059669 | 3 | Violon, alto, violoncelle |
| Salle Vents | #0891b2 | 2 | Flûte, sax, clarinette |
| Salle Cuivres | #d97706 | 2 | Trompette, trombone, cor |
| Salle Rythmes | #dc2626 | 4 | Batterie acoustique + électronique, percussions |
| Salle Guitares | #7c3aed | 3 | 3 guitares classiques, ampli, ukulélés |
| Grande Salle | #0f766e | 20 | FM, orchestre, répétitions |
| Auditorium | #1e40af | 120 | Concerts, auditions (pas de cours réguliers) |

---

## 4. Instruments

| Nom | Catégorie |
|-----|-----------|
| Piano | Claviers |
| Guitare classique | Cordes pincées |
| Guitare électrique | Cordes pincées |
| Ukulélé | Cordes pincées |
| Violon | Cordes frottées |
| Alto | Cordes frottées |
| Violoncelle | Cordes frottées |
| Contrebasse | Cordes frottées |
| Flûte traversière | Vents bois |
| Saxophone alto | Vents bois |
| Saxophone ténor | Vents bois |
| Clarinette | Vents bois |
| Trompette | Cuivres |
| Trombone | Cuivres |
| Cor | Cuivres |
| Batterie | Percussions |
| Percussions classiques | Percussions |
| Chant | Voix |
| Formation musicale | Théorie |

---

## 5. Professeurs (Teachers — 10)

### T01 — Hélène Marchand
- **Rôle :** Directrice + Professeur de piano
- **Instruments :** Piano (niveau avancé)
- **Disponibilité :** Lun–Ven 9h-19h, Sam 9h-12h
- **Tarif horaire :** €55
- **Bio :** Diplômée du Conservatoire National Supérieur de Paris, 20 ans d'enseignement. Spécialiste répertoire classique et romantique.
- **Cours :** Piano individuel (Salle Chopin), Atelier piano 4 mains (Grande Salle)

### T02 — Thomas Nguyen
- **Instruments :** Guitare classique, Guitare électrique, Ukulélé (avancé)
- **Disponibilité :** Mar–Sam 14h-20h
- **Tarif horaire :** €42
- **Bio :** Guitariste de formation jazz et classique, également animateur de l'Atelier Jazz.
- **Cours :** Guitare individuel (Salle Guitares), Atelier Jazz (Grande Salle, trimestres 1 et 3)

### T03 — Sophie Leblanc
- **Instruments :** Violon (avancé), Alto (intermédiaire)
- **Disponibilité :** Lun, Mer, Ven, Sam 10h-18h
- **Tarif horaire :** €45
- **Bio :** Ancienne violoniste de l'Orchestre Philharmonique de Strasbourg (section pupilles). Enseigne depuis 8 ans.
- **Cours :** Violon individuel, Alto individuel (Salle Cordes), chef de pupitre Orchestre Jeunes

### T04 — Marc Durand
- **Instruments :** Trompette (avancé), Trombone (avancé), Cor (intermédiaire)
- **Disponibilité :** Lun–Ven 16h-20h, Sam 9h-18h
- **Tarif horaire :** €42
- **Bio :** Ancien musicien militaire, chef de la section cuivres de l'Orchestre Jeunes.
- **Cours :** Trompette individuel, Trombone individuel, Cor individuel (Salle Cuivres)

### T05 — Isabelle Petit
- **Instruments :** Flûte traversière (avancé), Piccolo (intermédiaire)
- **Disponibilité :** Mar, Jeu, Sam 10h-18h
- **Tarif horaire :** €42
- **Bio :** Flûtiste concertiste, donne des masterclasses régulières dans la région.
- **Cours :** Flûte traversière individuel (Salle Vents)

### T06 — Karim Benali
- **Instruments :** Batterie (avancé), Percussions classiques (intermédiaire)
- **Disponibilité :** Lun–Ven 15h-20h, Sam 10h-18h
- **Tarif horaire :** €40
- **Bio :** Batteur professionnel (studio + scène), enseigne du classique au jazz-rock.
- **Cours :** Batterie individuel, Percussions (Salle Rythmes)

### T07 — Nathalie Rousseau
- **Instruments :** Formation musicale, Solfège (expert), Chant choral
- **Disponibilité :** Lun–Sam 9h-19h
- **Tarif horaire :** €38
- **Bio :** Musicologue et pédagogue, 15 ans dans l'enseignement de la théorie. Directrice artistique de la Chorale Les Hirondelles.
- **Cours :** FM Débutants (Grande Salle), FM Intermédiaires (Grande Salle), FM Avancés (Grande Salle), Chorale (Grande Salle)

### T08 — Pierre Moreau
- **Instruments :** Violoncelle (avancé), Contrebasse (intermédiaire)
- **Disponibilité :** Mer–Sam 10h-18h
- **Tarif horaire :** €45
- **Bio :** Ancien soliste, membre du quatuor Alsace. Très demandé pour les cours adultes.
- **Cours :** Violoncelle individuel, Contrebasse individuel (Salle Cordes)

### T09 — Agathe Simon
- **Instruments :** Chant (soprano, avancé), Comédie musicale
- **Disponibilité :** Lun, Mar, Jeu, Ven 14h-20h
- **Tarif horaire :** €42
- **Bio :** Chanteuse lyrique et de variété, enseigne technique vocale tous niveaux.
- **Cours :** Chant individuel (Salle Vents utilisée pour acoustique), participation Chorale

### T10 — Julien Fabre
- **Instruments :** Saxophone (alto, ténor — avancé), Clarinette (intermédiaire)
- **Disponibilité :** Mar–Sam 13h-20h
- **Tarif horaire :** €42
- **Bio :** Saxophoniste jazz et classique, co-animateur de l'Atelier Jazz avec Thomas Nguyen.
- **Cours :** Saxophone individuel, Clarinette individuel (Salle Vents), Atelier Jazz (trimestres 2)

---

## 6. Cours (Courses)

| Réf | Nom | Professeur | Salle | Type | Durée | Récurrence |
|-----|-----|------------|-------|------|-------|------------|
| C01 | Piano individuel — débutant | Hélène Marchand | Salle Chopin | PRIVATE_LESSON | 30 min | Hebdo |
| C02 | Piano individuel — intermédiaire | Hélène Marchand | Salle Chopin | PRIVATE_LESSON | 45 min | Hebdo |
| C03 | Piano individuel — avancé | Hélène Marchand | Salle Chopin | PRIVATE_LESSON | 60 min | Hebdo |
| C04 | Guitare classique individuel | Thomas Nguyen | Salle Guitares | PRIVATE_LESSON | 30 min | Hebdo |
| C05 | Guitare électrique individuel | Thomas Nguyen | Salle Guitares | PRIVATE_LESSON | 30 min | Hebdo |
| C06 | Ukulélé individuel | Thomas Nguyen | Salle Guitares | PRIVATE_LESSON | 30 min | Hebdo |
| C07 | Violon individuel — débutant | Sophie Leblanc | Salle Cordes | PRIVATE_LESSON | 30 min | Hebdo |
| C08 | Violon individuel — avancé | Sophie Leblanc | Salle Cordes | PRIVATE_LESSON | 45 min | Hebdo |
| C09 | Alto individuel | Sophie Leblanc | Salle Cordes | PRIVATE_LESSON | 30 min | Hebdo |
| C10 | Trompette individuel | Marc Durand | Salle Cuivres | PRIVATE_LESSON | 30 min | Hebdo |
| C11 | Trombone individuel | Marc Durand | Salle Cuivres | PRIVATE_LESSON | 30 min | Hebdo |
| C12 | Cor individuel | Marc Durand | Salle Cuivres | PRIVATE_LESSON | 30 min | Hebdo |
| C13 | Flûte traversière individuel | Isabelle Petit | Salle Vents | PRIVATE_LESSON | 30 min | Hebdo |
| C14 | Batterie individuel | Karim Benali | Salle Rythmes | PRIVATE_LESSON | 30 min | Hebdo |
| C15 | Percussions individuel | Karim Benali | Salle Rythmes | PRIVATE_LESSON | 30 min | Hebdo |
| C16 | Violoncelle individuel | Pierre Moreau | Salle Cordes | PRIVATE_LESSON | 30 min | Hebdo |
| C17 | Contrebasse individuel | Pierre Moreau | Salle Cordes | PRIVATE_LESSON | 30 min | Hebdo |
| C18 | Saxophone individuel | Julien Fabre | Salle Vents | PRIVATE_LESSON | 30 min | Hebdo |
| C19 | Clarinette individuel | Julien Fabre | Salle Vents | PRIVATE_LESSON | 30 min | Hebdo |
| C20 | Chant individuel | Agathe Simon | Salle Vents | PRIVATE_LESSON | 30 min | Hebdo |
| C21 | Formation musicale — Débutants (< 3 ans) | Nathalie Rousseau | Grande Salle | MUSIC_THEORY | 60 min | Hebdo, mer 14h |
| C22 | Formation musicale — Intermédiaires (3-6 ans) | Nathalie Rousseau | Grande Salle | MUSIC_THEORY | 60 min | Hebdo, sam 10h |
| C23 | Formation musicale — Avancés (>6 ans) | Nathalie Rousseau | Grande Salle | MUSIC_THEORY | 90 min | Hebdo, lun 17h |
| C24 | Orchestre Jeunes Les Hirondelles | Sophie Leblanc (+ Marc, Isabelle) | Grande Salle | GROUP_INSTRUMENT | 90 min | Hebdo, sam 14h30 |
| C25 | Chorale Les Hirondelles | Nathalie Rousseau (+ Agathe) | Grande Salle | GROUP_INSTRUMENT | 60 min | Hebdo, mer 18h |
| C26 | Atelier Jazz — Trimestre 1 | Thomas Nguyen | Grande Salle | WORKSHOP | 90 min | Hebdo, jeu 18h |
| C27 | Atelier Jazz — Trimestre 3 | Julien Fabre | Grande Salle | WORKSHOP | 90 min | Hebdo, jeu 18h |
| C28 | Piano 4 mains | Hélène Marchand | Salle Chopin | GROUP_INSTRUMENT | 60 min | Hebdo, ven 16h |

---

## 7. Vacances scolaires 2025-2026 — Zone B (Académie de Strasbourg)

| Période | Début | Fin | Affecte les cours |
|---------|-------|-----|-------------------|
| Toussaint 2025 | sam 18 oct 2025 | lun 3 nov 2025 | Oui |
| Noël 2025 | sam 20 déc 2025 | lun 5 jan 2026 | Oui |
| Hiver 2026 (Zone B) | sam 14 fév 2026 | lun 2 mar 2026 | Oui |
| Printemps 2026 (Zone B) | sam 25 avr 2026 | lun 11 mai 2026 | Oui |
| Été 2026 | sam 4 juil 2026 | lun 1 sep 2026 | Oui |

> ℹ️ Jours fériés à exclure en plus : 1er novembre 2025, 8 décembre 2025, 1er janvier 2026, Lundi de Pâques (6 avril 2026), 1er mai 2026, 8 mai 2026, Ascension (14 mai 2026), Lundi de Pentecôte (25 mai 2026), 14 juillet 2026, Assomption (15 août 2026).

---

## 8. Événements (Events)

### E01 — Audition de Printemps
- **Date :** Dimanche 15 mars 2026, 14h00 – 18h00
- **Lieu :** Grande Salle + Auditorium (parties dans chaque salle)
- **isAllDay :** false
- **isPublic :** true
- **Description :** Audition ouverte aux familles. Les élèves de chaque instrument se produisent en 3 sessions de 45 minutes (débutants, intermédiaires, avancés). Programme distribué à l'entrée.
- **Participants :** ~45 élèves performers + tous les enseignants en STAFF
- **Fichiers :** Programme de l'audition (PDF), Affiche (JPG)
- **Notes :** Répétition générale le samedi 14 mars 13h-16h (non publique)

### E02 — Grand Concert de Fin d'Année
- **Date :** Samedi 20 juin 2026, 19h00 – 22h30
- **Lieu :** Auditorium, 14 rue des Mélodies
- **isAllDay :** false
- **isPublic :** true
- **Description :** Concert de clôture de l'année scolaire. Orchestre Jeunes (45 min), soloistes sélectionnés (30 min), Chorale (20 min), Finale orchestre + chorale réunis. Buffet offert après le concert.
- **Participants :** ~80 élèves performers + 10 enseignants + familles (entrée gratuite, réservation recommandée)
- **Fichiers :** Programme complet (PDF), Affiche officielle (JPG/PDF), Playlist (PDF), Discours directrice (DOCX)
- **Notes :** Répétition générale vendredi 19 juin 18h-21h, samedi 20 juin 10h-13h

### E03 — Journée Portes Ouvertes
- **Date :** Samedi 17 janvier 2026, 10h00 – 17h00
- **isAllDay :** false
- **isPublic :** true
- **Lieu :** Académie entière
- **Description :** Découverte de tous les instruments, essais gratuits encadrés par les professeurs, inscription possible sur place pour le 2ème semestre.
- **Participants :** Tous les professeurs en STAFF
- **Fichiers :** Flyer (PDF)

### E04 — Stage Intensif Orchestre (week-end)
- **Date :** Vendredi 27 mars 2026 17h — Dimanche 29 mars 2026 17h
- **isAllDay :** true (multi-day)
- **isPublic :** false (membres seulement)
- **Lieu :** Centre de loisirs La Clairière, Barr (67)
- **Description :** Stage résidentiel pour les membres de l'Orchestre Jeunes et de la Chorale. Répétitions intensives, soirée jeux musicaux, mini-concert interne le dimanche.
- **Participants :** 28 élèves (Orchestre + Chorale) + Sophie Leblanc, Marc Durand, Isabelle Petit, Nathalie Rousseau en STAFF
- **Fichiers :** Programme du stage, Liste de matériel

---

## 9. Familles et Élèves (~100 élèves, ~43 familles)

### Familles avec 3+ enfants inscrits (réduction 3ème enfant)

---

#### Famille Martin
- **Contacts :** Frédéric Martin (père, PARENT, primary), Sandrine Martin née Perrot (mère, PARENT)
- **Adresse :** 8 allée des Peupliers, 67200 Strasbourg
- **Enfants inscrits :**
  1. **Hugo Martin** — 14 ans, Piano intermédiaire (C02), FM Intermédiaires (C22) → inscription normale
  2. **Léa Martin** — 11 ans, Violon débutant (C07), FM Débutants (C21) → -5% fratrie
  3. **Emma Martin** — 9 ans, Flûte traversière (C13), FM Débutants (C21) → -30% (3ème enfant)
- **Note :** Hugo participe aussi à l'Orchestre Jeunes (C24). Léa vient de rejoindre la Chorale (C25).
- **Facture annuelle estimée :** (680 + 200) + (680×0.95) + (680×0.70) = 880 + 646 + 476 = **2 002 €**

#### Famille Bernard
- **Contacts :** Laurent Bernard (père, PARENT, primary), Véronique Bernard (mère, PARENT)
- **Adresse :** 23 rue du Maréchal-Joffre, 67100 Strasbourg
- **Enfants inscrits :**
  1. **Antoine Bernard** — 16 ans, Guitare classique (C04), FM Avancés (C23), Atelier Jazz T1 (C26) → normal
  2. **Chloé Bernard** — 13 ans, Piano intermédiaire (C02), FM Intermédiaires (C22) → -5%
  3. **Mathis Bernard** — 10 ans, Batterie (C14), FM Débutants (C21) → -30%
- **Note :** Antoine est l'un des meilleurs guitaristes de l'académie, envisage le conservatoire.

#### Famille Dupont
- **Contacts :** Olivier Dupont (père, PARENT, primary), Marie-Claire Dupont née Leconte (mère, PARENT)
- **Adresse :** 5 rue de la Cigogne, 67000 Strasbourg
- **Enfants inscrits :**
  1. **Camille Dupont** — 15 ans, Violon avancé (C08), FM Avancés (C23), Orchestre (C24)
  2. **Romain Dupont** — 12 ans, Saxophone alto (C18), FM Intermédiaires (C22)
  3. **Elisa Dupont** — 8 ans, Piano débutant (C01), FM Débutants (C21) → -30%
- **Note :** Camille a joué en solo lors de la dernière audition, sera soliste au concert de juin.

#### Famille Thomas
- **Contacts :** Philippe Thomas (père, PARENT, primary), Isabelle Thomas née Arnaud (mère, PARENT)
- **Adresse :** 17 avenue des Vosges, 67000 Strasbourg
- **Enfants inscrits :**
  1. **Lola Thomas** — 14 ans, Flûte (C13), FM Intermédiaires (C22), Orchestre (C24)
  2. **Baptiste Thomas** — 11 ans, Trompette (C10), FM Débutants (C21) → -5% (cuivres, -15% sur cours individuel)
  3. **Inès Thomas** — 9 ans, Violoncelle (C16), FM Débutants (C21) → -30%
  4. **Victor Thomas** — 7 ans, Guitare (C04), FM Débutants (C21) → -30% (4ème enfant)
- **Note :** La famille Thomas est très impliquée — Philippe est bénévole aux concerts.

#### Famille Robert
- **Contacts :** Sébastien Robert (père, PARENT, primary), Céline Robert née Mallet (mère, PARENT)
- **Adresse :** 42 rue du Fossé-des-Treize, 67000 Strasbourg
- **Enfants inscrits :**
  1. **Manon Robert** — 16 ans, Piano avancé (C03), FM Avancés (C23), Chorale (C25)
  2. **Lucas Robert** — 13 ans, Batterie (C14), FM Intermédiaires (C22) → -5%
  3. **Jade Robert** — 10 ans, Violon débutant (C07), FM Débutants (C21) → -30%
- **Note :** Manon a commencé à donner des cours particuliers informels à des débutants (non officiel).

---

### Familles avec 2 enfants inscrits

#### Famille Leroy
- **Contacts :** Christophe Leroy (père, PARENT, primary), Nadia Leroy (mère, PARENT)
- **Enfants :** Théo Leroy (15 ans, Piano C02, FM Avancés C23), Alice Leroy (12 ans, Violoncelle C16, FM Intermédiaires C22) → -5%

#### Famille Girard
- **Contacts :** Jean-Paul Girard (père), Mélanie Girard (mère, primary)
- **Enfants :** Raphaël Girard (14 ans, Guitare C04, FM Intermédiaires C22, Atelier Jazz C26), Sarah Girard (11 ans, Flûte C13, FM Débutants C21)

#### Famille Moreau — (≠ professeur Pierre Moreau)
- **Contacts :** David Moreau (père, primary), Julie Moreau (mère)
- **Enfants :** Axel Moreau (13 ans, Saxophone C18, FM Intermédiaires C22), Nina Moreau (10 ans, Piano C01, FM Débutants C21)

#### Famille Laurent
- **Contacts :** Pascal Laurent (père, primary), Anne-Sophie Laurent (mère)
- **Enfants :** Tom Laurent (16 ans, Trompette C10, FM Avancés C23, Orchestre C24 — réduction cuivres), Clara Laurent (13 ans, Violon C08, FM Intermédiaires C22)

#### Famille Simon — (≠ professeur Agathe Simon)
- **Contacts :** Bruno Simon (père), Hélène Simon née Blanc (mère, primary)
- **Enfants :** Léo Simon (15 ans, Piano C02, FM Intermédiaires C22), Zoé Simon (12 ans, Chant C20, Chorale C25)

#### Famille Michel
- **Contacts :** Denis Michel (père, primary), Patricia Michel (mère)
- **Enfants :** Paul Michel (14 ans, Guitare C04, FM Intermédiaires C22), Marie Michel (11 ans, Violon C07, FM Débutants C21)

#### Famille Lefebvre
- **Contacts :** Arnaud Lefebvre (père, primary), Sylvie Lefebvre (mère)
- **Enfants :** Nathan Lefebvre (15 ans, Batterie C14, FM Avancés C23), Lucie Lefebvre (12 ans, Flûte C13, FM Intermédiaires C22)

#### Famille Roux
- **Contacts :** Stéphane Roux (père), Aurélie Roux née Bonnet (mère, primary)
- **Enfants :** Matteo Roux (14 ans, Saxophone C18, FM Intermédiaires C22), Camille Roux (11 ans, Guitare C04, FM Débutants C21)

#### Famille David
- **Contacts :** Gilles David (père, primary), Myriam David née Kauffmann (mère)
- **Enfants :** Simon David (16 ans, Piano C03, FM Avancés C23 — vise le DEM), Eva David (13 ans, Violon C08, FM Intermédiaires C22)

#### Famille Bertrand
- **Contacts :** Nicolas Bertrand (père), Carole Bertrand (mère, primary)
- **Enfants :** Adrien Bertrand (15 ans, Guitare C04, FM Avancés C23, Atelier Jazz T1+T3), Sofia Bertrand (12 ans, Flûte C13, FM Intermédiaires C22)

#### Famille Morel
- **Contacts :** Xavier Morel (père, primary), Laure Morel née Fontaine (mère)
- **Enfants :** Maxime Morel (14 ans, Trompette C10, Orchestre C24 — réduction cuivres), Chloé Morel (11 ans, Piano C01, FM Débutants C21)

#### Famille Fournier
- **Contacts :** Alain Fournier (père), Christine Fournier née Picard (mère, primary)
- **Enfants :** Arthur Fournier (13 ans, Batterie C14, FM Intermédiaires C22), Julie Fournier (10 ans, Violon C07, FM Débutants C21)

#### Famille Giraud
- **Contacts :** Marc Giraud (père, primary), Delphine Giraud née Vidal (mère)
- **Enfants :** Clément Giraud (15 ans, Piano C02, FM Avancés C23, Chorale C25), Emilie Giraud (12 ans, Chant C20, Chorale C25)

#### Famille Bonnet
- **Contacts :** Frédéric Bonnet (père), Isabelle Bonnet née Mercier (mère, primary)
- **Enfants :** Oscar Bonnet (14 ans, Saxophone alto C18, Atelier Jazz C27), Inès Bonnet (11 ans, Violoncelle C16, FM Intermédiaires C22)

#### Famille François
- **Contacts :** Pascal François (père, primary), Karine François née Richard (mère)
- **Enfants :** Hugo François (13 ans, Guitare C04, FM Intermédiaires C22), Manon François (10 ans, Flûte C13, FM Débutants C21)

#### Famille Gauthier
- **Contacts :** Rémi Gauthier (père), Sophie Gauthier née Lambert (mère, primary)
- **Enfants :** Théo Gauthier (16 ans, Violon C08, FM Avancés C23, Orchestre C24), Rose Gauthier (13 ans, Piano C02, FM Intermédiaires C22)

#### Famille Garcia
- **Contacts :** Carlos Garcia (père, primary), Lucie Garcia née Martin (mère) — famille d'origine espagnole
- **Enfants :** Diego Garcia (15 ans, Batterie C14, FM Avancés C23), Luna Garcia (12 ans, Chant C20, Chorale C25)

#### Famille Perrin
- **Contacts :** Antoine Perrin (père), Virginie Perrin née Schneider (mère, primary)
- **Enfants :** Ethan Perrin (14 ans, Trompette C10, FM Intermédiaires C22 — réduction cuivres), Mia Perrin (11 ans, Violon C07, FM Débutants C21)

#### Famille Lambert
- **Contacts :** Olivier Lambert (père, primary), Stéphanie Lambert née Collin (mère)
- **Enfants :** Jules Lambert (15 ans, Piano C02, FM Avancés C23), Lena Lambert (12 ans, Guitare C04, FM Intermédiaires C22)

---

### Familles avec 1 enfant inscrit

| Famille | Contact principal | Enfant | Âge | Cours | Notes |
|---------|-------------------|--------|-----|-------|-------|
| Chevalier | Marie Chevalier (mère) | Noa Chevalier | 17 | Violon avancé C08, FM Avancés C23, Orchestre C24 | Se prépare au concours d'entrée du CNR |
| Robin | Thierry Robin (père) | Charlotte Robin | 16 | Piano avancé C03, FM Avancés C23 | Souhaite passer son DEM l'année prochaine |
| Faure | Brigitte Faure (mère, veuve) | Benjamin Faure | 15 | Violoncelle C16, FM Intermédiaires C22, Orchestre C24 | |
| Renaud | Sylvain Renaud (père) | Alexia Renaud | 14 | Flûte C13, FM Intermédiaires C22 | |
| Clement | Patricia Clement (mère) | Mathieu Clement | 17 | Saxophone ténor C18, FM Avancés C23, Atelier Jazz C26+C27 | Passionné de jazz, élève très investi |
| Rousseau (2) | Jean Rousseau (père) | Bastien Rousseau | 12 | Guitare C04, FM Débutants C21 | Aucun lien avec le prof Nathalie Rousseau |
| Vincent | Nathalie Vincent (mère) | Zara Vincent | 11 | Violon C07, FM Débutants C21 | |
| Muller | Dieter Muller (père) | Karl Muller | 15 | Piano C02, FM Intermédiaires C22 | Famille allemande installée à Strasbourg |
| Gonzalez | Elena Gonzalez (mère) | Sofia Gonzalez | 13 | Guitare C04, FM Intermédiaires C22 | |
| Leclerc | Bernard Leclerc (père) | Timothée Leclerc | 16 | Batterie C14, FM Avancés C23 | Joue dans un groupe amateur en dehors |
| Adam | Sylvie Adam (mère) | Elsa Adam | 15 | Chant C20, Chorale C25 | Belle voix de mezzo-soprano |
| Henry | Patrick Henry (père) | Enzo Henry | 14 | Trompette C10, FM Intermédiaires C22, Orchestre C24 | Réduction cuivres |
| Jacquet | Béatrice Jacquet (mère) | Lily Jacquet | 10 | Flûte C13, FM Débutants C21 | Plus jeune de l'académie, très enthousiaste |
| Martini | Paolo Martini (père) | Marco Martini | 17 | Piano C03, FM Avancés C23 | Famille italienne, vise le conservatoire de Lyon |
| Nguyen (2) | Lan Nguyen (mère) | Mei Nguyen | 12 | Violon C07, FM Débutants C21 | Aucun lien avec le prof Thomas Nguyen |
| Pham | Thu Pham (mère) | Linh Pham | 9 | Piano C01, FM Débutants C21 | |
| Hamidi | Nadia Hamidi (mère) | Yasmine Hamidi | 13 | Flûte C13, FM Intermédiaires C22 | |
| Okafor | Chisom Okafor (père) | Amara Okafor | 14 | Batterie C14, FM Intermédiaires C22 | Famille franco-nigériane, talent naturel |
| Dubois | Fabrice Dubois (père) | Victor Dubois | 16 | Guitare classique C04, FM Avancés C23, Atelier Jazz C27 | |
| Petit (2) | (≠ prof Isabelle Petit) Gérard Petit (père) | Camille Petit | 11 | Alto C09, FM Débutants C21 | Démarrage cette année, bien progressé |
| Wagner | Klaus Wagner (père) | Hannah Wagner | 14 | Clarinette C19, FM Intermédiaires C22, Orchestre C24 | Famille alsacienne |
| Schmitt | Elisabeth Schmitt (mère) | Lucas Schmitt | 13 | Trombone C11, FM Intermédiaires C22 | Réduction cuivres — le seul élève trombone |

### Adultes (sans famille associée)

| Nom | Âge | Cours | Notes |
|-----|-----|-------|-------|
| Sandrine Beaumont | 35 | Piano C02 (cours adulte, 45 min, pas de FM obligatoire) | Reprend la musique après 15 ans d'arrêt |
| Philippe Renard | 42 | Guitare classique C04 | Cadre supérieur, cours le samedi uniquement |
| Cécile Aumont | 28 | Chant C20, Chorale C25 | Professeure d'école primaire, très bonne voix |
| Marc-Antoine Dubois | 31 | Saxophone alto C18 | Aucun lien avec Victor Dubois |
| Hanna Kowalski | 26 | Violon C07 | Étudiante en musicologie à l'Université de Strasbourg |

---

## 10. Présences représentatives (Attendance patterns)

### Élèves avec présence excellente (>95%)
- Hugo Martin, Camille Dupont, Noa Chevalier, Charlotte Robin, Simon David, Mathieu Clement

### Élèves avec quelques absences (~15%)
- **Antoine Bernard** : absences groupées en janvier (examens lycée), rattrapé rapidement
- **Nathan Lefebvre** : absences récurrentes les vendredis (parents divorcés, garde alternée complique la logistique)
- **Timothée Leclerc** : quelques absences en mai (concours de son groupe amateur)

### Élèves avec problème d'assiduité suivi (>25% absences)
- **Baptiste Thomas** (11 ans, trompette) : souvent absent le mercredi, problème de transport. Sa mère a envoyé plusieurs messages pour s'en excuser.
- **Linh Pham** (9 ans, piano) : absences fréquentes en hiver (maladie, enfant fragile). Ses parents ont demandé des rattrapages.

### Présences lors de l'Orchestre Jeunes
- Répétitions du samedi très bien suivies (92% en moyenne)
- Seuls Lola Thomas et Théo Gauthier sont régulièrement en retard (cours de sport le samedi matin)
- Répétition générale audition mars : **100% de présence**

---

## 11. Messages représentatifs (Messaging)

### Conversation 1 : Famille Thomas → Nathalie Rousseau (FM Débutants)
**Date :** 8 janvier 2026
**Isabelle Thomas :** "Bonjour Madame Rousseau, Baptiste ne pourra pas venir mercredi prochain car il a rendez-vous chez l'orthodontiste. Pourrait-il récupérer la séance ?"
**Nathalie Rousseau :** "Bonjour, bien sûr, pas de problème. Je lui enverrai les exercices par ce biais. Il peut rejoindre le groupe du samedi 17h pour compenser si vous souhaitez."
**Isabelle Thomas :** "Parfait, merci beaucoup !"

### Conversation 2 : Hélène Marchand (directrice) → Tous (annonce groupe)
**Date :** 15 janvier 2026
**Hélène Marchand :** "Chers élèves et familles, je suis ravie de vous annoncer que l'Audition de Printemps aura lieu le dimanche 15 mars de 14h à 18h. Les inscriptions pour se produire sont ouvertes jusqu'au 1er mars. Tous les élèves ayant au moins 6 mois d'ancienneté sont encouragés à participer ! Le programme sera affiché prochainement. Bonne pratique à tous."

### Conversation 3 : Sandrine Beaumont → Hélène Marchand
**Date :** 22 janvier 2026
**Sandrine Beaumont :** "Bonjour Hélène, je dois décaler mon cours de mercredi prochain, aurais-tu un créneau jeudi ou vendredi ?"
**Hélène Marchand :** "Bonjour Sandrine, je peux te proposer jeudi 29 janvier à 18h30 ou vendredi 30 à 17h, qu'est-ce qui t'arrange ?"
**Sandrine Beaumont :** "Jeudi 18h30 c'est parfait, merci !"

### Conversation 4 : Marc Durand → Famille Perrin (Ethan)
**Date :** 3 février 2026
**Marc Durand :** "Bonjour, je souhaitais vous informer qu'Ethan a réalisé d'excellents progrès ce semestre. Il maîtrise maintenant les gammes jusqu'à 3 bémols et son son s'est beaucoup amélioré. Je l'encourage vivement à intégrer l'Orchestre Jeunes à la rentrée de septembre prochain."
**Virginie Perrin :** "Bonjour M. Durand, merci pour ce retour encourageant ! Ethan sera ravi d'apprendre ça. Nous en parlerons ensemble ce week-end."

### Conversation 5 : Secrétariat → Famille Dupont (rappel facture)
**Date :** 10 février 2026
**Secrétariat :** "Bonjour M. et Mme Dupont, nous vous rappelons que la facture n°2026-018 d'un montant de €1 960 pour le 2ème semestre reste impayée. Pourriez-vous régulariser votre situation avant le 28 février ? Merci de contacter notre secrétariat au 03 88 45 12 67."

### Conversation 6 : Nathalie Rousseau → Groupe FM Avancés
**Date :** 20 mars 2026 (après l'audition)
**Nathalie Rousseau :** "Bravo à tous pour vos prestations de dimanche ! Vous avez fait honneur à l'académie. Pour le cours de lundi, nous commençons le chapitre sur les modes ecclésiastiques — pensez à relire votre cours sur les gammes majeures. À lundi !"

### Conversation 7 : Famille Pham → Hélène Marchand (direction)
**Date :** 5 mars 2026
**Thu Pham :** "Bonjour Madame, Linh a encore été malade cette semaine (bronchite). C'est la 4ème absence depuis janvier. Nous craignons de trop prendre de retard. Est-il possible d'avoir un bilan avec son professeur ?"
**Hélène Marchand :** "Bonjour Mme Pham, je comprends votre inquiétude. Hélène suit bien Linh et me dit qu'elle rattrape vite. Je vous propose un rendez-vous le samedi 14 mars à 11h30, est-ce possible ?"

---

## 12. Notifications représentatives

- **Absence Linh Pham** (12 fév 2026) : "Linh Pham a été marquée absente au cours de Piano débutant du 12 février (Hélène Marchand). — Message automatique"
- **Facture envoyée** : "La facture n°2026-018 pour la famille Dupont a été émise (€1 960,00). Échéance : 28 février 2026."
- **Rappel cours** : "Rappel : Orchestre Jeunes ce samedi 14h30 — Répétition générale audition. Présence obligatoire."
- **Inscription confirmée** : "Inscription de Victor Thomas (Guitare + FM Débutants) confirmée pour l'année 2025-2026."

---

## 13. Comptes utilisateurs à créer

| Email | Mot de passe initial | Rôle | Lié à |
|-------|---------------------|------|-------|
| admin@hirondelles-musique.fr | Admin1234! | SUPER_ADMIN | Directrice (Hélène Marchand) |
| h.marchand@hirondelles-musique.fr | Teacher1234! | TEACHER | Hélène Marchand |
| t.nguyen@hirondelles-musique.fr | Teacher1234! | TEACHER | Thomas Nguyen |
| s.leblanc@hirondelles-musique.fr | Teacher1234! | TEACHER | Sophie Leblanc |
| m.durand@hirondelles-musique.fr | Teacher1234! | TEACHER | Marc Durand |
| i.petit@hirondelles-musique.fr | Teacher1234! | TEACHER | Isabelle Petit |
| k.benali@hirondelles-musique.fr | Teacher1234! | TEACHER | Karim Benali |
| n.rousseau@hirondelles-musique.fr | Teacher1234! | TEACHER | Nathalie Rousseau |
| p.moreau@hirondelles-musique.fr | Teacher1234! | TEACHER | Pierre Moreau |
| a.simon@hirondelles-musique.fr | Teacher1234! | TEACHER | Agathe Simon |
| j.fabre@hirondelles-musique.fr | Teacher1234! | TEACHER | Julien Fabre |
| f.martin@famille.fr | Parent1234! | PARENT | Famille Martin (primary) |
| l.bernard@famille.fr | Parent1234! | PARENT | Famille Bernard (primary) |
| o.dupont@famille.fr | Parent1234! | PARENT | Famille Dupont (primary) |
| … (un compte parent par famille, email générique) | | | |
| sandrine.beaumont@email.fr | Student1234! | STUDENT | (adulte) |
| philippe.renard@email.fr | Student1234! | STUDENT | (adulte) |
| cecile.aumont@email.fr | Student1234! | STUDENT | (adulte) |

---

## 14. Notes pour l'import

1. **Ordre de création :** Instruments → Rooms → Users (teachers first) → Teachers → Users (parents) → Families → FamilyMembers → Users (students) → Students → Courses → Enrollments → Sessions (recurrence) → Attendance → Events → EventParticipants → Invoices
2. **Sessions récurrentes :** Chaque cours hebdomadaire génère ~32 sessions entre le 15 septembre 2025 et le 26 juin 2026, hors vacances scolaires Zone B et jours fériés.
3. **Présences :** Générer ~85% PRESENT, ~8% ABSENT, ~5% LATE, ~2% EXCUSED pour rendre les données réalistes.
4. **Factures :** Une facture par semestre par famille (1er semestre : oct 2025, 2ème semestre : fév 2026). Statut : la plupart PAID, 2-3 OVERDUE, 1 PARTIAL.
5. **La réduction cuivres s'applique** uniquement sur le cours individuel de l'instrument concerné, pas sur les add-ons (orchestre, FM).
6. **SubscriptionPlan** à assigner à chaque enrollment (enrollment.planId une fois ajouté) — pour le moment, les montants sont calculés manuellement dans les InvoiceItems.
