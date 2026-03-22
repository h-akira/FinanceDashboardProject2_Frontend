<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import type { User } from '@/api/generated/main/model'
import { getMe } from '@/api/generated/main/users/users'

const router = useRouter()
const profile = ref<User | null>(null)
const loading = ref(true)

onMounted(async () => {
  const res = await getMe()
  if (res.status === 200) {
    profile.value = res.data
  }
  loading.value = false
})
</script>

<template>
  <div class="profile-page">
    <h1>プロフィール</h1>

    <template v-if="loading">
      <ProgressSpinner />
    </template>

    <template v-else-if="profile">
      <div class="profile-card">
        <div class="profile-field">
          <span class="field-label">ユーザー名</span>
          <span class="field-value">{{ profile.username }}</span>
        </div>

        <div class="profile-field">
          <span class="field-label">メールアドレス</span>
          <span class="field-value">
            {{ profile.email }}
            <i v-if="profile.email_verified" class="pi pi-check-circle verified-icon" />
          </span>
        </div>

        <div class="profile-field">
          <span class="field-label">登録日</span>
          <span class="field-value">{{ profile.created_at }}</span>
        </div>
      </div>

      <div class="profile-actions">
        <Button
          label="パスワード変更"
          icon="pi pi-lock"
          severity="secondary"
          outlined
          @click="router.push('/change-password')"
        />
        <Button
          label="アカウント削除"
          icon="pi pi-trash"
          severity="danger"
          outlined
          @click="router.push('/delete-account')"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 1rem 0;
}

h1 {
  margin-bottom: 1.5rem;
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 500px;
  padding: 1.5rem;
  border: 1px solid var(--p-surface-200, #e5e7eb);
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--p-text-muted-color, #6b7280);
  text-transform: uppercase;
}

.field-value {
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.verified-icon {
  color: #22c55e;
  font-size: 0.875rem;
}

.profile-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
