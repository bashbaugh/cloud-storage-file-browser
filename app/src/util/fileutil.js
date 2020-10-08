// File utilities

export function formatBytes(bytes, decimals = 2) {
  // https://stackoverflow.com/a/18650828/8748307
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDatetime(date) {
  const tzOffsetMs = new Date().getTimezoneOffset() * 60 * 1000 // Get local timezone offset
  const localDatetime = new Date(new Date(date) - tzOffsetMs) // Subtract tz offset from datetime to get local datetime
  return localDatetime.toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " at ") // ISO format and return local datetime
}

export default () => {}