import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  BookOpen, Home, HelpCircle, Trophy, Star, Settings, LogOut,
  Plus, Shield, Menu, X, ChevronDown, Zap, Bookmark, Lightbulb, ShoppingCart, GraduationCap
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import AnnouncementBanner from "./AnnouncementBanner";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/questions", icon: HelpCircle, label: "Questions" },
  { href: "/clase", icon: GraduationCap, label: "Clase" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/badges", icon: Star, label: "Badges" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4 min-w-0">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="relative w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm flex-shrink-0">
                <BookOpen className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden xs:block sm:block">
                <span className="font-extrabold text-lg tracking-tight text-foreground">StudyWave</span>
                <span className="hidden lg:inline ml-1.5 text-xs font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded-full">Beta</span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_ITEMS.map(item => {
                const active = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <button className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-primary/8 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
                    }`}>
                      <item.icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {user ? (
                <>
                  <Link href="/ask" className="hidden md:block">
                    <Button size="sm" className="gap-2 shadow-sm gradient-primary text-white border-0 h-8 px-3.5 rounded-lg font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Ask a Question
                    </Button>
                  </Link>

                  <NotificationBell />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border border-border/60 hover:border-border hover:bg-gray-50/80 transition-all duration-150 flex-shrink-0">
                        <Avatar className="h-7 w-7 flex-shrink-0">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback className="gradient-primary text-white text-xs font-bold">
                            {user.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden sm:block text-left max-w-[100px]">
                          <p className="text-xs font-semibold text-foreground leading-tight truncate">{user.displayName}</p>
                          <p className="text-xs text-primary font-medium">{user.points?.toLocaleString()} pts</p>
                        </div>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block flex-shrink-0" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 shadow-xl border border-border/60 rounded-xl p-1.5">
                      <div className="px-3 py-2.5 mb-1">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatarUrl || undefined} />
                            <AvatarFallback className="gradient-primary text-white font-bold">{user.displayName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold leading-tight">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center gap-2 p-2 rounded-lg bg-primary/6 border border-primary/10">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium text-primary">{user.points?.toLocaleString()} points earned</span>
                        </div>
                      </div>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem asChild className="rounded-lg py-2 px-3 cursor-pointer">
                        <Link href={`/profile/${user.id}`}>Public Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg py-2 px-3 cursor-pointer">
                        <Link href="/bookmarks">
                          <Bookmark className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Bookmarks
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg py-2 px-3 cursor-pointer">
                        <Link href="/leaderboard#suggest">
                          <Lightbulb className="h-3.5 w-3.5 mr-2 text-amber-500" />
                          <span className="text-amber-600 font-medium">Suggest a Feature</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg py-2 px-3 cursor-pointer">
                        <Link href="/buy-points">
                          <ShoppingCart className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                          <span className="text-emerald-600 font-medium">Buy Points</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg py-2 px-3 cursor-pointer">
                        <Link href="/settings">
                          <Settings className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Account Settings
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "admin" && (
                        <>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem asChild className="rounded-lg py-2 px-3 cursor-pointer">
                            <Link href="/admin">
                              <Shield className="h-3.5 w-3.5 mr-2 text-primary" />
                              <span className="text-primary font-medium">Admin Panel</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        onClick={logout}
                        className="rounded-lg py-2 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-sm font-medium h-8 px-3.5">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="gradient-primary text-white border-0 h-8 px-4 rounded-lg font-semibold shadow-sm hover:opacity-90 transition-opacity">
                      Sign Up Free
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile menu toggle — visible below lg */}
              <button
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Announcement banner — inside sticky header so it doesn't push page content */}
        <AnnouncementBanner />

        {/* Mobile / tablet menu (below lg) */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border/60 bg-background">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    location === item.href ? "bg-primary/8 text-primary" : "text-muted-foreground"
                  }`}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                </Link>
              ))}
              {user && (
                <>
                  <Link href="/ask" onClick={() => setMobileOpen(false)}>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary bg-primary/8">
                      <Plus className="h-4 w-4" /> Ask a Question
                    </button>
                  </Link>
                  <Link href="/leaderboard" onClick={() => setMobileOpen(false)}>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-600 bg-amber-50">
                      <Lightbulb className="h-4 w-4" /> Suggest a Feature
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-sm text-foreground">StudyWave</span>
              <span className="text-muted-foreground text-sm">· Learn better, together</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2026 StudyWave. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
