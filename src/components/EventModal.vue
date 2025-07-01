<template>
  <teleport to="body">
    <div
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 transition-opacity"
    >
      <div
        class="bg-white p-4 sm:p-8 rounded-xl shadow-2xl w-full max-w-xl font-sans transition-all max-h-[90vh] overflow-y-auto"
      >
        <h3 class="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">
          {{ mode === 'create' ? 'Create Event' : 'Edit Event' }}
        </h3>

        <!-- Guest Info (only for unauthenticated users) -->
        <div v-if="!authStore.isAuthenticated" class="mb-6">
          <label class="block mb-1 text-gray-600 font-semibold"
            >Your Name</label
          >
          <input
            v-model="guestName"
            type="text"
            placeholder="Enter your name"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <label class="block mb-1 text-gray-600 font-semibold"
            >Your Email</label
          >
          <input
            v-model="guestEmail"
            type="email"
            placeholder="Enter your email"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Title -->
        <div class="mb-6">
          <input
            id="title"
            v-model="localEvent.title"
            type="text"
            placeholder="Add title"
            class="w-full p-3 text-xl border-b border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold"
            autofocus
          />
        </div>

        <!-- Date/Time and All Day -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <div class="flex-1">
            <label class="block mb-1 text-gray-600 font-semibold">Start</label>
            <flat-pickr
              v-model="localEvent.start"
              :config="flatpickrConfig"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex-1">
            <label class="block mb-1 text-gray-600 font-semibold">End</label>
            <flat-pickr
              v-model="localEvent.end"
              :config="flatpickrConfig"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center mt-2 sm:mt-7">
            <input
              id="allDay"
              v-model="localEvent.allDay"
              type="checkbox"
              class="h-5 w-5 rounded mr-2"
            />
            <label for="allDay" class="text-gray-600 font-semibold"
              >All Day</label
            >
          </div>
        </div>

        <!-- Location & Video Call -->
        <div class="flex flex-col sm:flex-row gap-4 mb-6">
          <div class="flex-1">
            <label class="block mb-1 text-gray-600 font-semibold"
              >Location</label
            >
            <input
              v-model="localEvent.location"
              type="text"
              placeholder="Add location"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <!-- <div class="flex-1">
            <label class="block mb-1 text-gray-600 font-semibold"
              >URL/Video Call</label
            >
            <input
              v-model="localEvent.url"
              type="text"
              placeholder="Add meeting link"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div> -->
        </div>

        <!-- Description -->
        <div class="mb-6">
          <label class="block mb-1 text-gray-600 font-semibold"
            >Description</label
          >
          <textarea
            v-model="localEvent.description"
            placeholder="Add description"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows="2"
          ></textarea>
        </div>

        <!-- Attendees -->
        <div class="mb-6">
          <label class="block mb-1 text-gray-600 font-semibold"
            >Attendees</label
          >
          <div class="flex gap-2 flex-wrap mb-2">
            <span
              v-for="(att, idx) in attendeeList"
              :key="idx"
              class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center"
            >
              {{ att.email }}
              <button
                class="ml-1 text-red-500 hover:text-red-700"
                @click="removeAttendee(idx)"
                type="button"
              >
                ×
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input
              v-model="attendeeInput"
              type="email"
              placeholder="Add attendee email"
              class="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              @keyup.enter="addAttendee"
            />
            <button
              class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              type="button"
              @click="addAttendee"
            >
              Add
            </button>
          </div>
        </div>

        <!-- Recurrence, Visibility, Status, Color -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block mb-1 text-gray-600 font-semibold"
              >Recurrence</label
            >
            <select
              v-model="recurrenceRule"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Does not repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <div>
            <label class="block mb-1 text-gray-600 font-semibold"
              >Visibility</label
            >
            <select
              v-model="localEvent.visibility"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Default</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="confidential">Confidential</option>
            </select>
          </div>
          <div>
            <label class="block mb-1 text-gray-600 font-semibold">Status</label>
            <select
              v-model="localEvent.status"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Default</option>
              <option value="confirmed">Confirmed</option>
              <option value="tentative">Tentative</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label class="block mb-1 text-gray-600 font-semibold">Color</label>
            <input
              v-model="localEvent.colorId"
              type="text"
              placeholder="Color ID"
              class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-4 mt-8">
          <button
            @click="onSave"
            class="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
          >
            {{ mode === 'create' ? 'Create' : 'Update' }}
          </button>
          <button
            @click="onCancel"
            class="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            v-if="mode === 'edit' && authStore.isAuthenticated"
            @click="onDelete"
            class="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { reactive, watch, ref } from 'vue'
import dayjs from 'dayjs'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  mode: String, // 'create' | 'edit'
  event: Object,
})
const emit = defineEmits(['save', 'cancel', 'delete'])

const authStore = useAuthStore()

const localEvent = reactive({
  id: null,
  title: '',
  description: '',
  location: '',
  url: '',
  start: '',
  end: '',
  allDay: false,
  recurrence: '',
  attendees: '',
  visibility: '',
  status: '',
  colorId: '',
  // organizer and creator will be set programmatically
  source: '',
})

const flatpickrConfig = reactive({
  enableTime: true,
  dateFormat: 'Y-m-d H:i',
  altInput: true,
  altFormat: 'F j, Y h:i K',
})

const attendeeInput = ref('')
const attendeeList = ref([])
const recurrenceRule = ref('')
const guestName = ref('')
const guestEmail = ref('')

function formatForInput(dateStr) {
  if (!dateStr) return ''
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

watch(
  () => props.event,
  (val) => {
    if (val) {
      localEvent.id = val.id || null
      localEvent.title = val.title || ''
      localEvent.description = val.description || ''
      localEvent.location = val.location || ''
      localEvent.url = val.url || ''
      localEvent.start = formatForInput(val.start)
      localEvent.end = formatForInput(val.end)
      localEvent.allDay = !!val.allDay
      // Recurrence
      if (Array.isArray(val.recurrence) && val.recurrence.length > 0) {
        if (val.recurrence[0].includes('DAILY')) recurrenceRule.value = 'DAILY'
        else if (val.recurrence[0].includes('WEEKLY'))
          recurrenceRule.value = 'WEEKLY'
        else if (val.recurrence[0].includes('MONTHLY'))
          recurrenceRule.value = 'MONTHLY'
        else if (val.recurrence[0].includes('YEARLY'))
          recurrenceRule.value = 'YEARLY'
        else recurrenceRule.value = ''
      } else {
        recurrenceRule.value = ''
      }
      // Attendees as array of objects with email
      if (Array.isArray(val.attendees)) {
        attendeeList.value = val.attendees
        localEvent.attendees = JSON.stringify(val.attendees)
      } else {
        attendeeList.value = []
        localEvent.attendees = ''
      }
      localEvent.visibility = val.visibility || ''
      localEvent.status = val.status || ''
      localEvent.colorId = val.colorId || ''
      localEvent.source = val.source || ''
    }
  },
  { immediate: true }
)

function addAttendee() {
  const email = attendeeInput.value.trim()
  if (email && !attendeeList.value.some((a) => a.email === email)) {
    attendeeList.value.push({ email })
    localEvent.attendees = JSON.stringify(attendeeList.value)
    attendeeInput.value = ''
  }
}
function removeAttendee(idx) {
  attendeeList.value.splice(idx, 1)
  localEvent.attendees = JSON.stringify(attendeeList.value)
}

function onSave() {
  const eventPayload = { ...localEvent }
  // Recurrence as array
  if (recurrenceRule.value) {
    eventPayload.recurrence = [`RRULE:FREQ=${recurrenceRule.value}`]
  } else {
    eventPayload.recurrence = null
  }
  // Attendees as array
  eventPayload.attendees = attendeeList.value
  // Add guest info if not authenticated
  if (!authStore.isAuthenticated) {
    eventPayload.guestName = guestName.value
    eventPayload.guestEmail = guestEmail.value
  }
  if (eventPayload.end === '') {
    eventPayload.end = null
  }
  emit('save', eventPayload)
}
function onCancel() {
  emit('cancel')
}
function onDelete() {
  emit('delete', localEvent.id)
}
</script>

<style>
.flatpickr-input {
  background-color: white !important;
}
</style>
