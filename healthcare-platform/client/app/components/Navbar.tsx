"use client";

import Link from "next/link";
import { Activity, User, LogOut, LayoutDashboard, Video } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/sessions", label: "Telemedicine", icon: Video },
    { href: "/profile", label: "Profile", icon: User },
  ];

  // Don't show navbar on login/register pages
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "glass py-2" : "bg-transparent py-4"}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-brand-primary p-2 rounded-xl">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-clinical-dark dark:text-clinical-white">
            Health<span className="text-brand-primary">Sync</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center space-x-2 text-sm font-medium transition-colors hover:text-brand-primary ${
                pathname.startsWith(link.href) ? "text-brand-primary" : "text-clinical-gray"
              }`}
            >
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          ))}
          <button className="flex items-center space-x-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
