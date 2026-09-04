import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';
import { ToastProvider } from '@/components/glass/glass-toast';
import { RealtimeProvider } from '@/lib/realtime/realtime-context';
import { LenisProvider } from '@/components/motion/lenis-provider';
import { RoleSwitcher } from '@/components/ui/role-switcher';

export const metadata: Metadata = {
  title: 'SolarGrid | Digital Solar Infrastructure. Community Powered.',
  description:
    'SolarGrid connects distributed global energy contributors to high-efficiency utility-scale solar generation with decentralized community incentives, automated weekday yields, and multi-tier leadership rewards in a luxury Midnight Solar ecosystem.',
  keywords: [
    'SolarGrid',
    'solar energy',
    'distributed energy',
    'clean tech',
    'photovoltaic investment',
    'community solar',
    'solar rewards',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#050B18] text-[#F8FAFC] min-h-screen flex flex-col antialiased selection:bg-solar-gold selection:text-solar-darkest">
        <ToastProvider>
          <AuthProvider>
            <RealtimeProvider>
              <LenisProvider>
                {children}
                <RoleSwitcher />
              </LenisProvider>
            </RealtimeProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
