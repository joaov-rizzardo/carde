export default function DashboardLoading() {
  return (
    <div className="min-h-full p-6 md:p-10 animate-pulse" style={{ background: '#F7F3EE' }}>
      <div className="mb-10 max-w-xl">
        <div className="h-9 w-64 rounded-xl mb-3" style={{ background: '#E5E0D8' }} />
        <div className="h-5 w-80 rounded-lg" style={{ background: '#E5E0D8' }} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-5 rounded-2xl p-6"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(26, 26, 46, 0.08)',
            }}
          >
            <div className="h-11 w-11 rounded-xl" style={{ background: '#F0EDE8' }} />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-28 rounded-lg" style={{ background: '#F0EDE8' }} />
              <div className="h-4 w-full rounded-lg" style={{ background: '#F0EDE8' }} />
              <div className="h-4 w-3/4 rounded-lg" style={{ background: '#F0EDE8' }} />
            </div>
            <div className="h-6 w-24 rounded-full" style={{ background: '#F0EDE8' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
