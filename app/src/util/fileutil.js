// File utilities

export function formatBytes(bytes, decimals = 2) {
  // Returns bytes formatted like 5MB
  // https://stackoverflow.com/a/18650828/8748307
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDatetime(date) {
  // Returns datetime formated like
  const tzOffsetMs = new Date().getTimezoneOffset() * 60 * 1000 // Get local timezone offset
  const localDatetime = new Date(new Date(date) - tzOffsetMs) // Subtract tz offset from datetime to get local datetime
  return localDatetime.toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " at ") // ISO format and return local datetime
}

export function getIconByMIMEType (fileType, isFolder) {
  // Returns a font awesome icon name for a specified file type
  const icons = [ // Array of MIME type prefixes and their associated file icons. The first match is used, so place more specific types higher.
    ['application/vnd.ms-powerpoint', 'file powerpoint'],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'file powerpoint'],
    ['application/msword', 'file text'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'file text'],
    ['application/vnd.ms-excel', 'file excel'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'file excel'],
    ['application/gzip', 'file archive'],
    ['application/vnd.rar', 'file archive'],
    ['application/x-tar', 'file archive'],
    ['application/x-7z-compressed', 'file archive'],
    ['application/zip', 'file archive'],
    ['application/x-httpd-php', 'php'],
    ['application/pdf', 'file pdf'],
    ['text/javascript', 'js square'],
    ['text/html', 'html5'],
    ['text', 'file text'],
    ['video', 'video'],
    ['audio', 'file audio'],
    ['font', 'font'],
    ['image', 'image'],
  ]

  return isFolder ? 'folder' :
    (icons.find(([mimeType]) => fileType.startsWith(mimeType)) || ['unknown', 'file'])[1]
}

export default () => {}