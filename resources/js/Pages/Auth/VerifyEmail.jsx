import { Button, Typography, Alert, Form } from 'antd';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = () => {
        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <Typography.Paragraph className="mb-4 text-sm text-gray-600">
                Thanks for signing up! Before getting started, could you verify your email address by clicking on the
                link we just emailed to you? If you didn&apos;t receive the email, we will gladly send you another.
            </Typography.Paragraph>


            {status === 'verification-link-sent' && (
                <Alert
                    message="A new verification link has been sent to the email address you provided during registration."
                    type="success"
                    showIcon
                    className="mb-4"
                />
            )}

            <Form onFinish={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <Button type="primary" htmlType="submit" loading={processing}>
                        Resend Verification Email
                    </Button>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Log Out
                    </Link>
                </div>
            </Form>
        </GuestLayout>
    );
}
