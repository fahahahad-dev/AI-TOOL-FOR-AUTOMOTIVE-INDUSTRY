"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Code2,
  Compass,
  FolderPlus,
  History,
  Home,
  LayoutDashboard,
  Lightbulb,
  type LucideIcon,
  Plus,
  Settings,
  Star,
  Terminal,
  Zap,
  Database,
  FlameIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import Image from "next/image"

// Define the interface for a single Project item, icon is now a string
interface ProjectData {
  id: string
  name: string
  // starred: boolean
}

export function DashboardSidebar({ initialProjectsData }: { initialProjectsData: ProjectData[] }) {
  const pathname = usePathname()
  // const [starredProjects, setStarredProjects] = useState(initialProjectsData.filter((p) => p.starred))
  const [recentProjects, setRecentProjects] = useState(initialProjectsData)

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-1 border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-3 justify-center">
          <Image src={"/logo-white.png"} alt="logo" height={90} width={300} />
        </div>
       
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Home">
                <Link href="/">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Dashboard">
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          
          </SidebarMenu>
        </SidebarGroup>

        {/* <SidebarGroup>
          <SidebarGroupLabel>
            <Star className="h-4 w-4 mr-2" />
            Starred
          </SidebarGroupLabel>
          <SidebarGroupAction title="Add Starred Projects">
            <Plus className="h-4 w-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>

              {starredProjects.length === 0 && starredProjects.length === 0 ? (
                <div className="text-center text-muted-foreground py-4 w-full">Add New Project</div>
              ) : (
                starredProjects.map((project) => {
                  const IconComponent = Code2;
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/editor/${project.id}`}
                        tooltip={project.name}
                      >
                        <Link href={`/editor/${project.id}`}>
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                          <span>{project.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}

        <SidebarGroup>
          <SidebarGroupLabel>
            <History className="h-4 w-4 mr-2" />
            Recent
          </SidebarGroupLabel>
          <SidebarGroupAction title="Add New Projects">
            <FolderPlus className="h-4 w-4" />
          </SidebarGroupAction>
          <SidebarGroupContent>
            {/* <SidebarMenu>
              {starredProjects.length === 0 && recentProjects.length === 0 ? null : (
                recentProjects.map((project) => {
                  const IconComponent = Code2;
                  return (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/editor/${project.id}`}
                        tooltip={project.name}
                      >
                        <Link href={`/editor/${project.id}`}>
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                          <span>{project.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu> */}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
