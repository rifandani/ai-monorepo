'use client';

import { logoutAction } from '@/auth/actions/auth';
import { Avatar } from '@/core/components/ui/avatar';
import { Menu } from '@/core/components/ui/menu';
import { Icon } from '@iconify/react';
import { useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';

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

          <Menu.Item id="profile" className="gap-x-2" isDisabled={isPending}>
            <Icon icon="lucide:user" />
            <span>{t('profile')}</span>
          </Menu.Item>
          <Menu.Item id="settings" className="gap-x-2" isDisabled={isPending}>
            <Icon icon="lucide:settings" />
            <span>{t('settings')}</span>
          </Menu.Item>
        </Menu.Section>

        <Menu.Separator />

        <Menu.Section>
          <Menu.Item id="logout" className="gap-x-2" isDisabled={isPending}>
            <Icon icon="lucide:log-out" />
            <p>{t('logout')}</p>
          </Menu.Item>
        </Menu.Section>
      </Menu.Content>
    </Menu>
  );
}
