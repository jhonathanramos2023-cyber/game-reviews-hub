import { useEffect, useRef, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { resolveApiUrl } from "@/lib/api-base";

interface GameImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fallbackTitle?: string;
  fallbackBanner?: string;
  slug?: string;
}

const imageCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function colorFromString(str: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360;
  return [`hsl(${hue1}, 70%, 25%)`, `hsl(${hue2}, 70%, 12%)`];
}

function looksValid(src: string | undefined): boolean {
  if (!src) return false;
  if (src.includes("placeholder")) return false;
  if (src.includes("via.placeholder")) return false;
  if (src.includes("wikipedia.org")) return false;
  if (src.includes("wikimedia.org")) return false;
  return /^https?:\/\//.test(src);
}

function cacheKey(name: string, slug?: string): string {
  return `${name.toLowerCase().trim()}|${(slug ?? "").toLowerCase()}`;
}

async function lookupRawgImage(name: string, slug?: string): Promise<string | null> {
  const key = cacheKey(name, slug);
  if (imageCache.has(key)) return imageCache.get(key) ?? null;
  const existing = inflight.get(key);
  if (existing) return existing;

  const params = new URLSearchParams();
  if (slug?.trim()) params.set("slug", slug.trim());

  const promise = fetch(
    resolveApiUrl(
      `/imagen/${encodeURIComponent(name)}${params.size ? `?${params}` : ""}`,
    ),
  )
    .then((r) => (r.ok ? r.json() : { imagen: null }))
    .then((data: { imagen?: string | null }) => {
      const img = data.imagen ?? null;
      imageCache.set(key, img);
      return img;
    })
    .catch(() => {
      imageCache.set(key, null);
      return null;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export function GameImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  fallbackTitle,
  fallbackBanner,
  slug,
}: GameImageProps) {
  const title = fallbackTitle ?? alt;
  const candidates = [src, fallbackBanner].filter(
    (u, i, arr): u is string => !!u && looksValid(u) && arr.indexOf(u) === i,
  );

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [rawgSrc, setRawgSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [searching, setSearching] = useState(candidates.length === 0);
  const rawgAttempted = useRef(false);

  const currentSrc = rawgSrc ?? candidates[candidateIndex] ?? null;

  useEffect(() => {
    setCandidateIndex(0);
    setRawgSrc(null);
    setFailed(false);
    rawgAttempted.current = false;
    setSearching(candidates.length === 0);

    if (candidates.length === 0) {
      rawgAttempted.current = true;
      lookupRawgImage(title, slug).then((img) => {
        if (img) setRawgSrc(img);
        else setFailed(true);
        setSearching(false);
      });
    }
  }, [src, fallbackBanner, title, slug]);

  const tryRawg = () => {
    if (rawgAttempted.current) {
      setFailed(true);
      setSearching(false);
      return;
    }
    rawgAttempted.current = true;
    setSearching(true);
    lookupRawgImage(title, slug).then((img) => {
      if (img) {
        setRawgSrc(img);
        setFailed(false);
      } else {
        setFailed(true);
      }
      setSearching(false);
    });
  };

  const handleError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((i) => i + 1);
      return;
    }
    tryRawg();
  };

  if (failed) {
    const [c1, c2] = colorFromString(title);
    return (
      <div
        className={`flex items-center justify-center text-center px-4 ${className}`}
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        <div className="flex flex-col items-center gap-2 text-white/90">
          <Gamepad2 className="h-10 w-10 opacity-70" />
          <span className="font-display font-bold text-base leading-tight line-clamp-3">
            {title}
          </span>
        </div>
      </div>
    );
  }

  if (searching && !currentSrc) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{ background: "#1a1a2e" }}
      >
        <div className="absolute inset-0 image-shimmer" />
      </div>
    );
  }

  if (!currentSrc) return null;

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
    />
  );
}
