"use client";

import * as React from "react";
import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  Package,
  User,
  Calendar,
  Users,
  CreditCard,
  SearchIcon,
  LoaderCircleIcon,
  Coins,
  BanknoteArrowUp,
  BanknoteArrowDown,
  Truck,
  ClipboardPlus,
  SquareActivity,
  Building2,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { UserButton } from '@neondatabase/auth/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLinkItem {
  title: string;
  href: string;
  description?: string;
  icon?: React.ElementType;
  badge?: string;
}

interface NavItem {
  title: string;
  href?: string;
  children?: NavLinkItem[];
}

// ─── Nav data ─────────────────────────────────────────────────────────────────

const navItems: NavItem[] = [
  {
    title: "Atendimentos",
    children: [
      { title: "Agenda",        href: "/treatment/scheduling", description: "Acompanhe os agendamentos e horários dos clientes", icon: Calendar },
      { title: "Pacientes",     href: "/treatment/patients",             description: "Gerencie as informações dos pacientes",           icon: Users },
      { title: "Pontuários",    href: "/treatment/points",               description: "Gerencie os pontos dos pacientes",               icon: ClipboardPlus },
      { title: "Procedimentos", href: "/treatment/procedures",           description: "Visualize e altere os procedimentos",            icon: SquareActivity },
    ],
  },
  {
    title: "Financeiro",
    children: [
      { title: "Fluxo de Caixa",     href: "/financial/cashflow",           description: "Acompanhe as entradas e saídas financeiras",       icon: Coins },
      { title: "Contas a Pagar",     href: "/financial/accounts-payable",   description: "Gerencie as contas a pagar e seus vencimentos",    icon: BanknoteArrowUp },
      { title: "Contas a Receber",   href: "/financial/accounts-receivable",description: "Gerencie as contas a receber e seus vencimentos",  icon: BanknoteArrowDown },
    ],
  },
  {
    title: "Estoque",
    children: [
      { title: "Produtos e Insumos", href: "/inventory/products",  description: "Gerencie os produtos e insumos do estoque", icon: Package },
      { title: "Fornecedores",       href: "/inventory/suppliers", description: "Gerencie as informações dos fornecedores",  icon: Truck },
    ],
  },
];

// ─── ListItem ─────────────────────────────────────────────────────────────────

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string; icon?: React.ElementType; badge?: string }
>(({ className, title, children, icon: Icon, badge, ...props }, ref) => (
  <li>
    <NavigationMenuLink
      ref={ref}
      className={cn("group flex select-none gap-3 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent focus:bg-accent", className)}
      {...props}
    >
      {Icon && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background shadow-xs transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
          <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium leading-none">{title}</span>
          {badge && <Badge variant="secondary" className="h-4 rounded-sm px-1 py-0 text-[10px] font-semibold">{badge}</Badge>}
        </div>
        {children && <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{children}</p>}
      </div>
    </NavigationMenuLink>
  </li>
));
ListItem.displayName = "ListItem";

// ─── SearchBar ────────────────────────────────────────────────────────────────

const SearchBar = () => {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!value) { setIsLoading(false); return; }
    setIsLoading(true);
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <div className="w-full max-w-xs space-y-2 px-3">
      <div className="relative">
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
          <SearchIcon className="size-4" />
        </div>
        <Input
          id={id}
          type="search"
          placeholder="Pesquisar..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="peer px-9 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
        />
        {isLoading && (
          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center pr-3">
            <LoaderCircleIcon className="size-4 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Mobile Nav ───────────────────────────────────────────────────────────────

function MobileNavSection({ item, onClose }: { item: NavItem; onClose: () => void }) {
  const [open, setOpen] = React.useState(false);

  if (!item.children) {
    return (
      <Link href={item.href ?? "#"} onClick={onClose} className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
        {item.title}
      </Link>
    );
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
        {item.title}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 ml-3 space-y-0.5 border-l pl-3">
          {item.children.map((child) => (
            <Link key={child.href} href={child.href} onClick={onClose}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              {child.icon && <child.icon className="h-4 w-4 shrink-0" />}
              <span>{child.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileSheet({ user, clinic, onSignOut }: { user?: any; clinic?: any; onSignOut: () => void }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden" />
        }
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Abrir menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-80 flex-col p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle render={<Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)} />}>
            <Logo />
          </SheetTitle>
          <div className="mt-2">
            <ClinicBadge name={clinic?.name} />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <MobileNavSection key={item.title} item={item} onClose={() => setOpen(false)} />
            ))}
          </nav>

          <Separator className="my-4" />

          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Conta</p>
            <Link href="/equipe" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <UserPlus className="h-4 w-4" /> Gerenciar Equipe
            </Link>
          </div>
        </ScrollArea>

        <div className="border-t p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs font-semibold">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user?.name || user?.email?.split('@')[0] || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive" onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair da conta
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center">
        <Image src="/logo.svg" width={500} height={500} alt="logo" />
      </div>
      <span className="font-semibold tracking-tight">SmileCorp</span>
    </div>
  );
}

// ─── ClinicBadge ──────────────────────────────────────────────────────────────

function ClinicBadge({ name }: { name?: string }) {
  if (!name) {
    return (
      <span className="text-sm font-medium text-muted-foreground italic">Sem clínica</span>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-accent/50 px-2.5 py-1 text-sm font-medium">
      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
      <span>{name}</span>
    </div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [clinic, setClinic] = useState<any>(null);

  const loadUser = async () => {
    try {
      const res = await fetch('/api/user');
      if (!res.ok) return;
      const data = await res.json();
      setUser(data.user);
      setClinic(data.clinic);
    } catch (e) {
      console.error("Navbar loadUser error:", e);
    }
  };

  useEffect(() => {
    // Refresh user data when pathname changes (navigation)
    loadUser();
  }, [pathname]);

  useEffect(() => {
    // Also refresh every 30 seconds as a fallback
    const interval = setInterval(loadUser, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await Promise.race([
        authClient.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
    } catch {}
    
    // Clear user and clinic immediately
    setUser(null);
    setClinic(null);
    
    try { router.push('/auth/sign-in'); } catch { window.location.href = '/auth/sign-in'; }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4">
        <div className="mx-auto flex h-14 items-center gap-4">

          {/* Mobile hamburger */}
          <MobileSheet user={user} clinic={clinic} onSignOut={handleSignOut} />

          {/* Logo */}
          <Link href="/" className="mr-2 flex items-center">
            <Logo />
          </Link>

          {/* Clinic name */}
          <div className="mr-4">
            <ClinicBadge name={clinic?.name} />
          </div>

          {/* Desktop nav */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {navItems.map((item) =>
                item.children ? (
                  <NavigationMenuItem key={item.title}>
                    <NavigationMenuTrigger className="h-8 text-sm font-medium bg-transparent">
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className={cn("grid gap-1 p-3", item.children.length > 4 ? "w-[520px] grid-cols-2" : "w-[360px] grid-cols-1")}>
                        {item.children.map((child) => (
                          <ListItem key={child.href} title={child.title} href={child.href} icon={child.icon} badge={child.badge}>
                            {child.description}
                          </ListItem>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={item.title}>
                    <Link href={item.href ?? "#"} legacyBehavior passHref>
                      <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "h-8 text-sm font-medium bg-transparent")}>
                        {item.title}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1">
            {/* Manage team link */}
            <Link href="/equipe">
              <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <UserPlus className="h-4 w-4" />
                <span className="hidden lg:inline">Equipe</span>
              </Button>
            </Link>

            <SearchBar />
            <Separator orientation="vertical" className="" />
            <UserButton size="icon" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;