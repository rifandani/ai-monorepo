'use client';

import { Icon } from '@iconify/react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/core/components/ui/avatar';
import { Menu } from '@/core/components/ui/menu';

export function ProfileMenu({ username }: { username: string }) {
  const t = useTranslations('core');

  return (
    <Menu>
      <Menu.Trigger>
        <Avatar initials={username.slice(0, 2).toUpperCase()} />
      </Menu.Trigger>

      <Menu.Content>
        <Menu.Section>
          <Menu.Header separator>{t('account')}</Menu.Header>

          <Menu.Item className="gap-x-2" id="profile">
            <Icon icon="lucide:user" />
            <span>{t('profile')}</span>
          </Menu.Item>
          <Menu.Item className="gap-x-2" id="settings">
            <Icon icon="lucide:settings" />
            <span>{t('settings')}</span>
          </Menu.Item>
        </Menu.Section>

        <Menu.Separator />

        <Menu.Section>
          <Menu.Item className="gap-x-2" id="logout">
            <Icon icon="lucide:log-out" />
            <p>{t('logout')}</p>
          </Menu.Item>
        </Menu.Section>
      </Menu.Content>
    </Menu>
  );
}
