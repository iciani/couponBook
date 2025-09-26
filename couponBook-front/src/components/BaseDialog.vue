<script setup>
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, required: false },
  message: { type: String, required: false },
  maxWidth: {
    type: [String, Number],
    default: 500,
  },
})

const emit = defineEmits(['update:modelValue', 'resolve'])
</script>

<template>
  <VDialog
    :model-value="modelValue"
    :max-width="maxWidth"
    persistent
    scrollable
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <VCard>
      <VCardTitle
        v-if="$slots.title"
        class="text-h3 border-b py-4"
      >
        <slot name="title" />
      </VCardTitle>

      <VCardText
        v-if="$slots.message"
        class="py-4"
      >
        <slot name="message" />
      </VCardText>
      
      <div>
        <VCardText
          v-if="$slots.default"
          class="pt-4"
        >
          <slot />
        </VCardText>
      </div>
      <VCardActions
        v-if="$slots.actions"
        class="pa-4"
      >
        <slot name="actions" />
      </VCardActions>
    </VCard>
  </VDialog>
</template>
