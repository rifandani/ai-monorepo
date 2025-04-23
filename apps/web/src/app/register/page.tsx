import { RegisterForm } from '@/auth/components/register-form.client';
import { Link } from '@/core/components/ui';
import { createMetadata } from '@/core/utils/seo';
import { Icon } from '@iconify/react';

export const metadata = createMetadata({
  title: 'Register',
  description:
    'Create an account to access personalized features, manage your profile, and enjoy a seamless experience across our platform.',
});

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full">
      {/* form */}
      <section className="flex min-h-screen w-full flex-col justify-center px-10 md:w-1/2 xl:px-20">
        <h1 className="text-center text-3xl text-primary">Welcome</h1>

        <RegisterForm />

        <p className="py-12 text-center">
          Already have an account?{' '}
          <Link aria-label="Login" className="hover:underline" href="/login">
            Login
          </Link>
        </p>
      </section>

      {/* image */}
      <section className="hidden w-1/2 shadow-2xl md:block">
        <span className="relative h-screen w-full md:flex md:items-center md:justify-center">
          <Icon
            icon="logos:nextjs-icon"
            className="size-60 object-cover"
            aria-label="cool nextjs logo"
          />
        </span>
      </section>
    </div>
  );
}
