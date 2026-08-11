import React, { createContext, useContext, useState, useEffect } from 'react';
import { Paleta, Cor } from '../types';
import { api } from '../services/api';

interface ThemeContextType {
  paleta: Paleta | null;
  cores: Cor[];
  loading: boolean;
  refreshPaleta: () => Promise<void>;
  reloadTheme: () => Promise<void>;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  accentColor: string;
}

const ThemeContext = createContext<ThemeContextType>({
  paleta: null,
  cores: [],
  loading: true,
  refreshPaleta: async () => {},
  reloadTheme: async () => {},
  primaryColor: '#800020',
  secondaryColor: '#556B2F',
  bgColor: '#FAF6F0',
  accentColor: '#D4AF37'
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paleta, setPaleta] = useState<Paleta | null>(null);
  const [cores, setCores] = useState<Cor[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshPaleta = async () => {
    try {
      const data = await api.getPaleta();
      setPaleta(data.paleta);
      setCores(data.cores);

      // Apply CSS custom properties to documentElement
      const prim = data.cores.find(c => c.tipo === 'PRIMARIA')?.codigo_hex || '#800020';
      const sec = data.cores.find(c => c.tipo === 'SECUNDARIA')?.codigo_hex || '#556B2F';
      const bg = data.cores.find(c => c.tipo === 'FUNDO')?.codigo_hex || '#FAF6F0';
      const acc = data.cores.find(c => c.tipo === 'DESTAQUE')?.codigo_hex || '#D4AF37';

      document.documentElement.style.setProperty('--color-marsala', prim);
      document.documentElement.style.setProperty('--color-oliva', sec);
      document.documentElement.style.setProperty('--color-creme', bg);
      document.documentElement.style.setProperty('--color-destaque', acc);
    } catch (err) {
      console.error('Failed to load theme palette:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPaleta();
  }, []);

  const primaryColor = cores.find(c => c.tipo === 'PRIMARIA')?.codigo_hex || '#800020';
  const secondaryColor = cores.find(c => c.tipo === 'SECUNDARIA')?.codigo_hex || '#556B2F';
  const bgColor = cores.find(c => c.tipo === 'FUNDO')?.codigo_hex || '#FAF6F0';
  const accentColor = cores.find(c => c.tipo === 'DESTAQUE')?.codigo_hex || '#D4AF37';

  return (
    <ThemeContext.Provider
      value={{
        paleta,
        cores,
        loading,
        refreshPaleta,
        reloadTheme: refreshPaleta,
        primaryColor,
        secondaryColor,
        bgColor,
        accentColor
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
