'use client';

import { Icon } from '@iconify/react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import { logoutAction } from '@/auth/actions/auth';
import { Avatar } from '@/core/components/ui/avatar';
import { Menu } from '@/core/components/ui/menu';

export function ProfileMenu({ username }: { username: string }) {
  const t = useTranslations('core');
  const { execute, isPending } = useAction(logoutAction);

  return (
    <Menu>
      <Menu.Trigger>
        <Avatar initials={username.slice(0, 2).toUpperCase()} />
      </Menu.Trigger>

      <Menu.Content
        onAction={(key) => {
          const currentKey = key as 'profile' | 'settings' | 'logout';

          if (currentKey === 'logout') {
            execute();
          }
        }}
      >
        <Menu.Section>
          <Menu.Header separator>{t('account')}</Menu.Header>

          <Menu.Item className="gap-x-2" id="profile" isDisabled={isPending}>
            <Icon icon="lucide:user" />
            <span>{t('profile')}</span>
          </Menu.Item>
          <Menu.Item className="gap-x-2" id="settings" isDisabled={isPending}>
            <Icon icon="lucide:settings" />
            <span>{t('settings')}</span>
          </Menu.Item>
        </Menu.Section>

        <Menu.Separator />

        <Menu.Section>
          <Menu.Item className="gap-x-2" id="logout" isDisabled={isPending}>
            <Icon icon="lucide:log-out" />
            <p>{t('logout')}</p>
          </Menu.Item>
        </Menu.Section>
      </Menu.Content>
    </Menu>
  );
}
