import {
  defineWebApplication,
  useUserStore,
  type AppMenuItemExtension,
  type AccountExtension,
  type Extension
} from '@opencloud-eu/web-pkg'
import { urlJoin } from '@opencloud-eu/web-client'
import '@opencloud-eu/extension-sdk/tailwind.css'
import { computed } from 'vue'
import { useGettext } from 'vue3-gettext'
import { WebmailConfigSchema } from './types'
import { useWebmailConfigStore } from './composables/useWebmailConfigStore'
import { useMailAccountStore } from './composables/useMailAccountStore'
import MailAccountSettings from './views/MailAccountSettings.vue'

export default defineWebApplication({
  setup(args) {
    const { $gettext } = useGettext()
    console.log('[webmail] args:', JSON.stringify(Object.keys(args)), 'appName:', args.appName, 'applicationConfig:', JSON.stringify(args.applicationConfig))
    const config = WebmailConfigSchema.parse(args.applicationConfig)
    console.log('[webmail] parsed config:', JSON.stringify(config))

    const configStore = useWebmailConfigStore()
    configStore.setConfig(config)
    console.log('[webmail] configStore instances:', configStore.instances.length)

    const appInfo = {
      id: 'webmail',
      name: $gettext('Webmail'),
      icon: 'mail',
      color: '#0478d4'
    }

    const routes: any[] = [
      {
        path: '/',
        redirect: `/${appInfo.id}/inbox`
      },
      {
        path: '/inbox',
        name: 'webmail-inbox',
        component: () => import('./views/WebmailView.vue'),
        meta: {
          authContext: 'user',
          title: $gettext('Webmail')
        }
      }
    ]

    const extensions = computed<Extension[]>(() => {
      const menuItems: AppMenuItemExtension[] = [
        {
          id: `app.${appInfo.id}.menuItem`,
          type: 'appMenuItem',
          label: () => appInfo.name,
          color: appInfo.color,
          icon: appInfo.icon,
          path: urlJoin(appInfo.id)
        }
      ]

      const accountExtensions: AccountExtension[] = [
        {
          id: `app.${appInfo.id}.accountSettings`,
          type: 'accountExtension',
          label: () => $gettext('Mail Accounts'),
          icon: 'mail',
          content: MailAccountSettings
        }
      ]

      return [...menuItems, ...accountExtensions]
    })

    return {
      appInfo,
      routes,
      extensions,
      ready() {
        const userStore = useUserStore()
        if (userStore.user?.id) {
          const accountStore = useMailAccountStore()
          accountStore.load(userStore.user.id)
        }
      }
    }
  }
})
