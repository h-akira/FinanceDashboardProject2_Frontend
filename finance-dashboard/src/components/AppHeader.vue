<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import { useAuth } from '@/auth/auth'

const router = useRouter()
const { isAuthenticated, user, login, logout } = useAuth()

const menuItems = computed(() => {
  if (!isAuthenticated.value) return []
  return [
    {
      label: 'ダッシュボード',
      icon: 'pi pi-chart-bar',
      command: () => router.push('/dashboard'),
    },
    {
      label: 'カスタムチャート',
      icon: 'pi pi-chart-line',
      command: () => router.push('/custom-chart'),
    },
  ]
})

function handleLogout() {
  logout()
  router.push('/')
}
</script>

<template>
  <Menubar :model="menuItems" class="app-header">
    <template #start>
      <router-link to="/" class="app-logo">
        <span class="app-logo-text">Finance Dashboard</span>
      </router-link>
    </template>
    <template #end>
      <div class="header-end">
        <template v-if="isAuthenticated">
          <Button
            :label="user?.email"
            icon="pi pi-user"
            text
            class="header-user-btn"
            @click="router.push('/profile')"
          />
          <Button
            label="ログアウト"
            icon="pi pi-sign-out"
            severity="secondary"
            text
            class="header-logout-btn"
            @click="handleLogout"
          />
        </template>
        <template v-else>
          <Button label="ログイン" icon="pi pi-sign-in" @click="login" />
        </template>
      </div>
    </template>
  </Menubar>
</template>

<style scoped>
.app-header {
  margin-bottom: 1.5rem;
}

.app-logo {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  margin-right: 1rem;
}

.app-logo-text {
  font-size: 1.25rem;
  font-weight: 700;
}

.header-end {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

@media screen and (max-width: 768px) {
  .app-logo-text {
    font-size: 1rem;
  }

  .header-user-btn :deep(.p-button-label) {
    display: none;
  }

  .header-logout-btn :deep(.p-button-label) {
    display: none;
  }
}
</style>
