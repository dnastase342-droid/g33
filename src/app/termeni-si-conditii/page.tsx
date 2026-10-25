import Link from "next/link";
import { LegalPage, Todo } from "@/components/legal/LegalPage";
import { legalMetadata } from "@/config/legal-meta";
import { brand, company } from "@/config/site";

export const metadata = legalMetadata(
  "Termeni și condiții",
  "Termenii și condițiile de utilizare a site-ului și de aderare la comunitatea GRUPAREA 33 (G33).",
  "/termeni-si-conditii",
);

export default function TermsPage() {
  return (
    <LegalPage title="Termeni și condiții">
      <h2>1. Cine oferă serviciul</h2>
      <p>
        Entitatea care încheie contractul de membru cu tine:{" "}
        {company.confirmedAsSeller ? (
          <>
            {company.legalName}, CUI {company.cui}, sediu social: {company.registeredOffice}.
          </>
        ) : (
          <Todo>confirmarea entității contractante (propusă: {company.legalName}, CUI {company.cui})</Todo>
        )}{" "}
        Nr. Reg. Com.: {company.tradeRegisterNumber ?? <Todo>număr Registrul Comerțului</Todo>}. Telefon:{" "}
        <a href={company.phoneHref}>{company.phoneDisplay}</a>. Email: {company.email ?? <Todo>email oficial</Todo>}.
      </p>

      <h2>2. Serviciul</h2>
      <p>
        {brand.name} ({brand.shortName}) este o comunitate privată centrată pe networking, întâlniri și interacțiune între membri. Activitatea
        comunității include, în prezent, o întâlnire fizică pe lună și call-uri video săptămânale. G33 nu este un curs și nu garantează
        rezultate financiare sau de business.
      </p>
      <p>
        Conținutul exact al fiecărui plan de membru: <Todo>beneficiile confirmate pentru fiecare plan</Todo>.
      </p>

      <h2>3. Eligibilitate și procesul de aplicare</h2>
      <ul>
        <li>Accesul în comunitate se face pe bază de aplicație, completată prin formularul de pe site.</li>
        <li>Fiecare aplicație este analizată individual. Trimiterea unei aplicații nu garantează acceptarea și nu creează obligația de plată.</li>
        <li>Criterii de eligibilitate (ex. vârstă minimă): <Todo>criterii confirmate</Todo>.</li>
      </ul>

      <h2>4. Acceptare și acces</h2>
      <p>
        După acceptare, aplicantul primește un link securizat de plată, valabil o perioadă limitată. Calitatea de membru devine activă numai
        după acceptarea aplicației și confirmarea plății de către procesatorul de plăți. Comunitatea are o capacitate maximă limitată.
      </p>

      <h2>5. Durata calității de membru</h2>
      <ul>
        <li>Plan 3 luni: acces pentru 3 luni de la activare.</li>
        <li>Plan 1 an: acces pentru 12 luni de la activare.</li>
        <li>
          Plan Lifetime: <Todo>definirea exactă a duratei și a condițiilor accesului „Lifetime”</Todo>.
        </li>
      </ul>

      <h2>6. Preț și plată</h2>
      <p>
        Prețurile sunt afișate în euro pe site. Plata se face online prin Stripe; datele cardului nu sunt primite și nu sunt stocate de G33.
        Tipul plății pentru fiecare plan (plată unică sau abonament): <Todo>confirmare</Todo>. Regim TVA și emiterea facturii:{" "}
        <Todo>statutul TVA și modul de facturare</Todo>.
      </p>

      <h2>7. Reînnoire</h2>
      <p>
        <Todo>dacă există reînnoire automată și în ce condiții</Todo>. În lipsa unei mențiuni exprese, planurile nu se reînnoiesc automat.
      </p>

      <h2>8. Anulare, retragere și rambursare</h2>
      <p>
        Condițiile sunt descrise în <Link href="/politica-de-anulare-si-rambursare">Politica de anulare și rambursare</Link>. Drepturile tale
        legale de consumator, inclusiv dreptul de retragere prevăzut de OUG nr. 34/2014, nu sunt limitate de acești termeni.
      </p>

      <h2>9. Conduita membrilor și suspendarea</h2>
      <p>
        Membrii se angajează să trateze ceilalți membri cu respect, să nu folosească comunitatea pentru spam, înșelătorii sau activități
        ilegale și să respecte confidențialitatea discuțiilor. Regulile detaliate și procedura de suspendare/excludere:{" "}
        <Todo>regulament intern și consecințele asupra plății</Todo>.
      </p>

      <h2>10. Proprietate intelectuală</h2>
      <p>
        Numele {brand.name}, {brand.shortName}, logo-ul și materialele publicate pe site nu pot fi folosite fără acordul titularului. Titularul
        drepturilor: <Todo>confirmare</Todo>.
      </p>

      <h2>11. Reclamații și contact</h2>
      <p>
        Pentru întrebări sau reclamații ne poți contacta la <a href={company.phoneHref}>{company.phoneDisplay}</a>
        {company.email ? (
          <>
            {" "}
            sau la <a href={`mailto:${company.email}`}>{company.email}</a>
          </>
        ) : null}
        . Consumatorii se pot adresa și Autorității Naționale pentru Protecția Consumatorilor (ANPC) sau pot folosi mecanismele de soluționare
        alternativă a litigiilor (SAL).
      </p>

      <h2>12. Legea aplicabilă</h2>
      <p>
        <Todo>legea aplicabilă și instanța competentă, stabilite cu un jurist</Todo>. Orice clauză se aplică fără a afecta protecția conferită
        consumatorilor de legislația obligatorie a statului lor de reședință.
      </p>
    </LegalPage>
  );
}
