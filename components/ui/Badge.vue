<script setup lang="ts">
import type { ApiSourceName, CategorySlug } from '~/types'

interface Props {
  /** Visual variant of the badge */
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'category' | 'api'
  /** Category slug — used when variant is 'category' */
  category?: CategorySlug
  /** API source name — used when variant is 'api' */
  apiSource?: ApiSourceName
  /** Optional size modifier */
  size?: 'sm' | 'md'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'sm',
  category: undefined,
  apiSource: undefined,
})

const categoryColors: Record<CategorySlug, string> = {
  general: 'bg-slate-500/15 text-slate-400 ring-slate-500/20',
  technology: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/20',
  sports: 'bg-green-500/15 text-green-400 ring-green-500/20',
  business: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  health: 'bg-rose-500/15 text-rose-400 ring-rose-500/20',
  entertainment: 'bg-pink-500/15 text-pink-400 ring-pink-500/20',
  science: 'bg-violet-500/15 text-violet-400 ring-violet-500/20',
}

const apiColors: Record<ApiSourceName, string> = {
  WorldNewsAPI: 'badge-api-worldnews',
  NewsDataIO: 'badge-api-newsdata',
  NewsAPIOrg: 'badge-api-newsapiorg',
  TheNewsAPI: 'badge-api-thenewsapi',
}

const variantClasses: Record<string, string> = {
  default: 'bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/20',
  secondary: 'bg-surface-500/15 text-surface-300 ring-1 ring-surface-500/20',
  outline: 'border border-surface-300 dark:border-surface-600 text-surface-500 dark:text-surface-400',
  destructive: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20',
}

const computedClass = computed<string>(() => {
  const sizeClass = props.size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'

  if (props.variant === 'category' && props.category) {
    return `${sizeClass} ${categoryColors[props.category] ?? categoryColors.general} ring-1`
  }

  if (props.variant === 'api' && props.apiSource) {
    return `${sizeClass} ${apiColors[props.apiSource] ?? ''}`
  }

  return `${sizeClass} ${variantClasses[props.variant] ?? variantClasses.default}`
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full font-semibold tracking-wide uppercase whitespace-nowrap transition-colors"
    :class="computedClass"
  >
    <slot />
  </span>
</template>
