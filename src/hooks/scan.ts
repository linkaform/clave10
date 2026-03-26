import { useEffect, useState } from "react";

export const useScanPreference = () => {
    const [preference, setPreference] = useState<'camera' | 'scanner' | null>(null);
  
    useEffect(() => {
        const saved = localStorage.getItem('scan_preference') as 'camera' | 'scanner' | null;
        setPreference(saved);
    }, []);
  
    const reset = () => {
        localStorage.removeItem('scan_preference');
        setPreference(null);
    };
  
    return { preference, setPreference, reset };
  }