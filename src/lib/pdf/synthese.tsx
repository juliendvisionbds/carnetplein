import path from "node:path";
import { Document, Font, Link, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { CALL, DEMO_DELAY, SITE } from "@/lib/content";
import { EVIDENCE_IDS, EVIDENCE_LABELS, SECONDARY_HINT, diagnose, formatAnswer, profileFor, profiles } from "@/lib/diagnostic";
import type { Lead } from "@/lib/store";

/* Polices embarquées (fichiers statiques dans src/assets/fonts). */
const FONTS = path.join(process.cwd(), "src", "assets", "fonts");
let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  Font.register({
    family: "Manrope",
    fonts: [
      { src: path.join(FONTS, "Manrope-500.ttf"), fontWeight: 500 },
      { src: path.join(FONTS, "Manrope-800.ttf"), fontWeight: 800 },
    ],
  });
  Font.register({
    family: "DM Sans",
    fonts: [
      { src: path.join(FONTS, "DMSans-400.ttf"), fontWeight: 400 },
      { src: path.join(FONTS, "DMSans-600.ttf"), fontWeight: 600 },
    ],
  });
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

const C = { ink: "#272727", muted: "#76766e", paper: "#f8f7f2", line: "#e2e2d8", lime: "#d9f879", limeDark: "#3f4a1a", purple: "#7561a1", soft: "#efedf8", softLine: "#dbd6e8", white: "#fffefa" };

const s = StyleSheet.create({
  page: { fontFamily: "DM Sans", fontSize: 10, color: C.ink, backgroundColor: C.paper, paddingTop: 24, paddingBottom: 30, paddingHorizontal: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  brand: { flexDirection: "row", alignItems: "center" },
  brandText: { fontFamily: "Manrope", fontWeight: 800, fontSize: 16, letterSpacing: -0.6, marginLeft: 8 },
  brandDot: { color: "#8a83c6" },
  headerMeta: { fontSize: 9, color: C.muted },
  eyebrow: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", backgroundColor: C.lime, color: "#2f3522", borderRadius: 12, paddingVertical: 4, paddingHorizontal: 9, fontSize: 7.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#2f3522", marginRight: 6 },
  h1: { fontFamily: "Manrope", fontWeight: 800, fontSize: 21, letterSpacing: -0.7, lineHeight: 1.1, marginTop: 8 },
  h1Accent: { color: "#7971af" },
  lead: { fontSize: 10, color: C.muted, lineHeight: 1.45, marginTop: 5, maxWidth: 440 },
  panel: { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 9, padding: 14, marginTop: 12 },
  panelSoft: { backgroundColor: C.soft, borderColor: C.softLine },
  badgeRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  badge: { backgroundColor: C.soft, color: C.purple, borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8, fontSize: 7.5, fontWeight: 600, marginRight: 6 },
  badgeOnSoft: { backgroundColor: C.white },
  badgeWarm: { backgroundColor: "#faeddb", color: "#9f7137" },
  h2: { fontFamily: "Manrope", fontWeight: 800, fontSize: 15.5, letterSpacing: -0.5, lineHeight: 1.15 },
  p: { fontSize: 9.5, color: C.muted, lineHeight: 1.45, marginTop: 4 },
  evidence: { borderTopWidth: 1, borderTopColor: "#d9d5e4", paddingTop: 6, marginTop: 7 },
  evidenceLabel: { fontSize: 8, color: C.muted, marginBottom: 2 },
  evidenceQuote: { fontSize: 9.5, lineHeight: 1.35 },
  notice: { backgroundColor: C.white, borderWidth: 1, borderColor: C.softLine, borderRadius: 7, padding: 8, marginTop: 9 },
  noticeTitle: { fontWeight: 600, fontSize: 9.5, marginBottom: 2 },
  sectionLabel: { fontSize: 7.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: C.purple, marginBottom: 7 },
  action: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 5.5, borderTopWidth: 1, borderTopColor: C.line },
  actionFirst: { borderTopWidth: 0, paddingTop: 0 },
  num: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.lime, color: "#2f3522", fontSize: 8, fontWeight: 600, textAlign: "center", paddingTop: 5, marginRight: 10 },
  actionTitle: { fontWeight: 600, fontSize: 10, lineHeight: 1.3 },
  actionDetail: { fontSize: 9, color: C.muted, lineHeight: 1.4, marginTop: 1 },
  steps: { flexDirection: "row", marginTop: 4 },
  step: { flex: 1, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: 7, padding: 7, marginRight: 8 },
  stepLast: { marginRight: 0 },
  stepLabel: { fontSize: 7, fontWeight: 600, letterSpacing: 1, color: C.purple, marginBottom: 4 },
  stepText: { fontSize: 9, fontWeight: 600, lineHeight: 1.3 },
  next: { flexDirection: "row", marginTop: 10 },
  nextCol: { flex: 1, padding: 10, borderRadius: 9, marginRight: 10 },
  nextDark: { backgroundColor: "#2d302a" },
  nextLime: { backgroundColor: C.lime, marginRight: 0 },
  nextTitle: { fontFamily: "Manrope", fontWeight: 800, fontSize: 12.5, letterSpacing: -0.3, lineHeight: 1.2 },
  nextText: { fontSize: 9, lineHeight: 1.4, marginTop: 4 },
  onDark: { color: "#ffffff" },
  onDarkMuted: { color: "#c2c6b8" },
  onLime: { color: "#2f3522" },
  cta: { marginTop: 6, backgroundColor: C.ink, color: "#ffffff", alignSelf: "flex-start", borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10, fontSize: 9, fontWeight: 600, textDecoration: "none" },
  footer: { position: "absolute", left: 40, right: 40, bottom: 16, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, fontSize: 7.5, color: C.muted },
  link: { color: C.purple, textDecoration: "none" },
});

function Mark() {
  return (
    <Svg width={22} height={22} viewBox="0 0 40 40">
      <Path d="M4 3h32v24.5L26.5 37H4z" fill={C.lime} />
      <Path d="M36 27.5L26.5 37v-6.5a3 3 0 0 1 3-3z" fill="#b7d354" />
      <Path d="M4 3h32v24.5L26.5 37H4z" fill="none" stroke="#b7d354" strokeWidth={1.2} />
      <Path d="M11 13h18M11 20h13M11 27h8" stroke={C.ink} strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
    </Svg>
  );
}

const fmtDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

export function SyntheseDocument({ lead }: { lead: Lead }) {
  registerFonts();
  const a = lead.answers;
  const d = { ...diagnose(a), key: lead.priority, secondary: lead.secondary, intensity: lead.intensity };
  const p = profileFor(a, d);
  const firstName = lead.name.split(" ")[0];
  const company = lead.company || lead.trade || new URL(lead.website).hostname.replace(/^www\./, "");
  const espace = `${SITE.url}/espace/${lead.token}`;

  const footnote = d.uncertain
    ? "Plusieurs réponses sont incertaines : commencez par observer votre activité pendant un mois, la démo vous y aidera."
    : d.lowVolume && d.key !== "acquisition"
      ? "Avec moins de cinq demandes par mois, chacune compte double : c’est précisément pour cela que votre priorité mérite d’être traitée vite."
      : d.key === "acquisition"
        ? "Le suivi seul ne résout pas le manque de demandes. Nous vérifierons d’abord ensemble si notre offre est pertinente pour vous."
        : "Diagnostic indicatif fondé sur vos réponses. Vos trois actions peuvent aussi être mises en place avec vos outils actuels.";

  return (
    <Document title={`Diagnostic Carnet Plein — ${company}`} author={SITE.name} language="fr">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={s.brand}>
            <Mark />
            <Text style={s.brandText}>
              carnet plein<Text style={s.brandDot}>.</Text>
            </Text>
          </View>
          <Text style={s.headerMeta}>Votre diagnostic · {fmtDate.format(new Date(lead.created_at))}</Text>
        </View>

        <View style={s.eyebrow}>
          <View style={s.dot} />
          <Text>Votre diagnostic · {company}</Text>
        </View>
        <Text style={s.h1}>
          Bonjour {firstName},{"\n"}votre priorité : <Text style={s.h1Accent}>{p.tag.toLowerCase()}</Text>.
        </Text>

        <View style={[s.panel, s.panelSoft]}>
          <View style={s.badgeRow}>
            <Text style={[s.badge, s.badgeOnSoft]}>Votre priorité · {p.tag}</Text>
            <Text style={[s.badge, d.intensity === "forte" ? s.badgeWarm : s.badgeOnSoft]}>Intensité {d.intensity}</Text>
          </View>
          <Text style={s.h2}>{p.title}</Text>
          <Text style={s.p}>{p.intro}</Text>
          {EVIDENCE_IDS[d.key].map((id) => (
            <View style={s.evidence} key={id}>
              <Text style={s.evidenceLabel}>{EVIDENCE_LABELS[id]}</Text>
              <Text style={s.evidenceQuote}>« {formatAnswer(a, id)} »</Text>
            </View>
          ))}
          {d.secondary && (
            <View style={s.notice}>
              <Text style={s.noticeTitle}>À surveiller aussi : {profiles[d.secondary].tag.toLowerCase()}</Text>
              <Text style={{ fontSize: 9.5, color: C.muted, lineHeight: 1.45 }}>
                Vos réponses indiquent que {SECONDARY_HINT[d.secondary]}. Nous en tiendrons compte dans votre démo.
              </Text>
            </View>
          )}
          <Text style={{ fontSize: 8, color: C.muted, marginTop: 8, lineHeight: 1.4 }}>{footnote}</Text>
        </View>

        <View style={s.panel}>
          <Text style={s.sectionLabel}>Votre plan d’action</Text>
          {p.actions.map(([title, detail], i) => (
            <View style={[s.action, i === 0 ? s.actionFirst : {}]} key={title} wrap={false}>
              <Text style={s.num}>0{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.actionTitle}>{title}</Text>
                <Text style={s.actionDetail}>{detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 12 }} wrap={false}>
          <Text style={s.sectionLabel}>Votre parcours, demain</Text>
          <View style={s.steps}>
            {p.projection.map((x, i) => (
              <View style={[s.step, i === p.projection.length - 1 ? s.stepLast : {}]} key={x}>
                <Text style={s.stepLabel}>ÉTAPE 0{i + 1}</Text>
                <Text style={s.stepText}>{x}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.next} wrap={false}>
          <View style={[s.nextCol, s.nextDark]}>
            <Text style={[s.nextTitle, s.onDark]}>Votre démo est en préparation.</Text>
            <Text style={[s.nextText, s.onDarkMuted]}>
              Nous construisons la version complète de votre tunnel de vente, à vos couleurs. Vous la recevrez par e-mail {DEMO_DELAY}.
            </Text>
          </View>
          <View style={[s.nextCol, s.nextLime]}>
            <Text style={[s.nextTitle, s.onLime]}>{CALL.duration} pour en parler ?</Text>
            <Text style={[s.nextText, s.onLime]}>Vos réponses à l’écran, votre démo, vos questions. Sans engagement.</Text>
            <Link src={`${espace}#rdv`} style={s.cta}>
              {CALL.title} →
            </Link>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>
            Votre espace :{" "}
            <Link src={espace} style={s.link}>
              {espace}
            </Link>
          </Text>
          <Text>
            {SITE.name} · {SITE.tagline}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
