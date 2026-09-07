/** Formate une date (ISO ou objet Date) au format JJ/MM/AAAA. */
export function formatDate(valeur) {
  if (!valeur) return ''
  const d = new Date(valeur)
  if (isNaN(d.getTime())) return ''
  const jj = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const aaaa = d.getFullYear()
  return `${jj}/${mm}/${aaaa}`
}

/** Idem + heure (JJ/MM/AAAA HH:MM). */
export function formatDateHeure(valeur) {
  if (!valeur) return ''
  const d = new Date(valeur)
  if (isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(valeur)} ${hh}:${min}`
}
