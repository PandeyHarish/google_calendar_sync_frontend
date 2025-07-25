<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCalendarStore } from '../stores/calendar'
import { useAuthStore } from '../stores/auth'
import { getGoogleRedirectUrl } from '../services/api'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import EventModal from '../components/EventModal.vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import axios from 'axios'
const showModal = ref(false)
const modalMode = ref('create') // 'create' | 'edit'
const modalEvent = ref({
  id: null,
  title: '',
  start: '',
  end: '',
  allDay: false,
})

const calendarRef = ref(null)
const calendarStore = useCalendarStore()
const authStore = useAuthStore()
const router = useRouter()

const currentEvents = computed(() => calendarStore.events)

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  eventDrop: handleEventUpdate,
  eventResize: handleEventUpdate,
  initialView: 'dayGridMonth',
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  events: fetchEvents,
  select: openCreateModal,
  eventClick: handleEventClick,
}

function handleWeekendsToggle() {
  calendarOptions.weekends = !calendarOptions.weekends
}

async function fetchEvents(fetchInfo, successCallback, failureCallback) {
  try {
    await calendarStore.loadEvents()
    successCallback(calendarStore.events)
  } catch (e) {
    failureCallback(e)
  }
}

function openCreateModal(selectInfo) {
  modalMode.value = 'create'
  modalEvent.value = {
    id: null,
    title: '',
    start: selectInfo.startStr,
    end: selectInfo.endStr,
    allDay: selectInfo.allDay,
  }
  showModal.value = true
}

function handleEventClick(clickInfo) {
  // Prevent the browser from navigating to the event's URL (if it has one)
  clickInfo.jsEvent.preventDefault()

  if (authStore.isAuthenticated) {
    openEditModal(clickInfo)
  } else {
    // For public users, show a read-only view
    openViewModal(clickInfo)
  }
}

function openEditModal(clickInfo) {
  if (!authStore.isAuthenticated) return

  // No longer needed here as it's handled in the parent click handler
  // clickInfo.jsEvent.preventDefault()

  const event = clickInfo.event

  // Helper to get the field from extendedProps or fallback to event object
  const getField = (field) =>
    event.extendedProps && event.extendedProps[field] !== undefined
      ? event.extendedProps[field]
      : event[field] !== undefined
      ? event[field]
      : ''

  modalMode.value = 'edit'
  modalEvent.value = {
    id: event.id,
    title: getField('title'),
    start: event.startStr || event.start,
    end: event.endStr || event.end,
    allDay: event.allDay,
    source: getField('source'),
    location: getField('location'),
    url: getField('url'),
    description: getField('description'),
    attendees: getField('attendees') || [],
    recurrence: getField('recurrence') || null,
    visibility: getField('visibility') || '',
    status: getField('status') || '',
    colorId: getField('colorId') || '',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleModalSave(eventData) {
  closeModal()

  if (modalMode.value === 'create') {
    await calendarStore.addEvent(eventData)
  } else if (modalMode.value === 'edit') {
    await calendarStore.updateEvent(eventData)
  }

  if (calendarRef.value) calendarRef.value.getApi().refetchEvents()
}

async function handleModalDelete(eventId) {
  closeModal()
  const event = currentEvents.value.find(
    (e) => String(e.id) === String(eventId)
  )
  if (event) {
    await calendarStore.deleteEvent(event)
  } else {
    console.error('Could not find event to delete with id:', eventId)
  }
  if (calendarRef.value) calendarRef.value.getApi().refetchEvents()
}

async function handleEventUpdate(changeInfo) {
  if (!authStore.isAuthenticated) return;

  const event = changeInfo.event
  await calendarStore.updateEvent({
    id: event.id,
    title: event.title,
    start: event.startStr,
    end: event.endStr,
    allDay: event.allDay,
    source: event.extendedProps.source,
  })
}

function formatDateTime(dateStr) {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

async function syncWithGoogleCalendar() {
  await calendarStore.sync()
  if (calendarRef.value) calendarRef.value.getApi().refetchEvents()
}

async function handleGoogleConnect() {
  try {
    const response = await axios.get(
      `http://127.0.0.1:8888/api/auth/google/redirect`
    )

    if (response.status === 200 && response.data?.data?.url) {
      // Redirect user to Google OAuth URL
      window.location.href = response.data.data.url
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Connection Failed',
        text: 'Could not get Google authentication URL.',
        confirmButtonColor: '#4285F4',
      })
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Connection Failed',
      text: 'Could not connect to Google. Please try again later.',
      confirmButtonColor: '#4285F4',
    })
  }
}

async function handleLogout() {
  await authStore.logout()
}

async function handleGoogleDisconnect() {
  try {
    // You need to implement this endpoint in your backend and api.js
    await authStore.disconnectGoogle()
    await authStore.checkAuth() // Refresh user info
    Swal.fire({
      icon: 'success',
      title: 'Disconnected',
      text: 'Google Calendar has been disconnected.',
      confirmButtonColor: '#4285F4',
    })
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Disconnection Failed',
      text: 'Could not disconnect Google Calendar. Please try again later.',
      confirmButtonColor: '#4285F4',
    })
  }
}

function openViewModal(clickInfo) {
  const event = clickInfo.event
  const props = event.extendedProps

  const startTime = dayjs(event.start).format('MMMM D, YYYY h:mm A')
  const endTime = event.end
    ? dayjs(event.end).format('MMMM D, YYYY h:mm A')
    : 'No end time'
  const description = props.description || 'No description provided.'
  const location = props.location || 'No location specified.'

  Swal.fire({
    title: event.title,
    html: `
      <div style="text-align: left; padding: 0 1em;">
        <p><strong>Starts:</strong> ${startTime}</p>
        <p><strong>Ends:</strong> ${endTime}</p>
        <p><strong>Location:</strong> ${location}</p>
        <hr style="margin: 1em 0;" />
        <p>${description}</p>
      </div>
    `,
    icon: 'info',
    confirmButtonText: 'Close',
  })
}
</script>

<template>
  <div class="flex h-screen font-sans text-sm">
    <!-- Google Calendar-style Loading Bar -->
    <div
      v-if="calendarStore.loading"
      class="absolute top-0 left-0 w-full h-1 z-50 overflow-hidden bg-blue-200"
    >
      <div class="h-full bg-blue-600 animate-progress-bar"></div>
    </div>

    <div
      v-if="calendarStore.error"
      class="absolute top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-md z-50"
    >
      Error loading events:
      {{ calendarStore.error.message || calendarStore.error }}
    </div>

    <!-- Sidebar -->
    <div class="w-80 leading-6 bg-blue-50 border-r border-blue-200">
      <div class="p-8 text-center bg-gray-100">
        <!-- Show User Info and Logout if Authenticated -->
        <div v-if="authStore.isAuthenticated && authStore.user">
          <span class="block mb-2 font-bold"
            >Welcome, {{ authStore.user.name }}!</span
          >
          <button
            @click="handleLogout"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Logout
          </button>
        </div>
        <!-- Show Login if Not Authenticated -->
        <div v-else>
          <router-link
            to="/login"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Login
          </router-link>
        </div>
      </div>
      <div class="p-8">
        <label class="flex items-center">
          <input
            type="checkbox"
            :checked="calendarOptions.weekends"
            @change="handleWeekendsToggle"
            class="mr-2"
          />
          toggle weekends
        </label>
      </div>
      <div v-if="authStore.isAuthenticated" class="p-8">
        <div v-if="authStore.user && authStore.user.google_calendar_connected">
          <button
            @click="syncWithGoogleCalendar"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mb-4"
          >
            Sync with Google Calendar
          </button>
          <button
            @click="handleGoogleDisconnect"
            class="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors mb-4"
          >
            Disconnect from Google Calendar
          </button>
        </div>
        <div v-else>
          <button
            @click="handleGoogleConnect"
            class="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors mb-4"
          >
            <i class="google-icon"></i>
            <span>Connect to Google Calendar</span>
          </button>
          <p class="text-xs text-gray-500 text-center">
            To see and manage Google Calendar events.
          </p>
        </div>
      </div>
      <div class="p-8">
        <h2 class="text-base font-bold m-0">
          All Events ({{ currentEvents.length }})
        </h2>
        <ul class="m-0 p-0 list-none mt-6">
          <li v-for="event in currentEvents" :key="event.id" class="my-6 p-0">
            <b class="mr-1">{{ formatDateTime(event.start) }}</b>
            <i>{{ event.title }}</i>
            <span
              v-if="event.source === 'google'"
              class="text-blue-600 text-xs ml-1"
              >(Google)</span
            >
          </li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-grow p-12">
      <FullCalendar
        ref="calendarRef"
        class="max-w-6xl mx-auto"
        :options="calendarOptions"
      >
        <template v-slot:eventContent="arg">
          <b class="mr-1">{{ arg.timeText }}</b>
          <i>{{ arg.event.title }}</i>
          <span
            v-if="arg.event.extendedProps.source === 'google'"
            class="text-blue-600 text-xs ml-1"
            >(Google)</span
          >
        </template>
      </FullCalendar>
    </div>

    <EventModal
      v-if="showModal"
      :mode="modalMode"
      :event="modalEvent"
      @save="handleModalSave"
      @cancel="closeModal"
      @delete="handleModalDelete"
    />
  </div>
</template>

<style>
/* You may need to add some global styles for FullCalendar overrides if Tailwind doesn't cover everything */
/* For example: */
.fc .fc-button {
  background-color: #4285f4 !important;
  border-color: #4285f4 !important;
  color: white !important;
}
.fc .fc-button:hover {
  background-color: #3367d6 !important;
}
.google-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  display: inline-block;
  vertical-align: middle;
  background: url('https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg')
    no-repeat center center;
  background-size: contain;
}
</style>
