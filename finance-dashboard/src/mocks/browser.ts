import { setupWorker } from 'msw/browser'
import { getUsersMock } from '@/api/generated/main/users/users.msw'
import { getFinanceMock } from '@/api/generated/main/finance/finance.msw'
import { customHandlers } from './handlers'

export const worker = setupWorker(...customHandlers, ...getUsersMock(), ...getFinanceMock())
