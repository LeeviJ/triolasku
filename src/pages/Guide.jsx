import { HelpCircle } from 'lucide-react'
import Card, { CardBody } from '../components/ui/Card'

export default function Guide() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Käyttöohjeet</h1>
        </div>
      </div>

      <div className="space-y-6">

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Alkuvalmistelut</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Lisää ensin yrityksesi tiedot <strong>Yritykset</strong>-sivulla (nimi, Y-tunnus, osoite, pankkitili, logo)</li>
              <li>Lisää asiakkaat <strong>Asiakkaat</strong>-sivulla</li>
              <li>Lisää usein käytetyt tuotteet/palvelut <strong>Tuotteet</strong>-sivulla (valinnainen, nopeuttaa laskun tekoa)</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Laskun luominen</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Avaa <strong>Laskut</strong>-sivu ja paina <strong>+ Uusi lasku</strong></li>
              <li>Valitse yritys ja asiakas, lisää tuoterivit (kuvaus, määrä, yksikköhinta, ALV-%)</li>
              <li>Tarkista eräpäivä, maksuehto ja viivästyskorko</li>
              <li>Paina <strong>Tallenna</strong> — lasku tallennetaan ja <strong>PDF latautuu automaattisesti</strong> laitteellesi</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. PDF-laskun lähetys</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Tallennettu PDF löytyy laitteesi <strong>Lataukset</strong>-kansiosta</li>
              <li>Lähetä PDF asiakkaalle sähköpostilla tai jaa pilvitallennuksesta</li>
              <li>Voit myös tulostaa laskun esikatselunäkymästä</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Laskujen hallinta</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li><strong>Silmä-ikoni</strong> — avaa laskun esikatselun ja PDF-latauksen</li>
              <li><strong>Kynä-ikoni</strong> — muokkaa laskua</li>
              <li><strong>H-kirjain</strong> — luo hyvityslasku (kysyy vahvistuksen ensin)</li>
              <li>Laskun tila muuttuu automaattisesti: luonnos → valmis → lähetetty → maksettu</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Huomautuslasku</h2>
            <p className="text-sm text-gray-600 mb-3">
              Jos asiakas ei ole maksanut laskua eräpäivään mennessä, voit tehdä huomautuslaskun:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Avaa alkuperäinen lasku <strong>Laskut</strong>-sivulta ja paina <strong>kynä-ikonia</strong> (muokkaa)</li>
              <li>Kirjoita <strong>Lisätiedot</strong>-kenttään esim. <em>&quot;HUOMAUTUSLASKU — Alkuperäinen lasku nro X, eräpäivä XX.XX.XXXX. Pyydämme maksamaan laskun viipymättä.&quot;</em></li>
              <li>Tarvittaessa lisää viivästyskorko tai huomautusmaksu uutena tuoterivinä</li>
              <li>Tallenna — huomautuslasku latautuu PDF-tiedostona</li>
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Hyvityslasku</h2>
            <p className="text-sm text-gray-600 mb-3">
              Jos lasku on virheellinen tai asiakas palauttaa tuotteen:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>Etsi alkuperäinen lasku <strong>Laskut</strong>-sivulta</li>
              <li>Paina <strong>H-kirjainta</strong> ja vahvista &quot;Kyllä&quot;</li>
              <li>Ohjelma luo automaattisesti hyvityslaskun negatiivisilla summilla</li>
              <li>Voit muokata summia osahyvitystä varten ennen tallennusta</li>
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Varmuuskopiointi</h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li><strong>Lataa PDF + varmuuskopio (ZIP)</strong> — kaikki laskut PDF-tiedostoina + tietokannan JSON-muodossa yhtenä ZIP-pakettina</li>
              <li><strong>Lataa varmuuskopio (JSON)</strong> — vain tiedot ilman PDF-tiedostoja (pienempi tiedosto)</li>
              <li><strong>Palauta varmuuskopio</strong> — palauttaa aiemmin ladatun JSON-varmuuskopion tiedot</li>
            </ul>
          </CardBody>
        </Card>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>Vinkki:</strong> Kaikki tiedot tallennetaan laitteesi selaimeen. Tiedot säilyvät niin kauan kuin et tyhjennä selaimen tietoja. Ota varmuuskopio säännöllisesti ja tallenna se turvalliseen paikkaan (pilvi, ulkoinen levy).
          </p>
        </div>
      </div>
    </div>
  )
}
