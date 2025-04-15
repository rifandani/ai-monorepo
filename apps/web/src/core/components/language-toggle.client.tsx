'use client';

import { setUserLocaleAction } from '@/core/actions/i18n';
import { Button, Menu } from '@/core/components/ui';
import type { I18NLocale } from '@/core/constants/i18n';
import { Icon } from '@iconify/react';
import { useLocale, useTranslations } from 'next-intl';
import { useAction } from 'next-safe-action/hooks';
import type { Selection } from 'react-stately';
import { toast } from 'sonner';

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations('core');
  const { executeAsync, isPending } = useAction(setUserLocaleAction);

  return (
    <Menu>
      <Button appearance="outline" data-slot="menu-trigger">
        <Icon
          icon={locale === 'en' ? 'flag:us-1x1' : 'flag:id-1x1'}
          className="size-6"
        />
      </Button>

      <Menu.Content
        selectionMode="single"
        selectedKeys={new Set([locale])}
        onSelectionChange={async (_selection) => {
          const selection = _selection as Exclude<Selection, 'all'> & {
            currentKey: I18NLocale;
          };

          const result = await executeAsync(selection.currentKey);

          if (result?.serverError) {
            toast.error(result.serverError);
          }
        }}
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
