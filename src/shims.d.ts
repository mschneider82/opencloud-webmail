declare module 'vue3-gettext' {
  import type { Plugin } from 'vue'
  export function useGettext(): {
    $gettext: (msgid: string) => string
    $pgettext: (context: string, msgid: string) => string
    $ngettext: (msgid: string, plural: string, n: number) => string
    $npgettext: (context: string, msgid: string, plural: string, n: number) => string
  }
  const plugin: Plugin
  export default plugin
}

declare module '@opencloud-eu/extension-sdk' {
  import type { UserConfig } from 'vite'
  export function defineConfig(config: { name: string }): UserConfig
}
