import { useEffect, useState } from "react";

/** Poll gstatic url to check network status reliably */
export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let timer: any;

    async function check() {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 1500);
        const url = `https://www.gstatic.com/generate_204?ts=${Date.now()}`;

        await fetch(url, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
          mode: "no-cors",
        });

        clearTimeout(t);
        setOnline(true);
      } catch {
        setOnline(false);
      }
    }
    check();
    timer = setInterval(check, 1500);

    return () => clearInterval(timer);
  }, []);

  return online;
}
