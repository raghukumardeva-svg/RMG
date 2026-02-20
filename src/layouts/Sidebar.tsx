import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { getNavigationForRole } from "@/router/roleConfig";
import { profileService } from "@/services/profileService";
import { cn } from "@/lib/utils";
import acuvateLogo from "@/assets/acuvateLogo_light.png";
import acuvateIcon from "@/assets/acu_v_icon.png";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  User,
  Users,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Headphones,
  ClipboardCheck,
  Shield,
  Ticket,
  CalendarCheck,
  ClipboardList,
  Wallet,
  UserPlus,
  Target,
  Database,
  GitBranch,
  Activity,
  LineChart,
  BarChart3,
  CircleDot,
  Settings,
  IndianRupee,
  type LucideIcon,
} from "lucide-react";

// Icon map for navigation - only imports icons that are actually used
// This improves bundle size by avoiding importing all lucide-react icons
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  User,
  Users,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Headphones,
  ClipboardCheck,
  Shield,
  Ticket,
  CalendarCheck,
  ClipboardList,
  Wallet,
  UserPlus,
  Target,
  Database,
  GitBranch,
  Activity,
  LineChart,
  BarChart3,
  CircleDot,
  Settings,
  IndianRupee,
};

interface MenuSection {
  title?: string;
  items: Array<{
    path: string;
    label: string;
    icon: string;
    action?: () => void;
    children?: Array<{
      path: string;
      label: string;
      icon: string;
    }>;
  }>;
}

export function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  // Fetch user profile photo
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (user?.employeeId) {
        try {
          const profile = await profileService.getProfile(user.employeeId);
          if (profile.photo && profile.photo !== user.avatar) {
            updateUser({ avatar: profile.photo });
          }
        } catch (error) {
          // Silently fail - photo is optional
        }
      }
    };

    fetchProfilePhoto();
  }, [user?.employeeId, user?.avatar, updateUser]);

  if (!user) return null;

  const navigation = getNavigationForRole(user.role);

  // Filter navigation based on department for EMPLOYEE role
  const filteredNavigation = navigation.filter((item) => {
    // If user is EMPLOYEE, only show department-specific ticket pages
    if (user.role === "EMPLOYEE") {
      if (item.path === "/financeadmin/tickets") {
        return user.department === "Finance";
      }
      if (item.path === "/facilitiesadmin/tickets") {
        return user.department === "Facilities";
      }
    }
    return true;
  });

  const getIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || iconMap.CircleDot;
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Check if any child is active
  const hasActiveChild = (children: any[] | undefined) => {
    if (!children) return false;
    return children.some((child) => location.pathname === child.path);
  };

  // Organize navigation into sections
  const menuSections: MenuSection[] = [
    {
      items: filteredNavigation.map((item) => ({
        path: item.path,
        label: item.label,
        icon: item.icon || "CircleDot",
        children: item.children?.map((child) => ({
          path: child.path,
          label: child.label,
          icon: child.icon || "CircleDot",
        })),
      })),
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <nav
        className={cn(
          "h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out rounded-r-3xl shadow-lg",
          isCollapsed ? "w-20" : "w-[220px]",
          "bg-gray-900 border-r border-gray-800",
        )}
        aria-label="Sidebar"
      >
        {/* Header with Logo */}
        <div className="p-5 border-b border-gray-800">
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "justify-between",
            )}
          >
            {!isCollapsed && (
              <div>
                <img
                  src={acuvateLogo}
                  alt="Acuvate"
                  className="h-8 w-auto object-contain"
                />
              </div>
            )}
            {isCollapsed && (
              <div className="h-10 w-10 flex items-center justify-center">
                <img
                  src={acuvateIcon}
                  alt="Acuvate"
                  className="h-8 w-8 object-contain"
                />
              </div>
            )}
          </div>
        </div>
        {/* Navigation Sections */}
        <div
          className="flex-1 p-3 overflow-y-auto scrollbar-thin"
          aria-label="Main navigation"
        >
          {menuSections.map((section) => (
            <div
              key={section.items[0]?.label || JSON.stringify(section)}
              className="mb-6"
            >
              {/* Section Items */}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = getIcon(item.icon);
                  const isActive = location.pathname === item.path;
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = expandedItems[item.path];
                  const childActive = hasActiveChild(item.children);

                  const handleClick = (e: React.MouseEvent) => {
                    if (hasChildren) {
                      e.preventDefault();
                      toggleExpanded(item.path);
                    } else if (item.action) {
                      e.preventDefault();
                      item.action();
                    }
                  };

                  const linkContent = (
                    <div>
                      <Link
                        to={hasChildren ? "#" : item.path}
                        onClick={handleClick}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                          isCollapsed && "justify-center px-2",
                          isActive || childActive
                            ? "bg-brand-green/20 text-brand-green"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                            (isActive || childActive) && "scale-110",
                          )}
                          aria-hidden="true"
                        />

                        {!isCollapsed && (
                          <>
                            <span
                              className={cn(
                                "font-medium text-sm whitespace-nowrap transition-opacity duration-300 flex-1",
                                isCollapsed ? "opacity-0" : "opacity-100",
                              )}
                            >
                              {item.label}
                            </span>
                            {hasChildren &&
                              (isExpanded ? (
                                <ChevronUp className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                              ))}
                          </>
                        )}
                      </Link>

                      {/* Render children if expanded */}
                      {hasChildren && isExpanded && !isCollapsed && (
                        <ul className="ml-4 mt-1 space-y-1">
                          {item.children?.map((child) => {
                            const ChildIcon = getIcon(child.icon);
                            const isChildActive =
                              location.pathname === child.path;

                            return (
                              <li key={child.path}>
                                <Link
                                  to={child.path}
                                  aria-label={child.label}
                                  aria-current={
                                    isChildActive ? "page" : undefined
                                  }
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                                    isChildActive
                                      ? "bg-brand-green/20 text-brand-green"
                                      : "text-gray-400 hover:bg-gray-800 hover:text-white",
                                  )}
                                >
                                  <ChildIcon
                                    className={cn(
                                      "h-4 w-4 flex-shrink-0",
                                      isChildActive && "scale-110",
                                    )}
                                    aria-hidden="true"
                                  />
                                  <span className="font-medium text-sm">
                                    {child.label}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );

                  return (
                    <li key={item.path}>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-slate-800 text-white border-slate-700"
                          >
                            {item.label}
                            {hasChildren && item.children && (
                              <div className="mt-1 pl-2 space-y-1">
                                {item.children.map((child) => (
                                  <div
                                    key={child.path}
                                    className="text-xs text-gray-300"
                                  >
                                    • {child.label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkContent
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          className="fixed -right-3 top-20 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-300 z-50 shadow-md bg-brand-green text-white hover:bg-brand-green-dark focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 focus:ring-offset-gray-900"
          style={{ left: isCollapsed ? "68px" : "208px" }}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </nav>
    </TooltipProvider>
  );
}
