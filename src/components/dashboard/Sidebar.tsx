import Link from "next/link";
import { LayoutDashboard, Users, Calendar, Settings, LogOut, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

const Sidebar = () => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Meetings", href: "/dashboard/meetings", icon: Calendar },
    { name: "Employees", href: "/dashboard/employees", icon: Users },
    { name: "Reports", href: "/dashboard/reports", icon: FileText },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col w-64 bg-white dark:bg-card border-r border-gray-200 dark:border-gray-800 min-h-screen p-4 shadow-sm">
      <div className="flex items-center justify-center mb-8 pt-4">
        <Image 
          src="/logo.png" 
          alt="MeetTrack Pro Logo" 
          width={180} 
          height={60} 
          className="object-contain"
          priority
        />
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 rounded-lg transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-primary text-white shadow-md dark:bg-primary dark:text-white" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-white"
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {user?.displayName || "Admin User"}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
