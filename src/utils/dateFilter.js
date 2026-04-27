export function isSameMonth(dateValue, filterDate) {
  if (!filterDate || !dateValue) return true
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return true
  return (
    date.getMonth() === filterDate.getMonth() &&
    date.getFullYear() === filterDate.getFullYear()
  )
}

export function filterByMonth(items, filterDate, getDate) {
  if (!filterDate) return items
  return items.filter((item) => isSameMonth(getDate(item), filterDate))
}
