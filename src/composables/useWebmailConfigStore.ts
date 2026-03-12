import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RoundcubeInstance, WebmailConfig } from '../types'

export const useWebmailConfigStore = defineStore('webmail-config', () => {
  const instances = ref<RoundcubeInstance[]>([])

  function setConfig(config: WebmailConfig) {
    instances.value = config.instances
  }

  function getInstanceById(id: string): RoundcubeInstance | undefined {
    return instances.value.find((instance) => instance.id === id)
  }

  return { instances, setConfig, getInstanceById }
})
