// Starter-cursussen voor de Trainingen-module. Worden bij eerste gebruik in D1
// geladen (seedIfEmpty). Daarna bewerkbaar via Beheer → Trainingen.
// Markdown-conventies in body: "## kop", "### kop", "- bullet", "**vet**".
// Kennischeck: een "- Vraag || Antwoord" regel wordt een uitklapbaar vraag/antwoord.

export interface SeedChapter { title: string; body: string }
export interface SeedCourse { title: string; description: string; chapters: SeedChapter[] }

export const COURSE_SEED: SeedCourse[] = [
  {
    title: "Slim werken met Microsoft Copilot",
    description:
      "Wat Copilot wel/niet kan, goede prompts, per Office-app, en veilig met bedrijfsgegevens. ~45 min.",
    chapters: [
      {
        title: "1 — Wat is Copilot eigenlijk?",
        body: `Copilot is de AI-assistent van Microsoft die in je vertrouwde Office-programma's zit: Word, Excel, Outlook, Teams, PowerPoint en als losse chat. Hij kan tekst schrijven, samenvatten, herschrijven, gegevens analyseren, e-mails opstellen en vragen beantwoorden — op basis van wat jij hem vraagt.

Belangrijk om te begrijpen: Copilot is een **taalmodel**. Hij voorspelt wat een waarschijnlijk goed antwoord is op basis van enorme hoeveelheden tekst waarop hij getraind is. Hij "begrijpt" niet zoals een mens, en hij heeft geen eigen oordeel. Dat verklaart zowel zijn kracht (razendsnel taal produceren) als zijn zwakte (hij kan met volle overtuiging iets verkeerds zeggen).

Wat Copilot ten opzichte van een gratis publieke chatbot bijzonder maakt: de versie in jullie Microsoft-licentie kan — met de juiste rechten — werken met jullie eigen bestanden, mails en agenda's binnen de beveiligde Microsoft-omgeving. Daarover meer in hoofdstuk 6 en 7.

### Kennischeck
- Is Copilot een mens die meeleest? || Nee — het is een taalmodel dat tekst voorspelt.
- Waarom kan Copilot soms met overtuiging iets onjuists zeggen? || Hij voorspelt waarschijnlijke taal; hij heeft geen eigen oordeel of feitengarantie.`,
      },
      {
        title: "2 — De kunst van het vragen (prompten)",
        body: `De kwaliteit van wat Copilot teruggeeft, hangt vooral af van hoe goed je het vraagt. Een goede opdracht (prompt) bevat meestal vier dingen:

- **Rol of context**: "Je bent een marketingmedewerker bij een fruitveredelingsbedrijf…"
- **Taak**: wat moet er precies gebeuren? "Schrijf een korte nieuwsbrieftekst over…"
- **Vorm**: hoe wil je het? "…in maximaal 150 woorden, in een enthousiaste maar zakelijke toon, met een pakkende kop."
- **Materiaal**: waarop baseert hij zich? "…op basis van dit persbericht: [tekst]."

Vergelijk een zwakke en een sterke prompt:
- Zwak: "Schrijf iets over ons nieuwe appelras."
- Sterk: "Schrijf een wervende productbeschrijving van ~120 woorden voor telers over ons nieuwe appelras Bloss, met nadruk op smaak en bewaarbaarheid, in een professionele toon."

Twee technieken die altijd helpen:
- **Itereren**: je eerste antwoord is een startpunt, geen eindpunt. Vraag gerust "maak het korter", "formeler", "voeg een voorbeeld toe".
- **Voorbeelden geven**: laat zien hoe je het wilt ("schrijf in dezelfde stijl als deze eerdere tekst: …").

### Kennischeck
- Noem drie van de vier onderdelen van een goede prompt. || Rol/context, taak, vorm, materiaal.
- Wat doe je als het eerste antwoord niet goed genoeg is? || Itereren — bijsturen met vervolgopdrachten.`,
      },
      {
        title: "3 — Wat Copilot goed kan (en wat niet)",
        body: `**Goed in:**
- Eerste versies schrijven (mails, teksten, samenvattingen) die jij daarna aanscherpt.
- Lange documenten of mailthreads samenvatten.
- Tekst herschrijven: korter, formeler, in een andere toon, in een andere taal.
- Brainstormen en structureren (lijsten, opzetjes, ideeën).
- Gegevens in Excel analyseren en uitleggen.

**Niet goed in / wees voorzichtig:**
- **Feiten met zekerheid geven.** Hij kan namen, cijfers, citaten en bronnen "verzinnen" die plausibel klinken maar fout zijn. Dit heet *hallucineren*.
- **Recente of zeer specifieke kennis** die niet in zijn training of jouw documenten zit.
- **Rekenen op exacte juridische, medische of financiële juistheid** zonder controle.
- **Oordeel en verantwoordelijkheid.** Het eindbesluit en de eindcontrole blijven bij jou.

De gouden regel: **Copilot levert een concept, jij levert de kwaliteit.** Gebruik hem om sneller te starten, niet om blind te eindigen.

### Kennischeck
- Wat betekent "hallucineren" bij AI? || Plausibel klinkende maar onjuiste informatie produceren.
- Bij wie ligt de eindverantwoordelijkheid voor wat je verstuurt? || Bij jou, niet bij Copilot.`,
      },
      {
        title: "4 — Aan de slag: je eerste Copilot-opdracht",
        body: `Een eenvoudige manier om te starten, los van welke app dan ook (Copilot Chat):

- Open Copilot (via de Copilot-knop in Office of de losse Copilot-chat).
- Begin klein: vraag hem een mail samen te vatten of een tekstje te herschrijven.
- Lees het antwoord kritisch: klopt het, mist er iets, klinkt het zoals jij wilt?
- Stuur bij met een vervolgopdracht.
- Kopieer pas naar je echte document/mail als je tevreden bent — en controleer feiten.

Oefening om zelf te doen: neem een e-mail die je deze week kreeg en vraag Copilot om "vat deze e-mail samen in drie bulletpoints en stel een korte, vriendelijke reactie voor". Bekijk wat er goed gaat en wat je zou bijsturen.

### Kennischeck
- Wat is de laatste stap voordat je Copilot-output echt gebruikt? || Controleren — feiten en toon — vóór versturen/opslaan.`,
      },
      {
        title: "5 — Copilot per Office-app (verdieping)",
        body: `*Dit hoofdstuk is de verdieping. Pak de stukken die voor jouw werk relevant zijn.*

### Word
- Laat een eerste versie schrijven vanuit een korte opdracht ("schrijf een conceptbrief over…").
- Laat bestaande tekst herschrijven, inkorten of van toon veranderen.
- Vraag een samenvatting van een lang document bovenaan.

### Excel
- Laat formules voorstellen of uitleggen ("hoe bereken ik het percentage groei per kolom?").
- Vraag om patronen of opvallende punten in een tabel te benoemen.
- Let op: controleer altijd of de analyse klopt met je eigen blik op de data — zeker bij beslissingen.

### Outlook
- Laat e-mails samenvatten of een concept-antwoord opstellen.
- Vraag om een mail korter, vriendelijker of formeler te maken.
- Laat een lange thread samenvatten ("wat is hier afgesproken en wat moet ik doen?").

### Teams
- Laat een vergadering samenvatten met actiepunten (bij opgenomen/getranscribeerde meetings).
- Vraag "wat heb ik gemist?" als je later instapt.

### PowerPoint
- Laat een eerste opzet van een presentatie maken vanuit een document of korte beschrijving.
- Vraag om een slide te vereenvoudigen of er sprekersnotities bij te maken.

### Kennischeck
- Welke Copilot-functie scheelt het meeste tijd bij lange mailthreads? || Samenvatten + actiepunten eruit halen.
- Waarom blijft controle in Excel extra belangrijk? || Foute analyse kan tot foute beslissingen leiden; cijfers ogen overtuigend.`,
      },
      {
        title: "6 — Kritisch gebruik: vertrouwen én controleren",
        body: `AI maakt je sneller, maar alleen als je de output blijft wegen. Vier gewoontes:

- **Controleer feiten, namen en cijfers** altijd zelf, zeker als je ze extern gebruikt. Vraag desnoods "waar baseer je dit op?" — maar weet dat ook die bronvermelding fout kan zijn.
- **Wees alert op zelfverzekerde toon.** Copilot klinkt overtuigend, ook als hij ernaast zit. Toon is geen bewijs.
- **Gebruik het als sparringpartner, niet als orakel.** Laat het opties geven, kies zelf.
- **Hoe belangrijker de uitkomst, hoe meer controle.** Een interne notitie mag een ruwe versie zijn; een contract, klantmail of cijferrapport niet.

Denk aan de verhouding: Copilot doet het zware tilwerk van de eerste 80%, jij doet de cruciale laatste 20% — controle, oordeel, eindverantwoordelijkheid. Die 20% is juist waarvoor je wordt ingehuurd.

### Kennischeck
- Waarom is een zelfverzekerde toon geen bewijs van juistheid? || Het model klinkt altijd overtuigend, ook bij fouten.
- Wanneer is extra controle het belangrijkst? || Naarmate de uitkomst belangrijker/externer is.`,
      },
      {
        title: "7 — Veilig omgaan met bedrijfsgegevens",
        body: `Dit is misschien wel het belangrijkste hoofdstuk. Een paar duidelijke regels:

- **Gebruik de Copilot uit de bedrijfslicentie**, niet een willekeurige gratis publieke chatbot, voor werk met bedrijfsgegevens. In de beveiligde Microsoft-omgeving worden jullie bedrijfsprompts en -gegevens niet gebruikt om het onderliggende model te trainen. (Controleer de exacte voorwaarden van jullie eigen licentie.)
- **Deel geen gevoelige gegevens in publieke/gratis AI-tools.** Geen klantgegevens, geen persoonsgegevens, geen vertrouwelijke veredelings- of contractinformatie in tools buiten de beveiligde bedrijfsomgeving.
- **Copilot ziet alleen wat jij mag zien.** Binnen de bedrijfsomgeving respecteert Copilot de bestaande toegangsrechten — hij toont je geen bestanden waar je zelf geen toegang toe hebt. Dat betekent ook: wees zorgvuldig met wie waar toegang toe heeft.
- **AVG blijft gelden.** Persoonsgegevens die je in een prompt zet, zijn nog steeds een verwerking. Verwerk niet meer dan nodig.
- **Bij twijfel: niet plakken.** Twijfel je of iets gevoelig is? Behandel het dan als gevoelig.

Voor Fresh Forward specifiek: veredelingsdata, licentiecontracten en kwekergegevens zijn bedrijfskritisch en deels vertrouwelijk/persoonsgebonden. Houd die binnen de beveiligde omgeving en deel ze nooit in externe AI-tools.

### Kennischeck
- Mag je vertrouwelijke contractdata in een gratis publieke chatbot plakken? || Nee — alleen binnen de beveiligde bedrijfsomgeving, en ook daar alleen wat nodig is.
- Kan Copilot je bestanden tonen waar je geen toegang toe hebt? || Nee, hij respecteert je bestaande toegangsrechten.
- Wat doe je bij twijfel over gevoeligheid? || Behandelen als gevoelig; niet delen.`,
      },
    ],
  },
  {
    title: "Microsoft Teams — praktische uitleg & naslag",
    description:
      "Praktische Teams-uitleg & naslag: chat vs. kanalen, vergaderen, bestanden, meldingen en Copilot.",
    chapters: [
      {
        title: "1 — Wat is Teams en waarvoor gebruik je het?",
        body: `Microsoft Teams is de plek waar je met collega's **samenwerkt, communiceert en vergadert** — alles in één app, gekoppeld aan je Microsoft-account. Je kunt het gebruiken op je computer (desktop-app of in de browser) en op je telefoon.

Teams bundelt grofweg vier dingen:
- **Chat** — snel 1-op-1 of met een groepje berichten sturen.
- **Teams & kanalen** — vaste samenwerkruimtes per afdeling, project of onderwerp.
- **Vergaderingen (meetings)** — bellen met beeld, scherm delen, opnemen.
- **Bestanden** — documenten delen en er samen in werken.

De rode draad: gebruik **chat** voor het snelle, vluchtige overleg en **kanalen** voor alles wat bij een onderwerp hoort en vindbaar moet blijven.

### Kennischeck
- Welke vier dingen bundelt Teams? || Chat, teams & kanalen, vergaderingen, bestanden.
- Waarvoor gebruik je chat en waarvoor kanalen? || Chat = snel/vluchtig overleg; kanalen = onderwerpgebonden en vindbaar.`,
      },
      {
        title: "2 — Chatten vs. kanalen: wanneer wat?",
        body: `Dit is de belangrijkste keuze in Teams, en waar het vaakst mis gaat.

**Chat** (linkermenu "Chat"):
- Voor een snel berichtje aan één persoon of een klein groepje.
- Vluchtig: het is van jullie samen, niet gekoppeld aan een onderwerp of project.
- Nadeel: kennis "verdwijnt" in privéchats; een nieuwe collega kan er niet bij.

**Kanaal** (binnen een Team):
- Voor alles wat bij een afdeling, project of onderwerp hoort.
- Iedereen in het team ziet het, het blijft vindbaar, en bestanden horen er automatisch bij.
- Gebruik **antwoorden (reply)** onder een bericht zodat een gesprek bij elkaar blijft, in plaats van een nieuw bericht te starten.

Vuistregel: *"Zou een collega dit later willen terugvinden, of is het relevant voor het team?"* → kanaal. *"Is het een snel dingetje tussen ons?"* → chat.

**Tip (gevorderd):** gebruik @naam om iemand gericht te taggen, en @kanaal/@team spaarzaam (dat pingt iedereen).

### Kennischeck
- Waar plaats je iets dat het hele team later moet kunnen terugvinden? || In een kanaal, niet in een privéchat.
- Hoe houd je een gesprek in een kanaal bij elkaar? || Reageren met "antwoord" onder het bericht i.p.v. een nieuw bericht.`,
      },
      {
        title: "3 — Vergaderen in Teams",
        body: `Een Teams-vergadering plan je meestal via je **agenda** (in Teams of Outlook) of je start 'm direct ("Nu vergaderen").

De basis tijdens een meeting:
- **Microfoon & camera** aan/uit met de knoppen bovenin. Zet je microfoon uit als je niet praat.
- **Scherm delen**: deel je hele scherm of één venster/presentatie. Deel liefst één venster, niet je hele scherm met je mail erbij.
- **Chat**: tijdens de meeting kun je links of vragen in de meetingchat zetten.
- **Hand opsteken** om netjes het woord te vragen in een grotere meeting.
- **Opnemen & transcriptie**: je kunt een meeting opnemen en automatisch laten uittypen (handig voor wie er niet bij was). Meld het even als je opneemt.

**Tip (gevorderd):** met **achtergrond vervagen/vervangen** oogt je beeld rustiger. En check vóór een externe meeting even je microfoon/camera via de apparaatinstellingen.

### Kennischeck
- Wat doe je met je microfoon als je niet aan het woord bent? || Uitzetten (mute).
- Wat kun je het beste delen: je hele scherm of één venster? || Eén venster/presentatie, om meelekken van andere zaken te voorkomen.`,
      },
      {
        title: "4 — Bestanden delen en samen bewerken",
        body: `In Teams hoef je bestanden niet meer als bijlage heen en weer te mailen — je werkt in **hetzelfde** bestand.

- In een **kanaal** vind je bovenin het tabblad **Bestanden**: alles wat in dat kanaal gedeeld wordt, staat daar (opgeslagen in SharePoint).
- In een **chat** staan gedeelde bestanden onder het tabblad Bestanden van die chat (opgeslagen in OneDrive).
- Sleep een bestand in een bericht of gebruik de paperclip om te delen.
- **Samen bewerken**: meerdere mensen kunnen tegelijk in een Word/Excel/PowerPoint-bestand werken; je ziet elkaars cursor. Wijzigingen worden automatisch opgeslagen.

Voordeel: er is altijd één actuele versie — geen "definitief_v3_echtfinaal.docx" meer.

**Tip (gevorderd):** rechtsklik een bestand → **Koppeling kopiëren** om ernaar te verwijzen i.p.v. een kopie te sturen. Zo blijft iedereen in dezelfde versie werken.

### Kennischeck
- Waarom een bestand in Teams delen i.p.v. als mailbijlage? || Je werkt samen in één actuele versie; geen losse kopieën.
- Waar vind je de bestanden die bij een kanaal horen? || Onder het tabblad "Bestanden" bovenin dat kanaal.`,
      },
      {
        title: "5 — Meldingen beheren (rust in je hoofd)",
        body: `Teams kan veel pingen. Goed ingestelde meldingen schelen enorm.

- Via je **profielfoto → Instellingen → Meldingen** bepaal je wat je wanneer ziet.
- Zet meldingen voor drukke kanalen op "alleen bij @vermeldingen", zodat je niet bij elk bericht een seintje krijgt.
- **Stille uren / niet storen**: stel in wanneer je geen meldingen wilt (bijv. 's avonds). Tijdens een meeting onderdrukt Teams meldingen automatisch.
- Een kanaal dat je weinig gebruikt kun je **verbergen**; een belangrijk kanaal kun je **vastmaken** of "volgen" zodat je niets mist.
- **Status** (Beschikbaar / Bezet / Niet storen) laat collega's zien of je gestoord mag worden — en stuurt mede je meldingen.

Vuistregel: zet "volgen" alleen aan voor kanalen die er echt toe doen, en gebruik @vermeldingen voor de rest.

### Kennischeck
- Hoe voorkom je een seintje bij élk bericht in een druk kanaal? || Meldingen op "alleen bij @vermeldingen" zetten.
- Wat doet je status "Niet storen"? || Onderdrukt meldingen en laat collega's zien dat je niet gestoord wil worden.`,
      },
      {
        title: "6 — Copilot in Teams",
        body: `Als Copilot in jullie licentie zit, helpt het je vooral rond **vergaderingen en gesprekken** (zie ook de Copilot-cursus voor de basis).

- **Vergadering samenvatten**: bij een opgenomen/getranscribeerde meeting kun je Copilot vragen om een samenvatting met **actiepunten** en besluiten.
- **"Wat heb ik gemist?"**: stap je later in een meeting in, dan vat Copilot kort samen wat er tot dan toe besproken is.
- **Chat/kanaal samenvatten**: laat een lange draad samenvatten zodat je snel bij bent.

Let op dezelfde gouden regels als bij de Copilot-cursus: **controleer** de samenvatting (zeker actiepunten en namen), en deel geen gevoelige info buiten de beveiligde omgeving. Copilot levert een concept van de notulen — jij bevestigt wat klopt.

### Kennischeck
- Wat is een handige Copilot-functie bij een meeting die je miste? || "Wat heb ik gemist?" / de meeting laten samenvatten met actiepunten.
- Wat doe je met een door Copilot gemaakte samenvatting voordat je 'm deelt? || Controleren (actiepunten, namen, besluiten) — het is een concept.`,
      },
      {
        title: "7 — Handige tips & sneltoetsen (naslag)",
        body: `Een paar dingen die het dagelijks werken in Teams prettiger maken:

- **Zoeken bovenin**: typ in de zoekbalk om snel een bericht, persoon of bestand te vinden. Begin met "/" voor snelle commando's (bijv. /bel, /beschikbaar).
- **Vastmaken**: maak belangrijke chats of kanalen vast zodat ze bovenaan staan.
- **Berichten opslaan**: klik de drie puntjes op een bericht → Opslaan; terugvinden via je profielfoto → Opgeslagen.
- **Bewerken/verwijderen**: je eigen berichten kun je achteraf aanpassen (drie puntjes → Bewerken).
- **Emoji/reacties**: reageer met een duim of hartje i.p.v. een los "oké"-bericht — minder ruis.

Handige sneltoetsen (desktop):
- **Ctrl + E** — naar de zoekbalk.
- **Ctrl + N** — nieuwe chat.
- **Ctrl + Shift + M** — microfoon dempen/aanzetten in een meeting.
- **Ctrl + Shift + O** — camera aan/uit in een meeting.

### Kennischeck
- Hoe spring je snel naar de zoekbalk? || Ctrl + E.
- Hoe reageer je laagdrempelig op een bericht zonder ruis te maken? || Met een emoji-reactie (duim/hartje) i.p.v. een los tekstbericht.`,
      },
    ],
  },
];
