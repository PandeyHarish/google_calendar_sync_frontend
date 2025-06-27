<template>
  <teleport to="body">
    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 transition-opacity">
      <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg font-sans transition-all">
        <h3 class="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">
          {{ mode === 'create' ? 'Create Event' : 'Edit Event' }}
        </h3>
        
        <div class="space-y-6">
          <div class="form-group">
            <label for="title" class="block mb-2 font-semibold text-gray-600">Title:</label>
            <input id="title" v-model="localEvent.title" type="text" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div class="form-group">
            <label for="start" class="block mb-2 font-semibold text-gray-600">Start:</label>
            <flat-pickr id="start" v-model="localEvent.start" :config="flatpickrConfig" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
          </div>

          <div class="form-group">
            <label for="end" class="block mb-2 font-semibold text-gray-600">End:</label>
            <flat-pickr id="end" v-model="localEvent.end" :config="flatpickrConfig" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"/>
          </div>

          <div class="flex items-center">
            <input id="allDay" v-model="localEvent.allDay" type="checkbox" class="h-5 w-5 rounded mr-3"/>
            <label for="allDay" class="font-semibold text-gray-600">All Day</label>
          </div>
        </div>

        <div class="flex justify-end gap-4 mt-8">
          <button @click="onSave" class="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors">
            {{ mode === 'create' ? 'Create' : 'Update' }}
          </button>
          <button @click="onCancel" class="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">Cancel</button>
          <button v-if="mode === 'edit'" @click="onDelete" class="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { reactive, watch } from 'vue'
import dayjs from 'dayjs'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'

const props = defineProps({
  mode: String, // 'create' | 'edit'
  event: Object,
})
const emit = defineEmits(['save', 'cancel', 'delete'])

const localEvent = reactive({
  id: null,
  title: '',
  start: '',
  end: '',
  allDay: false,
  source: '',
})

const flatpickrConfig = reactive({
  enableTime: true,
  dateFormat: 'Y-m-d H:i',
  altInput: true,
  altFormat: 'F j, Y h:i K',
})

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
      localEvent.start = formatForInput(val.start)
      localEvent.end = formatForInput(val.end)
      localEvent.allDay = !!val.allDay
      localEvent.source = val.source || ''
    }
  },
  { immediate: true }
)

function onSave() {
  const eventPayload = { ...localEvent }
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
/* Overriding flatpickr styles to match Tailwind form inputs */
.flatpickr-input {
  background-color: white !important;
}
</style>
