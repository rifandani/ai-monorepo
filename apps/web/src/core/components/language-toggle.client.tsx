'use client';

import { Icon } from '@iconify/react';
import { useLocale, useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import type { Selection } from 'react-stately';
import { toast } from 'sonner';
import { setUserLocaleAction } from '@/core/actions/i18n';
import { Button, Menu } from '@/core/components/ui';
import type { I18NLocale } from '@/core/constants/i18n';

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations('core');
  const { executeAsync, isPending } = useAction(setUserLocaleAction);

  return (
    <Menu>
      <Button appearance="outline" data-slot="menu-trigger">
        <Icon
          className="size-6"
          icon={locale === 'en' ? 'flag:us-1x1' : 'flag:id-1x1'}
        />
      </Button>

      <Menu.Content
        onSelectionChange={async (_selection) => {
          const selection = _selection as Exclude<Selection, 'all'> & {
            currentKey: I18NLocale;
          };

          const result = await executeAsync(selection.currentKey);

          if (result?.serverError) {
            toast.error(result.serverError);
          }
        }}
        selectedKeys={new Set([locale])}
        selectionMode="single"
      >
        <Menu.Section>
          <Menu.Header separator>{t('language')}</Menu.Header>

          <Menu.Item id="en" isDisabled={isPending}>
            English
          </Menu.Item>
          <Menu.Item id="id" isDisabled={isPending}>
            Indonesia
          </Menu.Item>
        </Menu.Section>
      </Menu.Content>
    </Menu>
  );
}
