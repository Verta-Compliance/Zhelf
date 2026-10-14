import type { ReactNode } from 'react';
import { FluentProvider } from '@fluentui/react-provider';
import { webLightTheme } from '@fluentui/react-theme';
import SiteHeader from '../components/site-header';
import './globals.css';

export const metadata = {
  title: 'Zhelf',
  description: 'Community marketplace for books and clothing.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FluentProvider theme={webLightTheme}>
          <SiteHeader />
          {children}
        </FluentProvider>
      </body>
    </html>
  );
}
