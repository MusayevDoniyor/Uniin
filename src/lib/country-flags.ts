// Map country name → flag emoji (ISO country codes converted to regional indicators).
const COUNTRY_CODES: Record<string, string> = {
  "united states": "US", "usa": "US", "us": "US", "america": "US",
  "united kingdom": "GB", "uk": "GB", "britain": "GB", "england": "GB", "great britain": "GB",
  "south korea": "KR", "korea": "KR",
  "germany": "DE", "deutschland": "DE",
  "netherlands": "NL", "holland": "NL",
  "france": "FR",
  "japan": "JP",
  "china": "CN",
  "canada": "CA",
  "australia": "AU",
  "italy": "IT",
  "spain": "ES",
  "switzerland": "CH",
  "sweden": "SE",
  "norway": "NO",
  "denmark": "DK",
  "finland": "FI",
  "ireland": "IE",
  "belgium": "BE",
  "austria": "AT",
  "poland": "PL",
  "czechia": "CZ", "czech republic": "CZ",
  "hungary": "HU",
  "turkey": "TR", "türkiye": "TR",
  "russia": "RU",
  "uzbekistan": "UZ",
  "kazakhstan": "KZ",
  "singapore": "SG",
  "hong kong": "HK",
  "taiwan": "TW",
  "malaysia": "MY",
  "india": "IN",
  "uae": "AE", "united arab emirates": "AE",
  "saudi arabia": "SA",
  "new zealand": "NZ",
  "brazil": "BR",
  "mexico": "MX",
  "argentina": "AR",
  "portugal": "PT",
  "greece": "GR",
};

export function countryToFlag(country?: string | null): string {
  if (!country) return "";
  const code = COUNTRY_CODES[country.trim().toLowerCase()];
  if (!code) return "";
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

export function countriesToFlags(countries?: (string | null | undefined)[] | null): string {
  if (!countries?.length) return "";
  return countries.map(countryToFlag).filter(Boolean).join(" ");
}
