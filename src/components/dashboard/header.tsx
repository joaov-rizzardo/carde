import { UserMenu } from './user-menu'

type HeaderProps = {
  restaurantName: string
  userEmail: string | null | undefined
  userName: string | null | undefined
}

export function Header({ restaurantName, userEmail, userName }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between h-16 px-4 md:px-6 shrink-0"
      style={{
        background: '#1A1A2E',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: '#16A34A', boxShadow: '0 0 6px #16A34A' }}
        />
        <h1 className="font-display text-base font-medium text-white truncate">
          {restaurantName}
        </h1>
      </div>
      <UserMenu email={userEmail} name={userName} />
    </header>
  )
}
