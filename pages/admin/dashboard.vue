<script setup lang="ts">
import { useApiRotator } from '~/composables/useApiRotator'
import { API_CONFIGS } from '~/server/constants/apiConfig'

useHead({
  title: 'Admin Dashboard — NewsAggregator',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const {
  quotaData,
  loading,
  error,
  fetchResult,
  isFetching,
  fetchQuotaStatus,
  triggerFetch,
  formatTimeRemaining,
} = useApiRotator()

onMounted(async () => {
  await fetchQuotaStatus()
})

// Auto-refresh quota every 30 seconds
let refreshInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  refreshInterval = setInterval(() => {
    fetchQuotaStatus()
  }, 30000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

const currentApiName = computed<string>(() => {
  if (!quotaData.value) return '—'
  const idx = quotaData.value.rotation.current_index
  return API_CONFIGS[idx]?.name ?? 'Unknown'
})

function getStatusColor(percent: number): string {
  if (percent >= 80) return 'bg-red-500'
  if (percent >= 50) return 'bg-amber-500'
  return 'bg-green-500'
}

function getStatusTextColor(percent: number): string {
  if (percent >= 80) return 'text-red-400'
  if (percent >= 50) return 'text-amber-400'
  return 'text-green-400'
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'success':
      return 'bg-green-500/15 text-green-400'
    case 'failed':
      return 'bg-red-500/15 text-red-400'
    case 'skipped':
      return 'bg-amber-500/15 text-amber-400'
    case 'quota_exceeded':
      return 'bg-red-500/15 text-red-400'
    default:
      return 'bg-surface-500/15 text-surface-400'
  }
}

async function handleForceFetch(): Promise<void> {
  await triggerFetch()
}
</script>

<template>
  <div class="space-y-8">
    <!-- Page header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
          <span class="text-2xl">📊</span>
          Admin Dashboard
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Monitor API usage, quotas, and rotation status
        </p>
      </div>

      <button
        id="force-fetch-button"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-accent-500/25"
        :disabled="isFetching"
        @click="handleForceFetch"
      >
        <UiSpinner v-if="isFetching" :size="16" color="text-white" />
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        <span>{{ isFetching ? 'Fetching...' : 'Force Fetch Now' }}</span>
      </button>
    </div>

    <!-- Fetch result notification -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="fetchResult"
        class="glass-card p-4 border-l-4"
        :class="fetchResult.success ? 'border-l-green-500' : 'border-l-red-500'"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-surface-900 dark:text-surface-100">
              {{ fetchResult.success ? '✅ Fetch Successful' : '❌ Fetch Failed' }}
            </p>
            <p class="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              API: {{ fetchResult.api_used ?? 'None' }} •
              Fetched: {{ fetchResult.articles_fetched }} •
              Inserted: {{ fetchResult.articles_inserted }} •
              Skipped: {{ fetchResult.articles_skipped }}
            </p>
          </div>
          <button
            class="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            @click="fetchResult = null"
          >
            ✕
          </button>
        </div>
        <p v-if="fetchResult.error" class="text-xs text-red-400 mt-1">{{ fetchResult.error }}</p>
      </div>
    </Transition>

    <!-- Loading state -->
    <div v-if="loading && !quotaData" class="space-y-4">
      <div class="h-40 skeleton-pulse rounded-2xl" />
      <div class="h-64 skeleton-pulse rounded-2xl" />
    </div>

    <!-- Error state -->
    <div v-else-if="error && !quotaData" class="text-center py-12">
      <p class="text-red-400">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600"
        @click="fetchQuotaStatus"
      >
        Retry
      </button>
    </div>

    <!-- Dashboard content -->
    <template v-if="quotaData">
      <!-- Stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Current API card -->
        <div class="glass-card p-5">
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
            Next API
          </p>
          <p class="mt-2 text-xl font-bold text-accent-500">{{ currentApiName }}</p>
          <p class="text-xs text-surface-400 mt-1">Active in rotation</p>
        </div>

        <!-- Next refresh card -->
        <div class="glass-card p-5">
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
            Next Refresh
          </p>
          <p class="mt-2 text-xl font-bold text-surface-900 dark:text-surface-100">
            {{ formatTimeRemaining(quotaData.nextRefreshIn) }}
          </p>
          <p class="text-xs text-surface-400 mt-1">Auto-fetch interval</p>
        </div>

        <!-- Total articles today -->
        <div class="glass-card p-5">
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
            API Calls Today
          </p>
          <p class="mt-2 text-xl font-bold text-surface-900 dark:text-surface-100">
            {{ quotaData.quotas.reduce((acc, q) => acc + q.used_today, 0) }}
          </p>
          <p class="text-xs text-surface-400 mt-1">
            of {{ quotaData.quotas.reduce((acc, q) => acc + q.daily_limit, 0) }} total limit
          </p>
        </div>

        <!-- Recent logs count -->
        <div class="glass-card p-5">
          <p class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
            Recent Logs
          </p>
          <p class="mt-2 text-xl font-bold text-surface-900 dark:text-surface-100">
            {{ quotaData.logs.length }}
          </p>
          <p class="text-xs text-surface-400 mt-1">Entries in log</p>
        </div>
      </div>

      <!-- Quota table -->
      <div class="glass-card overflow-hidden">
        <div class="p-5 border-b border-surface-200/50 dark:border-surface-800/50">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
            API Quota Status
          </h2>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                <th class="px-5 py-3">API Name</th>
                <th class="px-5 py-3">Daily Limit</th>
                <th class="px-5 py-3">Used Today</th>
                <th class="px-5 py-3">Remaining</th>
                <th class="px-5 py-3 min-w-[200px]">Usage</th>
                <th class="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-200/50 dark:divide-surface-800/50">
              <tr
                v-for="quota in quotaData.quotas"
                :key="quota.api_name"
                class="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
              >
                <td class="px-5 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" :class="getStatusColor(quota.usage_percent)" />
                    <span class="text-sm font-medium text-surface-900 dark:text-surface-100">
                      {{ quota.api_name }}
                    </span>
                    <span
                      v-if="currentApiName === quota.api_name"
                      class="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-500/15 text-accent-400 font-semibold"
                    >
                      NEXT
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4 text-sm text-surface-600 dark:text-surface-400">
                  {{ quota.daily_limit.toLocaleString() }}
                </td>
                <td class="px-5 py-4 text-sm font-medium" :class="getStatusTextColor(quota.usage_percent)">
                  {{ quota.used_today }}
                </td>
                <td class="px-5 py-4 text-sm text-surface-600 dark:text-surface-400">
                  {{ (quota.daily_limit - quota.used_today).toLocaleString() }}
                </td>
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex-1 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-700 ease-out"
                        :class="getStatusColor(quota.usage_percent)"
                        :style="{ width: `${Math.min(quota.usage_percent, 100)}%` }"
                      />
                    </div>
                    <span class="text-xs font-mono w-10 text-right" :class="getStatusTextColor(quota.usage_percent)">
                      {{ Math.round(quota.usage_percent) }}%
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold uppercase"
                    :class="{
                      'bg-green-500/15 text-green-400': quota.status === 'healthy',
                      'bg-amber-500/15 text-amber-400': quota.status === 'warning',
                      'bg-red-500/15 text-red-400': quota.status === 'critical',
                    }"
                  >
                    {{ quota.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent API call logs -->
      <div class="glass-card overflow-hidden">
        <div class="p-5 border-b border-surface-200/50 dark:border-surface-800/50">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
            Recent API Call Logs
          </h2>
        </div>

        <div v-if="quotaData.logs.length === 0" class="p-8 text-center text-sm text-surface-500">
          No logs yet. Trigger a fetch to see activity.
        </div>

        <div v-else class="overflow-x-auto max-h-96 overflow-y-auto">
          <table class="w-full">
            <thead class="sticky top-0 bg-surface-50 dark:bg-surface-900">
              <tr class="text-left text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">
                <th class="px-5 py-3">Time</th>
                <th class="px-5 py-3">API</th>
                <th class="px-5 py-3">Status</th>
                <th class="px-5 py-3">Articles</th>
                <th class="px-5 py-3">Error</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-200/50 dark:divide-surface-800/50">
              <tr
                v-for="log in quotaData.logs"
                :key="log.id"
                class="hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors"
              >
                <td class="px-5 py-3 text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">
                  {{ log.called_at }}
                </td>
                <td class="px-5 py-3 text-sm font-medium text-surface-900 dark:text-surface-100">
                  {{ log.api_name }}
                </td>
                <td class="px-5 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                    :class="getStatusBadge(log.status)"
                  >
                    {{ log.status }}
                  </span>
                </td>
                <td class="px-5 py-3 text-sm text-surface-600 dark:text-surface-400">
                  {{ log.articles_fetched }}
                </td>
                <td class="px-5 py-3 text-xs text-red-400 max-w-xs truncate">
                  {{ log.error_message ?? '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
