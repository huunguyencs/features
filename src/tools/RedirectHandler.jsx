import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function RedirectHandler() {
  const { shortId } = useParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const map = JSON.parse(localStorage.getItem("devtools-url-map") || "{}");
      const target = map[shortId];
      if (target) {
        window.location.replace(target);
      } else {
        setError(`No URL found for short ID: ${shortId}`);
      }
    } catch {
      setError("Failed to look up short URL.");
    }
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
