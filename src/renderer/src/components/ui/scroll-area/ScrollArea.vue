<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaViewport, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaCorner } from 'radix-vue'
defineProps<{ class?: string }>()
</script>

<template>
  <ScrollAreaRoot :class="['relative overflow-hidden', $props.class]">
    <ScrollAreaViewport class="h-full w-full rounded-[inherit]">
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar orientation="vertical" class="flex touch-none select-none transition-colors w-1.5 border-l border-l-transparent p-px">
      <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar orientation="horizontal" class="flex touch-none select-none transition-colors h-1.5 border-t border-t-transparent p-px">
      <ScrollAreaThumb class="relative rounded-full bg-border" />
    </ScrollAreaScrollbar>
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
