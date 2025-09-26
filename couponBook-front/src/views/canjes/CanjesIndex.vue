<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle>
          <span>Canjes de Cupones</span>
        </VCardTitle>

        <VCardText>
          <!-- Filtros -->
          <VRow class="mb-4">
            <VCol cols="12" md="4">
              <VTextField
                v-model="filters.search"
                label="Buscar por código"
                prepend-inner-icon="ri-search-line"
                clearable
                @input="applyFilters"
              />
            </VCol>
            <VCol cols="12" md="3">
              <VSelect
                v-model="filters.status"
                :items="statusOptions"
                label="Estado"
                clearable
                @update:model-value="applyFilters"
              />
            </VCol>
            <VCol cols="12" md="3">
              <VSelect
                v-model="filters.userId"
                :items="users"
                item-title="name"
                item-value="id"
                label="Usuario"
                clearable
                @update:model-value="applyFilters"
              />
            </VCol>
            <VCol cols="12" md="2">
              <div class="d-flex gap-2">
                <VBtn
                  color="secondary"
                  variant="outlined"
                  @click="clearFilters"
                >
                  Limpiar
                </VBtn>
                <VBtn
                  color="primary"
                  @click="openRedeemDialog"
                >
                  <VIcon class="mr-1">ri-gift-line</VIcon>
                  Canjear
                </VBtn>
              </div>
            </VCol>
          </VRow>

          <!-- Tabla de canjes -->
          <VDataTable
            :headers="headers"
            :items="redemptions"
            :loading="loading"
            :items-per-page="pagination.limit"
            :server-items-length="pagination.totalCount"
            @update:options="onTableUpdate"
            hide-default-footer
          >
            <template #item.coupon_code="{ item }">
              <code class="text-primary">{{ item.couponCode?.code }}</code>
            </template>

            <template #item.user_name="{ item }">
              {{ item.user?.name || 'N/A' }}
            </template>

            <template #item.book_name="{ item }">
              {{ item.couponCode?.book?.name || 'N/A' }}
            </template>

            <template #item.status="{ item }">
              <VChip
                :color="getStatusColor(item.status)"
                size="small"
              >
                {{ getStatusText(item.status) }}
              </VChip>
            </template>

            <template #item.redeemed_at="{ item }">
              {{ formatDate(item.redeemed_at) }}
            </template>

            <template #item.actions="{ item }">
              <VBtn
                size="small"
                variant="text"
                color="primary"
                @click="viewRedemptionDetails(item)"
              >
                <VIcon>ri-eye-line</VIcon>
              </VBtn>
            </template>
          </VDataTable>

          <!-- Paginación -->
          <div class="d-flex justify-space-between align-center mt-4">
            <div class="text-body-2 text-medium-emphasis">
              Mostrando {{ redemptions.length }} de {{ pagination.totalCount }} canjes
            </div>
            <div class="d-flex align-center gap-2">
              <VBtn
                :disabled="!pagination.hasPrevPage"
                variant="outlined"
                size="small"
                @click="goToPage(pagination.prevPage)"
              >
                Anterior
              </VBtn>
              <span class="text-body-2">
                Página {{ pagination.currentPage }} de {{ pagination.totalPages }}
              </span>
              <VBtn
                :disabled="!pagination.hasNextPage"
                variant="outlined"
                size="small"
                @click="goToPage(pagination.nextPage)"
              >
                Siguiente
              </VBtn>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Modal de Canje -->
    <VDialog v-model="redeemDialog" max-width="500">
      <VCard>
        <VCardTitle>
          <div class="d-flex justify-space-between align-center">
            <span>Canjear Cupón</span>
            <VBtn
              icon
              variant="text"
              @click="closeRedeemDialog"
            >
              <VIcon>ri-close-line</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VCardText>
          <VForm ref="redeemForm" @submit.prevent="lockCoupon">
            <VTextField
              v-model="redeemData.couponCode"
              label="Código del Cupón"
              placeholder="Ingresa el código del cupón a canjear"
              :rules="[v => !!v || 'El código es requerido']"
              class="mb-4"
              prepend-inner-icon="ri-coupon-line"
              :disabled="isLocked"
              @input="clearLock"
            />

            <!-- Estado del lock -->
            <VAlert
              v-if="isLocked && lockData"
              type="success"
              variant="tonal"
              class="mb-4"
            >
              <VAlertTitle>Cupón Bloqueado</VAlertTitle>
              <div>
                <strong>Cupón:</strong> {{ lockData.coupon.code }}<br>
                <strong>Usuario:</strong> {{ lockData.coupon.user.name }}<br>
                <strong>Book:</strong> {{ lockData.coupon.book.name }}<br>
                <strong>Expira en:</strong> {{ formatTimeRemaining(lockExpiresAt) }}
              </div>
            </VAlert>

            <VAlert
              v-else
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <VAlertTitle>Información</VAlertTitle>
              Ingresa el código del cupón para validarlo y bloquearlo temporalmente antes del canje.
            </VAlert>

          </VForm>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            color="grey"
            @click="closeRedeemDialog"
          >
            Cancelar
          </VBtn>
          <VBtn
            v-if="!isLocked"
            color="primary"
            :loading="loading"
            @click="lockCoupon"
          >
            <VIcon class="mr-2">ri-lock-line</VIcon>
            Validar y Bloquear
          </VBtn>
          <VBtn
            v-else
            color="success"
            :loading="loading"
            @click="redeemCoupon"
          >
            <VIcon class="mr-2">ri-gift-line</VIcon>
            Confirmar Canje
          </VBtn>
          <VBtn
            v-if="isLocked"
            color="warning"
            variant="outlined"
            :loading="loading"
            @click="unlockCoupon"
          >
            <VIcon class="mr-2">ri-lock-unlock-line</VIcon>
            Liberar Lock
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Modal de Detalles -->
    <VDialog v-model="detailsDialog" max-width="600">
      <VCard>
        <VCardTitle>
          <div class="d-flex justify-space-between align-center">
            <span>Detalles del Canje</span>
            <VBtn
              icon
              variant="text"
              @click="detailsDialog = false"
            >
              <VIcon>ri-close-line</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VCardText v-if="selectedRedemption">
          <VRow>
            <VCol cols="12" md="6">
              <div class="mb-3">
                <strong>Código del Cupón:</strong>
                <br>
                <code class="text-primary">{{ selectedRedemption.code?.code }}</code>
              </div>
            </VCol>
            <VCol cols="12" md="6">
              <div class="mb-3">
                <strong>Estado:</strong>
                <br>
                <VChip
                  :color="getStatusColor(selectedRedemption.status)"
                  size="small"
                >
                  {{ getStatusText(selectedRedemption.status) }}
                </VChip>
              </div>
            </VCol>
            <VCol cols="12" md="6">
              <div class="mb-3">
                <strong>Usuario:</strong>
                <br>
                {{ selectedRedemption.user?.name || 'N/A' }}
                <span v-if="selectedRedemption.user?.email" class="text-caption text-medium-emphasis d-block">
                  {{ selectedRedemption.user.email }}
                </span>
              </div>
            </VCol>
            <VCol cols="12" md="6">
              <div class="mb-3">
                <strong>Book:</strong>
                <br>
                {{ selectedRedemption.code?.book?.name || 'N/A' }}
              </div>
            </VCol>
            <VCol cols="12">
              <div class="mb-3">
                <strong>Fecha de Canje:</strong>
                <br>
                {{ formatDate(selectedRedemption.redeemed_at) }}
              </div>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VDialog>
  </VRow>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import CouponRedemptionsResource from '@api/resources/couponRedemptions.resource.js'
import UserResource from '@api/resources/user.resource.js'

// Variables reactivas
const loading = ref(false)
const redemptions = ref([])
const users = ref([])
const redeemDialog = ref(false)
const detailsDialog = ref(false)
const selectedRedemption = ref(null)
const redeemForm = ref(null)

// Filtros
const filters = ref({
  search: '',
  status: '',
  userId: ''
})

// Paginación
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 20,
  hasNextPage: false,
  hasPrevPage: false
})

// Datos del canje
const redeemData = ref({
  couponCode: ''
})

// Estado del lock
const lockData = ref(null)
const isLocked = ref(false)
const lockExpiresAt = ref(null)

// Opciones de estado
const statusOptions = [
  { title: 'Canjeado', value: 'REDEEMED' },
  { title: 'Cancelado', value: 'CANCELLED' },
  { title: 'Expirado', value: 'EXPIRED' }
]

// Headers de la tabla
const headers = [
  { title: 'Código', key: 'coupon_code', sortable: false },
  { title: 'Usuario', key: 'user_name', sortable: false },
  { title: 'Book', key: 'book_name', sortable: false },
  { title: 'Estado', key: 'status', sortable: false },
  { title: 'Fecha', key: 'redeemed_at', sortable: false },
  { title: 'Acciones', key: 'actions', sortable: false }
]

// Funciones
const loadRedemptions = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.value.currentPage,
      limit: pagination.value.limit,
      ...filters.value
    }

    const response = await CouponRedemptionsResource.list(params)
    redemptions.value = response.data.data
    pagination.value = response.data.pagination

    console.log(redemptions.value)
  } catch (error) {
    console.error('Error cargando canjes:', error)
    notify('Error cargando canjes', 'error')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await UserResource.getAll()
    users.value = response.data.data
  } catch (error) {
    console.error('Error cargando usuarios:', error)
  }
}

const openRedeemDialog = () => {
  redeemData.value = {
    couponCode: ''
  }
  redeemDialog.value = true
}

const closeRedeemDialog = () => {
  redeemDialog.value = false
  redeemData.value = {
    couponCode: ''
  }
  clearLock()
}

// Función para bloquear cupón
const lockCoupon = async () => {
  if (!redeemForm.value) return
  
  const { valid } = await redeemForm.value.validate()
  if (!valid) return

  try {
    loading.value = true
    const response = await CouponRedemptionsResource.lockCoupon(redeemData.value.couponCode)

    lockData.value = response.data.data
    isLocked.value = true
    lockExpiresAt.value = new Date(response.data.data.lock.expiresAt)
    
    notify('Cupón validado y bloqueado exitosamente', 'success')
  } catch (error) {
    console.error('Error bloqueando cupón:', error)
    let errorMessage = 'Error validando cupón'
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.status === 409) {
      errorMessage = 'El cupón ya está siendo utilizado por otro usuario'
    } else if (error.response?.status === 404) {
      errorMessage = 'Cupón no encontrado'
    } else if (error.response?.status === 400) {
      errorMessage = 'El cupón no está disponible para canje'
    }
    
    notify(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

// Función para canjear cupón
const redeemCoupon = async () => {
  if (!isLocked.value || !lockData.value) return

  try {
    loading.value = true
    const response = await CouponRedemptionsResource.redeem(
      redeemData.value.couponCode
    )

    const userInfo = response.data.data.redemption.user
    notify(`Cupón canjeado exitosamente por ${userInfo.name}`, 'success')
    closeRedeemDialog()
    await loadRedemptions()
  } catch (error) {
    console.error('Error canjeando cupón:', error)
    const errorMessage = error.response?.data?.message || 'Error canjeando cupón'
    notify(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

// Función para limpiar el lock
const clearLock = () => {
  isLocked.value = false
  lockData.value = null
  lockExpiresAt.value = null
}

// Función para liberar lock manualmente
const unlockCoupon = async () => {
  if (!isLocked.value || !lockData.value) return

  try {
    loading.value = true
    await CouponRedemptionsResource.unlockCoupon(redeemData.value.couponCode)
    
    clearLock()
    notify('Lock liberado exitosamente', 'success')
  } catch (error) {
    console.error('Error liberando lock:', error)
    const errorMessage = error.response?.data?.message || 'Error liberando lock'
    notify(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

// Función para formatear tiempo restante
const formatTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 'N/A'
  
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()
  
  if (diff <= 0) return 'Expirado'
  
  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const viewRedemptionDetails = (redemption) => {
  selectedRedemption.value = redemption
  detailsDialog.value = true
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  loadRedemptions()
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    userId: ''
  }
  applyFilters()
}

const onTableUpdate = (options) => {
  pagination.value.currentPage = options.page
  loadRedemptions()
}

const goToPage = (page) => {
  if (page) {
    pagination.value.currentPage = page
    loadRedemptions()
  }
}

const getStatusColor = (status) => {
  const colors = {
    'REDEEMED': 'success',
    'CANCELLED': 'error',
    'EXPIRED': 'warning'
  }
  return colors[status] || 'default'
}

const getStatusText = (status) => {
  const texts = {
    'REDEEMED': 'Canjeado',
    'CANCELLED': 'Cancelado',
    'EXPIRED': 'Expirado'
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

const notify = (message, type = 'info') => {
  // Implementar notificación según tu sistema
  console.log(`${type.toUpperCase()}: ${message}`)
}

onMounted(() => {
  loadUsers()
  loadRedemptions()
})
</script>
