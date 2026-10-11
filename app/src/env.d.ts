// Таблицы свойств документации kit: модуль собирает плагин из docs/props-plugin.ts пакета (vite.config.ts)
declare module 'virtual:uikit-props' {
  import type { PropsLibrary } from '../node_modules/@tugen/uikit/docs/props-plugin';
  export const web: PropsLibrary;
  export const native: PropsLibrary;
}
