<script setup lang="ts">
import { TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent, TooltipProvider } from 'radix-vue'

defineProps<{ content: string; side?: 'top' | 'bottom' | 'left' | 'right' }>()
</script>

<template>
  <TooltipProvider :delay-duration="400">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          :side="side ?? 'top'"
          class="z-50 overflow-hidden rounded-md bg-popover border border-border px-2 py-1 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          {{ content }}
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
