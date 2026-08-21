"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { defaultSurahId, normalizedData, playStoreUrl, surahs } from "@/lib/quran";

type PageProps = { surahId?: string };

function setSeo(title: string, description: string, canonical: string) {
  document.title = title;
  const setMeta = (attr: "name" | "property", key: string, value: string) => {
    let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.content = value;
  };
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", canonical);
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/">Il-Quran bil-Malti</a>
        <nav className="header-links" aria-label="Main navigation">
          <a className="playstore-link" href={playStoreUrl} target="_blank" rel="noreferrer">Niżżel l-app</a>
          <a className="about-link" href="/about">Dwar</a>
        </nav>
      </header>
      {children}
    </div>
  );
}

function ChapterControls({
  currentValue,
  onChange,
  previous,
  next,
  onPrevious,
  onNext,
}: {
  currentValue: string;
  onChange: (value: string) => void;
  previous: boolean;
  next: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  return (
    <nav className="chapter-bar" aria-label="Navigazzjoni tas-surah">
      <button type="button" aria-label="Surah ta' qabel" disabled={!previous} onClick={onPrevious}>
        <ChevronLeft size={20} />
      </button>
      <select value={currentValue} onChange={(event) => onChange(event.target.value)} aria-label="Agħżel surah">
        {surahs.map((surah) => (
          <option key={surah.number} value={`${surah.number}-${surah.slug}`}>
            {surah.number}. {surah.name}
          </option>
        ))}
      </select>
      <button type="button" aria-label="Surah li jmiss" disabled={!next} onClick={onNext}>
        <ChevronRight size={20} />
      </button>
    </nav>
  );
}

function Reader({ surah }: { surah: NonNullable<(typeof normalizedData)[string]> }) {
  const verses = Object.entries(surah.verses);
  return (
    <main className="reader">
      <header className="surah-heading">
        <p>Surah</p>
        <h1>{surah.name}</h1>
        <span>{verses.length} versi</span>
      </header>
      <section className="verse-list">
        {verses.map(([verseNumber, verse]) => (
          <article className="verse" key={verseNumber}>
            <span className="verse-number">{verseNumber}</span>
            <p>{verse.translation}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export function HomeReader() {
  const router = useRouter();
  const fatiha = normalizedData["1"];

  useEffect(() => {
    setSeo("Il-Quran bil-Malti", "Aqra l-Quran bil-Malti.", "https://maltiquran.com/");
  }, []);

  if (!fatiha) return null;
  const next = surahs[1];

  return (
    <Shell>
      <ChapterControls
        currentValue={defaultSurahId}
        onChange={(value) => router.push(`/surah/${value}`)}
        previous={false}
        next={Boolean(next)}
        onNext={() => next && router.push(`/surah/${next.number}-${next.slug}`)}
      />
      <Reader surah={fatiha} />
    </Shell>
  );
}

export function SurahReader({ surahId }: PageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const number = surahId?.split("-")[0] ?? "";
  const surah = normalizedData[number];
  const currentIndex = surahs.findIndex((item) => item.number === number);
  const previousSurah = currentIndex > 0 ? surahs[currentIndex - 1] : null;
  const nextSurah = currentIndex >= 0 && currentIndex < surahs.length - 1 ? surahs[currentIndex + 1] : null;

  useEffect(() => {
    if (!surah) return;
    setSeo(`Surah ${surah.name} | Il-Quran bil-Malti`, `Aqra Surah ${surah.name} bil-Malti.`, `https://maltiquran.com${pathname}`);
  }, [pathname, surah]);

  if (!surah) return null;

  return (
    <Shell>
      <ChapterControls
        currentValue={surahId ?? defaultSurahId}
        onChange={(value) => router.push(`/surah/${value}`)}
        previous={Boolean(previousSurah)}
        next={Boolean(nextSurah)}
        onPrevious={() => previousSurah && router.push(`/surah/${previousSurah.number}-${previousSurah.slug}`)}
        onNext={() => nextSurah && router.push(`/surah/${nextSurah.number}-${nextSurah.slug}`)}
      />
      <Reader surah={surah} />
    </Shell>
  );
}

export function StaticPage({ title, body, path }: { title: string; body: string; path: string }) {
  useEffect(() => {
    setSeo(`${title} | Il-Quran bil-Malti`, body, `https://maltiquran.com${path}`);
  }, [body, path, title]);

  return (
    <Shell>
      <main className="static-page">
        <h1>{title}</h1>
        <p>{body}</p>
      </main>
    </Shell>
  );
}
