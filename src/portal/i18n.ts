// Meertalig fundament voor het klantenportaal.
// Vertaalt de INTERFACE (navigatie, knoppen, login, dashboard). De inhoud uit
// Airtable (rassen, teeltadvies, ...) blijft in de taal waarin die is ingevoerd.
//
// Taal per klant komt uit het veld "Taal" in de Klanten-tabel; valt terug op de
// browsertaal (Accept-Language) en anders op Nederlands.

export type Lang = "nl" | "en" | "de" | "es";
export const LANGS: Lang[] = ["nl", "en", "de", "es"];

export interface Strings {
  lang: Lang;
  brand: string;
  footer: string;
  nav: { home: string; rassen: string; teelt: string; snoei: string; docs: string; logout: string };
  login: { title: string; intro: string; emailLabel: string; button: string; verlopen: string; nietIngesteld: string };
  sent: { title: string; body: string; testPrefix: string; retry: string };
  dash: {
    welcome: string;
    intro: string;
    rassenT: string; rassenD: string;
    teeltT: string; teeltD: string;
    snoeiT: string; snoeiD: string;
    docsT: string; docsD: string;
    askT: string; askPlaceholder: string; askBtn: string; askBusy: string; askSources: string; askError: string;
  };
  rassen: { title: string; empty: string; smaak: string; kleur: string };
  teelt: { title: string; empty: string };
  snoei: { title: string; empty: string };
  docs: { title: string; empty: string };
}

const nl: Strings = {
  lang: "nl",
  brand: "Klantenportaal",
  footer: "Fresh Forward klantenportaal · beveiligde toegang",
  nav: { home: "Home", rassen: "Rassen", teelt: "Teeltadvies", snoei: "Snoei & pluk", docs: "Documenten", logout: "Uitloggen" },
  login: {
    title: "Inloggen",
    intro: "Vul je e-mailadres in. Als je bij ons bekend bent, sturen we je een inloglink. Geen wachtwoord nodig.",
    emailLabel: "E-mailadres",
    button: "Stuur inloglink",
    verlopen: "Je inloglink is verlopen of ongeldig. Vraag een nieuwe aan.",
    nietIngesteld: "Het portaal is nog niet volledig ingesteld (PORTAL_SECRET ontbreekt).",
  },
  sent: {
    title: "Check je mail",
    body: "Als het e-mailadres bij ons bekend is, hebben we een inloglink gestuurd. De link is 15 minuten geldig.",
    testPrefix: "Testmodus: er is geen mail verstuurd. Gebruik deze link om in te loggen:",
    retry: "← opnieuw proberen",
  },
  dash: {
    welcome: "Welkom",
    intro: "Hier vind je rasseninformatie, teeltadvies, snoei- en plukinstructies en documenten van Fresh Forward.",
    rassenT: "Rassen", rassenD: "Rasseninformatie & eigenschappen",
    teeltT: "Teeltadvies", teeltD: "Adviezen per onderwerp",
    snoeiT: "Snoei & pluk", snoeiD: "Instructies en timing",
    docsT: "Documenten", docsD: "Handleidingen & downloads",
    askT: "Vraag de kennisbank", askPlaceholder: "bv. Wanneer snoei ik dit ras?", askBtn: "Vraag", askBusy: "Bezig met zoeken\u2026", askSources: "Bronnen:", askError: "Kon de kennisbank niet bereiken.",
  },
  rassen: { title: "Rassen", empty: "Nog geen rassen gepubliceerd.", smaak: "Smaak", kleur: "Kleur" },
  teelt: { title: "Teeltadvies", empty: "Nog geen teeltadvies gepubliceerd." },
  snoei: { title: "Snoei & pluk", empty: "Nog geen instructies gepubliceerd." },
  docs: { title: "Documenten", empty: "Nog geen documenten beschikbaar." },
};

const en: Strings = {
  lang: "en",
  brand: "Customer portal",
  footer: "Fresh Forward customer portal · secure access",
  nav: { home: "Home", rassen: "Varieties", teelt: "Growing advice", snoei: "Pruning & picking", docs: "Documents", logout: "Log out" },
  login: {
    title: "Log in",
    intro: "Enter your email address. If you are known to us, we will send you a login link. No password needed.",
    emailLabel: "Email address",
    button: "Send login link",
    verlopen: "Your login link has expired or is invalid. Please request a new one.",
    nietIngesteld: "The portal is not fully configured yet (PORTAL_SECRET is missing).",
  },
  sent: {
    title: "Check your email",
    body: "If the email address is known to us, we have sent a login link. The link is valid for 15 minutes.",
    testPrefix: "Test mode: no email was sent. Use this link to log in:",
    retry: "← try again",
  },
  dash: {
    welcome: "Welcome",
    intro: "Here you will find variety information, growing advice, pruning and picking instructions, and documents from Fresh Forward.",
    rassenT: "Varieties", rassenD: "Variety information & traits",
    teeltT: "Growing advice", teeltD: "Advice by topic",
    snoeiT: "Pruning & picking", snoeiD: "Instructions and timing",
    docsT: "Documents", docsD: "Manuals & downloads",
    askT: "Ask the knowledge base", askPlaceholder: "e.g. When do I prune this variety?", askBtn: "Ask", askBusy: "Searching\u2026", askSources: "Sources:", askError: "Could not reach the knowledge base.",
  },
  rassen: { title: "Varieties", empty: "No varieties published yet.", smaak: "Taste", kleur: "Colour" },
  teelt: { title: "Growing advice", empty: "No growing advice published yet." },
  snoei: { title: "Pruning & picking", empty: "No instructions published yet." },
  docs: { title: "Documents", empty: "No documents available yet." },
};

const de: Strings = {
  lang: "de",
  brand: "Kundenportal",
  footer: "Fresh Forward Kundenportal · sicherer Zugang",
  nav: { home: "Start", rassen: "Sorten", teelt: "Anbauberatung", snoei: "Schnitt & Ernte", docs: "Dokumente", logout: "Abmelden" },
  login: {
    title: "Anmelden",
    intro: "Geben Sie Ihre E-Mail-Adresse ein. Wenn Sie bei uns bekannt sind, senden wir Ihnen einen Anmeldelink. Kein Passwort nötig.",
    emailLabel: "E-Mail-Adresse",
    button: "Anmeldelink senden",
    verlopen: "Ihr Anmeldelink ist abgelaufen oder ungültig. Bitte fordern Sie einen neuen an.",
    nietIngesteld: "Das Portal ist noch nicht vollständig eingerichtet (PORTAL_SECRET fehlt).",
  },
  sent: {
    title: "Prüfen Sie Ihre E-Mail",
    body: "Wenn die E-Mail-Adresse bei uns bekannt ist, haben wir einen Anmeldelink gesendet. Der Link ist 15 Minuten gültig.",
    testPrefix: "Testmodus: es wurde keine E-Mail gesendet. Verwenden Sie diesen Link zum Anmelden:",
    retry: "← erneut versuchen",
  },
  dash: {
    welcome: "Willkommen",
    intro: "Hier finden Sie Sorteninformationen, Anbauberatung, Schnitt- und Ernteanleitungen sowie Dokumente von Fresh Forward.",
    rassenT: "Sorten", rassenD: "Sorteninformationen & Eigenschaften",
    teeltT: "Anbauberatung", teeltD: "Beratung nach Thema",
    snoeiT: "Schnitt & Ernte", snoeiD: "Anleitungen und Timing",
    docsT: "Dokumente", docsD: "Handbücher & Downloads",
    askT: "Wissensdatenbank fragen", askPlaceholder: "z. B. Wann schneide ich diese Sorte?", askBtn: "Fragen", askBusy: "Suche l\u00e4uft\u2026", askSources: "Quellen:", askError: "Wissensdatenbank nicht erreichbar.",
  },
  rassen: { title: "Sorten", empty: "Noch keine Sorten veröffentlicht.", smaak: "Geschmack", kleur: "Farbe" },
  teelt: { title: "Anbauberatung", empty: "Noch keine Anbauberatung veröffentlicht." },
  snoei: { title: "Schnitt & Ernte", empty: "Noch keine Anleitungen veröffentlicht." },
  docs: { title: "Dokumente", empty: "Noch keine Dokumente verfügbar." },
};

const es: Strings = {
  lang: "es",
  brand: "Portal de clientes",
  footer: "Portal de clientes de Fresh Forward · acceso seguro",
  nav: { home: "Inicio", rassen: "Variedades", teelt: "Consejos de cultivo", snoei: "Poda y recolección", docs: "Documentos", logout: "Cerrar sesión" },
  login: {
    title: "Iniciar sesión",
    intro: "Introduce tu correo electrónico. Si te conocemos, te enviaremos un enlace de acceso. No necesitas contraseña.",
    emailLabel: "Correo electrónico",
    button: "Enviar enlace de acceso",
    verlopen: "Tu enlace de acceso ha caducado o no es válido. Solicita uno nuevo.",
    nietIngesteld: "El portal aún no está completamente configurado (falta PORTAL_SECRET).",
  },
  sent: {
    title: "Revisa tu correo",
    body: "Si conocemos el correo electrónico, hemos enviado un enlace de acceso. El enlace es válido durante 15 minutos.",
    testPrefix: "Modo de prueba: no se envió ningún correo. Usa este enlace para iniciar sesión:",
    retry: "← intentar de nuevo",
  },
  dash: {
    welcome: "Bienvenido",
    intro: "Aquí encontrarás información sobre variedades, consejos de cultivo, instrucciones de poda y recolección, y documentos de Fresh Forward.",
    rassenT: "Variedades", rassenD: "Información y características de variedades",
    teeltT: "Consejos de cultivo", teeltD: "Consejos por tema",
    snoeiT: "Poda y recolección", snoeiD: "Instrucciones y momento",
    docsT: "Documentos", docsD: "Manuales y descargas",
    askT: "Pregunta a la base de conocimientos", askPlaceholder: "p. ej. ¿Cu\u00e1ndo podo esta variedad?", askBtn: "Preguntar", askBusy: "Buscando\u2026", askSources: "Fuentes:", askError: "No se pudo acceder a la base de conocimientos.",
  },
  rassen: { title: "Variedades", empty: "Aún no hay variedades publicadas.", smaak: "Sabor", kleur: "Color" },
  teelt: { title: "Consejos de cultivo", empty: "Aún no hay consejos publicados." },
  snoei: { title: "Poda y recolección", empty: "Aún no hay instrucciones publicadas." },
  docs: { title: "Documentos", empty: "Aún no hay documentos disponibles." },
};

const DICT: Record<Lang, Strings> = { nl, en, de, es };

// Airtable-keuze ("Nederlands"/"English"/...) of taalcode -> Lang.
const NAAR_LANG: Record<string, Lang> = {
  nederlands: "nl", nl: "nl", dutch: "nl",
  english: "en", en: "en", engels: "en",
  deutsch: "de", de: "de", duits: "de", german: "de",
  "español": "es", espanol: "es", es: "es", spaans: "es", spanish: "es",
};

// Bepaal de taal uit (1) klant-voorkeur, anders (2) Accept-Language, anders nl.
export function pickLang(klantTaal?: string, acceptLanguage?: string): Lang {
  if (klantTaal) {
    const v = NAAR_LANG[klantTaal.trim().toLowerCase()];
    if (v) return v;
  }
  if (acceptLanguage) {
    for (const part of acceptLanguage.split(",")) {
      const code = part.trim().slice(0, 2).toLowerCase();
      if ((LANGS as string[]).includes(code)) return code as Lang;
    }
  }
  return "nl";
}

export const getStrings = (lang: Lang): Strings => DICT[lang];
