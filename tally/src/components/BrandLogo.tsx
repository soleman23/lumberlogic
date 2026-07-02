export function BrandLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="60" height="60" rx="15" fill="#BC7A2C" />
      <rect x="13" y="37" width="12" height="12" rx="2.5" fill="#2B221A" />
      <rect x="26" y="37" width="12" height="12" rx="2.5" fill="#2B221A" />
      <rect x="39" y="37" width="12" height="12" rx="2.5" fill="#2B221A" />
      <rect x="19.5" y="24.5" width="12" height="12" rx="2.5" fill="#3D260F" />
      <rect x="32.5" y="24.5" width="12" height="12" rx="2.5" fill="#3D260F" />
      <rect x="26" y="12" width="12" height="12" rx="2.5" fill="#17120D" />
    </svg>
  )
}
