import { Link, useLocation } from "wouter";
import { Gamepad2, Trophy, List, User, Search, Menu, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Inicio", icon: Gamepad2 },
    { href: "/ranking", label: "Ranking", icon: Trophy },
    { href: "/mi-lista", label: "Mi Lista", icon: List },
    { href: "/perfil", label: "Perfil", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 md:pb-0 font-sans">
      {/* Desktop Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-primary hidden md:inline-block">GameReviews</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-primary ${
                    location === link.href ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            {user ? (
              <Link href="/perfil">
                <Avatar className="h-8 w-8 cursor-pointer border border-primary/20 hover:border-primary transition-colors">
                  <AvatarFallback style={{ backgroundColor: user.avatarColor, color: "#fff" }}>
                    {user.nombre.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {/* Mobile Nav overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur border-b border-border p-4"
          >
            <nav className="flex flex-col gap-4 text-lg">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                    location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container px-4 py-8 md:px-8 mx-auto max-w-7xl">
        {children}
      </main>

      {/* Bottom Tab Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur h-16 flex items-center justify-around px-2">
        {navLinks.map((link) => {
          const isActive = location === link.href || (link.href !== '/' && location.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              <link.icon className={`h-5 w-5 ${isActive ? 'fill-primary/20' : ''}`} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
