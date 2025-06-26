'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useHookFormAction } from '@next-safe-action/adapter-react-hook-form/hooks';
import { authSignUpEmailRequestSchema } from '@workspace/core/apis/auth';
import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';
import { registerAction } from '@/auth/actions/auth';
import { Button, Form, TextField } from '@/core/components/ui';

export function RegisterForm() {
  const t = useTranslations('auth');
  const { action, form, handleSubmitWithAction } = useHookFormAction(
    registerAction,
    zodResolver(authSignUpEmailRequestSchema),
    {
      formProps: { mode: 'onChange' },
    }
  );

  return (
    <Form
      className="flex flex-col pt-3 md:pt-8"
      onSubmit={handleSubmitWithAction}
    >
      <Controller
        control={form.control}
        name="name"
        render={({
          field: { name, value, onChange, onBlur },
          fieldState: { error, invalid },
        }) => (
          <TextField
            className="group/name pt-4"
            errorMessage={error?.message}
            isInvalid={invalid}
            isPending={action.isPending}
            // Let React Hook Form handle validation instead of the browser.
            label="Name"
            name={name}
            onBlur={onBlur}
            onChange={onChange}
            placeholder="Name"
            type="text"
            validationBehavior="aria"
            value={value}
          />
        )}
      />

      <Controller
        control={form.control}
        name="email"
        render={({
          field: { name, value, onChange, onBlur },
          fieldState: { error, invalid },
        }) => (
          <TextField
            className="group/email pt-4"
            errorMessage={error?.message}
            isInvalid={invalid}
            isPending={action.isPending}
            // Let React Hook Form handle validation instead of the browser.
            label="Email"
            name={name}
            onBlur={onBlur}
            onChange={onChange}
            placeholder="Email"
            type="text"
            validationBehavior="aria"
            value={value}
          />
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({
          field: { name, value, onChange, onBlur },
          fieldState: { error, invalid },
        }) => (
          <TextField
            className="group/password pt-4"
            errorMessage={error?.message}
            isInvalid={invalid}
            isPending={action.isPending}
            // Let React Hook Form handle validation instead of the browser.
            isRevealable
            label={t('password')}
            name={name}
            onBlur={onBlur}
            onChange={onChange}
            placeholder={t('passwordPlaceholder')}
            type="password"
            validationBehavior="aria"
            value={value}
          />
        )}
      />

      <Button
        className="mt-8 w-full normal-case"
        isDisabled={action.isPending || !form.formState.isValid}
        type="submit"
      >
        {action.isPending ? t('loginLoading') : 'Register'}{' '}
      </Button>
    </Form>
  );
}
