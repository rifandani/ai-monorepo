import { AppSidebar } from '@/core/components/app-sidebar';
import { AppSidebarNav } from '@/core/components/app-sidebar-nav';
import { SidebarInset } from '@/core/components/ui/sidebar';
import { SidebarProvider } from '@/core/components/ui/sidebar';
import { getChatHistory } from '@/core/utils/filesystem';
import type React from 'react';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chatHistory = await getChatHistory();

  return (
    <SidebarProvider>
      <AppSidebar chatHistory={chatHistory} />
      <SidebarInset>
        <AppSidebarNav />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
