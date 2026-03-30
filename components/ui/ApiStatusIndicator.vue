<script setup lang="ts">
import { useApiRotator } from '~/composables/useApiRotator'
import { API_CONFIGS } from '~/server/constants/apiConfig'

const { quotaData, loading, fetchQuotaStatus, formatTimeRemaining } = useApiRotator()
const isExpanded = ref<boolean>(false)

// Fetch quota status on mount and refresh every 60 seconds
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await fetchQuotaStatus()
  refreshInterval = setInterval(() => {
    fetchQuotaStatus()
  }, 60000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

const currentApiName = computed<string>(() => {
  if (!quotaData.value) return 'Loading...'
  const idx = quotaData.value.rotation.current_index
  return API_CONFIGS[idx]?.name ?? 'Unknown'
})

const timeRemaining = computed<string>(() => {
  if (!quotaData.value) return '--'
  return formatTimeRemaining(quotaData.value.nextRefreshIn)
})

const isFetchActive = computed<boolean>(() => {
  if (!quotaData.value) return false
  return quotaData.value.nextRefreshIn <= 0
})
</script>

<template>
  <div class="fixed bottom-4 left-4 z-50">
    <button
      id="api-status-toggle"
      class="group relative"
      @click="isExpanded = !isExpanded"
    >
      <!-- Collapsed badge -->
      <div
        class="flex items-center gap-2 px-3 py-2 rounded-full glass-card text-xs font-medium transition-all duration-300"
        :class="[
          isFetchActive
            ? 'ring-2 ring-accent-500/50 shadow-lg shadow-accent-500/20'
            : 'hover:ring-1 hover:ring-surface-400/30',
        ]"
      >
        <!-- Pulse dot -->
        <span class="relative flex h-2 w-2">
          <span
            v-if="isFetchActive"
            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"
          />
          <span
            class="relative inline-flex rounded-full h-2 w-2"
            :class="isFetchActive ? 'bg-accent-500' : 'bg-green-500'"
          />
        </span>

        <span class="text-surface-600 dark:text-surface-400">
          API: <span class="font-semibold text-surface-900 dark:text-surface-100">{{ currentApiName }}</span>
          <span class="text-surface-400 dark:text-surface-500 mx-1">|</span>
          Next: <span class="font-semibold text-surface-900 dark:text-surface-100">{{ timeRemaining }}</span>
        </span>
      </div>
    </button>

    <!-- Expanded panel -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="isExpanded && quotaData"
        class="absolute bottom-full left-0 mb-2 w-72 glass-card p-4 rounded-xl"
      >
        <h4 class="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3">
          API Status
        </h4>

        <div class="space-y-2">
          <div
            v-for="quota in quotaData.quotas"
            :key="quota.api_name"
            class="flex items-center justify-between text-xs"
          >
            <span class="text-surface-600 dark:text-surface-400 truncate flex-1">
              {{ quota.api_name }}
            </span>
            <div class="flex items-center gap-2 ml-2">
              <div class="w-16 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="{
                    'bg-green-500': quota.status === 'healthy',
                    'bg-amber-500': quota.status === 'warning',
                    'bg-red-500': quota.status === 'critical',
                  }"
                  :style="{ width: `${Math.min(quota.usage_percent, 100)}%` }"
                />
              </div>
              <span
                class="w-8 text-right font-mono"
                :class="{
                  'text-green-400': quota.status === 'healthy',
                  'text-amber-400': quota.status === 'warning',
                  'text-red-400': quota.status === 'critical',
                }"
              >
                {{ Math.round(quota.usage_percent) }}%
              </span>
            </div>
          </div>
        </div>

        <NuxtLink
          to="/admin/dashboard"
          class="mt-3 block text-center text-xs text-accent-500 hover:text-accent-400 transition-colors"
          @click="isExpanded = false"
        >
          View Dashboard →
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>
