<script setup>
import { snackbar } from '@/composables/useSnackbar'
</script>

<template>
  <VSnackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    timeout="3000"
    location="top right"
    transition="slide-y-transition"
    :style="{ zIndex: 1000 }"
  >
    <VRow no-gutters>
      <VCol cols="auto">
        <VIcon
          class="mr-2"
          size="24"
          color="white"
        >
          ri-information-line
        </VIcon>
      </VCol>
      <VCol>
        <h4 class="text-white">
          {{ snackbar.message }}
        </h4>
      </VCol>
    </VRow>
  </VSnackbar>
</template>