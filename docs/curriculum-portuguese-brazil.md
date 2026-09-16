# Brazilian Portuguese: the Brazil-trip stream

**Target learner**: an English speaker who is going to Brazil to meet a partner's
family, travelling with a parent who speaks no Portuguese.
**CEFR range**: A1 through early A2.
**Shipped**: 5 units, 20 scenes, 233 words, 100 phrases, 60 patterns, 60 can-dos.

This is a description of what is in `lib/db/content/pt/`, not a plan for what
might go there. Every figure above is countable from those files.

---

## Why this stream is shaped differently

The Indonesian curriculum (`curriculum-indonesian-a1-a2.md`) is organised by
*domain* — greetings, transport, food, money — because its learner is a resident
who will meet those domains in an unpredictable order over months.

This stream is organised by *itinerary*, because its learner meets its situations
in a known order on a known date: arrive, meet the family, travel, then the
festas. A domain curriculum would teach the bus station in Unit 2 and the family
in Unit 6; here the family comes first, because that is the week that arrives
first and the one that matters most.

The consequence is that the units are not independent. Unit 5 assumes you can
already introduce yourself (Unit 1), say who someone is (Unit 3) and ask a
stranger for help (Unit 4). No scene uses a word before the scene that teaches
it — this is checked, not assumed.

## Unit overview

| Unit | Theme | Scenes | New words | Cumulative | CEFR |
|------|-------|--------|-----------|------------|------|
| 1 | Chegando — arrival, hotel, neighbours, first outing | 4 | 45 | 45 | A1 |
| 2 | O dia a dia — café, market, bus, dinner with friends | 4 | 44 | 89 | A1 |
| 3 | A família — meeting the partner's family | 4 | 48 | 137 | A1+ |
| 4 | Viajando pelo Brasil — bus station, guesthouse, beach, asking locals | 4 | 48 | 185 | A1+ |
| 5 | Festas com a minha mãe — Christmas, Réveillon, Carnival, goodbyes | 4 | 48 | 233 | A2 |

## Scene list

Scene `sort_order` is 1–20 across the whole path; the numbers below are the
scene ids' last two digits (`d4000000-0001-4000-8000-0000000000NN`).

**Unit 1 — Chegando (11–14)**
1. `11` No aeroporto — greetings, your name, thank you
2. `12` Check-in no hotel — reservations, numbers, your room
3. `13` Conhecendo os vizinhos — introducing a friend, where things are
4. `14` Primeiro passeio — the beach, directions, excuse me

**Unit 2 — O dia a dia (21–24)**
5. `21` No café — ordering, refusing, complimenting food
6. `22` Na feira — prices, quantities, bargaining
7. `23` Pegando o ônibus — transport, times, getting off
8. `24` Um jantar entre amigos — small talk over a meal

**Unit 3 — A família (31–34)**
9. `31` Chegando na casa da família — arriving, hugs, being welcomed
10. `32` Quem é quem — relatives, who is who, ages
11. `33` Falando de mim — where you live, what you do, "slower please"
12. `34` Churrasco de domingo — passing dishes, praising food, being full

**Unit 4 — Viajando pelo Brasil (41–44)**
13. `41` Na rodoviária — return tickets, departure times, gates, delays
14. `42` Na pousada — what's included, wifi, a broken shower
15. `43` Dia de praia — hiring a chair, coconut water, going in the sea
16. `44` Pedindo dicas — recommendations, safety, being lost, a pharmacy

**Unit 5 — Festas com a minha mãe (51–54)**
17. `51` Apresentando a minha mãe — introducing her, `senhor/senhora`, "say that again"
18. `52` Ceia de Natal — Merry Christmas, presents at midnight, singing
19. `53` Réveillon na praia — white clothes, seven waves, fireworks, toasts
20. `54` Carnaval e a despedida — blocos, costumes, *saudade*, goodbyes

## Design decisions worth keeping

**The mother is a character, not a footnote.** Unit 5 teaches the learner to
speak *on someone else's behalf* — introducing a person who cannot answer for
herself, asking the room to slow down, explaining a local custom to her. That is
a different skill from self-introduction and it is the actual job on this trip.

**`senhor` / `senhora` is taught where it is needed.** Brazilian Portuguese is
informal by default and `você` carries almost everywhere, so the respectful
forms are easy to skip. They are introduced in Unit 5 at the moment a learner
is put in front of a partner's grandmother, which is the one context where
getting it wrong is felt.

**Grammar is caught, not taught.** Gendered agreement (`obrigado`/`obrigada`,
`cansado`/`cansada`, `bem-vindo`/`bem-vinda`) is never given a rule page. It
appears in the phrase, in the usage note, and in the can-do `accept_notes`, so
both forms pass the test and the learner meets the distinction repeatedly in
context rather than once as an abstraction.

**Can-dos are situations, never translations.** `prompt_en` must not contain the
Portuguese answer or any of its content words — a check enforced over all 60
statements. Proper names and shared words (`café`) are exempt: the prompt has to
name the person for the task to be doable.

**`must_include` ships empty on every one of the 60.** A lemma list rejects a
valid answer before the grader ever runs, with no appeal. Several can-dos carry
`accept_notes` instead, which the grader reads as guidance rather than a gate —
that is where "Estou satisfeita for a woman" and "Cuidem-se for a group" live.

## Regenerating

```
npx tsx lib/db/seed-expanded.ts  --lang=pt        # scenes, words, phrases, patterns
npx tsx lib/db/seed-can-dos.ts   --language=pt    # can-dos (+ retroactive unlock)
npx tsx lib/db/seed-mnemonics.ts --lang=pt        # keyword mnemonics + illustrations
npx tsx lib/db/seed-audio.ts     --lang=pt --mode=all
npx tsx lib/db/seed-scene-anchors.ts --lang=pt --limit=20
```

All five are idempotent and skip work already done. Mnemonic text for Units 1–2
is inline in `lib/db/mnemonic-data.ts`; Units 3–5 are in
`lib/db/content/pt/mnemonics-unit{3,4,5}.ts` and spread into the same record at
the bottom of that file.
