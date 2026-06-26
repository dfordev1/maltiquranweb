import chunk01 from "../data/quran/chunk-01.json";
import chunk02 from "../data/quran/chunk-02.json";
import chunk03 from "../data/quran/chunk-03.json";
import chunk04 from "../data/quran/chunk-04.json";
import chunk05 from "../data/quran/chunk-05.json";
import chunk06 from "../data/quran/chunk-06.json";
import chunk07 from "../data/quran/chunk-07.json";
import chunk08 from "../data/quran/chunk-08.json";
import chunk09 from "../data/quran/chunk-09.json";
import chunk10 from "../data/quran/chunk-10.json";
import chunk11 from "../data/quran/chunk-11.json";
import chunk12 from "../data/quran/chunk-12.json";

type Verse = { translation: string };
type Surah = { name: string; verses: Record<string, Verse> };

const chunks = [chunk01, chunk02, chunk03, chunk04, chunk05, chunk06, chunk07, chunk08, chunk09, chunk10, chunk11, chunk12];

function fixMojibake(value: string) {
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function normalizeSurah(surah: Surah): Surah {
  return {
    name: fixMojibake(surah.name),
    verses: Object.fromEntries(
      Object.entries(surah.verses).map(([verseNumber, verse]) => [
        verseNumber,
        { translation: fixMojibake(verse.translation) },
      ]),
    ),
  };
}

const data = Object.fromEntries(chunks.flatMap((chunk) => Object.entries(chunk as Record<string, Surah>))) as Record<
  string,
  Surah
>;

export const normalizedData = Object.fromEntries(
  Object.entries(data).map(([number, surah]) => [number, normalizeSurah(surah)]),
) as Record<string, Surah>;

export type SurahEntry = {
  number: string;
  name: string;
  verseCount: number;
  slug: string;
};

export const surahs: SurahEntry[] = Object.entries(normalizedData).map(([number, surah]) => ({
  number,
  name: surah.name,
  verseCount: Object.keys(surah.verses).length,
  slug: slugify(surah.name),
}));

export const playStoreUrl = "https://play.google.com/store/apps/details?id=com.malti.quran";
export const defaultSurahId = "1-al-fatiha";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
