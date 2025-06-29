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
import dayjs from 'dayjs'

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
        let allEvents = []
        if (auth.isAuthenticated && auth.user.google_calendar_connected) {
          const responseData = await fetchGoogleEvents()
          const googleEvents = responseData.google_events || []
          const localEvents = responseData.local_events || []

          console.log('Fetched Google Calendar Events:', googleEvents)
          console.log('Fetched Unsynced Local Events:', localEvents)

          const mappedGoogleEvents = googleEvents.map((event) => ({
            id: event.id,
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            allDay: !event.start.dateTime,
            source: 'google',
            backgroundColor: '#4285F4',
            borderColor: '#4285F4',
          }))

          const mappedLocalEvents = localEvents.map((e) => ({
            ...e,
            source: 'local',
          }))

          allEvents = [...mappedGoogleEvents, ...mappedLocalEvents]
        } else {
          // Fallback to fetching only local events if not connected
          const locals = await fetchLocalEvents()
          console.log('Local Events:', locals)
          allEvents = locals.map((e) => ({ ...e, source: 'local' }))
        }

        this.events = allEvents
      } catch (e) {
        this.error = e
      } finally {
        this.loading = false
      }
    },
    async addEvent(event) {
      this.loading = true
      try {
        // Create the event locally first for a fast UI response
        const newLocal = await createLocalEvent(event)
        this.events.push({ ...newLocal, source: 'local' })

        // If connected to Google, sync in the background after a 3-second delay
        if (useAuthStore().user.google_calendar_connected) {
          setTimeout(() => {
            // Format for Google
            const googlePayload = {
              summary: event.title,
              description: event.description,
              location: event.location,
              start: {},
              end: {},
              attendees: event.attendees || [],
              recurrence: event.recurrence || null,
              visibility: event.visibility || undefined,
              status: event.status || undefined,
              colorId: event.colorId || undefined,
              reminders: { useDefault: true },
            }
            if (event.allDay) {
              googlePayload.start.date = dayjs(event.start).format('YYYY-MM-DD')
              googlePayload.end.date = dayjs(event.end).format('YYYY-MM-DD')
            } else {
              googlePayload.start.dateTime = dayjs(event.start).toISOString()
              googlePayload.end.dateTime = event.end
                ? dayjs(event.end).toISOString()
                : dayjs(event.start).add(1, 'hour').toISOString()
            }

            createGoogleEvent(googlePayload)
              .then(() => {
                this.loadEvents()
              })
              .catch(() => {
                Swal.fire(
                  'Sync Warning',
                  'The event was saved locally, but the background sync with Google Calendar failed.',
                  'warning'
                )
              })
          }, 3000)
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
          // Format for Google
          const payload = {
            summary: eventFields.title,
            description: eventFields.description,
            location: eventFields.location,
            start: {},
            end: {},
            attendees: eventFields.attendees || [],
            recurrence: eventFields.recurrence || null,
            visibility: eventFields.visibility || undefined,
            status: eventFields.status || undefined,
            colorId: eventFields.colorId || undefined,
            reminders: { useDefault: true },
          }

          if (eventFields.allDay) {
            payload.start.date = dayjs(eventFields.start).format('YYYY-MM-DD')
            payload.end.date = dayjs(eventFields.end).format('YYYY-MM-DD')
          } else {
            payload.start.dateTime = dayjs(eventFields.start).toISOString()
            payload.end.dateTime = eventFields.end
              ? dayjs(eventFields.end).toISOString()
              : dayjs(eventFields.start).add(1, 'hour').toISOString()
          }

          await updateGoogleEvent(id, payload)
        }
        await this.loadEvents()
      } catch (error) {
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
