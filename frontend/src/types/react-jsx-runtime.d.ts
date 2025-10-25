declare module 'react/jsx-runtime' {
  import * as React from 'react';
  export function jsx(type: any, props?: any, key?: any): React.ReactElement | null;
  export function jsxs(type: any, props?: any, key?: any): React.ReactElement | null;
  export function jsxDEV(type: any, props?: any, key?: any): React.ReactElement | null;
  export const Fragment: React.ExoticComponent<any>;
}