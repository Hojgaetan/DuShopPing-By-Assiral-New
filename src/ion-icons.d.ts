// Type declarations for Ionicons custom elements in React/JSX
// This allows using <ion-icon> elements without TypeScript errors

import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          name?: string;
          size?: 'small' | 'large';
          color?: string;
          src?: string;
        },
        HTMLElement
      >;
    }
  }
}
