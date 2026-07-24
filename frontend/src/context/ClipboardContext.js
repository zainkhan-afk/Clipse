"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getClipboards } from "@/api/clipboard";

const ClipboardsContext = createContext();

export const ClipboardsProvider = ({ children }) => {
  const [ClipboardsData, setClipboardsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // `load` sets state only after awaiting, so the mount effect never calls
  // setState synchronously. `refresh` adds the loading flip for manual refetches.
  const load = async () => {
    const data = await getClipboards();
    setClipboardsData(data);
    setLoading(false);
  };

  const refresh = async () => {
    setLoading(true);
    await load();
  };

  useEffect(() => {
    // Fetch once on mount; setState only runs after the awaited request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return (
    <ClipboardsContext.Provider value={{ ClipboardsData, loading, refresh }}>
      {children}
    </ClipboardsContext.Provider>
  );
};

export const useClipboards = () => useContext(ClipboardsContext);
