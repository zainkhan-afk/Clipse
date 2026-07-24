"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getProfile } from "@/api/auth";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [UserData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // `load` sets state only after awaiting, so the mount effect never calls
  // setState synchronously. `refresh` adds the loading flip for manual refetches.
  const load = async () => {
    const data = await getProfile();
    setUserData(data);
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
    <UserContext.Provider value={{ UserData, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
