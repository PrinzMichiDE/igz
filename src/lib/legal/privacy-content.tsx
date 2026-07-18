import type { ReactNode } from "react";

type Section = {
  id: string;
  title: string;
  body: ReactNode;
};

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-700 hover:underline"
    >
      {children}
    </a>
  );
}

export function getPrivacySections(locale: "de" | "en"): Section[] {
  const imprintHref = `/${locale}/impressum`;
  const sections = locale === "en" ? privacyEn(imprintHref) : privacyDe(imprintHref);
  return sections;
}

const privacyDe = (imprintHref: string): Section[] => [
  {
    id: "verantwortlicher",
    title: "1. Verantwortlicher",
    body: (
      <>
        <p>
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und
          anderer nationaler Datenschutzgesetze der Mitgliedstaaten sowie
          sonstiger datenschutzrechtlicher Bestimmungen ist:
        </p>
        <p className="mt-3">
          Michel Fritzsch
          <br />
          Emilienstr. 15
          <br />
          99817 Eisenach
          <br />
          Deutschland
        </p>
        <p className="mt-3">
          Kontakt für Datenschutzanfragen: postalisch über die oben genannte
          Anschrift. Ergänzende Angaben finden Sie im{" "}
          <a href={imprintHref} className="text-blue-700 hover:underline">
            Impressum
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "ueberblick",
    title: "2. Allgemeines zur Datenverarbeitung",
    body: (
      <>
        <p>
          Wir betreiben unter „IGZ Vergleich“ eine redaktionelle
          Produktvergleichsplattform mit Amazon-Affiliate-Links. Der Schutz Ihrer
          personenbezogenen Daten ist uns wichtig. Personenbezogene Daten werden
          nur verarbeitet, soweit dies zur Bereitstellung einer funktionsfähigen
          Website, ihrer Inhalte und Leistungen erforderlich ist oder eine
          gesetzliche Grundlage dies erlaubt.
        </p>
        <p className="mt-3">
          Rechtsgrundlagen der Verarbeitung sind insbesondere Art. 6 Abs. 1 lit.
          a DSGVO (Einwilligung), Art. 6 Abs. 1 lit. b DSGVO (Vertrag/vorvertragliche
          Maßnahmen), Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung) sowie
          Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
        </p>
      </>
    ),
  },
  {
    id: "hosting",
    title: "3. Hosting und Server-Logfiles",
    body: (
      <>
        <p>
          Unsere Website wird bei Vercel Inc., 440 N Barranca Ave #4133,
          Covina, CA 91723, USA („Vercel“) gehostet. Beim Aufruf der Website
          werden technisch notwendige Informationen automatisiert in
          sogenannten Server-Logfiles verarbeitet, insbesondere:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>IP-Adresse</li>
          <li>Datum und Uhrzeit der Anfrage</li>
          <li>abgerufene URL / Datei</li>
          <li>HTTP-Statuscode</li>
          <li>Referrer-URL (soweit übermittelt)</li>
          <li>Browsertyp und Betriebssystem</li>
        </ul>
        <p className="mt-3">
          Die Verarbeitung erfolgt zur Auslieferung der Website, zur
          Sicherstellung der Systemsicherheit und zur Missbrauchserkennung
          (Art. 6 Abs. 1 lit. f DSGVO). Eine Zusammenführung dieser Daten mit
          anderen Datenquellen zu Profiling-Zwecken findet durch uns nicht
          statt.
        </p>
        <p className="mt-3">
          Vercel kann Daten auch in den USA verarbeiten. Soweit erforderlich,
          erfolgt die Übermittlung auf Grundlage geeigneter Garantien (z. B.
          EU-Standardvertragsklauseln). Weitere Informationen:{" "}
          <ExternalLink href="https://vercel.com/legal/privacy-policy">
            Vercel Privacy Policy
          </ExternalLink>
          .
        </p>
      </>
    ),
  },
  {
    id: "ssl",
    title: "4. SSL- bzw. TLS-Verschlüsselung",
    body: (
      <p>
        Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
        vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine
        verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des
        Browsers von „http://“ auf „https://“ wechselt und an dem
        Schloss-Symbol in Ihrer Browserzeile.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "5. Cookies und lokale Speicherung",
    body: (
      <>
        <p>
          Wir setzen Cookies und vergleichbare Technologien nur ein, soweit
          dies technisch erforderlich ist oder Sie eingewilligt haben bzw. ein
          berechtigtes Interesse besteht.
        </p>
        <h3 className="mt-4 font-semibold text-zinc-900">
          5.1 Technisch notwendige Cookies (Admin-Bereich)
        </h3>
        <p className="mt-2">
          Für den geschützten Administrationsbereich nutzen wir
          Session-/Authentifizierungs-Cookies (NextAuth). Diese Cookies sind
          erforderlich, um den Login-Status zu speichern. Rechtsgrundlage: Art.
          6 Abs. 1 lit. f DSGVO bzw. § 25 Abs. 2 TDDDG (technisch erforderlich).
        </p>
        <h3 className="mt-4 font-semibold text-zinc-900">
          5.2 Lokale Speicherung im Browser (Preisbeobachtung)
        </h3>
        <p className="mt-2">
          Die Funktion „Preis beobachten“ speichert ausgewählte Produkte lokal
          in Ihrem Browser (localStorage). Diese Daten werden nicht an unsere
          Server übertragen. Sie können die Einträge jederzeit in Ihrem Browser
          löschen.
        </p>
        <h3 className="mt-4 font-semibold text-zinc-900">
          5.3 Keine Marketing-/Tracking-Cookies
        </h3>
        <p className="mt-2">
          Wir setzen derzeit keine eigenen Analyse- oder Marketing-Cookies
          (z. B. Google Analytics, Meta Pixel) ein. Beim Klick auf
          Amazon-Affiliate-Links können jedoch Cookies von Amazon gesetzt
          werden (siehe Abschnitt „Amazon-Affiliate-Links“).
        </p>
      </>
    ),
  },
  {
    id: "erfahrungen",
    title: "6. Nutzererfahrungen / Erfahrungsberichte",
    body: (
      <>
        <p>
          Über das Formular „Eigene Erfahrung schreiben“ können Sie freiwillig
          Erfahrungsberichte einreichen. Dabei können folgende Daten verarbeitet
          werden:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Name bzw. Pseudonym</li>
          <li>optionaler Nutzungskontext</li>
          <li>optional E-Mail-Adresse</li>
          <li>Bewertung, Titel und Berichtstext</li>
          <li>optionale Nutzungsdauer</li>
          <li>gehashte IP-Adresse (zur Spam-/Missbrauchsabwehr)</li>
          <li>Zeitpunkt der Einreichung</li>
        </ul>
        <p className="mt-3">
          Die Verarbeitung erfolgt zur Prüfung, Moderation und ggf.
          Veröffentlichung Ihres Beitrags sowie zur Missbrauchsprävention (Art.
          6 Abs. 1 lit. a DSGVO bei Einwilligung durch Absenden bzw. Art. 6 Abs.
          1 lit. f DSGVO). Optional angegebene E-Mail-Adressen werden nicht
          öffentlich angezeigt und dienen nur der internen Rückfrage.
        </p>
        <p className="mt-3">
          Veröffentlichte Beiträge können auf der jeweiligen Produktseite
          sichtbar sein. Sie können die Löschung Ihres Beitrags verlangen; wir
          prüfen dann, ob dem Löschbegehren gesetzliche Aufbewahrungspflichten
          entgegenstehen.
        </p>
      </>
    ),
  },
  {
    id: "ki-chat",
    title: "7. KI-Chat / Einkaufsassistent",
    body: (
      <>
        <p>
          Unser optionaler KI-Chat sendet Ihre eingegebenen Nachrichten zur
          Beantwortung an einen KI-Dienstleister (OpenRouter Inc., USA bzw.
          angebundene Modell-Anbieter). Dabei können Chat-Inhalte und
          technisch notwendige Verbindungsdaten verarbeitet werden.
        </p>
        <p className="mt-3">
          Rechtsgrundlage ist Ihre Einwilligung bzw. unser berechtigtes
          Interesse an einer nutzerfreundlichen Produktempfehlung (Art. 6 Abs. 1
          lit. a bzw. lit. f DSGVO). Bitte geben Sie im Chat keine sensiblen
          personenbezogenen Daten (z. B. Gesundheitsdaten, Ausweisnummern,
          Bankdaten) ein.
        </p>
        <p className="mt-3">
          Eine Übermittlung in Drittländer (insbesondere USA) ist möglich.
          Weitere Informationen:{" "}
          <ExternalLink href="https://openrouter.ai/privacy">
            OpenRouter Privacy Policy
          </ExternalLink>
          .
        </p>
      </>
    ),
  },
  {
    id: "scanner",
    title: "8. Barcode-Scanner (Kamera)",
    body: (
      <>
        <p>
          Der optionale Barcode-Scanner kann auf Ihre Gerätekamera zugreifen,
          um EAN-/UPC-/ASIN-Codes zu erkennen. Der Kamerazugriff erfolgt nur
          nach Ihrer ausdrücklichen Browser-Freigabe. Die Kamerabilder werden
          zur Code-Erkennung im Browser verarbeitet und nicht dauerhaft auf
          unseren Servern gespeichert.
        </p>
        <p className="mt-3">
          Zur Produktsuche kann der erkannte Code an unsere Server und ggf. an
          Amazon-Datenquellen (über Server-APIs) übermittelt werden.
          Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch
          Kamerafreigabe) bzw. Art. 6 Abs. 1 lit. f DSGVO für die anschließende
          Produktsuche.
        </p>
      </>
    ),
  },
  {
    id: "amazon",
    title: "9. Amazon-Affiliate-Links",
    body: (
      <>
        <p>
          Als Teilnehmer am Amazon-Partnerprogramm werden auf dieser Website
          Werbeanzeigen und Links zu Amazon.de eingebunden, an denen wir über
          Werbekostenerstattung verdienen können. Amazon setzt dazu Cookies
          ein, um die Herkunft von Bestellungen nachvollziehen zu können.
        </p>
        <p className="mt-3">
          Beim Klick auf einen Amazon-Link verlassen Sie unsere Website. Es
          gelten dann die Datenschutzbestimmungen von Amazon. Weitere
          Informationen:{" "}
          <ExternalLink href="https://www.amazon.de/gp/help/customer/display.html?nodeId=201909010">
            Amazon Datenschutzhinweis
          </ExternalLink>
          .
        </p>
        <p className="mt-3">
          Rechtsgrundlage für die Einbindung und Nachverfolgung im Rahmen des
          Partnerprogramms ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
          Interesse an der Finanzierung des Angebots) in Verbindung mit den
          Vorgaben des TDDDG, soweit Cookies betroffen sind.
        </p>
      </>
    ),
  },
  {
    id: "server-dienste",
    title: "10. Server-seitige Dienstleister",
    body: (
      <>
        <p>
          Zur Bereitstellung von Produktinformationen, Inhalten und Stabilität
          nutzen wir folgende Dienstleister überwiegend server-seitig (ohne
          dass Besucherdaten gezielt an diese Dienste zu Werbezwecken
          übermittelt werden):
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>PostgreSQL-Datenbank</strong> (Hosting-Anbieter je nach
            Infrastruktur, z. B. Vercel Postgres/Neon): Speicherung von
            Produkt-, Inhalts- und Formular-Daten.
          </li>
          <li>
            <strong>Amazon-Produktdaten via RapidAPI</strong>: Abruf öffentlicher
            Produktdaten für Vergleiche und Anzeigen.
          </li>
          <li>
            <strong>OpenRouter</strong>: Generierung redaktioneller Inhalte und
            Chat-Antworten (siehe Abschnitt KI-Chat).
          </li>
          <li>
            <strong>Upstash (Redis / QStash / Workflow)</strong>: technische
            Warteschlangen, Locks und Hintergrundjobs.
          </li>
          <li>
            <strong>IndexNow / Suchmaschinen-Pings</strong>: technische
            Benachrichtigung von Suchmaschinen über aktualisierte Seiten (keine
            Analyse Ihres individuellen Surfverhaltens).
          </li>
        </ul>
        <p className="mt-3">
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse
          an einem sicheren, aktuellen und performanten Betrieb).
        </p>
      </>
    ),
  },
  {
    id: "speicherdauer",
    title: "11. Speicherdauer",
    body: (
      <>
        <p>
          Wir speichern personenbezogene Daten nur so lange, wie es für die
          jeweiligen Zwecke erforderlich ist oder gesetzliche
          Aufbewahrungsfristen bestehen.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Server-Logs: in der Regel wenige Tage bis Wochen</li>
          <li>
            Erfahrungsberichte: bis zur Löschung bzw. bis der Zweck entfällt
          </li>
          <li>Admin-Sessions: bis Logout bzw. Ablauf des Tokens</li>
          <li>localStorage-Preisbeobachtung: bis zur Löschung durch Sie</li>
        </ul>
      </>
    ),
  },
  {
    id: "weitergabe",
    title: "12. Weitergabe von Daten",
    body: (
      <p>
        Eine Übermittlung Ihrer personenbezogenen Daten an Dritte erfolgt nur,
        wenn dies zur Vertragserfüllung erforderlich ist, Sie eingewilligt
        haben, eine rechtliche Verpflichtung besteht oder wir ein berechtigtes
        Interesse daran haben und kein überwiegendes schutzwürdiges Interesse
        Ihrerseits entgegensteht. Eine Weitergabe zu Werbezwecken an Dritte
        findet nicht statt.
      </p>
    ),
  },
  {
    id: "rechte",
    title: "13. Ihre Rechte",
    body: (
      <>
        <p>Sie haben gegenüber uns folgende Rechte:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Auskunft (Art. 15 DSGVO)</li>
          <li>Berichtigung (Art. 16 DSGVO)</li>
          <li>Löschung (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Widerspruch (Art. 21 DSGVO)</li>
          <li>
            Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft
            (Art. 7 Abs. 3 DSGVO)
          </li>
        </ul>
        <p className="mt-3">
          Zur Ausübung Ihrer Rechte genügt eine formlose Mitteilung an die im
          Impressum genannte Anschrift.
        </p>
      </>
    ),
  },
  {
    id: "beschwerde",
    title: "14. Beschwerderecht bei einer Aufsichtsbehörde",
    body: (
      <>
        <p>
          Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über
          die Verarbeitung personenbezogener Daten durch uns zu beschweren.
          Zuständig ist insbesondere die Aufsichtsbehörde Ihres gewöhnlichen
          Aufenthaltsorts oder unseres Sitzes. Für Thüringen:
        </p>
        <p className="mt-3">
          Thüringer Landesbeauftragter für den Datenschutz und die
          Informationsfreiheit
          <br />
          Häßlerstraße 8
          <br />
          99096 Erfurt
          <br />
          <ExternalLink href="https://www.tlfdi.de">www.tlfdi.de</ExternalLink>
        </p>
      </>
    ),
  },
  {
    id: "pflicht",
    title: "15. Pflicht zur Bereitstellung von Daten",
    body: (
      <p>
        Die Bereitstellung personenbezogener Daten ist weder gesetzlich noch
        vertraglich vorgeschrieben. Ohne bestimmte technische Daten (z. B.
        IP-Adresse) kann die Website jedoch nicht ausgeliefert werden. Ohne
        Angaben im Erfahrungsbericht-Formular kann kein Beitrag eingereicht
        werden.
      </p>
    ),
  },
  {
    id: "profiling",
    title: "16. Keine automatisierte Entscheidungsfindung",
    body: (
      <p>
        Es findet keine automatisierte Entscheidungsfindung einschließlich
        Profiling gemäß Art. 22 DSGVO statt, die Ihnen gegenüber rechtliche
        Wirkung entfaltet oder Sie in ähnlicher Weise erheblich beeinträchtigt.
      </p>
    ),
  },
  {
    id: "kinder",
    title: "17. Kinder",
    body: (
      <p>
        Unser Angebot richtet sich nicht an Kinder unter 16 Jahren. Wir fordern
        wissentlich keine personenbezogenen Daten von Minderjährigen an.
      </p>
    ),
  },
  {
    id: "aenderungen",
    title: "18. Aktualität und Änderung dieser Datenschutzerklärung",
    body: (
      <p>
        Diese Datenschutzerklärung hat den Stand {new Date().toLocaleDateString("de-DE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        . Durch die Weiterentwicklung unserer Website oder aufgrund geänderter
        gesetzlicher bzw. behördlicher Vorgaben kann es notwendig werden, diese
        Erklärung anzupassen. Die jeweils aktuelle Version finden Sie stets
        unter dieser URL.
      </p>
    ),
  },
];

const privacyEn = (imprintHref: string): Section[] => [
  {
    id: "controller",
    title: "1. Controller",
    body: (
      <>
        <p>
          The controller within the meaning of the General Data Protection
          Regulation (GDPR) is:
        </p>
        <p className="mt-3">
          Michel Fritzsch
          <br />
          Emilienstr. 15
          <br />
          99817 Eisenach
          <br />
          Germany
        </p>
        <p className="mt-3">
          For privacy requests, please contact us by post at the address above.
          See also the{" "}
          <a href={imprintHref} className="text-blue-700 hover:underline">
            Imprint
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "overview",
    title: "2. General information on data processing",
    body: (
      <>
        <p>
          “IGZ Vergleich” is an editorial product comparison platform with
          Amazon affiliate links. We process personal data only as necessary to
          operate a functional website and its features, or where permitted by
          law.
        </p>
        <p className="mt-3">
          Legal bases include Art. 6(1)(a) GDPR (consent), Art. 6(1)(b) GDPR
          (contract), Art. 6(1)(c) GDPR (legal obligation) and Art. 6(1)(f) GDPR
          (legitimate interests).
        </p>
      </>
    ),
  },
  {
    id: "hosting",
    title: "3. Hosting and server log files",
    body: (
      <>
        <p>
          This website is hosted by Vercel Inc., 440 N Barranca Ave #4133,
          Covina, CA 91723, USA. When you visit the site, technically necessary
          information is processed in server log files, in particular IP
          address, date/time, requested URL, HTTP status, referrer, browser and
          operating system.
        </p>
        <p className="mt-3">
          Processing is based on Art. 6(1)(f) GDPR to deliver the website,
          ensure security and prevent abuse. We do not combine these logs with
          other data for profiling. Vercel may process data in the USA under
          appropriate safeguards (e.g. Standard Contractual Clauses). Details:{" "}
          <ExternalLink href="https://vercel.com/legal/privacy-policy">
            Vercel Privacy Policy
          </ExternalLink>
          .
        </p>
      </>
    ),
  },
  {
    id: "ssl",
    title: "4. SSL/TLS encryption",
    body: (
      <p>
        This site uses SSL/TLS encryption to protect data in transit. You can
        recognize an encrypted connection by “https://” and the lock icon in
        your browser.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "5. Cookies and local storage",
    body: (
      <>
        <p>
          We only use cookies and similar technologies where technically
          necessary, based on consent, or based on legitimate interests.
        </p>
        <h3 className="mt-4 font-semibold text-zinc-900">
          5.1 Necessary cookies (admin area)
        </h3>
        <p className="mt-2">
          The protected admin area uses NextAuth session/authentication cookies
          to keep you signed in (Art. 6(1)(f) GDPR / technically necessary under
          German TDDDG).
        </p>
        <h3 className="mt-4 font-semibold text-zinc-900">
          5.2 Local browser storage (price watch)
        </h3>
        <p className="mt-2">
          The “Watch price” feature stores selected products in your browser’s
          localStorage. These data are not sent to our servers. You can delete
          them in your browser at any time.
        </p>
        <h3 className="mt-4 font-semibold text-zinc-900">
          5.3 No marketing/tracking cookies
        </h3>
        <p className="mt-2">
          We currently do not use our own analytics or marketing cookies (e.g.
          Google Analytics). Clicking Amazon affiliate links may set Amazon
          cookies (see below).
        </p>
      </>
    ),
  },
  {
    id: "experiences",
    title: "6. User experience reports",
    body: (
      <>
        <p>
          If you submit an experience report, we may process name/pseudonym,
          optional context, optional email, rating, title/body, optional usage
          duration, a hashed IP address (anti-spam), and the submission time.
        </p>
        <p className="mt-3">
          Processing is for moderation, publication and abuse prevention (Art.
          6(1)(a) and/or (f) GDPR). Optional emails are not shown publicly. You
          may request deletion of your report.
        </p>
      </>
    ),
  },
  {
    id: "ai-chat",
    title: "7. AI chat / shopping assistant",
    body: (
      <>
        <p>
          Our optional AI chat sends your messages to OpenRouter (and connected
          model providers) to generate replies. Please do not enter sensitive
          personal data in the chat. Transfers to third countries (especially
          the USA) may occur. Details:{" "}
          <ExternalLink href="https://openrouter.ai/privacy">
            OpenRouter Privacy Policy
          </ExternalLink>
          .
        </p>
      </>
    ),
  },
  {
    id: "scanner",
    title: "8. Barcode scanner (camera)",
    body: (
      <p>
        The optional barcode scanner may access your device camera only after
        browser permission. Camera frames are processed in the browser for code
        detection and are not permanently stored on our servers. The recognized
        code may be sent to our servers and Amazon product data sources for
        lookup.
      </p>
    ),
  },
  {
    id: "amazon",
    title: "9. Amazon affiliate links",
    body: (
      <>
        <p>
          As an Amazon Associate we earn from qualifying purchases. Amazon may
          set cookies to attribute orders. When you click an Amazon link, Amazon’s
          privacy policy applies:{" "}
          <ExternalLink href="https://www.amazon.de/gp/help/customer/display.html?nodeId=201909010">
            Amazon privacy notice
          </ExternalLink>
          .
        </p>
      </>
    ),
  },
  {
    id: "processors",
    title: "10. Server-side service providers",
    body: (
      <>
        <p>
          We use PostgreSQL database hosting, RapidAPI Amazon product data,
          OpenRouter, Upstash (Redis/QStash/Workflow) and IndexNow/search-engine
          pings primarily on the server side to operate the platform (Art.
          6(1)(f) GDPR).
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "11. Retention",
    body: (
      <p>
        We retain personal data only as long as necessary for the respective
        purpose or as required by law. Server logs are typically kept for days
        to weeks; experience reports until deletion/purpose ends; admin sessions
        until logout/token expiry; localStorage watchlists until you delete them.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "12. Sharing of data",
    body: (
      <p>
        We share personal data with third parties only where necessary for
        providing the service, based on consent, legal obligation, or legitimate
        interests that are not overridden by your rights. We do not sell personal
        data for advertising.
      </p>
    ),
  },
  {
    id: "rights",
    title: "13. Your rights",
    body: (
      <>
        <p>
          You have the rights of access, rectification, erasure, restriction,
          data portability, objection, and withdrawal of consent under the GDPR.
          Contact us via the imprint address to exercise these rights.
        </p>
      </>
    ),
  },
  {
    id: "complaint",
    title: "14. Right to lodge a complaint",
    body: (
      <>
        <p>
          You may lodge a complaint with a supervisory authority. For Thuringia,
          Germany:
        </p>
        <p className="mt-3">
          Thüringer Landesbeauftragter für den Datenschutz und die
          Informationsfreiheit
          <br />
          Häßlerstraße 8
          <br />
          99096 Erfurt
          <br />
          <ExternalLink href="https://www.tlfdi.de">www.tlfdi.de</ExternalLink>
        </p>
      </>
    ),
  },
  {
    id: "obligation",
    title: "15. Obligation to provide data",
    body: (
      <p>
        Providing personal data is generally neither legally nor contractually
        required. Without certain technical data (e.g. IP address), the website
        cannot be delivered. Without form fields, experience reports cannot be
        submitted.
      </p>
    ),
  },
  {
    id: "profiling",
    title: "16. No automated decision-making",
    body: (
      <p>
        We do not carry out automated decision-making including profiling under
        Art. 22 GDPR that produces legal effects concerning you or similarly
        significantly affects you.
      </p>
    ),
  },
  {
    id: "children",
    title: "17. Children",
    body: (
      <p>
        Our service is not directed at children under 16. We do not knowingly
        collect personal data from minors.
      </p>
    ),
  },
  {
    id: "changes",
    title: "18. Changes to this privacy policy",
    body: (
      <p>
        This privacy policy is current as of{" "}
        {new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        . We may update it when our website or legal requirements change. The
        current version is always available at this URL.
      </p>
    ),
  },
];
