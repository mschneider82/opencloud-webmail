<template>
  <div class="ext:p-4 ext:flex ext:flex-col ext:gap-4">
    <div v-if="editingAccount || addingAccount">
      <h3 class="ext:text-lg ext:font-medium ext:mb-4">
        {{ editingAccount ? $gettext('Edit Mail Account') : $gettext('Add Mail Account') }}
      </h3>
      <MailAccountForm
        :instances="configStore.instances"
        :account="editingAccount"
        @submit="onFormSubmit"
        @cancel="closeForm"
      />
    </div>

    <div v-else>
      <div class="ext:flex ext:justify-between ext:items-center ext:mb-4">
        <h3 class="ext:text-lg ext:font-medium">{{ $gettext('Mail Accounts') }}</h3>
        <button
          class="ext:px-4 ext:py-2 ext:text-sm ext:rounded ext:bg-blue-600 ext:text-white"
          :disabled="configStore.instances.length === 0"
          @click="addingAccount = true"
        >
          {{ $gettext('Add Account') }}
        </button>
      </div>

      <p v-if="configStore.instances.length === 0" class="ext:text-sm ext:text-gray-500">
        {{ $gettext('No mail servers configured by the administrator.') }}
      </p>

      <div v-else-if="accountStore.accounts.length === 0" class="ext:text-sm ext:text-gray-500">
        {{ $gettext('No mail accounts configured yet.') }}
      </div>

      <table v-else class="ext:w-full ext:text-sm">
        <thead>
          <tr class="ext:border-b">
            <th class="ext:text-left ext:py-2 ext:px-2">{{ $gettext('Label') }}</th>
            <th class="ext:text-left ext:py-2 ext:px-2">{{ $gettext('Server') }}</th>
            <th class="ext:text-left ext:py-2 ext:px-2">{{ $gettext('IMAP User') }}</th>
            <th class="ext:text-right ext:py-2 ext:px-2">{{ $gettext('Actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in accountStore.accounts" :key="account.id" class="ext:border-b">
            <td class="ext:py-2 ext:px-2">{{ account.label }}</td>
            <td class="ext:py-2 ext:px-2">{{ instanceLabel(account.roundcubeInstanceId) }}</td>
            <td class="ext:py-2 ext:px-2">{{ account.imapUser }}</td>
            <td class="ext:py-2 ext:px-2 ext:text-right">
              <button class="ext:text-blue-600 ext:mr-2" @click="editAccount(account)">
                {{ $gettext('Edit') }}
              </button>
              <button class="ext:text-red-600" @click="deleteAccount(account.id)">
                {{ $gettext('Delete') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useGettext } from 'vue3-gettext'
import { useWebmailConfigStore } from '../composables/useWebmailConfigStore'
import { useMailAccountStore } from '../composables/useMailAccountStore'
import MailAccountForm from '../components/MailAccountForm.vue'
import type { MailAccount } from '../types'

interface FormData {
  label: string
  roundcubeInstanceId: string
  imapUser: string
  imapPass: string
}

export default defineComponent({
  name: 'MailAccountSettings',
  components: { MailAccountForm },
  setup() {
    const { $gettext } = useGettext()
    const configStore = useWebmailConfigStore()
    const accountStore = useMailAccountStore()

    const addingAccount = ref(false)
    const editingAccount = ref<MailAccount | null>(null)

    function instanceLabel(id: string): string {
      return configStore.getInstanceById(id)?.label ?? id
    }

    function editAccount(account: MailAccount) {
      editingAccount.value = account
    }

    function deleteAccount(id: string) {
      accountStore.removeAccount(id)
    }

    function closeForm() {
      addingAccount.value = false
      editingAccount.value = null
    }

    async function onFormSubmit(data: FormData) {
      if (editingAccount.value) {
        const updates: { label?: string; roundcubeInstanceId?: string; imapUser?: string; imapPass?: string } = {
          label: data.label,
          roundcubeInstanceId: data.roundcubeInstanceId,
          imapUser: data.imapUser
        }
        if (data.imapPass) {
          updates.imapPass = data.imapPass
        }
        await accountStore.updateAccount(editingAccount.value.id, updates)
      } else {
        await accountStore.addAccount(data.label, data.roundcubeInstanceId, data.imapUser, data.imapPass)
      }
      closeForm()
    }

    return {
      $gettext,
      configStore,
      accountStore,
      addingAccount,
      editingAccount,
      instanceLabel,
      editAccount,
      deleteAccount,
      closeForm,
      onFormSubmit
    }
  }
})
</script>
