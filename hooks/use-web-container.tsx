"use client";

import { useState, useEffect, useCallback } from "react";
import { WebContainer } from "@webcontainer/api";

export const useWebContainer = () => {
  const [instance, setInstance] = useState<WebContainer | null>(null);

  // Boot WebContainer once
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const wc = await WebContainer.boot();
        if (!mounted) return;
        setInstance(wc);
      } catch (err) {
        console.error("WebContainer boot failed:", err);
      }
    }

    init();

    return () => {
      mounted = false;
      if (instance) instance.teardown();
    };
  }, []);

  // Only writeFileSync — nothing else
  const writeFileSync = useCallback(
    async (path: string, content: string) => {
      if (!instance) return;

      try {
        const parts = path.split("/");
        const folder = parts.slice(0, -1).join("/");

        if (folder) {
          await instance.fs.mkdir(folder, { recursive: true });
        }

        await instance.fs.writeFile(path, content);
      } catch (err) {
        console.error("writeFileSync error:", err);
      }
    },
    [instance]
  );

  return {
    instance,
    writeFileSync,
  };
};
