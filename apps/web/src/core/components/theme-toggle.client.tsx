'use client';

import { Icon } from '@iconify/react';
import type { BasicColorMode } from '@workspace/core/hooks/use-color-mode';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { Selection } from 'react-stately';
import { match } from 'ts-pattern';
import { Button, Menu } from '@/core/components/ui';

export function ThemeToggle() {
  const t = useTranslations('core');
  const { theme, setTheme } = useTheme();

  return (
    <Menu>
      <Button appearance="outline" data-slot="menu-trigger">
        <Icon
          className="size-6"
          icon={match(theme)
            .with('light', () => 'lucide:sun')
            .with('dark', () => 'lucide:moon')
            .otherwise(() => 'lucide:computer')}
        />
      </Button>

      <Menu.Content
        onSelectionChange={(_selection) => {
          const selection = _selection as Exclude<Selection, 'all'> & {
            currentKey: 'system' | BasicColorMode;
          };
          setTheme(selection.currentKey);
        }}
        selectedKeys={new Set([theme as string])}
        selectionMode="single"
      >
        <Menu.Section>
          <Menu.Header separator>{t('theme')}</Menu.Header>

          <Menu.Item id="system">{t('system')}</Menu.Item>
          <Menu.Item id="light">{t('light')}</Menu.Item>
          <Menu.Item id="dark">{t('dark')}</Menu.Item>
        </Menu.Section>
      </Menu.Content>
    </Menu>
  );
}
