import { useState } from "react";
import { Gamepad2 } from "lucide-react";

interface GameImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  fallbackTitle?: string;
}

function colorFromString(str: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360;
  return [
    `hsl(${hue1}, 70%, 25%)`,
    `hsl(${hue2}, 70%, 12%)`,
  ];
}

export function GameImage({
  src,
  alt,
  className = "",
  loading = "lazy",
  fallbackTitle,
}: GameImageProps) {
  const [failed, setFailed] = useState(false);
  const title = fallbackTitle ?? alt;
  const [c1, c2] = colorFromString(title);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center text-center px-4 ${className}`}
        style={{
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
        }}
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

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
