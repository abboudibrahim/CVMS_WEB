import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { INITIAL_RESTAURANTS, INITIAL_AIRLINES, TAX_RATES } from '../constants';

const AppContext = createContext();

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  const [restaurants, setRestaurants] = useState(INITIAL_RESTAURANTS);
  const [airlines, setAirlines] = useState(INITIAL_AIRLINES);
  const [vouchers, setVouchers] = useState([]);
  const [archivedVouchers, setArchivedVouchers] = useState([]);
  const [tpsPct, setTpsPct] = useState(TAX_RATES.DEFAULT_TPS);
  const [tvqPct, setTvqPct] = useState(TAX_RATES.DEFAULT_TVQ);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data from Firestore
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setError(null);
        
        // Load restaurants
        const restSnap = await getDocs(collection(db, "restaurants"));
        let restList = [];
        if (restSnap.empty) {
          for (const r of INITIAL_RESTAURANTS) {
            await addDoc(collection(db, "restaurants"), { name: r });
          }
          restList = INITIAL_RESTAURANTS;
        } else {
          restList = restSnap.docs.map((d) => d.data().name).filter(Boolean);
          if (!restList.length) restList = INITIAL_RESTAURANTS;
        }
        if (isMounted) setRestaurants(restList);

        // Load airlines
        const airSnap = await getDocs(collection(db, "airlines"));
        let airMap = {};
        if (airSnap.empty) {
          for (const [name, code] of Object.entries(INITIAL_AIRLINES)) {
            await addDoc(collection(db, "airlines"), { name, code });
          }
          airMap = INITIAL_AIRLINES;
        } else {
          const pairs = airSnap.docs.map((d) => d.data()).filter((x) => x && x.name && x.code);
          airMap = pairs.reduce((acc, { name, code }) => {
            acc[name] = code;
            return acc;
          }, {});
          if (!Object.keys(airMap).length) airMap = INITIAL_AIRLINES;
        }
        if (isMounted) setAirlines(airMap);

        // Load tax settings
        const taxSnap = await getDocs(collection(db, "tax"));
        if (!taxSnap.empty && isMounted) {
          const tax = taxSnap.docs[0].data();
          if (typeof tax.tpsPct === "number") setTpsPct(tax.tpsPct);
          if (typeof tax.tvqPct === "number") setTvqPct(tax.tvqPct);
        }

        // Load vouchers
        const vouchersSnap = await getDocs(collection(db, "vouchers"));
        const loadedVouchers = vouchersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (isMounted) {
          setVouchers(loadedVouchers.sort((a, b) => (b.date || "").localeCompare(a.date || "")));
        }
      } catch (e) {
        console.error("Error loading data:", e);
        if (isMounted) setError("Failed to load data. Please refresh the page.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const addVoucher = async (voucherData) => {
    try {
      const docRef = await addDoc(collection(db, "vouchers"), voucherData);
      const newVoucher = { id: docRef.id, ...voucherData };
      setVouchers(prev => [newVoucher, ...prev]);
      return newVoucher;
    } catch (error) {
      console.error("Error adding voucher:", error);
      throw error;
    }
  };

  const updateVoucher = async (voucherId, updates) => {
    try {
      await updateDoc(doc(db, "vouchers", voucherId), updates);
      setVouchers(prev => 
        prev.map(v => v.id === voucherId ? { ...v, ...updates } : v)
      );
    } catch (error) {
      console.error("Error updating voucher:", error);
      throw error;
    }
  };

  const archiveVoucher = (voucherId) => {
    const voucher = vouchers.find(v => v.id === voucherId);
    if (voucher) {
      setArchivedVouchers(prev => [...prev, voucher]);
      setVouchers(prev => prev.filter(v => v.id !== voucherId));
    }
  };

  const addRestaurant = async (name) => {
    try {
      await addDoc(collection(db, "restaurants"), { name });
      setRestaurants(prev => [...prev, name]);
    } catch (error) {
      console.error("Error adding restaurant:", error);
      throw error;
    }
  };

  const addAirline = async (name, code) => {
    try {
      await addDoc(collection(db, "airlines"), { name, code });
      setAirlines(prev => ({ ...prev, [name]: code }));
    } catch (error) {
      console.error("Error adding airline:", error);
      throw error;
    }
  };

  const saveTaxSettings = async () => {
    try {
      const taxRef = collection(db, "tax");
      const snapshot = await getDocs(taxRef);
      if (!snapshot.empty) {
        await updateDoc(doc(db, "tax", snapshot.docs[0].id), {
          tpsPct,
          tvqPct,
        });
      } else {
        await addDoc(taxRef, { tpsPct, tvqPct });
      }
    } catch (error) {
      console.error("Error saving tax settings:", error);
      throw error;
    }
  };

  const value = {
    restaurants,
    airlines,
    vouchers,
    archivedVouchers,
    tpsPct,
    tvqPct,
    setTpsPct,
    setTvqPct,
    loading,
    error,
    addVoucher,
    updateVoucher,
    archiveVoucher,
    addRestaurant,
    addAirline,
    saveTaxSettings,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
