import { UserMenu } from './user-menu'

type HeaderProps = {
  restaurantName: string
  userEmail: string | null | undefined
  userName: string | null | undefined
}

export function Header({ restaurantName, userEmail, userName }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-brand-primary border-b border-white/10">
      <h1 className="text-white font-display text-lg font-semibold truncate">
        {restaurantName}
      </h1>
      <UserMenu email={userEmail} name={userName} />
    </header>
  )
}
