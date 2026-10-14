/**
 * Country phase for the world-entry flights, derived on the client with no
 * network request.
 *
 *   φ = (ISO 3166-1 numeric code of the visitor's locale region mod 360) degrees
 *
 * e.g. es-AR → AR → 032 → 32°, en-US → US → 840 → 120°, ja → JP → 392 → 32°.
 * The region comes from the browser's preferred languages (Intl.Locale
 * maximize() fills it in for a bare language). A missing, unknown or non-ISO
 * region ("419", "XX") gives 0°.
 *
 * Only imported by the lazily loaded flight overlay (components/WorldEntryFlight),
 * so this table never ships in the initial bundle.
 */

/**
 * ISO 3166-1 alpha-2 code followed by its 3-digit numeric code, for every
 * officially assigned country (source: ISO 3166-1, via
 * github.com/lukes/ISO-3166-Countries-with-Regional-Codes).
 */
const ISO_NUMERIC_TABLE =
  "AD020AE784AF004AG028AI660AL008AM051AO024AQ010AR032AS016AT040AU036AW533AX248AZ031BA070BB052BD050BE056" +
  "BF854BG100BH048BI108BJ204BL652BM060BN096BO068BQ535BR076BS044BT064BV074BW072BY112BZ084CA124CC166CD180" +
  "CF140CG178CH756CI384CK184CL152CM120CN156CO170CR188CU192CV132CW531CX162CY196CZ203DE276DJ262DK208DM212" +
  "DO214DZ012EC218EE233EG818EH732ER232ES724ET231FI246FJ242FK238FM583FO234FR250GA266GB826GD308GE268GF254" +
  "GG831GH288GI292GL304GM270GN324GP312GQ226GR300GS239GT320GU316GW624GY328HK344HM334HN340HR191HT332HU348" +
  "ID360IE372IL376IM833IN356IO086IQ368IR364IS352IT380JE832JM388JO400JP392KE404KG417KH116KI296KM174KN659" +
  "KP408KR410KW414KY136KZ398LA418LB422LC662LI438LK144LR430LS426LT440LU442LV428LY434MA504MC492MD498ME499" +
  "MF663MG450MH584MK807ML466MM104MN496MO446MP580MQ474MR478MS500MT470MU480MV462MW454MX484MY458MZ508NA516" +
  "NC540NE562NF574NG566NI558NL528NO578NP524NR520NU570NZ554OM512PA591PE604PF258PG598PH608PK586PL616PM666" +
  "PN612PR630PS275PT620PW585PY600QA634RE638RO642RS688RU643RW646SA682SB090SC690SD729SE752SG702SH654SI705" +
  "SJ744SK703SL694SM674SN686SO706SR740SS728ST678SV222SX534SY760SZ748TC796TD148TF260TG768TH764TJ762TK772" +
  "TL626TM795TN788TO776TR792TT780TV798TW158TZ834UA804UG800UM581US840UY858UZ860VA336VC670VE862VG092VI850" +
  "VN704VU548WF876WS882YE887YT175ZA710ZM894ZW716";

const ENTRY_LENGTH = 5;

let numericByAlpha2: ReadonlyMap<string, number> | null = null;

function isoNumericTable(): ReadonlyMap<string, number> {
  if (numericByAlpha2) return numericByAlpha2;
  const table = new Map<string, number>();
  for (let i = 0; i < ISO_NUMERIC_TABLE.length; i += ENTRY_LENGTH) {
    table.set(ISO_NUMERIC_TABLE.slice(i, i + 2), Number(ISO_NUMERIC_TABLE.slice(i + 2, i + ENTRY_LENGTH)));
  }
  numericByAlpha2 = table;
  return table;
}

/** φ for an unknown country. */
const UNKNOWN_PHASE_DEG = 0;

/** ISO 3166-1 numeric code for an alpha-2 code, or null when it is not an assigned country. */
export function isoNumericCode(alpha2: string | null): number | null {
  if (!alpha2) return null;
  return isoNumericTable().get(alpha2.trim().toUpperCase()) ?? null;
}

/** φ in degrees, in [0, 360): the country's ISO numeric code mod 360, or 0 when unknown. */
export function countryPhaseDegrees(alpha2: string | null): number {
  const numeric = isoNumericCode(alpha2);
  return numeric === null ? UNKNOWN_PHASE_DEG : numeric % 360;
}

/** Region of a BCP 47 language tag ("es-AR" → "AR", "ja" → "JP"), or null when it has none or is malformed. */
export function localeRegion(tag: string): string | null {
  try {
    return new Intl.Locale(tag).maximize().region ?? null;
  } catch {
    return null; // Not a valid language tag.
  }
}

/**
 * φ in degrees for a list of preferred language tags (navigator.languages):
 * the first tag whose region is an assigned ISO country wins, 0 when none is.
 */
export function localePhaseDegrees(tags: readonly string[]): number {
  for (const tag of tags) {
    const region = localeRegion(tag);
    if (isoNumericCode(region) !== null) return countryPhaseDegrees(region);
  }
  return UNKNOWN_PHASE_DEG;
}
