'use client';

import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import type React from 'react';
import { twMerge } from 'tailwind-merge';
import { deleteChatAction } from '@/core/actions/chat';
import { Avatar } from '@/core/components/ui/avatar';
import { Link } from '@/core/components/ui/link';
import { Menu } from '@/core/components/ui/menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarLink,
  SidebarRail,
  SidebarSection,
  SidebarSectionGroup,
  useSidebar,
} from '@/core/components/ui/sidebar';

interface ChatHistoryItem {
  id: string;
  content: string;
  createdAt: Date | undefined;
}

// Update component props to accept chatHistory
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  chatHistory: ChatHistoryItem[];
}

export function AppSidebar({ chatHistory, ...props }: AppSidebarProps) {
  const { state } = useSidebar();
  const params = useParams();
  const { execute: deleteChat, isPending: isDeleting } =
    useAction(deleteChatAction);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link
          className="flex items-center gap-x-2 group-data-[collapsible=dock]:size-10 group-data-[collapsible=dock]:justify-center"
          href="/"
        >
          <Icon className="size-5" icon="arcticons:openai-chatgpt" />
          <SidebarLabel className="font-medium">ChatGPT</SidebarLabel>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSectionGroup>
          <SidebarSection>
            <SidebarItem className="gap-2" href="/chat">
              <Icon className="size-4" icon="lucide:plus" />
              <SidebarLabel>New Chat</SidebarLabel>
            </SidebarItem>
          </SidebarSection>

          <SidebarSection title="History">
            {/* Map over the chatHistory prop */}
            {chatHistory.map((chat) => (
              <SidebarItem isCurrent={params.id === chat.id} key={chat.id}>
                {({ isCollapsed }) => (
                  <>
                    {/* Update href to link to the chat page */}
                    <SidebarLink href={`/chat/${chat.id}`}>
                      <SidebarLabel>{chat.content}</SidebarLabel>
                    </SidebarLink>
                    {!isCollapsed && (
                      <Menu>
                        <Menu.Trigger aria-label="Manage">
                          <Icon icon="lucide:more-horizontal" />
                        </Menu.Trigger>
                        <Menu.Content offset={0} placement="right top">
                          <Menu.Item
                            className="gap-2"
                            isDisabled={isDeleting}
                            onAction={() => {
                              // TODO: implement share
                            }}
                          >
                            <Icon icon="lucide:upload" />
                            Share
                          </Menu.Item>
                          <Menu.Item
                            className="gap-2"
                            isDisabled={isDeleting}
                            onAction={() => {
                              // TODO: implement rename
                            }}
                          >
                            <Icon icon="lucide:pencil" />
                            Rename
                          </Menu.Item>
                          <Menu.Item
                            className="gap-2"
                            isDisabled={isDeleting}
                            onAction={() => {
                              // TODO: implement archive
                            }}
                          >
                            <Icon icon="lucide:archive" />
                            Archive
                          </Menu.Item>
                          <Menu.Item
                            className="gap-2"
                            isDanger
                            isDisabled={isDeleting}
                            onAction={() =>
                              deleteChat({
                                id: chat.id,
                                redirect: params.id === chat.id,
                              })
                            }
                          >
                            <Icon icon="lucide:trash" />
                            Delete
                          </Menu.Item>
                        </Menu.Content>
                      </Menu>
                    )}
                  </>
                )}
              </SidebarItem>
            ))}
          </SidebarSection>
        </SidebarSectionGroup>
      </SidebarContent>

      <SidebarFooter>
        <Menu>
          <Menu.Trigger aria-label="Profile" className="group">
            <Avatar src="/images/boy.png" />
            <div className="in-data-[sidebar-collapsible=dock]:hidden text-sm">
              <SidebarLabel>Kurt Cobain</SidebarLabel>
              <span className="-mt-0.5 block text-muted-fg">
                kurt@cobain.com
              </span>
            </div>
            <Icon
              className="absolute right-3 size-4 transition-transform group-pressed:rotate-180"
              data-slot="chevron"
              icon="lucide:chevron-down"
            />
          </Menu.Trigger>
          <Menu.Content
            className={twMerge(
              state === 'expanded'
                ? 'sm:min-w-(--trigger-width)'
                : 'sm:min-w-60'
            )}
            placement="bottom right"
          >
            <Menu.Section>
              <Menu.Header separator>
                <span className="block">Kurt Cobain</span>
                <span className="font-normal text-muted-fg">
                  kurt@cobain.com
                </span>
              </Menu.Header>
            </Menu.Section>

            <Menu.Item className="gap-2" href="/">
              <Icon icon="lucide:home" />
              Home
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item className="gap-2" href="#logout">
              <Icon icon="lucide:log-out" />
              Logout
            </Menu.Item>
          </Menu.Content>
        </Menu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
