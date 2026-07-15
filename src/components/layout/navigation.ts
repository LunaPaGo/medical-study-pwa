import { BookOpen, Clock, Files, Heart, Home, Pill, Search, ShieldCheck, UploadCloud } from 'lucide-react';
import type { AppRoute } from '../../types/navigation';

export const primaryRoutes: AppRoute[] = [
  { label: 'Inicio', path: '/', icon: Home },
  { label: 'Temas', path: '/temas', icon: BookOpen },
  { label: 'Farmacología', path: '/farmacologia', icon: Pill },
  { label: 'Buscar', path: '/buscar', icon: Search },
  { label: 'Archivos', path: '/archivos', icon: Files },
  { label: 'Favoritos', path: '/favoritos', icon: Heart }
];

export const secondaryRoutes: AppRoute[] = [
  { label: 'Historial', path: '/historial', icon: Clock },
  { label: 'Respaldo', path: '/respaldo', icon: UploadCloud },
  { label: 'Seguridad', path: '/seguridad', icon: ShieldCheck }
];
