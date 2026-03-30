<script setup lang="ts">
</script>

<template>
  <div class="glass-card overflow-hidden animate-pulse">
    <!-- Image skeleton -->
    <div class="aspect-video skeleton-pulse" />

    <!-- Content skeleton -->
    <div class="p-4 space-y-3">
      <!-- Title skeleton -->
      <div class="space-y-2">
        <div class="h-4 skeleton-pulse rounded-lg w-full" />
        <div class="h-4 skeleton-pulse rounded-lg w-3/4" />
      </div>

      <!-- Description skeleton -->
      <div class="space-y-1.5">
        <div class="h-3 skeleton-pulse rounded-lg w-full" />
        <div class="h-3 skeleton-pulse rounded-lg w-5/6" />
      </div>

      <!-- Meta skeleton -->
      <div class="flex items-center justify-between pt-2">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 rounded-full skeleton-pulse" />
          <div class="h-3 skeleton-pulse rounded-lg w-20" />
        </div>
        <div class="h-3 skeleton-pulse rounded-lg w-16" />
      </div>
    </div>
  </div>
</template>
