<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import { useAuthStore } from '@/stores/auth'
import UserResource from '@api/resources/user.resource.js'
import { notify } from '@/composables/useSnackbar'

const accountData = {
  avatarImg: avatar1,
}

const refInputEl = ref()
const desactivarUsuario = ref(false)
const accountDataLocal = ref(structuredClone(accountData))

const user = computed(() => (useAuthStore().user))

const changeAvatar = file => {
  const fileReader = new FileReader()
  const { files } = file.target
  if (files && files.length) {
    fileReader.readAsDataURL(files[0])
    fileReader.onload = () => {
      if (typeof fileReader.result === 'string')
        accountDataLocal.value.avatarImg = fileReader.result
    }
  }
}

// reset avatar image
const resetAvatar = () => {
  accountDataLocal.value.avatarImg = accountData.avatarImg
}

const updateUser = async () => {
  await UserResource.updateUser(user.value.id, { active: false }).then(() => {
    notify('Usuario desactivado correctamente.', 'success')
    useAuthStore().logout(true)
    
  }).catch(error => {
    notify('Error al desactivar usuario.', 'error')
  })
  
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Detalle de Usuario">
        <VCardText class="d-flex">
          <VAvatar
            rounded="lg"
            size="100"
            class="me-6"
            :image="accountDataLocal.avatarImg"
          />

          <form class="d-flex flex-column justify-center gap-5">
            <div class="d-flex flex-wrap gap-2">
              <VBtn
                color="primary"
                disabled
                @click="refInputEl?.click()"
              >
                <VIcon
                  icon="ri-upload-cloud-line"
                  class="d-sm-none"
                />
                <span class="d-none d-sm-block">Subir Foto de Perfil</span>
              </VBtn>

              <input
                ref="refInputEl"
                type="file"
                name="file"
                accept=".jpeg,.png,.jpg,GIF"
                hidden
                @input="changeAvatar"
              >

              <VBtn
                type="reset"
                color="error"
                variant="outlined"
                disabled
                @click="resetAvatar"
              >
                <span class="d-none d-sm-block">Reset</span>
                <VIcon
                  icon="ri-refresh-line"
                  class="d-sm-none"
                />
              </VBtn>
            </div>

            <p class="text-body-1 mb-0">
              Permitido JPG, GIF or PNG. Tamaño máximo de 800K
            </p>
          </form>
        </VCardText>

        <VDivider />

        <VCardText>
          <VForm class="mt-6">
            <VRow>
              <VCol
                md="6"
                cols="12"
              >
                <VTextField
                  v-model="user.userName"
                  placeholder="John"
                  label="First Name"
                  disabled
                />
              </VCol>

              <VCol
                md="6"
                cols="12"
              >
                <VTextField
                  v-model="user.email"
                  placeholder="Doe"
                  label="Email"
                  disabled
                />
              </VCol>
            </VRow>
          </VForm>

          <VRow>
            <VCol
              md="12"
              cols="12"
            >
              <VDataTable
                :headers="[
                  { title: 'Rol', key: 'rol', sortable: false },
                  { title: 'Nombre', key: 'nombre', align: 'center', sortable: false }
                ]"
                :items="[]"
                class="mt-4"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12">
      <!-- 👉 Desactivar Usuario -->
      <VCard title="Desactivar Usuario">
        <VCardText>
          <div>
            <VCheckbox
              v-model="desactivarUsuario"
              label="Confirmo que quiero desactivar mi usuario"
            />
          </div>

          <VBtn
            :disabled="!desactivarUsuario"
            color="error"
            class="mt-3"
            @click="() => updateUser()"
          >
            Desactivar Usuario
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
