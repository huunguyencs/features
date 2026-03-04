import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadMap } from "../utils/urlShortener";

export default function RedirectHandler() {
  const { shortId } = useParams<{ shortId: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const map = loadMap();
      const target = shortId ? map[shortId] : undefined;
      if (target) {
        window.location.replace(target);
      } else {
        const msg = `No URL found for short ID: ${shortId ?? "unknown"}`;
        queueMicrotask(() => {
          if (!cancelled) setError(msg);
        });
      }
    } catch {
      queueMicrotask(() => {
        if (!cancelled) setError("Failed to look up short URL.");
      });
    }
    return () => {
      cancelled = true;
    };
  }, [shortId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-base">
        <div className="tool-card max-w-md text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <a
            href="/#/url-shortener"
            className="text-accent-primary hover:text-accent-hover underline"
          >
            Back to URL Shortener
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-surface-base">
      <p className="text-text-secondary">Redirecting…</p>
    </div>
  );
}
