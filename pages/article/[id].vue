<script setup lang="ts">
import type { Article } from '~/types'
import { formatDistanceToNow, format } from 'date-fns'

const route = useRoute()
const articleId = route.params.id as string

const config = useRuntimeConfig()

// Fetch article directly — useFetch properly handles SSR payload
const { data: articleResponse, status } = await useFetch<{
  success: boolean
  data: { article: Article; related: Article[] }
}>(`/api/news/${articleId}`, {
  key: `article-${articleId}`,
})

const currentArticle = computed<Article | null>(() => articleResponse.value?.data?.article ?? null)
const relatedArticles = computed<Article[]>(() => articleResponse.value?.data?.related ?? [])
const loading = computed<boolean>(() => status.value === 'pending')
const error = computed<string | null>(() => {
  if (status.value === 'error') return 'Failed to fetch article'
  if (status.value === 'success' && !currentArticle.value) return 'Article not found'
  return null
})

// Dynamic SEO
useHead({
  title: () => currentArticle.value?.title
    ? `${currentArticle.value.title} — ${config.public.appName}`
    : `Article — ${config.public.appName}`,
})

useSeoMeta({
  title: () => currentArticle.value?.title ?? 'Article',
  ogTitle: () => currentArticle.value?.title ?? 'Article',
  description: () => currentArticle.value?.description ?? '',
  ogDescription: () => currentArticle.value?.description ?? '',
  ogImage: () => currentArticle.value?.image_url ?? '',
  ogType: 'article',
  twitterCard: 'summary_large_image',
  twitterTitle: () => currentArticle.value?.title ?? '',
  twitterDescription: () => currentArticle.value?.description ?? '',
  twitterImage: () => currentArticle.value?.image_url ?? '',
})

// Client-only relative time to avoid hydration mismatch
const isMounted = ref<boolean>(false)

onMounted(() => {
  isMounted.value = true
})

const relativeTime = computed<string>(() => {
  if (!isMounted.value || !currentArticle.value?.published_at) return ''
  try {
    return formatDistanceToNow(new Date(currentArticle.value.published_at), { addSuffix: true })
  } catch {
    return 'recently'
  }
})

const formattedDate = computed<string>(() => {
  if (!currentArticle.value?.published_at) return ''
  try {
    return format(new Date(currentArticle.value.published_at), 'MMMM d, yyyy • HH:mm')
  } catch {
    return ''
  }
})

const fallbackImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEyMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMGYxNzJhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0Ij5OZXdzQWdncmVnYXRvcjwvdGV4dD48L3N2Zz4='

const imageError = ref<boolean>(false)
const copySuccess = ref<boolean>(false)

function handleImageError(): void {
  imageError.value = true
}

function shareOnTwitter(): void {
  if (!currentArticle.value) return
  const text = encodeURIComponent(currentArticle.value.title)
  const url = encodeURIComponent(`${config.public.siteUrl}/article/${currentArticle.value.id}`)
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
}

function shareOnWhatsApp(): void {
  if (!currentArticle.value) return
  const text = encodeURIComponent(
    `${currentArticle.value.title}\n${config.public.siteUrl}/article/${currentArticle.value.id}`
  )
  window.open(`https://wa.me/?text=${text}`, '_blank')
}

async function copyLink(): Promise<void> {
  if (!currentArticle.value) return
  try {
    await navigator.clipboard.writeText(`${config.public.siteUrl}/article/${currentArticle.value.id}`)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch {
    console.error('Failed to copy link')
  }
}
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="space-y-6 animate-pulse">
      <div class="aspect-[21/9] skeleton-pulse rounded-2xl" />
      <div class="max-w-3xl mx-auto space-y-4">
        <div class="h-8 skeleton-pulse rounded-lg w-3/4" />
        <div class="h-4 skeleton-pulse rounded-lg w-1/2" />
        <div class="space-y-2 mt-8">
          <div class="h-4 skeleton-pulse rounded-lg w-full" v-for="n in 6" :key="n" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-16">
      <div class="text-5xl mb-4">😔</div>
      <h2 class="text-xl font-semibold text-surface-700 dark:text-surface-300">Article Not Found</h2>
      <p class="text-sm text-surface-500 mt-2">{{ error }}</p>
      <NuxtLink to="/" class="inline-block mt-4 px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors">
        ← Back to Home
      </NuxtLink>
    </div>

    <!-- Article content -->
    <article v-else-if="currentArticle" class="animate-fade-in">
      <!-- Hero image -->
      <div class="relative rounded-2xl overflow-hidden mb-8">
        <div class="aspect-[21/9]">
          <img
            :src="imageError ? fallbackImage : (currentArticle.image_url ?? fallbackImage)"
            :alt="currentArticle.title"
            class="w-full h-full object-cover"
            @error="handleImageError"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2">
          <!-- Badges -->
          <div class="flex items-center gap-2 mb-4">
            <UiBadge variant="category" :category="currentArticle.category" size="md">
              {{ currentArticle.category }}
            </UiBadge>
            <UiBadge variant="api" :api-source="currentArticle.source_api" size="md">
              {{ currentArticle.source_api }}
            </UiBadge>
          </div>

          <!-- Title -->
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-surface-900 dark:text-surface-100 leading-tight text-balance">
            {{ currentArticle.title }}
          </h1>

          <!-- Meta info -->
          <div class="flex flex-wrap items-center gap-4 mt-4 text-sm text-surface-500 dark:text-surface-400">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-accent-500/10 flex items-center justify-center">
                <span class="text-xs font-bold text-accent-500">
                  {{ currentArticle.source_name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <span class="font-medium">{{ currentArticle.source_name }}</span>
            </div>
            <span v-if="currentArticle.author" class="text-surface-400 dark:text-surface-500">
              by {{ currentArticle.author }}
            </span>
            <span class="text-surface-300 dark:text-surface-700">•</span>
            <time :datetime="currentArticle.published_at" :title="formattedDate">
              {{ relativeTime || formattedDate }}
            </time>
          </div>

          <!-- Share buttons -->
          <div class="flex items-center gap-2 mt-6 pb-6 border-b border-surface-200/50 dark:border-surface-800/50">
            <span class="text-xs font-medium text-surface-500 dark:text-surface-400 mr-1">Share:</span>

            <button
              id="share-twitter"
              class="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-blue-500/10 hover:text-blue-500 transition-all"
              @click="shareOnTwitter"
              aria-label="Share on Twitter/X"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>

            <button
              id="share-whatsapp"
              class="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-green-500/10 hover:text-green-500 transition-all"
              @click="shareOnWhatsApp"
              aria-label="Share on WhatsApp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>

            <button
              id="share-copy-link"
              class="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-accent-500/10 hover:text-accent-500 transition-all"
              @click="copyLink"
              aria-label="Copy link"
            >
              <svg v-if="!copySuccess" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>

            <span v-if="copySuccess" class="text-xs text-green-500 animate-fade-in">Copied!</span>
          </div>

          <!-- Article body -->
          <div class="mt-6 space-y-4">
            <p v-if="currentArticle.description" class="text-lg text-surface-700 dark:text-surface-300 leading-relaxed font-medium">
              {{ currentArticle.description }}
            </p>
            <div v-if="currentArticle.content" class="text-base text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-line">
              {{ currentArticle.content }}
            </div>
          </div>

          <!-- Read original button -->
          <div class="mt-8 pt-6 border-t border-surface-200/50 dark:border-surface-800/50">
            <a
              :href="currentArticle.url"
              target="_blank"
              rel="noopener noreferrer"
              id="read-original-link"
              class="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-accent-500/25 hover:shadow-accent-500/40"
            >
              <span>Read Original Article</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Sidebar: Related Articles -->
        <aside class="lg:col-span-1">
          <div class="sticky top-24">
            <h3 class="text-lg font-bold text-surface-900 dark:text-surface-100 mb-4 flex items-center gap-2">
              <span>📰</span> Related Articles
            </h3>

            <div v-if="relatedArticles.length > 0" class="space-y-3">
              <NuxtLink
                v-for="related in relatedArticles"
                :key="related.id"
                :to="`/article/${related.id}`"
                class="group block p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-all duration-200"
              >
                <div class="flex gap-3">
                  <img
                    v-if="related.image_url"
                    :src="related.image_url"
                    :alt="related.title"
                    class="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  <div class="min-w-0 flex-1">
                    <h4 class="text-sm font-medium text-surface-800 dark:text-surface-200 line-clamp-2 group-hover:text-accent-500 transition-colors">
                      {{ related.title }}
                    </h4>
                    <span class="text-[11px] text-surface-400 mt-1 block">
                      {{ related.source_name }}
                    </span>
                  </div>
                </div>
              </NuxtLink>
            </div>

            <p v-else class="text-sm text-surface-500 dark:text-surface-400">
              No related articles found.
            </p>
          </div>
        </aside>
      </div>
    </article>
  </div>
</template>
