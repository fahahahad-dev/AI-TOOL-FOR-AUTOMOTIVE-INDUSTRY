import { SidebarProvider } from "@/components/ui/sidebar"
import { DashboardSidebar } from "@/modules/dashboard/sidebar"
import { getAllProjectsForUser } from "@/modules/projects/actions"
import type React from "react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const projectData = await getAllProjectsForUser()

  const formattedProjectsData =
    projectData?.map((item) => ({
      id: item.id,
      name: item.title,
      // starred: item.stars?.[0]?.isMarked || false,
      // Pass the icon name as a string
      icon: "Code2", // Default to "Code2"
    })) || []

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        {/* Pass the formatted data with string icon names */}
        <DashboardSidebar initialProjectsData={formattedProjectsData} />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  )
}
