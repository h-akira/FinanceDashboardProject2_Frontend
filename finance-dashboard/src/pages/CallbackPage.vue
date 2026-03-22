<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import { exchangeCodeForTokens } from '@/auth/auth'

const router = useRouter()
const error = ref(false)

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) {
    error.value = true
    return
  }

  const success = await exchangeCodeForTokens(code)
  if (success) {
    router.replace('/dashboard')
  } else {
    error.value = true
  }
})
</script>

<template>
  <div class="callback-page">
    <Message v-if="error" severity="error">
      認証に失敗しました。もう一度ログインしてください。
    </Message>
    <div v-else class="loading">
      <ProgressSpinner />
      <p>認証処理中...</p>
    </div>
  </div>
</template>

<style scoped>
.callback-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading {
  text-align: center;
}

.loading p {
  margin-top: 1rem;
  color: var(--p-text-muted-color, #6b7280);
}
</style>
