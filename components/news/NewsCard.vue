<script setup lang="ts">
import type { Article } from '~/types'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  article: Article
}

const props = defineProps<Props>()

const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgZmlsbD0iIzFlMjkzYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ3NDhiIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'

const imageUrl = computed<string>(() => props.article.image_url || fallbackImage)

const isMounted = ref<boolean>(false)

onMounted(() => {
  isMounted.value = true
})

const relativeTime = computed<string>(() => {
  if (!isMounted.value) return ''
  try {
    return formatDistanceToNow(new Date(props.article.published_at), {
      addSuffix: true,
    })
  } catch {
    return 'recently'
  }
})

const imageError = ref<boolean>(false)

function handleImageError(): void {
  imageError.value = true
}
</script>

<template>
  <NuxtLink
    :to="`/article/${article.id}`"
    :id="`news-card-${article.id}`"
    class="group glass-card overflow-hidden hover-lift cursor-pointer flex flex-col"
  >
    <!-- Image -->
    <div class="relative aspect-video overflow-hidden bg-surface-200 dark:bg-surface-800">
      <img
        :src="imageError ? fallbackImage : imageUrl"
        :alt="article.title"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        @error="handleImageError"
      />

      <!-- Category badge overlay -->
      <div class="absolute top-3 left-3">
        <UiBadge variant="category" :category="article.category" size="sm">
          {{ article.category }}
        </UiBadge>
      </div>

      <!-- API source badge overlay -->
      <div class="absolute bottom-3 right-3">
        <UiBadge variant="api" :api-source="article.source_api" size="sm">
          {{ article.source_api }}
        </UiBadge>
      </div>

      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>

    <!-- Content -->
    <div class="p-4 flex-1 flex flex-col">
      <!-- Title -->
      <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100 line-clamp-2 leading-snug group-hover:text-accent-500 transition-colors duration-200">
        {{ article.title }}
      </h3>

      <!-- Description -->
      <p
        v-if="article.description"
        class="mt-2 text-xs text-surface-500 dark:text-surface-400 line-clamp-2 leading-relaxed"
      >
        {{ article.description }}
      </p>

      <!-- Meta -->
      <div class="mt-auto pt-3 flex items-center justify-between">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-5 h-5 rounded-full bg-accent-500/10 flex items-center justify-center flex-shrink-0">
            <span class="text-[10px] font-bold text-accent-500">
              {{ article.source_name.charAt(0).toUpperCase() }}
            </span>
          </div>
          <span class="text-[11px] font-medium text-surface-600 dark:text-surface-400 truncate">
            {{ article.source_name }}
          </span>
        </div>
        <span class="text-[11px] text-surface-400 dark:text-surface-500 whitespace-nowrap ml-2">
          {{ relativeTime }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
