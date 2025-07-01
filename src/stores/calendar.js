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
            ...event,
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
        const newLocal = await createLocalEvent({
          ...event,
          guest_name: event.guest_name,
          guest_email: event.guest_email,
        })
        this.events.push({ ...newLocal, source: 'local' })

        // If connected to Google, sync in the background after a 3-second delay
        if (useAuthStore().user.google_calendar_connected) {
          setTimeout(() => {
            // Use the same structure as your local payload for Google sync
            const googlePayload = {
              title: event.title,
              description: event.description,
              location: event.location,
              start: dayjs(event.start).toISOString(),
              end: event.end
                ? dayjs(event.end).toISOString()
                : dayjs(event.start).add(1, 'hour').toISOString(),
              attendees: Array.isArray(event.attendees)
                ? event.attendees
                    .filter((a) => a.email)
                    .map((a) => ({ email: a.email }))
                : [],
              recurrence: event.recurrence || null,
              visibility: event.visibility || undefined,
              status: event.status || undefined,
              colorId: event.colorId || undefined,
              reminders: event.reminders || { useDefault: true },
              // url: event.url || undefined,
              organizer: event.organizer || undefined,
              creator: event.creator || undefined,
              attachments: event.attachments || undefined,
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
          }, 10000)
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
          // Use the same structure as your local payload for Google sync
          const payload = {
            title: eventFields.title,
            description: eventFields.description,
            location: eventFields.location,
            start: dayjs(eventFields.start).toISOString(),
            end: eventFields.end
              ? dayjs(eventFields.end).toISOString()
              : dayjs(eventFields.start).add(1, 'hour').toISOString(),
            attendees: Array.isArray(eventFields.attendees)
              ? eventFields.attendees
                  .filter((a) => a.email)
                  .map((a) => ({ email: a.email }))
              : [],
            recurrence: eventFields.recurrence || null,
            visibility: eventFields.visibility || undefined,
            status: eventFields.status || undefined,
            colorId: eventFields.colorId || undefined,
            reminders: eventFields.reminders || { useDefault: true },
            // url: eventFields.url || undefined,
            organizer: eventFields.organizer || undefined,
            creator: eventFields.creator || undefined,
            attachments: eventFields.attachments || undefined,
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
