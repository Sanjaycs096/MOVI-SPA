export default function MaterialSymbol({
  name,
  className = '',
  filled = false,
  ariaLabel,
}) {
  const visibilityClass = filled ? 'is-filled' : ''

  return (
    <span
      className={`material-symbols-rounded app-symbol ${visibilityClass} ${className}`.trim()}
      aria-hidden={ariaLabel ? undefined : 'true'}
      aria-label={ariaLabel}
    >
      {name}
    </span>
  )
}
