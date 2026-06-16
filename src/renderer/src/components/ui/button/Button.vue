<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  disabled?: boolean
  class?: string
}>(), {
  variant: 'default',
  size: 'default'
})

const classes = computed(() =>
  cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline'
    }[props.variant],
    {
      default: 'h-7 px-3 py-1 text-xs',
      sm: 'h-6 px-2 text-xs',
      lg: 'h-9 px-4 text-sm',
      icon: 'h-7 w-7'
    }[props.size],
    props.class
  )
)
</script>

<template>
  <button :class="classes" :disabled="disabled" v-bind="$attrs">
    <slot />
  </button>
</template>
