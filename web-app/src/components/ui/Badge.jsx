import { badgeStyle } from '../../styles/theme'

export default function Badge({ variant = 'neutral', children }) {
  return <span style={badgeStyle(variant)}>{children}</span>
}
