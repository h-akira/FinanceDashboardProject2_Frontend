<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import {
  CognitoIdentityProviderClient,
  ChangePasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { getAccessToken } from '@/auth/auth'

const IS_DEV = import.meta.env.DEV

const router = useRouter()
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const submitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '新しいパスワードが一致しません'
    return
  }

  submitting.value = true
  try {
    if (IS_DEV) {
      await router.push('/profile')
      return
    }

    const client = new CognitoIdentityProviderClient({
      region: import.meta.env.VITE_COGNITO_REGION,
    })
    await client.send(
      new ChangePasswordCommand({
        AccessToken: getAccessToken(),
        PreviousPassword: currentPassword.value,
        ProposedPassword: newPassword.value,
      }),
    )
    await router.push('/profile')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '不明なエラーが発生しました'
    errorMessage.value = msg
  } finally {
    submitting.value = false
  }
}

const canSubmit = computed(
  () => currentPassword.value && newPassword.value && confirmPassword.value,
)
</script>

<template>
  <div class="change-password-page">
    <h1>パスワード変更</h1>

    <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>

    <div class="form-grid">
      <div class="form-field">
        <label for="current-password">現在のパスワード</label>
        <Password
          id="current-password"
          v-model="currentPassword"
          :feedback="false"
          toggleMask
          class="w-full"
          inputClass="w-full"
        />
      </div>

      <div class="form-field">
        <label for="new-password">新しいパスワード</label>
        <Password
          id="new-password"
          v-model="newPassword"
          :feedback="false"
          toggleMask
          class="w-full"
          inputClass="w-full"
        />
      </div>

      <div class="form-field">
        <label for="confirm-password">新しいパスワード（確認）</label>
        <Password
          id="confirm-password"
          v-model="confirmPassword"
          :feedback="false"
          toggleMask
          class="w-full"
          inputClass="w-full"
        />
      </div>

      <div class="form-actions">
        <Button
          label="変更する"
          icon="pi pi-check"
          :disabled="!canSubmit"
          :loading="submitting"
          @click="handleSubmit"
        />
        <Button label="キャンセル" severity="secondary" outlined @click="router.back()" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.change-password-page {
  padding: 1rem 0;
  max-width: 500px;
}

h1 {
  margin-bottom: 1.5rem;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
