import { CookiePreferencesButton } from "@/components/CookieConsent";
import { LegalPage } from "@/components/legal/LegalPage";
import { legalMetadata } from "@/config/legal-meta";

export const metadata = legalMetadata("Politica de cookie-uri", "Ce cookie-uri și tehnologii similare folosește site-ul G33.", "/politica-cookie");

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Politica de cookie-uri">
      <p>
        Site-ul G33 folosește cât mai puține tehnologii de stocare. <strong>Nu folosim cookie-uri de analiză sau de publicitate.</strong> Dacă
        acest lucru se va schimba, vom actualiza această pagină și vom cere acordul tău înainte de activare.
      </p>

      <h2>Ce folosim</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-subtle">
            <tr>
              <th className="py-2 pr-4">Nume</th>
              <th className="py-2 pr-4">Tip</th>
              <th className="py-2 pr-4">Scop</th>
              <th className="py-2">Durată</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            <tr>
              <td className="py-2 pr-4 font-mono">g33-consent</td>
              <td className="py-2 pr-4">Stocare locală, strict necesar</td>
              <td className="py-2 pr-4">Reține alegerile tale privind cookie-urile.</td>
              <td className="py-2">Până la ștergere</td>
            </tr>
            <tr>
              <td className="py-2 pr-4 font-mono">g33_admin</td>
              <td className="py-2 pr-4">Cookie, strict necesar</td>
              <td className="py-2 pr-4">Sesiunea de autentificare a administratorului (nu se setează pentru vizitatori).</td>
              <td className="py-2">8 ore</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">YouTube (youtube-nocookie.com)</td>
              <td className="py-2 pr-4">Terță parte, opțional</td>
              <td className="py-2 pr-4">Redarea videoclipurilor. Se încarcă doar după ce permiți conținutul extern sau apeși „Redă”.</td>
              <td className="py-2">Stabilită de Google</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Stripe</td>
              <td className="py-2 pr-4">Terță parte, necesar pentru plată</td>
              <td className="py-2 pr-4">Pe pagina de plată Stripe (checkout.stripe.com), pentru securitatea plății și prevenirea fraudei.</td>
              <td className="py-2">Stabilită de Stripe</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Cum îți schimbi alegerea</h2>
      <p>
        Poți modifica oricând preferințele: <CookiePreferencesButton className="text-volt underline underline-offset-4" />. Poți șterge
        cookie-urile și din setările browserului.
      </p>
    </LegalPage>
  );
}
