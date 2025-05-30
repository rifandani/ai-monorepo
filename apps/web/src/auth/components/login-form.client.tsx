'use client';

import { loginAction } from '@/auth/actions/auth';
import { Button, Form, Note, TextField } from '@/core/components/ui';
import { useHookFormAction } from '@/core/hooks/use-hook-form-action';
import { zodResolver } from '@hookform/resolvers/zod';
import { authSignInEmailRequestSchema } from '@workspace/core/apis/auth';
import { useTranslations } from 'next-intl';
import { Controller } from 'react-hook-form';

export function LoginForm() {
  const t = useTranslations('auth');
  const { action, form, handleSubmitWithAction } = useHookFormAction(
    loginAction,
    zodResolver(
      authSignInEmailRequestSchema.omit({ callbackURL: true, rememberMe: true })
    ),
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
        name="email"
        render={({
          field: { name, value, onChange, onBlur },
          fieldState: { error, invalid },
        }) => (
          <TextField
            type="email"
            className="group/email pt-4"
            label="Email"
            placeholder="Email"
            // Let React Hook Form handle validation instead of the browser.
            validationBehavior="aria"
            isPending={action.isPending}
            isInvalid={invalid}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            errorMessage={error?.message}
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
            type="password"
            className="group/password pt-4"
            label={t('password')}
            placeholder={t('passwordPlaceholder')}
            // Let React Hook Form handle validation instead of the browser.
            validationBehavior="aria"
            isRevealable
            isPending={action.isPending}
            isInvalid={invalid}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            errorMessage={error?.message}
          />
        )}
      />

      {action.result.data?.error && (
        <Note data-testid="mutation-error" intent="danger" className="mt-4">
          {action.result.data.error}
        </Note>
      )}

      <Button
        type="submit"
        className="mt-8 w-full normal-case"
        isDisabled={action.isPending || !form.formState.isValid}
      >
        {action.isPending ? t('loginLoading') : t('login')}
      </Button>
    </Form>
  );
}
