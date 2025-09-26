<script setup>
import { useAuthStore } from '@/stores/auth'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

    // Use logo
    const logoQurable = `/logo.png`
import authV1MaskDark from '@images/pages/auth-v1-mask-dark.png'
import authV1MaskLight from '@images/pages/auth-v1-mask-light.png'

import AuthResource from '@api/resources/auth.resource.js'

const router = useRouter()
const auth = useAuthStore()

const form = ref({
  email: '',
  password: '',
})

const vuetifyTheme = useTheme()
const isPasswordVisible = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const authThemeMask = computed(() => {
  return vuetifyTheme.global.name.value === 'light' ? authV1MaskLight : authV1MaskDark
})

const handleLogin = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  errorMessage.value = ''

  try {
    const payload = {
      email: form.value.email,
      password: form.value.password,
    }

    const response = await AuthResource.login(payload)

    if (response.data?.token) {
      auth.setToken(response.data.token)
      router.push({ name: 'dashboard' })
    } else {
      errorMessage.value = response.data?.message || 'Login fallido. Verifique sus credenciales.'
    }
  } catch (error) {
    
    if (error.response?.status === 401) {
      errorMessage.value = 'Credenciales inválidas. Verifique su email y contraseña.'
    } else {
      errorMessage.value = 'Error inesperado. Intente nuevamente.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <VCard
      class="auth-card pa-4 pt-7"
      width="400"
    >
      <VCardItem class="justify-center">
        <VImg
          :src="logoQurable"
          width="150"
          height="150"
        />
      </VCardItem>

      <VCardText>
        <VForm @submit.prevent="handleLogin">
          <VRow>
            <VCol cols="12">
              <VTextField
                v-model="form.email"
                label="Email"
                type="email"
                required
              />
            </VCol>

            <VCol cols="12">
              <VTextField
                v-model="form.password"
                label="Password"
                placeholder="············"
                :type="isPasswordVisible ? 'text' : 'password'"
                autocomplete="password"
                :append-inner-icon="isPasswordVisible ? 'ri-eye-off-line' : 'ri-eye-line'"
                required
                @click:append-inner="isPasswordVisible = !isPasswordVisible"
              />

              <VAlert
                v-if="errorMessage"
                type="error"
                class="my-1"
                dense
              >
                {{ errorMessage }}
              </VAlert>
            </VCol>

            <VCol>
              <VBtn
                block
                type="submit"
                :loading="isLoading"
                :disabled="isLoading"
                color="primary"
                size="large"
              >
                <VIcon
                  v-if="isLoading"
                  class="me-2"
                >
                  ri-loader-4-line
                </VIcon>
                {{ isLoading ? 'Iniciando sesión...' : 'Login' }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>

    <VImg
      class="auth-footer-mask d-none d-md-block"
      :src="authThemeMask"
    />
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
