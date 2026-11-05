import type { ReactNode } from 'react';
import { FluentProvider } from '@fluentui/react-provider';
import { webLightTheme } from '@fluentui/react-theme';
import SiteHeader from '../components/site-header';
import './globals.css';

const coralTheme = {
  ...webLightTheme,
  colorBrandBackground: '#e36b48',
  colorBrandBackgroundHover: '#cf5b3a',
  colorBrandBackgroundPressed: '#b94e30',
  colorBrandBackgroundSelected: '#f7e7e1',
  colorBrandForeground1: '#b94e30',
  colorBrandForeground2: '#a94024',
  colorBrandForeground2Hover: '#91391f',
  colorBrandForeground2Pressed: '#7f331d',
  colorBrandForegroundLink: '#b94e30',
  colorBrandForegroundLinkHover: '#a94024',
  colorBrandForegroundLinkPressed: '#91391f',
  colorBrandStroke1: '#e36b48',
  colorBrandStroke2: '#e36b48',
  colorBrandStroke2Hover: '#cf5b3a',
  colorBrandStroke2Pressed: '#b94e30',
  colorCompoundBrandBackground: '#e36b48',
  colorCompoundBrandBackgroundHover: '#cf5b3a',
  colorCompoundBrandBackgroundPressed: '#b94e30',
  colorCompoundBrandForeground1: '#b94e30',
};

export const metadata = {
  title: 'Zhelf',
  description: 'Community marketplace for books and clothing.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FluentProvider theme={coralTheme}>
          <SiteHeader />
          {children}
        </FluentProvider>
      </body>
    </html>
  );
}
