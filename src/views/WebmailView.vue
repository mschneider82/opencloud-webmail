<template>
  <main class="ext:flex ext:flex-col ext:h-full">
    <EmptyState v-if="accountStore.accounts.length === 0" />

    <template v-else>
      <nav class="ext:flex ext:border-b ext:px-4 ext:gap-1">
        <button
          v-for="account in accountStore.accounts"
          :key="account.id"
          class="ext:px-4 ext:py-2 ext:text-sm ext:border-b-2 ext:-mb-px"
          :class="
            selectedAccountId === account.id
              ? 'ext:border-blue-600 ext:text-blue-600'
              : 'ext:border-transparent ext:text-gray-500 hover:ext:text-gray-700'
          "
          @click="selectAccount(account.id)"
        >
          {{ account.label }}
        </button>
      </nav>

      <div class="ext:flex-1 ext:relative">
        <div v-if="loading" class="ext:flex ext:items-center ext:justify-center ext:h-full">
          <p class="ext:text-gray-500">{{ $gettext('Loading...') }}</p>
        </div>
        <div v-else-if="error" class="ext:flex ext:items-center ext:justify-center ext:h-full">
          <p class="ext:text-red-500">{{ error }}</p>
        </div>
        <RoundcubeFrame
          v-else-if="frameUrl"
          :title="selectedAccount?.label ?? ''"
          :url="frameUrl"
        />
      </div>
    </template>
  </main>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useMailAccountStore } from '../composables/useMailAccountStore'
import { buildAutologinUrl } from '../composables/useAutologinUrl'
import RoundcubeFrame from '../components/RoundcubeFrame.vue'
import EmptyState from '../components/EmptyState.vue'
import type { MailAccount } from '../types'

export default defineComponent({
  name: 'WebmailView',
  components: { RoundcubeFrame, EmptyState },
  setup() {
    const { $gettext } = useGettext()
    const accountStore = useMailAccountStore()

    const selectedAccountId = ref<string>('')
    const frameUrl = ref<string>('')
    const loading = ref(false)
    const error = ref<string>('')

    const selectedAccount = ref<MailAccount | undefined>(undefined)

    async function selectAccount(id: string) {
      selectedAccountId.value = id
      selectedAccount.value = accountStore.accounts.find((a: MailAccount) => a.id === id)
      if (!selectedAccount.value) return

      loading.value = true
      error.value = ''
      frameUrl.value = ''

      try {
        const url = await buildAutologinUrl(selectedAccount.value)
        if (url) {
          frameUrl.value = url
        } else {
          error.value = $gettext('Could not build autologin URL. Check your mail server configuration.')
        }
      } catch {
        error.value = $gettext('Failed to prepare autologin. Please check your account settings.')
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      if (accountStore.accounts.length > 0) {
        selectAccount(accountStore.accounts[0].id)
      }
    })

    watch(
      () => accountStore.accounts.length,
      (newLen) => {
        if (newLen > 0 && !selectedAccountId.value) {
          selectAccount(accountStore.accounts[0].id)
        }
      }
    )

    return {
      $gettext,
      accountStore,
      selectedAccountId,
      selectedAccount,
      frameUrl,
      loading,
      error,
      selectAccount
    }
  }
})
</script>
