const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request(method, path, body) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE}${path}`, options)
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: 'Request failed.' }))
    const message = detail.detail || detail.message || 'Request failed.'
    throw new Error(message)
  }

  return response.json()
}

export function apiGet(path) {
  return request('GET', path)
}

export function apiPost(path, body) {
  return request('POST', path, body)
}

export function apiPut(path, body) {
  return request('PUT', path, body)
}
