import type { ReactNode } from 'react';
import { FluentProvider } from '@fluentui/react-provider';
import { webLightTheme } from '@fluentui/react-theme';
import './globals.css';

export const metadata = {
  title: 'Zhelf',
  description: 'Community marketplace for books and clothing.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
      </body>
    </html>
  );
}
