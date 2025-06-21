'use client';

import { deleteChatAction } from '@/core/actions/chat';
import { Avatar } from '@/core/components/ui/avatar';
import { Button } from '@/core/components/ui/button';
import { Field, FieldControl, FieldLabel } from '@/core/components/ui/field';
import { Input } from '@/core/components/ui/input';
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
import { Icon } from '@iconify/react';
import { useAction } from 'next-safe-action/hooks';
import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

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
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [renamingChatValue, setRenamingChatValue] = useState<string>('');
  const [chatDisplayNames, setChatDisplayNames] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load stored chat names from local storage
    const storedNames = localStorage.getItem('chatDisplayNames');
    if (storedNames) {
      setChatDisplayNames(JSON.parse(storedNames));
    }
  }, []);

  const handleRenameClick = (chat: ChatHistoryItem) => {
    setRenamingChatId(chat.id);
    setRenamingChatValue(chatDisplayNames[chat.id] || chat.content);
  };

  const handleRenameSave = (chatId: string) => {
    if (renamingChatValue.trim() === '') return;

    const updatedDisplayNames = {
      ...chatDisplayNames,
      [chatId]: renamingChatValue,
    };
    setChatDisplayNames(updatedDisplayNames);
    localStorage.setItem('chatDisplayNames', JSON.stringify(updatedDisplayNames));
    setRenamingChatId(null);
    setRenamingChatValue('');
  };

  const getDisplayName = (chat: ChatHistoryItem) => {
    return chatDisplayNames[chat.id] || chat.content;
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link
          className="flex items-center gap-x-2 group-data-[collapsible=dock]:size-10 group-data-[collapsible=dock]:justify-center"
          href="/"
        >
          <Icon icon="arcticons:openai-chatgpt" className="size-5" />
          <SidebarLabel className="font-medium">ChatGPT</SidebarLabel>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSectionGroup>
          <SidebarSection>
            <SidebarItem href="/chat" className="gap-2">
              <Icon icon="lucide:plus" className="size-4" />
              <SidebarLabel>New Chat</SidebarLabel>
            </SidebarItem>
          </SidebarSection>

          <SidebarSection title="History">
            {/* Map over the chatHistory prop */}
            {chatHistory.map((chat) =>
              renamingChatId === chat.id ? (
                <SidebarItem key={chat.id} className="flex-col items-start px-2 py-1.5">
                  <Field className="w-full">
                    <FieldLabel className="sr-only">Rename chat</FieldLabel>
                    <FieldControl>
                      <Input
                        value={renamingChatValue}
                        onChange={(e) => setRenamingChatValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSave(chat.id);
                          if (e.key === 'Escape') setRenamingChatId(null);
                        }}
                      />
                    </FieldControl>
                  </Field>
                  <div className="mt-1.5 flex w-full justify-end gap-x-1.5">
                    <Button
                      variant="default"
                      size="sm"
                      onPress={() => handleRenameSave(chat.id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="light"
                      size="sm"
                      onPress={() => setRenamingChatId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </SidebarItem>
              ) : (
                <SidebarItem key={chat.id} isCurrent={params.id === chat.id}>
                  {({ isCollapsed }) => (
                    <>
                      {/* Update href to link to the chat page */}
                      <SidebarLink href={`/chat/${chat.id}`}>
                        <SidebarLabel>{getDisplayName(chat)}</SidebarLabel>
                      </SidebarLink>
                      {!isCollapsed && (
                        <Menu>
                          <Menu.Trigger aria-label="Manage">
                            <Icon icon="lucide:more-horizontal" />
                          </Menu.Trigger>
                          <Menu.Content offset={0} placement="right top">
                            <Menu.Item
                              isDisabled={isDeleting}
                              className="gap-2"
                              onAction={() => {
                                // TODO: implement share after we setup auth
                              }}
                            >
                              <Icon icon="lucide:upload" />
                              Share
                            </Menu.Item>
                            <Menu.Item
                              isDisabled={isDeleting}
                              className="gap-2"
                              onAction={() => handleRenameClick(chat)}
                            >
                              <Icon icon="lucide:pencil" />
                              Rename
                            </Menu.Item>
                            <Menu.Item
                              isDisabled={isDeleting}
                              className="gap-2"
                              onAction={() => {
                                // TODO: implement archive
                              }}
                            >
                              <Icon icon="lucide:archive" />
                              Archive
                            </Menu.Item>
                            <Menu.Item
                              isDanger
                              isDisabled={isDeleting}
                              className="gap-2"
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
              )
            )}
          </SidebarSection>
        </SidebarSectionGroup>
      </SidebarContent>

      <SidebarFooter>
        <Menu>
          <Menu.Trigger className="group" aria-label="Profile">
            <Avatar src="/images/boy.png" />
            <div className="in-data-[sidebar-collapsible=dock]:hidden text-sm">
              <SidebarLabel>Kurt Cobain</SidebarLabel>
              <span className="-mt-0.5 block text-muted-fg">
                kurt@cobain.com
              </span>
            </div>
            <Icon
              icon="lucide:chevron-down"
              data-slot="chevron"
              className="absolute right-3 size-4 transition-transform group-pressed:rotate-180"
            />
          </Menu.Trigger>
          <Menu.Content
            placement="bottom right"
            className={twMerge(
              state === 'expanded'
                ? 'sm:min-w-(--trigger-width)'
                : 'sm:min-w-60'
            )}
          >
            <Menu.Section>
              <Menu.Header separator>
                <span className="block">Kurt Cobain</span>
                <span className="font-normal text-muted-fg">
                  kurt@cobain.com
                </span>
              </Menu.Header>
            </Menu.Section>

            <Menu.Item href="/" className="gap-2">
              <Icon icon="lucide:home" />
              Home
            </Menu.Item>
            <Menu.Separator />
            <Menu.Item href="#logout" className="gap-2">
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
