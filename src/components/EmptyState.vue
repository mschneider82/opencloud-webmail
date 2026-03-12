<template>
  <div class="ext:flex ext:flex-col ext:items-center ext:justify-center ext:h-full ext:gap-4">
    <p class="ext:text-lg ext:text-gray-500">
      {{ $gettext('No mail accounts configured.') }}
    </p>
    <p class="ext:text-sm ext:text-gray-400">
      {{
        $gettext(
          'Add a mail account in your account settings to get started.'
        )
      }}
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useGettext } from 'vue3-gettext'

export default defineComponent({
  name: 'EmptyState',
  setup() {
    const { $gettext } = useGettext()
    return { $gettext }
  }
})
</script>
