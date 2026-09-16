let counter = 0

export function loadJsonp(baseUrl, { timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = `__jsonp_cb_${Date.now()}_${counter++}`
    let settled = false
    let timer

    const cleanup = () => {
      delete window[callbackName]
      script.remove()
      clearTimeout(timer)
    }

    window[callbackName] = data => {
      if (settled) return
      settled = true
      cleanup()
      resolve(data)
    }

    const script = document.createElement('script')
    script.onerror = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('JSONP request failed'))
    }

    timer = setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('JSONP request timed out'))
    }, timeoutMs)

    const sep = baseUrl.includes('?') ? '&' : '?'
    script.src = `${baseUrl}${sep}callback=${callbackName}&_=${Date.now()}`
    document.head.appendChild(script)
  })
}
