import { CERTIFICATIONS, LANGUAGES } from "@/lib/constants";
import type { Opportunity } from "@/lib/sources/types";
import type { CompanyProfile } from "@/lib/types";

export interface ScoreFactor {
  name: string;
  points: number;
  max: number;
  reason: string;
}

export interface MatchBreakdown {
  factors: ScoreFactor[];
  rawTotal: number;
  maxTotal: number;
}

export interface ScoreResult {
  score: number;
  breakdown: MatchBreakdown;
}

const MAX_TOTAL = 80;

const COUNTRY_ALIASES: Record<string, string[]> = {
  "united kingdom": ["united kingdom", "uk", "gb", "gbr", "great britain", "england", "scotland", "wales"],
  germany: ["germany", "de", "deu", "deutschland"],
  france: ["france", "fr", "fra"],
  spain: ["spain", "es", "esp", "españa"],
  italy: ["italy", "it", "ita", "italia"],
  netherlands: ["netherlands", "nl", "nld", "holland"],
  ireland: ["ireland", "ie", "irl"],
  belgium: ["belgium", "be", "bel"],
  sweden: ["sweden", "se", "swe"],
  norway: ["norway", "no", "nor"],
  denmark: ["denmark", "dk", "dnk"],
  poland: ["poland", "pl", "pol"],
  portugal: ["portugal", "pt", "prt"],
  luxembourg: ["luxembourg", "lu", "lux"],
  austria: ["austria", "at", "aut"],
  finland: ["finland", "fi", "fin"],
  "united states": ["united states", "us", "usa", "u.s."],
  canada: ["canada", "ca", "can"],
  australia: ["australia", "au", "aus"],
};

const LANGUAGE_ALIASES: Record<string, string[]> = {
  english: ["english", "en", "eng"],
  french: ["french", "fr", "fra", "français"],
  german: ["german", "de", "deu", "deutsch"],
  spanish: ["spanish", "es", "spa", "español"],
  portuguese: ["portuguese", "pt", "por"],
  arabic: ["arabic", "ar", "ara"],
  dutch: ["dutch", "nl", "nld"],
  italian: ["italian", "it", "ita"],
  polish: ["polish", "pl", "pol"],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeCountry(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = normalize(value);
  for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
    if (aliases.includes(normalized)) return canonical;
  }
  return normalized;
}

function countriesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeCountry(a);
  const right = normalizeCountry(b);
  if (!left || !right) return false;
  return left === right;
}

function countryInList(
  country: string | null | undefined,
  list: string[]
): boolean {
  return list.some((entry) => countriesMatch(country, entry));
}

function buildHaystack(opportunity: Opportunity): string {
  return [opportunity.title, opportunity.raw_text, opportunity.plain_summary]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function countServiceMatches(services: string[], haystack: string): number {
  if (services.length === 0) return 0;

  return services.filter((service) => {
    const serviceLower = service.toLowerCase();
    if (haystack.includes(serviceLower)) return true;

    const keywords = serviceLower
      .split(/[\s&/,-]+/)
      .filter((word) => word.length > 2 && word !== "and");

    return keywords.some((keyword) => haystack.includes(keyword));
  }).length;
}

function scoreServiceFit(
  opportunity: Opportunity,
  profile: CompanyProfile
): ScoreFactor {
  const max = 30;
  const haystack = buildHaystack(opportunity);
  const matches = countServiceMatches(profile.services, haystack);

  if (matches >= 3) {
    return {
      name: "Service fit",
      points: 30,
      max,
      reason: `${matches} of your services appear in this tender.`,
    };
  }

  if (matches >= 1) {
    return {
      name: "Service fit",
      points: 15,
      max,
      reason: `${matches} service${matches > 1 ? "s" : ""} partially match this tender.`,
    };
  }

  return {
    name: "Service fit",
    points: 0,
    max,
    reason: "None of your listed services clearly match this tender.",
  };
}

function scoreGeographyFit(
  opportunity: Opportunity,
  profile: CompanyProfile
): ScoreFactor {
  const max = 15;
  const tenderCountry = opportunity.country;

  if (countryInList(tenderCountry, profile.countries_served)) {
    return {
      name: "Country / geography fit",
      points: 15,
      max,
      reason: `This tender is in ${tenderCountry ?? "a market"} you actively serve.`,
    };
  }

  const operatesInternationally = profile.countries_served.length > 1;
  if (operatesInternationally && tenderCountry) {
    return {
      name: "Country / geography fit",
      points: 7,
      max,
      reason: `You serve multiple countries, but ${tenderCountry} is not on your list yet.`,
    };
  }

  return {
    name: "Country / geography fit",
    points: 0,
    max,
    reason: "This tender's location is outside your served countries.",
  };
}

function getTenderBudget(opportunity: Opportunity): number | null {
  if (opportunity.budget_min != null && opportunity.budget_max != null) {
    return Math.round((opportunity.budget_min + opportunity.budget_max) / 2);
  }
  return opportunity.budget_min ?? opportunity.budget_max;
}

function scoreBudgetFit(
  opportunity: Opportunity,
  profile: CompanyProfile
): ScoreFactor {
  const max = 10;
  const tenderBudget = getTenderBudget(opportunity);

  if (tenderBudget == null) {
    return {
      name: "Budget fit",
      points: 5,
      max,
      reason: "No budget was published — scored neutrally.",
    };
  }

  if (profile.budget_min == null || profile.budget_max == null) {
    return {
      name: "Budget fit",
      points: 5,
      max,
      reason: "Your budget preferences are not set — scored neutrally.",
    };
  }

  if (tenderBudget >= profile.budget_min && tenderBudget <= profile.budget_max) {
    return {
      name: "Budget fit",
      points: 10,
      max,
      reason: "The tender budget sits within your preferred range.",
    };
  }

  const lowerBound = profile.budget_min * 0.8;
  const upperBound = profile.budget_max * 1.2;

  if (tenderBudget >= lowerBound && tenderBudget <= upperBound) {
    return {
      name: "Budget fit",
      points: 5,
      max,
      reason: "The budget is close to your range, within 20%.",
    };
  }

  return {
    name: "Budget fit",
    points: 0,
    max,
    reason: "The tender budget is outside your preferred range.",
  };
}

function scoreDeadlineRealism(opportunity: Opportunity): ScoreFactor {
  const max = 10;

  if (!opportunity.deadline) {
    return {
      name: "Deadline realism",
      points: 5,
      max,
      reason: "No deadline listed — scored neutrally.",
    };
  }

  const daysLeft = Math.ceil(
    (new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft > 21) {
    return {
      name: "Deadline realism",
      points: 10,
      max,
      reason: `${daysLeft} days left — plenty of time to prepare a bid.`,
    };
  }

  if (daysLeft >= 14) {
    return {
      name: "Deadline realism",
      points: 7,
      max,
      reason: `${daysLeft} days left — workable but you'll need to move quickly.`,
    };
  }

  if (daysLeft >= 7) {
    return {
      name: "Deadline realism",
      points: 4,
      max,
      reason: `${daysLeft} days left — tight timeline.`,
    };
  }

  if (daysLeft >= 0) {
    return {
      name: "Deadline realism",
      points: 0,
      max,
      reason: `${daysLeft} days left — too little time for a strong bid.`,
    };
  }

  return {
    name: "Deadline realism",
    points: 0,
    max,
    reason: "The submission deadline has already passed.",
  };
}

function findMentionedCertifications(haystack: string): string[] {
  return CERTIFICATIONS.filter((cert) => {
    if (cert === "Other") return false;
    return haystack.includes(cert.toLowerCase());
  });
}

function scoreCertificationMatch(
  opportunity: Opportunity,
  profile: CompanyProfile
): ScoreFactor {
  const max = 10;
  const haystack = buildHaystack(opportunity);
  const mentioned = findMentionedCertifications(haystack);

  if (mentioned.length === 0) {
    return {
      name: "Certification match",
      points: 8,
      max,
      reason: "No specific certifications mentioned — scored neutrally.",
    };
  }

  const held = mentioned.filter((cert) => profile.certifications.includes(cert));

  if (held.length === mentioned.length) {
    return {
      name: "Certification match",
      points: 10,
      max,
      reason: `You hold all mentioned certifications (${held.join(", ")}).`,
    };
  }

  if (held.length > 0) {
    return {
      name: "Certification match",
      points: 5,
      max,
      reason: `You hold some required certifications (${held.join(", ")}).`,
    };
  }

  return {
    name: "Certification match",
    points: 0,
    max,
    reason: `Required certifications mentioned (${mentioned.join(", ")}) are not on your profile.`,
  };
}

function detectTenderLanguages(opportunity: Opportunity): string[] {
  const detected = new Set<string>();
  const haystack = buildHaystack(opportunity);

  for (const language of LANGUAGES) {
    if (language === "Other") continue;
    const aliases = LANGUAGE_ALIASES[language.toLowerCase()] ?? [language.toLowerCase()];
    if (aliases.some((alias) => haystack.includes(alias))) {
      detected.add(language);
    }
  }

  if (opportunity.raw_text) {
    try {
      const parsed = JSON.parse(opportunity.raw_text) as Record<string, unknown>;
      const rawLanguage = parsed.language;
      if (typeof rawLanguage === "string") {
        for (const language of LANGUAGES) {
          const aliases = LANGUAGE_ALIASES[language.toLowerCase()] ?? [];
          if (aliases.includes(rawLanguage.toLowerCase())) {
            detected.add(language);
          }
        }
      }
    } catch {
      // raw_text is not JSON — ignore
    }
  }

  return Array.from(detected);
}

function scoreLanguageMatch(
  opportunity: Opportunity,
  profile: CompanyProfile
): ScoreFactor {
  const max = 5;
  const tenderLanguages = detectTenderLanguages(opportunity);

  if (tenderLanguages.length === 0) {
    return {
      name: "Language match",
      points: 5,
      max,
      reason: "No language requirement detected — scored neutrally.",
    };
  }

  const overlap = tenderLanguages.filter((lang) => profile.languages.includes(lang));

  if (overlap.length > 0) {
    return {
      name: "Language match",
      points: 5,
      max,
      reason: `Tender requires ${overlap.join(", ")}, which your team speaks.`,
    };
  }

  return {
    name: "Language match",
    points: 0,
    max,
    reason: `Tender languages (${tenderLanguages.join(", ")}) don't match your profile.`,
  };
}

export function scoreOpportunity(
  opportunity: Opportunity,
  companyProfile: CompanyProfile
): ScoreResult {
  const factors = [
    scoreServiceFit(opportunity, companyProfile),
    scoreGeographyFit(opportunity, companyProfile),
    scoreBudgetFit(opportunity, companyProfile),
    scoreDeadlineRealism(opportunity),
    scoreCertificationMatch(opportunity, companyProfile),
    scoreLanguageMatch(opportunity, companyProfile),
  ];

  const rawTotal = factors.reduce((sum, factor) => sum + factor.points, 0);
  const score = Math.round((rawTotal / MAX_TOTAL) * 100);

  return {
    score,
    breakdown: {
      factors,
      rawTotal,
      maxTotal: MAX_TOTAL,
    },
  };
}
