<script setup>
import BaseDialog from './BaseDialog.vue'
import { useConfirmDeleteDialog } from '@/stores/confirmDeleteDialogStore'

const {
  isOpen,
  title,
  message,
  buttonText,
  buttonColor,
  closeConfirmDialog,
} = useConfirmDeleteDialog()
</script>

<template>
  <BaseDialog v-model="isOpen">
    <template #title>
      {{ title }}
    </template>

    <template #message>
      {{ message }}
    </template>

    <template #actions>
      <VSpacer />
      <VBtn
        color="grey"
        @click="() => closeConfirmDialog(false)"
      >
        Cancelar
      </VBtn>
      <VBtn
        :color="buttonColor"
        variant="flat"
        @click="() => closeConfirmDialog(true)"
      >
        {{ buttonText }}
      </VBtn>
    </template>
  </BaseDialog>
</template>
