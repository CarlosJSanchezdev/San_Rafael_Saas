import { useEffect } from 'react';

interface TiendaStyleProps {
  colorPrimario?: string;
  colorSecundario?: string;
}

// This component injects the CSS styles dynamically
// We'll import the CSS in each page that needs it

export default function TiendaStyle({ colorPrimario, colorSecundario }: TiendaStyleProps) {
  
  useEffect(() => {
    // Update CSS variables for dynamic colors
    const root = document.documentElement;
    
    if (colorPrimario) {
      root.style.setProperty('--primary', colorPrimario);
      // Calculate lighter and darker variants
      root.style.setProperty('--primary-light', adjustColor(colorPrimario, 20));
      root.style.setProperty('--primary-dark', adjustColor(colorPrimario, -20));
    }
    
    if (colorSecundario) {
      root.style.setProperty('--secondary', colorSecundario);
    }
  }, [colorPrimario, colorSecundario]);

  return null;
}

function adjustColor(hex: string, percent: number): string {
  if (!hex) return '#000000';
  
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  
  if (isNaN(num)) return '#000000';
  
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, (num >> 8 & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

export const PLANTILLAS = [
  { id: 'style_1', nombre: 'Clásico Lavanda', descripcion: 'Diseño limpio con tonos lavanda y morados' },
  { id: 'style_2', nombre: 'Midnight Dark', descripcion: 'Modo oscuro con acentos neón' },
];
