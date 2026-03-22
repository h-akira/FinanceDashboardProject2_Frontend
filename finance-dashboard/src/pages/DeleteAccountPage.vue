<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import { deleteMe } from '@/api/generated/main/users/users'
import { useAuth } from '@/auth/auth'

const router = useRouter()
const { logout } = useAuth()

const password = ref('')
const confirmDialogVisible = ref(false)
const deleting = ref(false)
const errorMessage = ref('')

function showConfirm() {
  if (!password.value) return
  confirmDialogVisible.value = true
}

async function handleDelete() {
  deleting.value = true
  errorMessage.value = ''
  try {
    const res = await deleteMe({ password: password.value })
    if (res.status !== 204) {
      errorMessage.value = res.data?.message || 'パスワードが正しくありません'
      return
    }
    confirmDialogVisible.value = false
    logout()
    router.push('/')
  } catch {
    errorMessage.value = '通信エラーが発生しました。時間をおいて再度お試しください。'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="delete-account-page">
    <h1>アカウント削除</h1>

    <Message severity="warn" :closable="false">
      アカウントを削除すると、すべてのデータが削除されます。この操作は取り消せません。
    </Message>

    <div class="form-grid">
      <div class="form-field">
        <label for="password">現在のパスワード</label>
        <Password
          id="password"
          v-model="password"
          :feedback="false"
          toggleMask
          class="w-full"
          inputClass="w-full"
        />
      </div>

      <div class="form-actions">
        <Button
          label="アカウントを削除"
          icon="pi pi-trash"
          severity="danger"
          :disabled="!password"
          @click="showConfirm"
        />
        <Button label="キャンセル" severity="secondary" outlined @click="router.back()" />
      </div>
    </div>

    <Dialog v-model:visible="confirmDialogVisible" header="最終確認" :modal="true" :closable="true">
      <p>本当にアカウントを削除しますか？すべてのデータが失われます。</p>
      <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
      <template #footer>
        <Button
          label="キャンセル"
          severity="secondary"
          outlined
          @click="confirmDialogVisible = false"
        />
        <Button label="削除する" severity="danger" :loading="deleting" @click="handleDelete" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.delete-account-page {
  padding: 1rem 0;
  max-width: 500px;
}

h1 {
  margin-bottom: 1rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-field label {
  font-weight: 600;
  font-size: 0.875rem;
}

.w-full {
  width: 100%;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
