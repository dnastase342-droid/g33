import { LegalPage, Todo } from "@/components/legal/LegalPage";
import { legalMetadata } from "@/config/legal-meta";
import { company } from "@/config/site";

export const metadata = legalMetadata(
  "Politica de anulare și rambursare",
  "Condițiile de anulare, retragere și rambursare pentru calitatea de membru G33.",
  "/politica-de-anulare-si-rambursare",
);

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Politica de anulare și rambursare">
      <p>
        Această politică urmează să fie finalizată împreună cu un jurist, în funcție de natura exactă a serviciului și de contractul de membru.
        Până atunci, sunt valabile în orice caz drepturile tale legale de consumator.
      </p>

      <h2>1. Dreptul de retragere (consumatori)</h2>
      <p>
        Dacă ești consumator și încheii contractul online, ai, ca regulă, dreptul de a te retrage în termen de 14 zile, fără a preciza motivul,
        conform OUG nr. 34/2014 privind drepturile consumatorilor. Excepțiile prevăzute de lege (de exemplu, pentru servicii prestate integral
        cu acordul tău prealabil expres) <strong>nu se aplică automat</strong>; ele se aplică numai dacă sunt îndeplinite toate condițiile
        legale, inclusiv informarea și acordul tău expres, obținute înainte de începerea prestării.
      </p>
      <p>
        Cum se aplică aceste reguli pentru calitatea de membru G33 (acces la comunitate, întâlniri, call-uri):{" "}
        <Todo>analiză juridică și formularea finală</Todo>.
      </p>

      <h2>2. Cum exerciți dreptul de retragere</h2>
      <p>
        Ne poți anunța printr-o declarație clară (telefonic la <a href={company.phoneHref}>{company.phoneDisplay}</a>
        {company.email ? (
          <>
            {" "}
            sau la <a href={`mailto:${company.email}`}>{company.email}</a>
          </>
        ) : null}
        ). Formular-tip de retragere: <Todo>anexă</Todo>.
      </p>

      <h2>3. Rambursări</h2>
      <ul>
        <li>Rambursările se fac prin aceeași metodă de plată folosită, prin Stripe.</li>
        <li>Termen de rambursare: în cel mult 14 zile de la comunicarea retragerii, în cazurile în care rambursarea este datorată.</li>
        <li>
          Rambursări în afara dreptului legal de retragere (după expirarea termenului): <Todo>politică comercială</Todo>.
        </li>
        <li>După o rambursare integrală, accesul în comunitate încetează.</li>
      </ul>

      <h2>4. Anularea abonamentelor</h2>
      <p>
        Dacă un plan este oferit ca abonament recurent, îl poți anula oricând înainte de următoarea reînnoire. Modalitatea concretă:{" "}
        <Todo>procedură de anulare</Todo>.
      </p>

      <h2>5. Suspendare sau excludere</h2>
      <p>
        Efectele suspendării sau excluderii unui membru pentru încălcarea regulilor asupra sumelor plătite: <Todo>regulă confirmată</Todo>.
      </p>
    </LegalPage>
  );
}
