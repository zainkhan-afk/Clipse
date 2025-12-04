"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { getProfile } from "@/api/auth";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [UserData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch data
  const fetchData = async () => {
    setLoading(true);
    const data = await getProfile();
    setUserData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // const interval = setInterval(fetchData, 10000); // refresh every 10 seconds
    // return () => clearInterval(interval);
  }, []);

  return (
    <UserContext.Provider value={{ UserData, loading, refresh: fetchData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
