/* QO-Lernseite · Inhalte für den Reiter „Themen“
 *
 * Abgleich Lecture Notes (LN) ↔ Home-Skript. Seitenzahlen = Skript-Seiten (PDF-Seite = Skript-Seite + 8).
 * Neue Lecture Notes: einfach eine weitere Gruppe anhängen. Die ids nicht mehr ändern,
 * an ihnen hängen die Häkchen.
 *
 * nimm: 'skript' | 'beides' (Skript + LN) | 'ln' | 'luecke'
 * Mathe wie in Anki mit \( … \).
 */
window.QO_THEMEN = (() => {
  const R = String.raw;
  return {
    hinweise: [
      'Seitenzahlen sind Skript-Seiten (Home). PDF-Seite = Skript-Seite + 8.',
      R`Konventionen beim Mischen: Home schreibt die JC-Paare als \(\{|e,n-1\rangle,|g,n\rangle\}\) mit \(\delta=\omega_0-\omega_c\) und \(\tfrac12\hbar\omega_0\sigma_z\), die LN als \(\{|e,n\rangle,|g,n+1\rangle\}\) mit \(\Delta\omega=\omega_{eg}-\omega_c\) und \(\hbar\omega_{eg}\sigma_{ee}\). Gleiche Physik, verschobene Indizes.`,
      'Die LN 4–6 tragen den Stempel „updated: January 17, 2025“, sind also vom Vorjahr.',
    ],
    gruppen: [
      {
        id: 'ln1', titel: 'LN1 · Quantisierung & Zustände des Lichts', items: [
          {
            id: 'ln1-quant', ln: 'LN1 §1', thema: 'Kanonische Quantisierung, Feldoperator', skript: '1.1–1.3, S. 1–7', nimm: 'skript',
            achtung: [R`LN1 S. 3: Bei \(\hat E(\mathbf r)\) fehlt der Faktor \(i\), so ist der Operator nicht hermitesch. Home Gl. 1.39 ist korrekt.`],
          },
          {
            id: 'ln1-zust', ln: 'LN1 §1.1', thema: R`Fock- und kohärente Zustände, Displacement, \(E^{(\pm)}\)`, skript: '1.3, 2.2–2.3, S. 6–13', nimm: 'skript',
            notiz: R`\(g^{(n)}=1\) für kohärente Zustände: zwei Zeilen mit \(\hat a|\alpha\rangle=\alpha|\alpha\rangle\).`,
          },
          {
            id: 'ln1-quad', ln: 'LN1 §1.2', thema: 'Quadraturen, Phasenraum', skript: '2.1, 2.3.3', nimm: 'beides',
            aufgaben: [{
              id: 'ln1-quad-phi0',
              text: R`\(\varphi_0(q)\) selbst herleiten, mit \(\hat a=\hat a_Q+i\hat a_P\) und \([\hat a_Q,\hat a_P]=i/2\)`,
              check: R`\(\varphi_0\propto e^{-q^2}\), Varianz \(1/4\)`,
            }],
            achtung: [R`LN1 S. 6: \(\hat a=\hat a_Q-i\hat a_P\) und \(\hat a_P=-i\,d/dq\) passen nicht zu \([\hat a_Q,\hat a_P]=i/2\). Deshalb widerspricht \(\varphi_0=e^{-q^2/2}\) dem \(\langle\hat a_Q^2\rangle=1/4\) auf S. 7.`],
          },
          {
            id: 'ln1-squeeze', ln: 'LN1 §1.3', thema: 'Squeezing durch degenerierten parametrischen Verstärker', skript: R`2.5, S. 14–18 (über \(S(\xi)\))`, nimm: 'beides',
            aufgaben: [{
              id: 'ln1-squeeze-dpa',
              text: R`Zeigen, dass der Propagator im rotierenden Frame genau Homes \(S(\xi)\) ist`,
              check: R`\(s=2\chi t\), \(\theta=\pi\). Danach gilt alles aus Home 2.5.`,
            }],
            achtung: [R`LN1 S. 9: \(d\hat b_Q/dt=2\chi\hat b_P\) ist falsch, das gäbe Rotation statt Squeezing. Richtig: \(d\hat b_Q/dt=2\chi\hat b_Q\) und \(d\hat b_P/dt=-2\chi\hat b_P\). Die Lösungen darunter stimmen.`],
          },
        ],
      },
      {
        id: 'ln2', titel: 'LN2 · Atom-Feld-Wechselwirkung', items: [
          { id: 'ln2-gm', ln: 'LN2 §2.1–2.3.1', thema: R`Minimal Coupling, \(A^2\)-Term, Göppert-Mayer`, skript: '3.1, S. 20–21', nimm: 'skript' },
          {
            id: 'ln2-pzw', ln: 'LN2 §2.3.2', thema: 'Power-Zienau-Woolley (PZW), Multipole ED/EQ/MD', skript: 'nur Fußnote S. 21f (Gl. 3.12)', nimm: 'luecke',
            aufgaben: [{
              id: 'ln2-pzw-x',
              text: R`PZW nacharbeiten: warum \(-\mathbf d\cdot\mathbf E\) auch für quantisierte Felder gilt (Göppert-Mayer ist nur für externe Felder sauber)`,
              check: 'Quellen: Cohen-Tannoudji et al., Photons & Atoms, Kap. IV; Loudon (Empfehlung im Skript)',
            }],
          },
          { id: 'ln2-jc', ln: 'LN2 §2.4', thema: 'JC-Herleitung, Dipol-Matrixelemente, RWA', skript: '3.2.1–3.2.3, S. 22–25', nimm: 'skript' },
        ],
      },
      {
        id: 'ln3', titel: 'LN3 · Cavity QED', items: [
          {
            id: 'ln3-gmax', ln: 'LN3 Anfang', thema: R`\(g_{\max}\), semiklassisch \(\Omega=2g\alpha\), Zahlenbeispiele`, skript: '–', nimm: 'ln',
            aufgaben: [{
              id: 'ln3-gmax-x',
              text: R`\(g/\omega\) abschätzen mit \(V=\lambda\langle r\rangle^2\) und \(\omega\lambda=2\pi c\)`,
              check: R`\(g/\omega\approx\sqrt{\alpha}\approx 1/12\)`,
            }],
          },
          { id: 'ln3-dressed', ln: 'LN3 §3.1–3.2', thema: 'Vakuum-Rabi-Oszillationen, Dressed States', skript: '3.2.3, S. 23–25', nimm: 'skript' },
          {
            id: 'ln3-cr', ln: 'LN3 §3.3', thema: 'Collapse & Revival', skript: '3.2.4, S. 25–26', nimm: 'skript',
            achtung: [R`LN3 S. 4: \(T_{\rm rev}\sim 4\pi/(g\sqrt{\bar n})\) skaliert falsch. Richtig ist \(t_r\approx 2\pi\sqrt{\bar n}/g\) (Home Gl. 3.53).`],
          },
          {
            id: 'ln3-disp', ln: 'LN3 §3.4', thema: 'Dispersiver JC, QND-Messung', skript: '3.2.5, S. 27–28', nimm: 'beides',
            aufgaben: [{
              id: 'ln3-disp-sw',
              text: R`Dispersiven JC per Schrieffer-Wolff herleiten, mit Homes Rezept aus 3.4: \([S,H_0]=-H_{\rm int}\), \(\tilde H\approx H_0+\tfrac12[S,H_{\rm int}]\)`,
              check: R`\(\hbar\frac{g^2}{\delta}\big(\hat a^\dagger\hat a+\tfrac12\big)\sigma_z\) + const, also Home Gl. 3.63`,
            }],
            achtung: [R`LN3 S. 5: Mit \(e^{-S}He^{S}\) und diesem \(S\) fällt \(H_{\rm int}\) nicht weg (Vorzeichen). Das Endergebnis stimmt trotzdem.`],
          },
          { id: 'ln3-tc', ln: 'LN3 §3.5', thema: 'Tavis-Cummings, Dicke-Zustände, Holstein-Primakoff', skript: '3.3, S. 28–29', nimm: 'skript' },
          {
            id: 'ln3-raman', ln: 'LN3 §3.6', thema: 'Raman-Übergänge', skript: '3.4, S. 29–31', nimm: 'skript',
            notiz: 'Die Fälle b (ein Feld quantisiert) und c (große Verstimmung) kurz aus den LN.',
            achtung: [R`LN3 S. 8–9: Im Raman-Kopplungsterm fehlt ein \(\tfrac12\), und \(\tilde\Omega\) in (a) und (c) unterscheidet sich um Faktor 2. Mit \(\Omega=2g\alpha\) und \(H=\tfrac{\hbar\Omega}{2}\sigma_x\) gilt \(\Omega_{\rm eff}=\Omega_p\Omega_c/(2\Delta)\). Home hat das \(\tfrac12\) (Gl. 3.87).`],
          },
        ],
      },
      {
        id: 'ln4', titel: 'LN4 · Spontane Emission & Dichteoperator', items: [
          { id: 'ln4-ww', ln: 'LN4 §4', thema: 'Wigner-Weisskopf, Lamb-Shift', skript: '4.1, S. 33–36', nimm: 'skript' },
          { id: 'ln4-rho', ln: 'LN4 §5', thema: 'Dichteoperator, Entropie, thermischer Zustand', skript: '5.1, S. 37–39', nimm: 'skript' },
        ],
      },
      {
        id: 'ln5', titel: 'LN5 · Master-Gleichung & optische Bloch-Gleichungen', items: [
          { id: 'ln5-me', ln: 'LN5 §6–6.1', thema: R`Master-Gleichung (Born, Reservoir, Markov), \(T>0\), optische Bloch-Gleichungen`, skript: '5.2–5.3, S. 39–43', nimm: 'skript' },
          {
            id: 'ln5-other', ln: 'LN5 §6.2', thema: R`Lindblad für Cavity-Zerfall \(\kappa\) und Pure Dephasing`, skript: '–', nimm: 'luecke',
            aufgaben: [{
              id: 'ln5-other-x',
              text: R`Homes Lindblad-Form (5.2) mit \(L=\sqrt\kappa\,\hat a\) bzw. \(L=\sqrt{\gamma_d}\,\sigma_{ee}\) auswerten`,
              check: R`Populationen bleiben konstant, \(\rho_{eg}\) zerfällt mit \(\gamma_d/2\)`,
            }],
          },
        ],
      },
      {
        id: 'ln6', titel: 'LN6 · Erzeugung von Lichtfeldern', items: [
          { id: 'ln6-mb', ln: 'LN6 §7.1', thema: R`Maxwell-Bloch, SVEA, \(\chi^{(1)}\), \(\sigma_{\rm abs}=3\lambda^2/2\pi\)`, skript: '6.1, S. 45–48', nimm: 'skript' },
          { id: 'ln6-src', ln: 'LN6 §7.2', thema: R`Quellfeld, kohärent vs. Fluktuation, \(G^{(1)}\) und \(G^{(2)}\)`, skript: '6.2, S. 48–51', nimm: 'skript' },
          {
            id: 'ln6-deph', ln: 'LN6 §7.2.2, §8.1', thema: R`Bloch-Gleichungen im Steady State mit \(\Delta\) und Dephasing, \(I_{\rm coh}/I_{\rm scat}\)`, skript: 'nur ohne Dephasing, implizit in 7.2', nimm: 'luecke',
            aufgaben: [{
              id: 'ln6-deph-x',
              text: 'Steady State als lineares Gleichungssystem lösen',
              check: R`\(I_{\rm coh}/I_{\rm scat}=\Gamma^2/(\gamma\Gamma+2\Omega^2)\) mit \(\gamma=\Gamma+\gamma_{\rm deph}\). Für \(\gamma_{\rm deph}=0\) ist das das Gewicht der δ-Linie in Home 7.2.`,
            }],
          },
          {
            id: 'ln6-cav', ln: 'LN6 §8.2', thema: R`Feld einer Cavity-Mode, \(\kappa\) über Fermi's Golden Rule`, skript: '–', nimm: 'luecke',
            aufgaben: [{
              id: 'ln6-cav-x',
              text: 'Wie Home 6.2 durchrechnen, nur mit der Cavity-Mode statt dem Atom',
              check: 'Literatur: Loudon Kap. 7 (steht so auch in der Outline)',
            }],
          },
        ],
      },
      {
        id: 'extra', titel: 'Optional · nur im Skript', items: [
          { id: 'ex-vac', thema: R`Vakuumfluktuationen \(\langle E^2\rangle_0\)`, skript: '1.3, S. 6', nimm: 'skript' },
          { id: 'ex-q', thema: 'Husimi-Q-Funktion', skript: '2.3.3, S. 12', nimm: 'skript' },
          { id: 'ex-ligo', thema: 'Phasenrauschen und LIGO', skript: '2.3.4–2.4, S. 12–14', nimm: 'skript', notiz: 'Passt zum Aasi-2013-Paper im paper-Ordner.' },
          { id: 'ex-sqc', thema: 'Squeezed coherent states', skript: '2.5.1, S. 17–18', nimm: 'skript' },
        ],
      },
      {
        id: 'next', titel: 'Ausblick · laut Outline', items: [
          { id: 'nx-rf', thema: 'Resonanzfluoreszenz & Photonenstatistik', skript: 'Kap. 7–8, S. 53–75', nimm: 'skript' },
          { id: 'nx-hom', thema: 'Hong-Ou-Mandel-Interferenz', skript: 'Kap. 9, S. 76–80', nimm: 'skript' },
          { id: 'nx-bell', thema: 'Bell-Ungleichung', skript: '–', nimm: 'luecke', notiz: 'Grynberg/Aspect/Fabre Kap. 5 (laut Outline)' },
          { id: 'nx-eit', thema: 'EIT & Rydberg-Blockade', skript: 'nur das Λ-System aus 3.4 als Basis', nimm: 'luecke', notiz: 'LN + Gorshkov 2011 im paper-Ordner' },
          { id: 'nx-om', thema: 'Cavity-Optomechanik', skript: 'Kap. 12, S. 100–106', nimm: 'skript' },
          { id: 'nx-ion', thema: 'Gefangene Ionen & Seitenbandkühlen', skript: 'Kap. 11, S. 91–98', nimm: 'skript' },
          { id: 'nx-dop', thema: 'Laserkühlung: Doppler', skript: 'Kap. 10, S. 81–90', nimm: 'skript' },
          { id: 'nx-subdop', thema: 'Laserkühlung: Sub-Doppler', skript: '–', nimm: 'luecke', notiz: 'Grynberg/Aspect/Fabre Kap. 8 + Dalibard & Cohen-Tannoudji 1989' },
          { id: 'nx-cat', thema: 'Cat States, Wigner-Funktion (nicht in der Outline)', skript: 'Kap. 13, S. 107–117', nimm: 'skript' },
        ],
      },
    ],
  };
})();
