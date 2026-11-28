export function TrafficSenseLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="ts-loader" role="status" aria-label={label}>
      <div className="ts-loader-disc">
        <i aria-hidden="true" />
        <i aria-hidden="true" />
        <b>
          <svg
            viewBox="0 0 24 24"
            width="48"
            height="48"
            fill="none"
            stroke="#11141A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path pathLength={1} d="M3 12h4l2-4 4 8 2-4h6" />
          </svg>
        </b>
      </div>
      <div className="ts-loader-wordmark">TrafficSense</div>
      <div className="ts-loader-bar" aria-hidden="true" />
    </div>
  );
}
