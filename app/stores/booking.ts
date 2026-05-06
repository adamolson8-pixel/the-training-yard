import { defineStore } from 'pinia'
import type { Service } from '~/utils/services'

export interface BookingState {
  step: number
  service: Service | null
  date: string // ISO date string YYYY-MM-DD
  time: string
  customerName: string
  customerEmail: string
  customerPhone: string
  playerName: string
  playerAge: string
  sport: string
  notes: string
  waiverAccepted: boolean
  waiverSignerName: string
  isLoading: boolean
  error: string | null
}

export const useBookingStore = defineStore('booking', {
  state: (): BookingState => ({
    step: 1,
    service: null,
    date: '',
    time: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    playerName: '',
    playerAge: '',
    sport: '',
    notes: '',
    waiverAccepted: false,
    waiverSignerName: '',
    isLoading: false,
    error: null,
  }),

  actions: {
    setService(service: Service) {
      this.service = service
      this.step = 2
    },

    setDateTime(date: string, time: string) {
      this.date = date
      this.time = time
    },

    setCustomerInfo(info: {
      customerName: string
      customerEmail: string
      customerPhone: string
      playerName?: string
      playerAge?: string
      sport?: string
      notes?: string
    }) {
      this.customerName = info.customerName
      this.customerEmail = info.customerEmail
      this.customerPhone = info.customerPhone
      this.playerName = info.playerName || ''
      this.playerAge = info.playerAge || ''
      this.sport = info.sport || ''
      this.notes = info.notes || ''
    },

    setWaiver(accepted: boolean, signerName: string) {
      this.waiverAccepted = accepted
      this.waiverSignerName = signerName
    },

    nextStep() {
      if (this.step < 5) this.step++
    },

    prevStep() {
      if (this.step > 1) this.step--
    },

    reset() {
      this.$reset()
    },
  },
})
