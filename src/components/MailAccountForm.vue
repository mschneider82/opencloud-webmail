<template>
  <form class="ext:flex ext:flex-col ext:gap-4" @submit.prevent="onSubmit">
    <div class="ext:flex ext:flex-col ext:gap-1">
      <label for="account-label" class="ext:text-sm ext:font-medium">{{ $gettext('Label') }}</label>
      <input
        id="account-label"
        v-model="form.label"
        type="text"
        required
        class="ext:border ext:rounded ext:px-3 ext:py-2 ext:text-sm"
        :placeholder="$gettext('My Email')"
      />
    </div>

    <div class="ext:flex ext:flex-col ext:gap-1">
      <label for="account-instance" class="ext:text-sm ext:font-medium">{{
        $gettext('Mail Server')
      }}</label>
      <select
        id="account-instance"
        v-model="form.roundcubeInstanceId"
        required
        class="ext:border ext:rounded ext:px-3 ext:py-2 ext:text-sm"
      >
        <option value="" disabled>{{ $gettext('Select a mail server') }}</option>
        <option v-for="instance in instances" :key="instance.id" :value="instance.id">
          {{ instance.label }}
        </option>
      </select>
    </div>

    <div class="ext:flex ext:flex-col ext:gap-1">
      <label for="account-imap-user" class="ext:text-sm ext:font-medium">{{
        $gettext('IMAP Username')
      }}</label>
      <input
        id="account-imap-user"
        v-model="form.imapUser"
        type="text"
        required
        class="ext:border ext:rounded ext:px-3 ext:py-2 ext:text-sm"
        :placeholder="$gettext('user@example.com')"
      />
    </div>

    <div class="ext:flex ext:flex-col ext:gap-1">
      <label for="account-imap-pass" class="ext:text-sm ext:font-medium">{{
        $gettext('IMAP Password')
      }}</label>
      <input
        id="account-imap-pass"
        v-model="form.imapPass"
        type="password"
        :required="!isEdit"
        class="ext:border ext:rounded ext:px-3 ext:py-2 ext:text-sm"
        :placeholder="isEdit ? $gettext('Leave empty to keep current') : ''"
      />
    </div>

    <div class="ext:flex ext:gap-2 ext:justify-end">
      <button
        type="button"
        class="ext:px-4 ext:py-2 ext:text-sm ext:rounded ext:border"
        @click="$emit('cancel')"
      >
        {{ $gettext('Cancel') }}
      </button>
      <button
        type="submit"
        class="ext:px-4 ext:py-2 ext:text-sm ext:rounded ext:bg-blue-600 ext:text-white"
      >
        {{ isEdit ? $gettext('Save') : $gettext('Add Account') }}
      </button>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent, reactive, type PropType } from 'vue'
import { useGettext } from 'vue3-gettext'
import type { RoundcubeInstance, MailAccount } from '../types'

export default defineComponent({
  name: 'MailAccountForm',
  props: {
    instances: { type: Array as PropType<RoundcubeInstance[]>, required: true },
    account: { type: Object as PropType<MailAccount>, default: null }
  },
  emits: ['submit', 'cancel'],
  setup(props, { emit }) {
    const { $gettext } = useGettext()
    const isEdit = !!props.account

    const form = reactive({
      label: props.account?.label ?? '',
      roundcubeInstanceId: props.account?.roundcubeInstanceId ?? '',
      imapUser: props.account?.imapUser ?? '',
      imapPass: ''
    })

    function onSubmit() {
      emit('submit', { ...form })
    }

    return { $gettext, form, isEdit, onSubmit }
  }
})
</script>
