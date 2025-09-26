<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle>
          <div class="d-flex align-center">
            <VIcon class="mr-2">ri-shield-check-line</VIcon>
            Validar Canje de Cupón
          </div>
        </VCardTitle>

        <VCardText>
          <VForm ref="validateForm" @submit.prevent="validateCoupon">
            <VRow>
              <VCol cols="12" md="8">
                <VTextField
                  v-model="couponCode"
                  label="Código del Cupón"
                  placeholder="Ingresa el código del cupón a validar"
                  :rules="[v => !!v || 'El código es requerido']"
                  prepend-inner-icon="ri-coupon-line"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VBtn
                  type="submit"
                  color="primary"
                  size="large"
                  :loading="loading"
                  block
                >
                  <VIcon class="mr-2">ri-search-line</VIcon>
                  Validar
                </VBtn>
              </VCol>
            </VRow>
          </VForm>

          <!-- Resultado de la validación -->
          <div v-if="validationResult" class="mt-6">
            <VDivider class="mb-4" />
            
            <VAlert
              :type="validationResult.isValid ? 'success' : 'error'"
              :icon="validationResult.isValid ? 'ri-check-line' : 'ri-close-line'"
              class="mb-4"
            >
              <VAlertTitle>
                {{ validationResult.isValid ? 'Cupón Válido' : 'Cupón Inválido' }}
              </VAlertTitle>
              {{ validationResult.message }}
            </VAlert>

            <VCard v-if="validationResult.isValid && validationResult.coupon" variant="outlined">
              <VCardTitle class="text-h6">
                <VIcon class="mr-2">ri-information-line</VIcon>
                Información del Cupón
              </VCardTitle>
              
              <VCardText>
                <VRow>
                  <VCol cols="12" md="6">
                    <div class="mb-3">
                      <strong>Código:</strong>
                      <br>
                      <code class="text-primary">{{ validationResult.coupon.code }}</code>
                    </div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div class="mb-3">
                      <strong>Estado:</strong>
                      <br>
                      <VChip
                        :color="getStatusColor(validationResult.coupon.status)"
                        size="small"
                      >
                        {{ getStatusText(validationResult.coupon.status) }}
                      </VChip>
                    </div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div class="mb-3">
                      <strong>Book:</strong>
                      <br>
                      {{ validationResult.coupon.book?.name || 'N/A' }}
                    </div>
                  </VCol>
                  <VCol cols="12" md="6">
                    <div class="mb-3">
                      <strong>Usuario Asignado:</strong>
                      <br>
                      {{ validationResult.coupon.user?.name || 'No asignado' }}
                    </div>
                  </VCol>
                  <VCol v-if="validationResult.coupon.assigned_at" cols="12" md="6">
                    <div class="mb-3">
                      <strong>Fecha de Asignación:</strong>
                      <br>
                      {{ formatDate(validationResult.coupon.assigned_at) }}
                    </div>
                  </VCol>
                  <VCol v-if="validationResult.coupon.used_at" cols="12" md="6">
                    <div class="mb-3">
                      <strong>Fecha de Uso:</strong>
                      <br>
                      {{ formatDate(validationResult.coupon.used_at) }}
                    </div>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>

            <div class="mt-4">
              <VBtn
                color="secondary"
                variant="outlined"
                @click="clearValidation"
              >
                <VIcon class="mr-2">ri-refresh-line</VIcon>
                Validar Otro Cupón
              </VBtn>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup>
import { ref } from 'vue'
import CouponCodesResource from '@api/resources/couponCodes.resource.js'

// Variables reactivas
const loading = ref(false)
const couponCode = ref('')
const validationResult = ref(null)
const validateForm = ref(null)

// Funciones
const validateCoupon = async () => {
  if (!validateForm.value) return
  
  const { valid } = await validateForm.value.validate()
  if (!valid) return

  try {
    loading.value = true
    validationResult.value = null

    // Buscar el cupón por código
    const response = await CouponCodesResource.list({
      search: couponCode.value,
      limit: 1
    })

    const coupon = response.data.data[0]

    if (!coupon) {
      validationResult.value = {
        isValid: false,
        message: 'Cupón no encontrado'
      }
      return
    }

    // Validar el estado del cupón
    if (coupon.status === 'AVAILABLE') {
      validationResult.value = {
        isValid: false,
        message: 'El cupón está disponible pero no ha sido asignado a ningún usuario'
      }
    } else if (coupon.status === 'ASSIGNED') {
      validationResult.value = {
        isValid: true,
        message: 'El cupón está asignado y listo para ser canjeado',
        coupon: coupon
      }
    } else if (coupon.status === 'USED') {
      validationResult.value = {
        isValid: false,
        message: 'El cupón ya ha sido utilizado',
        coupon: coupon
      }
    } else {
      validationResult.value = {
        isValid: false,
        message: `El cupón tiene un estado inválido: ${coupon.status}`,
        coupon: coupon
      }
    }

  } catch (error) {
    console.error('Error validando cupón:', error)
    validationResult.value = {
      isValid: false,
      message: 'Error al validar el cupón'
    }
  } finally {
    loading.value = false
  }
}

const clearValidation = () => {
  couponCode.value = ''
  validationResult.value = null
  if (validateForm.value) {
    validateForm.value.reset()
  }
}

const getStatusColor = (status) => {
  const colors = {
    'AVAILABLE': 'success',
    'ASSIGNED': 'info',
    'USED': 'warning'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    'AVAILABLE': 'Disponible',
    'ASSIGNED': 'Asignado',
    'USED': 'Usado'
  }
  return texts[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
