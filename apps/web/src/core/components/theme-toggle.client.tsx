'use client';

import { Button, Menu } from '@/core/components/ui';
import { Icon } from '@iconify/react';
import type { BasicColorMode } from '@workspace/core/hooks/use-color-mode';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { Selection } from 'react-stately';
import { match } from 'ts-pattern';

export function ThemeToggle() {
  const t = useTranslations('core');
  const { theme, setTheme } = useTheme();

  return (
    <Menu>
      <Button appearance="outline" data-slot="menu-trigger">
        <Icon
          icon={match(theme)
            .with('light', () => 'lucide:sun')
            .with('dark', () => 'lucide:moon')
            .otherwise(() => 'lucide:computer')}
          className="size-6"
        />
      </Button>

      <Menu.Content
        selectionMode="single"
        selectedKeys={new Set([theme as string])}
        onSelectionChange={(_selection) => {
          const selection = _selection as Exclude<Selection, 'all'> & {
            currentKey: 'system' | BasicColorMode;
          };
          setTheme(selection.currentKey);
        }}
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
