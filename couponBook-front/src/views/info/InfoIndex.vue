<script setup>
import InfoResource from '@api/resources/info.resource.js'
import { ref, onMounted, computed } from 'vue'

const baseInfo = ref(null)
const healthInfo = ref(null)
const loading = ref(false)
const error = ref(null)


const getBaseInfo = async () => {
  try {
    loading.value = true
    const response = await InfoResource.getBaseInfo()
    baseInfo.value = response.data
  } catch (err) {
    console.error('Error obteniendo información base:', err)
    error.value = 'Error obteniendo información base de la API'
  } finally {
    loading.value = false
  }
}

const getHealthInfo = async () => {
  try {
    const response = await InfoResource.getHealth()
    healthInfo.value = response.data
  } catch (err) {
    console.error('Error obteniendo información de salud:', err)
    error.value = 'Error obteniendo información de salud de la API'
  }
}


const refreshData = async () => {
  error.value = null
  await Promise.all([getBaseInfo(), getHealthInfo()])
}

onMounted(() => {
  refreshData()
})
</script>

<template>
  <div>
    <VCard class="height-container pa-4">
      <template #title>
        <div class="d-flex justify-space-between pb-10">
          <h2>Información del Sistema</h2>
          <VBtn
            size="small"
            color="primary"
            :loading="loading"
            @click="refreshData"
          >
            <VIcon class="mr-2">ri-refresh-line</VIcon>
            Actualizar
          </VBtn>
        </div>
      </template>

      <div v-if="error" class="mb-4">
        <VAlert
          type="error"
          variant="tonal"
          :text="error"
        />
      </div>

      <VRow v-if="loading && !baseInfo && !healthInfo">
        <VCol cols="12" class="text-center">
          <VProgressCircular
            indeterminate
            color="primary"
            size="64"
          />
          <p class="mt-4">Cargando información del sistema...</p>
        </VCol>
      </VRow>

      <VRow v-else>
        <!-- Información Base de la API -->
        <VCol cols="12" md="6">
          <VCard variant="outlined" class="h-100">
            <VCardTitle class="d-flex align-center">
              <VIcon class="mr-2" color="primary">ri-information-line</VIcon>
              Información Base de la API
            </VCardTitle>
            <VCardText v-if="baseInfo">
              <VList>
                <VListItem>
                  <VListItemTitle>Mensaje</VListItemTitle>
                  <VListItemSubtitle>{{ baseInfo.message }}</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle>Versión</VListItemTitle>
                  <VListItemSubtitle>{{ baseInfo.version }}</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle>Endpoints Disponibles</VListItemTitle>
                  <VListItemSubtitle>
                    <VList density="compact" class="mt-2">
                      <VListItem
                        v-for="(endpoint, key) in baseInfo.endpoints"
                        :key="key"
                        class="px-0"
                      >
                        <VListItemTitle class="text-body-2">
                          <strong>{{ key }}:</strong> {{ endpoint }}
                        </VListItemTitle>
                      </VListItem>
                    </VList>
                  </VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
            <VCardText v-else>
              <VAlert type="warning" variant="tonal" text="No se pudo cargar la información base" />
            </VCardText>
          </VCard>
        </VCol>

        <!-- Estado de Salud -->
        <VCol cols="12" md="6">
          <VCard variant="outlined" class="h-100">
            <VCardTitle class="d-flex align-center">
              <VIcon class="mr-2" :color="healthInfo?.status === 'OK' ? 'success' : 'error'">
                {{ healthInfo?.status === 'OK' ? 'ri-check-line' : 'ri-error-warning-line' }}
              </VIcon>
              Estado de Salud del Sistema
            </VCardTitle>
            <VCardText v-if="healthInfo">
              <VList>
                <VListItem>
                  <VListItemTitle>Estado</VListItemTitle>
                  <VListItemSubtitle>
                    <VChip
                      :color="healthInfo.status === 'OK' ? 'success' : 'error'"
                      size="small"
                    >
                      {{ healthInfo.status }}
                    </VChip>
                  </VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle>Timestamp</VListItemTitle>
                  <VListItemSubtitle>{{ new Date(healthInfo.timestamp).toLocaleString() }}</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle>Servicio</VListItemTitle>
                  <VListItemSubtitle>{{ healthInfo.service }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
            <VCardText v-else>
              <VAlert type="warning" variant="tonal" text="No se pudo cargar el estado de salud" />
            </VCardText>
          </VCard>
        </VCol>

      </VRow>
    </VCard>
  </div>
</template>

<style scoped>
.height-container {
  min-height: 400px;
}
</style>
