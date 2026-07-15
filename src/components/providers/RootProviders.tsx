import { AuthProvider } from './AuthProvider';

export function RootProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
