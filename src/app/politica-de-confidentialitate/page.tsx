import Link from "next/link";
import { LegalPage, Todo } from "@/components/legal/LegalPage";
import { legalMetadata } from "@/config/legal-meta";
import { brand, company } from "@/config/site";

export const metadata = legalMetadata(
  "Politica de confidențialitate",
  "Cum prelucrează GRUPAREA 33 (G33) datele personale ale aplicanților și membrilor.",
  "/politica-de-confidentialitate",
);

export default function PrivacyPage() {
  return (
    <LegalPage title="Politica de confidențialitate">
      <p>
        Această notă explică ce date personale colectăm prin site-ul {brand.name} ({brand.shortName}), de ce, cât timp le păstrăm și ce
        drepturi ai, conform Regulamentului (UE) 2016/679 (GDPR).
      </p>

      <h2>1. Operatorul de date</h2>
      <p>
        {company.confirmedAsDataController ? (
          <>
            {company.legalName}, CUI {company.cui}, sediu social: {company.registeredOffice}, telefon{" "}
            <a href={company.phoneHref}>{company.phoneDisplay}</a>.
          </>
        ) : (
          <Todo>confirmarea operatorului de date (propus: {company.legalName}, CUI {company.cui})</Todo>
        )}{" "}
        Contact pentru protecția datelor: {company.email ?? <Todo>adresă de email pentru solicitări privind datele</Todo>}.
      </p>

      <h2>2. Ce date colectăm</h2>
      <h3>Prin formularul de aplicare</h3>
      <ul>
        <li>nume complet, adresă de email, număr de telefon;</li>
        <li>planul pentru care aplici, dacă ai deschis formularul dintr-un plan anume, și data trimiterii.</li>
      </ul>
      <h3>În procesul de selecție și plată</h3>
      <ul>
        <li>statusul aplicației (ex. nouă, acceptată, respinsă), statusul plății și al calității de membru;</li>
        <li>
          identificatori primiți de la Stripe (ID sesiune de plată, ID plată/abonament, ID client), suma și moneda. Nu primim și nu stocăm
          datele cardului.
        </li>
      </ul>
      <h3>Date tehnice</h3>
      <ul>
        <li>adresa IP, prelucrată temporar și stocată doar sub formă criptografic transformată (hash), pentru protecție împotriva abuzului (limitarea numărului de cereri).</li>
      </ul>

      <h2>3. Scopuri și temeiuri legale</h2>
      <ul>
        <li>
          Analiza aplicației și comunicarea cu tine despre ea — demersuri la cererea ta înainte de încheierea unui contract (art. 6 alin. (1)
          lit. b GDPR).
        </li>
        <li>Încheierea și executarea contractului de membru, inclusiv plata — art. 6 alin. (1) lit. b GDPR.</li>
        <li>Obligații legale contabile și fiscale — art. 6 alin. (1) lit. c GDPR.</li>
        <li>Securitatea site-ului și prevenirea abuzurilor — interes legitim (art. 6 alin. (1) lit. f GDPR).</li>
        <li>Nu folosim datele din formular pentru marketing.</li>
      </ul>
      <p>
        <Todo>verificarea finală a scopurilor și temeiurilor de către un specialist în protecția datelor</Todo>
      </p>

      <h2>4. Destinatari și furnizori</h2>
      <ul>
        <li>
          <strong>Google (Google Sheets / Google Workspace)</strong> — aplicațiile sunt stocate într-un tabel Google Sheets la care au acces
          doar persoanele autorizate ale echipei G33 și contul tehnic al site-ului.
        </li>
        <li>
          <strong>Stripe</strong> — procesarea plăților. Stripe prelucrează datele de plată ca operator independent, conform propriei politici
          de confidențialitate.
        </li>
        <li>
          <strong>Furnizorul de găzduire și furnizorul bazei de date</strong> — <Todo>denumirea furnizorilor și regiunea de găzduire</Todo>.
        </li>
        <li>Autorități publice, numai când legea o cere.</li>
      </ul>
      <p>
        Unii furnizori pot transfera date în afara Spațiului Economic European; în aceste cazuri transferurile se bazează pe garanții adecvate
        (de ex. clauze contractuale standard sau decizii de adecvare). <Todo>verificarea transferurilor pentru furnizorii aleși</Todo>
      </p>

      <h2>5. Cât timp păstrăm datele</h2>
      <ul>
        <li>Aplicații respinse sau neconvertite: <Todo>perioadă (ex. 12 luni)</Todo>, apoi ștergere.</li>
        <li>Date ale membrilor: pe durata calității de membru și ulterior <Todo>perioadă</Todo>.</li>
        <li>Documente contabile: perioada prevăzută de legislația contabilă.</li>
        <li>Date de limitare a cererilor: câteva ore.</li>
      </ul>

      <h2>6. Drepturile tale</h2>
      <p>
        Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate, opoziție și dreptul de a-ți retrage consimțământul oricând,
        fără a afecta legalitatea prelucrării anterioare. Ai dreptul să depui plângere la Autoritatea Națională de Supraveghere a Prelucrării
        Datelor cu Caracter Personal (ANSPDCP).
      </p>
      <p>
        Cereri: {company.email ?? <Todo>adresă de email</Todo>} sau telefonic la <a href={company.phoneHref}>{company.phoneDisplay}</a>. Răspundem
        în cel mult o lună.
      </p>

      <h2>7. Cookie-uri</h2>
      <p>
        Detalii în <Link href="/politica-cookie">Politica de cookie-uri</Link>.
      </p>
    </LegalPage>
  );
}
