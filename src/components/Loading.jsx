import { Logo } from './Brand.jsx'

// A ring turning around the script Cal — same mark the reference site shows
// during its own initial load, ported here for the handful of pages that
// fetch their own data before there's anything to render (game center,
// article detail, player bio) instead of a blank page.
export default function LoadingScreen({ label = 'Loading' }) {
  return (
    <div className="loadwrap">
      <div className="loadmark" role="status" aria-label={label}>
        <span className="loadring" aria-hidden="true" />
        <Logo size={56} color="var(--blue)" />
      </div>
    </div>
  )
}
