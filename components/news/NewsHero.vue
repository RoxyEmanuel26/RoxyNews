<script setup lang="ts">
import type { Article } from '~/types'
import { formatDistanceToNow } from 'date-fns'

const { proxyImageUrl } = useImageProxy()

interface Props {
  article: Article | null
}

const props = defineProps<Props>()

const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMGYxNzJhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0Ij5OZXdzQWdncmVnYXRvcjwvdGV4dD48L3N2Zz4='

const imageError = ref<boolean>(false)

const imageUrl = computed<string>(() => {
  if (imageError.value || !props.article?.image_url) return fallbackImage
  return proxyImageUrl(props.article.image_url) || fallbackImage
})

const isMounted = ref<boolean>(false)

onMounted(() => {
  isMounted.value = true
})

const relativeTime = computed<string>(() => {
  if (!isMounted.value || !props.article?.published_at) return ''
  try {
    return formatDistanceToNow(new Date(props.article.published_at), {
      addSuffix: true,
    })
  } catch {
    return 'recently'
  }
})

function handleImageError(): void {
  imageError.value = true
}
</script>

<template>
  <!-- Skeleton hero -->
  <div
    v-if="!article"
    class="relative rounded-2xl overflow-hidden animate-pulse"
  >
    <div class="aspect-[21/9] skeleton-pulse" />
  </div>

  <!-- Hero article -->
  <NuxtLink
    v-else
    :to="`/article/${article.id}`"
    :id="`hero-article-${article.id}`"
    class="group relative block rounded-2xl overflow-hidden hover-lift"
  >
    <!-- Background image -->
    <div class="aspect-[21/9] relative">
      <img
        :src="imageUrl"
        :alt="article.title"
        class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        loading="eager"
        @error="handleImageError"
      />

      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div class="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      <!-- Content overlay -->
      <div class="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
        <!-- Badges -->
        <div class="flex items-center gap-2 mb-3">
          <UiBadge variant="category" :category="article.category" size="md">
            {{ article.category }}
          </UiBadge>
          <UiBadge variant="api" :api-source="article.source_api" size="md">
            {{ article.source_api }}
          </UiBadge>
        </div>

        <!-- Title -->
        <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight line-clamp-2 text-balance group-hover:text-accent-200 transition-colors duration-300">
          {{ article.title }}
        </h2>

        <!-- Description -->
        <p
          v-if="article.description"
          class="mt-2 text-sm sm:text-base text-white/70 line-clamp-2 max-w-2xl"
        >
          {{ article.description }}
        </p>

        <!-- Meta -->
        <div class="mt-4 flex items-center gap-4 text-sm text-white/60">
          <div class="flex items-center gap-1.5">
            <div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <span class="text-[10px] font-bold text-white">
                {{ article.source_name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <span>{{ article.source_name }}</span>
          </div>
          <span class="text-white/30">•</span>
          <span>{{ relativeTime }}</span>
          <span class="hidden sm:inline text-white/30">•</span>
          <span class="hidden sm:inline">Read More →</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
