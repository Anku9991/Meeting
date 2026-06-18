"use client";

import { useEffect, useState } from "react";
import { Menu, Search, Bell, UserCheck, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "next-themes";

const Header = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const q = query(
          collection(db, "attendances"),
          orderBy("checkInTime", "desc"),
          limit(5)
        );
        const snap = await getDocs(q);
        const latest = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        setNotifications(latest);
        // Just mock unread count based on recent fetching
        setUnreadCount(latest.length > 0 ? latest.length : 0);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setUnreadCount(0);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div className="flex items-center flex-1">
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative w-full max-w-md hidden md:flex">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search meetings, employees..."
            className="w-full bg-gray-50/50 hover:bg-gray-100/50 transition-colors focus:bg-white pl-10 border-gray-200 rounded-full shadow-inner"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full hover:bg-primary/5 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
        <Popover onOpenChange={handleOpenChange}>
          <PopoverTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9 relative hover:bg-primary/5 rounded-full">
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 shadow-xl">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
              <h4 className="font-semibold text-sm text-gray-900">Notifications</h4>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3">
                    <div className="mt-0.5 bg-green-100 p-1.5 rounded-full text-green-600">
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {notif.guestName} <span className="font-normal text-gray-500">checked in</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notif.checkInTime ? formatDistanceToNow(notif.checkInTime.toDate(), { addSuffix: true }) : "Just now"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No new notifications
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
};

export default Header;
