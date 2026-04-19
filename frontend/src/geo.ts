import { feature } from "topojson-client";
import countries110m from "world-atlas/countries-110m.json";
import type { Country } from "./types";

export interface GlobeCountryFeature {
  type: "Feature";
  id: string;
  properties: {
    name?: string;
    iso3?: string;
  };
  geometry: unknown;
}

export function buildCountryFeatures(countries: Country[]): GlobeCountryFeature[] {
  const byNumeric = new Map(countries.map((country) => [country.iso_numeric, country.iso3]));
  const collection = feature(
    countries110m as any,
    (countries110m as any).objects.countries,
  ) as unknown as { features: GlobeCountryFeature[] };

  return collection.features.map((item) => ({
    ...item,
    id: String(item.id).padStart(3, "0"),
    properties: {
      ...item.properties,
      iso3: byNumeric.get(String(item.id).padStart(3, "0")),
    },
  }));
}
