import { useEffect, useRef } from "react";

// Extend Window interface for adsbygoogle
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdSenseUnit() {
  const ref = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet
    }
  }, []);

  return (
    <div
      ref={ref}
      className="w-full my-4 flex justify-center"
      style={{ minHeight: 60, overflow: "hidden" }}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-7251212546663529"
        data-ad-slot="894008938"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
