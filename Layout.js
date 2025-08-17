import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  MessageCircle, 
  Heart, 
  BarChart3, 
  BookOpen, 
  Settings,
  Shield,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "צ'ק-אין יומי",
    url: createPageUrl("Dashboard"),
    icon: MessageCircle,
    description: "התחל את השיחה היומית לבריאות הנפש"
  },
  {
    title: "היסטוריית שיחות",
    url: createPageUrl("History"),
    icon: BarChart3,
    description: "צפה בשיחות קודמות ומגמות מצב רוח"
  },
  {
    title: "משאבי בריאות נפש",
    url: createPageUrl("Resources"),
    icon: BookOpen,
    description: "כלים לטיפול עצמי והדרכה"
  },
  {
    title: "הגדרות",
    url: createPageUrl("Settings"),
    icon: Settings,
    description: "פרטיות, שפה והעדפות"
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-white to-blue-50" dir="rtl">
        <style>
          {`
            :root {
              --primary: 224 76% 48%;
              --primary-foreground: 210 40% 98%;
              --secondary: 215 100% 96%;
              --accent: 142 76% 36%;
              --muted: 215 100% 96%;
              --border: 214 32% 91%;
            }
            * {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
          `}
        </style>
        
        <Sidebar className="border-l border-blue-100 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-blue-100 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">מגן נפש</h2>
                <p className="text-sm text-blue-600 font-medium">תמיכה נפשית חכמה</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-3">
                כלי תמיכה
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`mb-2 rounded-xl transition-all duration-200 ${
                          location.pathname === item.url 
                            ? 'bg-blue-100 text-blue-700 shadow-sm' 
                            : 'hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-sm">{item.title}</span>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-3">
                גישה מהירה
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-3 py-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">זקוק לעזרה עכשיו?</span>
                  </div>
                  <p className="text-xs text-green-700 mb-3">
                    אם אתה במשבר, פנה לעזרה מיד
                  </p>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors">
                    תמיכה חירום
                  </button>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-blue-100 p-4">
            <div className="flex items-center gap-3 px-2 py-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">חייל</p>
                <p className="text-xs text-gray-500 truncate">הפרטיות שלך מוגנת</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-blue-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-gray-900">מגן נפש</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}