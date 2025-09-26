<script setup>
import BaseDialog from '@/components/BaseDialog.vue'
import { notify } from '@/composables/useSnackbar'
import { useConfirmDeleteDialog } from '@/stores/confirmDeleteDialogStore'
import UserResource from '@api/resources/user.resource.js'
import CouponAssignmentsResource from '@api/resources/couponAssignments.resource.js'
import CouponBooksResource from '@api/resources/couponBooks.resource.js'
import { computed, ref } from 'vue'

const { openConfirmDialog } = useConfirmDeleteDialog()

const items = ref([])
const loadingIds = ref([])
const dialog = ref(false)
const loading = ref(false)
const show = ref(false)
const action = ref("")

// Variables para asignación de cupones
const assignCouponsDialog = ref(false)
const selectedUser = ref(null)
const books = ref([])
const assignmentData = ref({
  bookId: '',
  quantity: 1,
  couponCode: ''
})
const userCoupons = ref([])
const loadingCoupons = ref(false)

const user = ref({
  name: '',
  email: '',
})

const headers = [
  { title: "Nombre", key: "name" },
  { title: "Email", key: "email", align: "center", sortable: false },
  { title: "Acciones", key: "actions", sortable: false },
]

const isShow = computed(() => {
  return action.value === "Ver"
})

const selectedBook = computed(() => {
  if (!assignmentData.value.bookId) return null
  return books.value.find(book => book.id === assignmentData.value.bookId)
})  

const getUsers = async () => {
  try {
    loading.value = true
    const response = await UserResource.getAll()
    items.value = response.data.data
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    notify('Error al cargar usuarios. Verifique la conexión con el servidor.', 'error')
    items.value = []
  } finally {
    loading.value = false
  }
}

const createUser = async () => {
  loading.value = true

  try {
    await UserResource.createUser(user.value)
    notify('Usuario creado correctamente.', 'success')
    resetModel()
    getUsers()
  } catch (error) {
    console.error('Error creando usuario:', error)
    const errorMessage = error.response?.data?.message || 'Error creando usuario.'
    notify(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

const updateUser = async () => {
  const id = user.value.id

  loadingIds.value.push(id)

  try {
    await UserResource.updateUser(id, user.value)
    notify('Usuario actualizado correctamente.', 'success')
    resetModel()
    getUsers()
  } catch (error) {
    console.error('Error actualizando usuario:', error)
    const errorMessage = error.response?.data?.message || 'Error actualizando usuario.'
    notify(errorMessage, 'error')
  } finally {
    loadingIds.value = loadingIds.value.filter(i => i !== id)
  }
}

const showUser = async item => {
  user.value = item
  action.value = "Ver"
  dialog.value = true
}

const deleteUser = async item => {

  const confirmed = await openConfirmDialog({
    title: '¿Eliminar usuario?',
    message: `¿Estás seguro de que querés eliminar a "${item.name}"?`,
  })

  if (!confirmed) return

  loadingIds.value.push(item.id)
  try {
    await UserResource.deleteUser(item.id)
    getUsers()
    notify('Usuario eliminado correctamente.', 'success')
  } catch (error) {
    notify('Error eliminando usuario.', 'error')
  } finally {
    loadingIds.value = loadingIds.value.filter(i => i !== item.id)
  }
}

const openDialog = (item = null) => {
  
  if (item) {
    user.value = { ...item }
    action.value = "Editar"

  } else {
    resetModel()
    action.value = "Crear"
  }

  dialog.value = true
}

const resetModel = () => {
  user.value = {
    name: '',
    email: '',
  }
}

const closeDialog = () => {
  dialog.value = false
  resetModel()
}

const save = async () => {
  if (action.value === "Editar") {
    await updateUser()
  } else {
    await createUser()
  }

  closeDialog()
}

// Funciones para asignación de cupones
const openAssignCouponsDialog = async (user) => {
  selectedUser.value = user
  assignmentData.value = {
    bookId: '',
    quantity: 1,
    couponCode: ''
  }
  assignCouponsDialog.value = true
  await loadBooks()
  await loadUserCoupons()
}

const loadBooks = async () => {
  try {
    const response = await CouponBooksResource.getAll()
    books.value = response.data.data.map(book => ({
      ...book,
      hasAvailableCodes: (book.codes_count || 0) > 0
    }))
  } catch (error) {
    console.error('Error cargando books:', error)
    notify('Error cargando books', 'error')
  }
}

const loadUserCoupons = async () => {
  if (!selectedUser.value) return
  
  loadingCoupons.value = true
  try {
    const response = await CouponAssignmentsResource.getUserAssignments(selectedUser.value.id)
    userCoupons.value = response.data.data
  } catch (error) {
    console.error('Error cargando cupones del usuario:', error)
    notify('Error cargando cupones del usuario', 'error')
  } finally {
    loadingCoupons.value = false
  }
}

const assignRandomCoupons = async () => {
  if (!assignmentData.value.bookId || !assignmentData.value.quantity) {
    notify('Por favor selecciona un book y especifica la cantidad', 'warning')
    return
  }

  // Verificar si el book tiene cupones disponibles
  if (!selectedBook.value?.hasAvailableCodes) {
    notify('Este book no tiene cupones disponibles para asignar', 'error')
    return
  }

  loading.value = true
  try {
    const response = await CouponAssignmentsResource.assignRandomCoupons({
      bookId: assignmentData.value.bookId,
      userId: selectedUser.value.id,
      quantity: assignmentData.value.quantity
    })

    notify(`Se asignaron ${response.data.data.totalAssigned} cupones correctamente`, 'success')
    await loadUserCoupons()
    assignmentData.value = { bookId: '', quantity: 1, couponCode: '' }
  } catch (error) {
    console.error('Error asignando cupones:', error)
    const errorMessage = error.response?.data?.message || 'Error asignando cupones'
    notify(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

const assignSpecificCoupon = async () => {
  if (!assignmentData.value.couponCode) {
    notify('Por favor ingresa el código del cupón', 'warning')
    return
  }

  loading.value = true
  try {
    const response = await CouponAssignmentsResource.assignSpecificCoupon({
      couponCode: assignmentData.value.couponCode,
      userId: selectedUser.value.id
    })

    notify(`Cupón ${assignmentData.value.couponCode} asignado correctamente`, 'success')
    await loadUserCoupons()
    assignmentData.value = { bookId: '', quantity: 1, couponCode: '' }
  } catch (error) {
    console.error('Error asignando cupón específico:', error)
    const errorMessage = error.response?.data?.message || 'Error asignando cupón'
    notify(errorMessage, 'error')
  } finally {
    loading.value = false
  }
}

const closeAssignCouponsDialog = () => {
  assignCouponsDialog.value = false
  selectedUser.value = null
  userCoupons.value = []
}

onMounted(() => {
  getUsers()
})

</script>

<template>
  <div>
    <VCard class="height-container pa-4">
      <template #title>
        <div class="d-flex justify-space-between pb-10">
          <h2>Usuarios</h2>
          <VBtn
            size="small"
            color="primary"
            @click="openDialog"
          >
            Crear Usuario
          </VBtn>
        </div>
      </template>

      <VDataTable
        :headers="headers"
        :items="items"
        class="mt-4"
        :loading="loading.value"
      >

        <template #item.actions="{ item }">
          <VIcon
            class="mr-2"
            @click="showUser(item)"
          >
            ri-eye-line
          </VIcon>
          <VIcon
            class="mr-2"
            @click="openDialog(item)"
          >
            ri-edit-2-line
          </VIcon>
          <VIcon
            color="primary"
            class="mr-2"
            @click="openAssignCouponsDialog(item)"
            title="Asignar Cupones"
          >
            ri-gift-line
          </VIcon>
          <VIcon
            color="error"
            class="mr-2"
            @click="deleteUser(item)"
          >
            ri-delete-bin-2-line
          </VIcon>
        </template>
      </VDataTable>
    </VCard>

    <BaseDialog v-model="dialog">
      <template #title>
        {{ `${action} Usuario` }}
      </template> 

      <template #message>
        {{ !isShow ? 'Ingrese los datos del usuario' : null }}
      </template>

      <template #default>
        <VForm @submit.prevent="() => {}">
          <VRow>
            <VCol
              cols="12"
              md="12"
            >
              <VTextField
                v-model="user.name"
                :disabled="isShow"
                label="Nombre"
                placeholder="Nombre del usuario"
              />
            </VCol>
          </VRow>
          
          <VRow>
            <VCol
              cols="12"
              md="12"
            >
              <VTextField
                v-model="user.email"
                :disabled="isShow"
                label="Email"
              />
            </VCol>

          </VRow>
        </VForm>
      </template>

      <template #actions>
        <VSpacer />
        <VBtn
          color="grey"
          @click="closeDialog"
        >
          Cerrar
        </VBtn>
        <VBtn
          v-if="!isShow"
          color="primary"
          variant="flat"
          :loading="loading"
          :disabled="loading"
          @click="save"
        >
          Guardar
        </VBtn>
      </template>
    </BaseDialog>

    <!-- Modal de Asignación de Cupones -->
    <VDialog v-model="assignCouponsDialog" max-width="800">
      <VCard>
        <VCardTitle>
          <div class="d-flex justify-space-between align-center">
            <span>Asignar Cupones a {{ selectedUser?.name }}</span>
            <VBtn
              icon
              variant="text"
              @click="closeAssignCouponsDialog"
            >
              <VIcon>ri-close-line</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VCardText>
          <VRow>
            <!-- Asignación Aleatoria -->
            <VCol cols="12" md="6">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">Asignación Aleatoria</VCardTitle>
                <VCardText>
                  <VSelect
                    v-model="assignmentData.bookId"
                    :items="books"
                    item-title="name"
                    item-value="id"
                    label="Seleccionar Book"
                    class="mb-3"
                  />
                  
                  <!-- Información del Book Seleccionado -->
                  <VAlert
                    v-if="selectedBook && !selectedBook.hasAvailableCodes"
                    type="error"
                    variant="tonal"
                    class="mb-3"
                  >
                    <template #title>
                      Sin Cupones Disponibles
                    </template>
                    <div class="text-body-2">
                      <strong>Book:</strong> {{ selectedBook.name }}<br>
                      <strong>Códigos generados:</strong> {{ selectedBook.codes_count || 0 }}<br>
                      <strong>Estado:</strong> Este book no tiene cupones disponibles para asignar
                    </div>
                  </VAlert>
                  
                  <VAlert
                    v-else-if="selectedBook && selectedBook.hasAvailableCodes"
                    type="success"
                    variant="tonal"
                    class="mb-3"
                  >
                    <template #title>
                      Cupones Disponibles
                    </template>
                    <div class="text-body-2">
                      <strong>Book:</strong> {{ selectedBook.name }}<br>
                      <strong>Códigos generados:</strong> {{ selectedBook.codes_count || 0 }}<br>
                      <strong>Estado:</strong> Listo para asignar cupones
                    </div>
                  </VAlert>
                  <VTextField
                    v-model="assignmentData.quantity"
                    label="Cantidad de cupones"
                    type="number"
                    min="1"
                    class="mb-3"
                  />
                  <VBtn
                    color="primary"
                    :loading="loading"
                    :disabled="!assignmentData.bookId || !assignmentData.quantity || (selectedBook && !selectedBook.hasAvailableCodes)"
                    @click="assignRandomCoupons"
                    block
                  >
                    <VIcon class="mr-2">ri-gift-line</VIcon>
                    {{ selectedBook && !selectedBook.hasAvailableCodes ? 'Sin Cupones Disponibles' : 'Asignar Cupones Aleatorios' }}
                  </VBtn>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Asignación Específica -->
            <VCol cols="12" md="6">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">Asignación Específica</VCardTitle>
                <VCardText>
                  <VTextField
                    v-model="assignmentData.couponCode"
                    label="Código del cupón"
                    placeholder="Ej: SPRING-1234"
                    class="mb-3"
                  />
                  <VBtn
                    color="secondary"
                    :loading="loading"
                    :disabled="!assignmentData.couponCode"
                    @click="assignSpecificCoupon"
                    block
                  >
                    <VIcon class="mr-2">ri-user-add-line</VIcon>
                    Asignar Cupón Específico
                  </VBtn>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Cupones Asignados -->
            <VCol cols="12">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  Cupones Asignados ({{ userCoupons.length }})
                </VCardTitle>
                <VCardText>
                  <VDataTable
                    :items="userCoupons"
                    :loading="loadingCoupons"
                    :headers="[
                      { title: 'Código', key: 'code.code' },
                      { title: 'Book', key: 'book.name' },
                      { title: 'Estado', key: 'status' },
                      { title: 'Asignado', key: 'assigned_at' }
                    ]"
                    :items-per-page="5"
                  >
                    <template #item.code.code="{ item }">
                      <code>{{ item.code?.code }}</code>
                    </template>
                    <template #item.status="{ item }">
                      <VChip
                        :color="item.status === 'ASSIGNED' ? 'success' : 'warning'"
                        size="small"
                      >
                        {{ item.status === 'ASSIGNED' ? 'Asignado' : 'Inactivo' }}
                      </VChip>
                    </template>
                    <template #item.assigned_at="{ item }">
                      {{ item.assigned_at ? new Date(item.assigned_at).toLocaleDateString('es-ES') : 'No asignado' }}
                    </template>
                  </VDataTable>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
