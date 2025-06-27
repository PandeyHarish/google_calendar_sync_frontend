import axios from 'axios'
const API_BASE = '/api'

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function getGoogleRedirectUrl() {
  const { data } = await axios.get(`${API_BASE}/auth/google/redirect`)
  return data.redirect_url
}

export async function fetchGoogleEvents() {
  const { data } = await axios.get(`${API_BASE}/google-calendar`)
  return data.data
}

// create/update/delete Google Event
export async function createGoogleEvent(event) {
  const res = await axios.post(`${API_BASE}/google-calendar`, event)
  return res.data.data
}

export async function fetchLocalEvents() {
  const response = await axios.get(`${API_BASE}/events`)
  return response.data.data
}

export async function createLocalEvent(event) {
  const { data } = await axios.post(`${API_BASE}/events`, event)
  return data
}

export async function updateLocalEvent(id, event) {
  const { data } = await axios.put(`${API_BASE}/events/${id}`, event)
  return data
}

export async function deleteLocalEvent(id) {
  return axios.delete(`${API_BASE}/events/${id}`)
}

export async function updateGoogleEvent(id, event) {
  const { data } = await axios.put(`${API_BASE}/google-calendar/${id}`, event)
  return data
}

export async function deleteGoogleEvent(id) {
  return axios.delete(`${API_BASE}/google-calendar/${id}`)
}

// --- Auth ---
export async function getAuthenticatedUser() {
  const { data } = await axios.get(`${API_BASE}/auth/me`)
  return data.data
}

export async function logoutUser() {
  return axios.post(`${API_BASE}/auth/logout`)
}

export async function loginWithEmail(credentials) {
  const { data } = await axios.post(`${API_BASE}/auth/login`, credentials)
  return data
}

export async function disconnectGoogle() {
  // You may need to implement this endpoint in your backend
  return axios.post('/api/auth/google/disconnect')
}
