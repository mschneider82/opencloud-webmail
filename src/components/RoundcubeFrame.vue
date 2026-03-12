<template>
  <iframe
    :title="title"
    :src="url"
    class="ext:size-full ext:border-0"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
    referrerpolicy="no-referrer"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'RoundcubeFrame',
  props: {
    title: { type: String, required: true },
    url: { type: String, required: true }
  }
})
</script>
