<script setup lang="ts">
import {
  SelectRoot, SelectTrigger, SelectValue, SelectPortal,
  SelectContent, SelectViewport, SelectItem, SelectItemText,
  SelectScrollUpButton, SelectScrollDownButton
} from 'radix-vue'

defineProps<{
  modelValue?: string
  placeholder?: string
  options: Array<{ value: string; label: string }>
  disabled?: boolean
  class?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <SelectRoot :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <SelectTrigger :disabled="disabled" :class="[
      'flex h-7 w-full items-center justify-between rounded-md border border-border bg-input px-2 py-1 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      $props.class
    ]">
      <SelectValue :placeholder="placeholder ?? 'Select...'" />
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
        <SelectScrollUpButton class="flex items-center justify-center h-6 bg-popover cursor-default">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
        </SelectScrollUpButton>
        <SelectViewport class="p-1">
          <SelectItem
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
            class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1 text-xs outline-none hover:bg-accent hover:text-accent-foreground data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary"
          >
            <SelectItemText>{{ opt.label }}</SelectItemText>
          </SelectItem>
        </SelectViewport>
        <SelectScrollDownButton class="flex items-center justify-center h-6 bg-popover cursor-default">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
