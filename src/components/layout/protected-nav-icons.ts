import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Dumbbell,
  Home,
  Images,
  LayoutDashboard,
  Megaphone,
  Radio,
  ShieldCheck,
  Timer,
  Trophy,
  User,
  UserCheck,
  Users,
  Video,
} from "lucide-react";

export const protectedNavIcons = {
  home: Home,
  user: User,
  radio: Radio,
  trophy: Trophy,
  layoutDashboard: LayoutDashboard,
  calendar: Calendar,
  users: Users,
  dumbbell: Dumbbell,
  timer: Timer,
  shieldCheck: ShieldCheck,
  megaphone: Megaphone,
  userCheck: UserCheck,
  video: Video,
  images: Images,
} satisfies Record<string, LucideIcon>;

export type ProtectedNavIconKey = keyof typeof protectedNavIcons;
