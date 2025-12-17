"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getClipboards } from "@/api/clipboard";

const ClipboardsContext = createContext();

export const ClipboardsProvider = ({ children }) => {
  const [ClipboardsData, setClipboardsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch data
  const fetchData = async () => {
    setLoading(true);
    const data = await getClipboards();
    setClipboardsData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // const interval = setInterval(fetchData, 10000); // refresh every 10 seconds
    // return () => clearInterval(interval);
  }, []);

  return (
    <ClipboardsContext.Provider value={{ ClipboardsData, loading, refresh: fetchData }}>
      {children}
    </ClipboardsContext.Provider>
  );
};

export const useClipboards = () => useContext(ClipboardsContext);
