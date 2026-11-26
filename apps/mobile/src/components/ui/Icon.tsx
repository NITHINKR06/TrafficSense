import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Bookmark,
  Briefcase,
  Bus,
  Camera,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  CircleMinus,
  Clock,
  Construction,
  Droplet,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  House,
  Layers,
  List,
  Lock,
  LogOut,
  Mail,
  Map,
  MapPin,
  Moon,
  Navigation,
  OctagonAlert,
  Plus,
  RefreshCw,
  Route,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Waves,
  X,
} from "lucide-react-native";
import type { ColorPalette } from "../../theme/tokens";

export type IconName =
  | "house"
  | "map"
  | "route"
  | "user-round"
  | "shield-check"
  | "plus"
  | "search"
  | "sliders-horizontal"
  | "layers"
  | "arrow-up-down"
  | "arrow-left"
  | "arrow-right"
  | "x"
  | "check"
  | "camera"
  | "bus"
  | "ellipsis"
  | "settings"
  | "circle-help"
  | "shield"
  | "file-text"
  | "list"
  | "clock"
  | "briefcase"
  | "moon"
  | "log-out"
  | "bookmark"
  | "waves"
  | "flask-conical"
  | "mail"
  | "lock"
  | "eye"
  | "eye-off"
  | "octagon-alert"
  | "circle-minus"
  | "car"
  | "droplet"
  | "construction"
  | "circle-alert"
  | "navigation"
  | "map-pin"
  | "chevron-right"
  | "chevron-down"
  | "refresh-cw"
  | "bell"
  | "external-link";

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
};

const ICON_MAP = {
  house: House,
  map: Map,
  route: Route,
  "user-round": UserRound,
  "shield-check": ShieldCheck,
  plus: Plus,
  search: Search,
  "sliders-horizontal": SlidersHorizontal,
  layers: Layers,
  "arrow-up-down": ArrowUpDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  x: X,
  check: Check,
  camera: Camera,
  bus: Bus,
  ellipsis: Ellipsis,
  settings: Settings,
  "circle-help": CircleHelp,
  shield: Shield,
  "file-text": FileText,
  list: List,
  clock: Clock,
  briefcase: Briefcase,
  moon: Moon,
  "log-out": LogOut,
  bookmark: Bookmark,
  waves: Waves,
  "flask-conical": FlaskConical,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  "eye-off": EyeOff,
  "octagon-alert": OctagonAlert,
  "circle-minus": CircleMinus,
  car: Car,
  droplet: Droplet,
  construction: Construction,
  "circle-alert": CircleAlert,
  navigation: Navigation,
  "map-pin": MapPin,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "refresh-cw": RefreshCw,
  bell: Bell,
  "external-link": ExternalLink,
} as const;

export function Icon({
  name,
  size = 20,
  color = "#121619",
  strokeWidth = 2,
  filled = false,
}: IconProps) {
  const Component = ICON_MAP[name];
  return (
    <Component
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      fill={filled ? color : "none"}
    />
  );
}

export function categoryIconName(category: string): IconName {
  switch (category) {
    case "accident":
    case "breakdown":
    case "vehicle_breakdown":
      return "octagon-alert";
    case "road_closed":
    case "closure":
    case "road_closure":
      return "circle-minus";
    case "heavy_traffic":
    case "traffic":
    case "congestion":
      return "car";
    case "flood":
    case "waterlogging":
      return "droplet";
    case "road_repair":
    case "road_works":
    case "pothole":
    case "construction":
      return "construction";
    default:
      return "circle-alert";
  }
}

export function categoryTone(
  category: string,
  palette: ColorPalette,
): { bg: string; fg: string } {
  switch (category) {
    case "accident":
    case "breakdown":
    case "vehicle_breakdown":
    case "road_closed":
    case "closure":
    case "road_closure":
      return { bg: palette.dangerSoft, fg: palette.danger };
    case "flood":
    case "waterlogging":
    case "heavy_traffic":
    case "traffic":
    case "congestion":
      return { bg: palette.warningSoft, fg: palette.warning };
    default:
      return { bg: palette.surface2, fg: palette.text2 };
  }
}
