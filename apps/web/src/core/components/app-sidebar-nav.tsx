'use client';

import { Avatar } from '@/core/components/ui/avatar';
import { Menu } from '@/core/components/ui/menu';
import { Separator } from '@/core/components/ui/separator';
import { SidebarNav, SidebarTrigger } from '@/core/components/ui/sidebar';
import { Switch } from '@/core/components/ui/switch';
import { Icon } from '@iconify/react';
import { useTheme } from 'next-themes';

export function AppSidebarNav() {
  return (
    <SidebarNav className="sticky top-0 border-b">
      <span className="flex items-center gap-x-4">
        <SidebarTrigger className="-mx-2" />
        <Separator className="h-6" orientation="vertical" />
        {/* <Breadcrumbs className="hidden md:flex">
          <Breadcrumbs.Item href="/blocks/sidebar/sidebar-01">
            Dashboard
          </Breadcrumbs.Item>
          <Breadcrumbs.Item>Newsletter</Breadcrumbs.Item>
        </Breadcrumbs> */}
      </span>

      <UserMenu />
    </SidebarNav>
  );
}

function UserMenu() {
  const { theme, setTheme } = useTheme();

  return (
    <Menu>
      <Menu.Trigger className="ml-auto md:hidden" aria-label="Open Menu">
        <Avatar alt="kurt cobain" src="/images/boy.png" />
      </Menu.Trigger>
      <Menu.Content placement="bottom" showArrow className="sm:min-w-64">
        <Menu.Section>
          <Menu.Header separator>
            <span className="block">Kurt Cobain</span>
            <span className="font-normal text-muted-fg">kurt@cobain.com</span>
          </Menu.Header>
        </Menu.Section>
        <Menu.Item href="/" className="gap-2">
          <Icon icon="lucide:home" />
          <Menu.Label>Home</Menu.Label>
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item className="gap-2 [&>[slot=label]+[data-slot=icon]]:right-4 [&>[slot=label]+[data-slot=icon]]:bottom-3">
          {theme === 'dark' ? (
            <Icon icon="lucide:moon" />
          ) : (
            <Icon icon="lucide:sun" />
          )}
          <Menu.Label>Theme</Menu.Label>
          <span data-slot="icon">
            <Switch
              className="ml-auto"
              isSelected={theme === 'dark'}
              onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            />
          </span>
        </Menu.Item>
        <Menu.Separator />
        <Menu.Item href="#logout" className="gap-2">
          <Icon icon="lucide:log-out" />
          <Menu.Label>Logout</Menu.Label>
        </Menu.Item>
      </Menu.Content>
    </Menu>
  );
}
