import { defineStore } from 'pinia'
import {
  fetchLocalEvents,
  fetchGoogleEvents,
  createLocalEvent,
  updateLocalEvent,
  deleteLocalEvent,
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
} from '../services/api'
import { useAuthStore } from './auth'
import Swal from 'sweetalert2'

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    events: [],
    loading: false,
    error: null,
  }),
  actions: {
    async loadEvents() {
      this.loading = true
      this.error = null
      const auth = useAuthStore()
      try {
        const locals = await fetchLocalEvents()
        let googles = []
        if (auth.isAuthenticated && auth.user.google_calendar_connected) {
          googles = await fetchGoogleEvents()
        }
        this.events = [
          ...locals.map((e) => ({ ...e, source: 'local' })),
          ...googles.map((e) => ({
            ...e,
            source: 'google',
            backgroundColor: '#4285F4',
            borderColor: '#4285F4',
          })),
        ]
      } catch (e) {
        this.error = e
      } finally {
        this.loading = false
      }
    },
    async addEvent(event) {
      this.loading = true
      try {
        const newLocal = await api.createLocalEvent(event)
        this.events.push({ ...newLocal, source: 'local' })
        if (useAuthStore().user.google_calendar_connected) {
          try {
            await api.createGoogleEvent(event)
          } catch {
            Swal.fire(
              'Sync warning',
              'Saved locally but failed Google sync',
              'warning'
            )
          }
        }
      } catch (e) {
        Swal.fire('Error', e.response?.data?.message || e.message, 'error')
      } finally {
        this.loading = false
      }
    },
    async updateEvent(eventData) {
      this.loading = true
      const { id, source, ...eventFields } = eventData

      let eventIndex = this.events.findIndex(
        (e) => String(e.id) === String(id) && e.source === source
      )
      if (eventIndex === -1) {
        // Try reloading events in case state is stale
        await this.loadEvents()
        eventIndex = this.events.findIndex(
          (e) => String(e.id) === String(id) && e.source === source
        )
        if (eventIndex === -1) {
          Swal.fire('Error', 'Could not find the event to update.', 'error')
          this.loading = false
          return
        }
      }

      const originalEvent = { ...this.events[eventIndex] }

      // Optimistic update
      this.events[eventIndex] = { ...this.events[eventIndex], ...eventFields }

      try {
        if (source === 'local') {
          await updateLocalEvent(id, eventFields)
        } else if (source === 'google') {
          await updateGoogleEvent(id, eventFields)
        }
        // After successful update, reload events from backend to ensure state is in sync
        await this.loadEvents()
      } catch (error) {
        // Rollback on failure
        this.events[eventIndex] = originalEvent
        const message =
          error.response?.data?.message || 'Could not update the event.'
        Swal.fire('Error', message, 'error')
      } finally {
        this.loading = false
      }
    },
    async deleteEvent(eventData) {
      this.loading = true
      const { id, source } = eventData

      let eventIndex = this.events.findIndex(
        (e) => String(e.id) === String(id) && e.source === source
      )
      if (eventIndex === -1) {
        // Try reloading events in case state is stale
        await this.loadEvents()
        eventIndex = this.events.findIndex(
          (e) => String(e.id) === String(id) && e.source === source
        )
        if (eventIndex === -1) {
          Swal.fire('Error', 'Could not find the event to delete.', 'error')
          this.loading = false
          return
        }
      }

      const originalEvents = [...this.events]

      // Optimistic delete
      this.events.splice(eventIndex, 1)

      try {
        if (source === 'local') {
          await deleteLocalEvent(id)
        } else if (source === 'google') {
          await deleteGoogleEvent(id)
        }
        // After successful delete, reload events from backend to ensure state is in sync
        await this.loadEvents()
      } catch (error) {
        // Rollback on failure
        this.events = originalEvents
        const message =
          error.response?.data?.message || 'Could not delete the event.'
        Swal.fire('Error', message, 'error')
      } finally {
        this.loading = false
      }
    },
    async sync() {
      await this.loadEvents()
    },
  },
})
