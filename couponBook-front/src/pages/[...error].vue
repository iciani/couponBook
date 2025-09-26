<script setup>
import { useTheme } from 'vuetify'
// Logo dinámico según el tema
const qurableLogo = computed(() => {
  return `/logo.png`
})
import miscMaskDark from '@images/pages/misc-mask-dark.png'
import miscMaskLight from '@images/pages/misc-mask-light.png'
import tree from '@images/pages/tree.png'
import { useRoute } from 'vue-router'

const route = useRoute()
const vuetifyTheme = useTheme()

const authThemeMask = computed(() => {
  return vuetifyTheme.global.name.value === 'light' ? miscMaskLight : miscMaskDark
})

const errorCode = computed(() => route.query.code || '404')
const errorData = computed(() => errorDetails[errorCode.value] || errorDetails['404'])

const errorDetails = {
  '404': {
    title: 'Page Not Found ⚠️',
    description: "No pudimos encontrar la página que estabas buscando.",
    image: qurableLogo,
  },
  '403': {
    title: 'Permiso Denegado 🚫',
    description: 'No tiene permisos para acceder a esta página.',
    image: qurableLogo,
  },
  '500': {
    title: 'Internal Server Error 💥',
    description: 'Hubo un error en el servidor. Por favor volver a intentar.',
    image: qurableLogo,
  }
}
</script>

<template>
  <div class="misc-wrapper">
    <ErrorHeader
      :status-code="errorCode"
      :title="errorData.title"
      :description="errorData.description"
    />

    <!-- 👉 Image -->
    <div class="misc-avatar w-100 text-center">
      <VImg
        :src="qurableLogo"
        alt="Coming Soon"
        :max-width="300"
        class="mx-auto"
      />
      <VBtn
        to="/"
        class="mt-10"
      >
        Back to Home
      </VBtn>
    </div>

    <!-- 👉 Footer -->
    <VImg
      :src="authThemeMask"
      class="misc-footer-img d-none d-md-block"
    />
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/misc.scss";

.misc-footer-tree {
  inline-size: 15.625rem;
  inset-block-end: 3.5rem;
  inset-inline-start: 0.375rem;
}
</style>
