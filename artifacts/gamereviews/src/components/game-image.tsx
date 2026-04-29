import { useEffect, useRef, useState } from "react";
import { Gamepad2 } from "lucide-react";

interface GameImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fallbackTitle?: string;
}

const apiBase = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;
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
  return /^https?:\/\//.test(src);
}

async function lookupRawgImage(name: string): Promise<string | null> {
  const key = name.toLowerCase().trim();
  if (imageCache.has(key)) return imageCache.get(key) ?? null;
  const existing = inflight.get(key);
  if (existing) return existing;
  const promise = fetch(`${apiBase}/imagen/${encodeURIComponent(name)}`)
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
}: GameImageProps) {
  const title = fallbackTitle ?? alt;
  const initialValid = looksValid(src);
  const [currentSrc, setCurrentSrc] = useState<string | null>(
    initialValid ? src : null,
  );
  const [failed, setFailed] = useState(false);
  const [searching, setSearching] = useState(!initialValid);
  const triedRawg = useRef(false);

  useEffect(() => {
    if (!initialValid && !triedRawg.current) {
      triedRawg.current = true;
      setSearching(true);
      lookupRawgImage(title).then((img) => {
        if (img) {
          setCurrentSrc(img);
          setFailed(false);
        } else {
          setFailed(true);
        }
        setSearching(false);
      });
    }
  }, [initialValid, title]);

  const handleError = () => {
    if (!triedRawg.current) {
      triedRawg.current = true;
      setSearching(true);
      lookupRawgImage(title).then((img) => {
        if (img) {
          setCurrentSrc(img);
          setFailed(false);
        } else {
          setFailed(true);
        }
        setSearching(false);
      });
    } else {
      setFailed(true);
    }
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

  return (
    <img
      src={currentSrc ?? src}
      alt={alt}
      loading={loading}
      onError={handleError}
      className={className}
    />
  );
}
