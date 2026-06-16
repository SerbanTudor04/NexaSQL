<script setup lang="ts">
import { cn } from '@/lib/utils'
const props = withDefaults(defineProps<{
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  class?: string
}>(), { variant: 'default' })
</script>

<template>
  <span :class="cn(
    'inline-flex items-center rounded-sm px-1.5 py-0.5 text-xs font-medium',
    {
      default: 'bg-primary/15 text-primary',
      secondary: 'bg-secondary text-secondary-foreground',
      destructive: 'bg-destructive/15 text-destructive',
      outline: 'border border-border text-foreground',
      success: 'bg-emerald-500/15 text-emerald-400',
      warning: 'bg-amber-500/15 text-amber-400'
    }[props.variant],
    props.class
  )">
    <slot />
  </span>
</template>
