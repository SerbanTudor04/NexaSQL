<script setup lang="ts">
import { cn } from '@/lib/utils'

defineProps<{
  class?: string
  modelValue?: string | number
  placeholder?: string
  type?: string
  disabled?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <input
    :class="cn(
      'flex h-7 w-full rounded-md border border-border bg-input px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      $props.class
    )"
    :value="modelValue"
    :placeholder="placeholder"
    :type="type ?? 'text'"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    v-bind="$attrs"
  />
</template>
