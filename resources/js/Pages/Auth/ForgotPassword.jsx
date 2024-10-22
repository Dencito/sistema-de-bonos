import { Form, Input, Button, Alert } from 'antd';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = () => {
        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="mb-4 text-sm text-gray-600">
                Forgot your password? No problem. Just let us know your email address and we will email you a password
                reset link that will allow you to choose a new one.
            </div>

            {status && <Alert message={status} type="success" showIcon className="mb-4" />}

            <Form onFinish={submit} layout="vertical">
                <Form.Item
                    label="Email"
                    validateStatus={errors.email ? 'error' : ''}
                    help={errors.email}
                >
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoFocus
                    />
                </Form.Item>

                <Form.Item className="flex items-center justify-end">
                    <Button type="primary" htmlType="submit" loading={processing}>
                        Email Password Reset Link
                    </Button>
                </Form.Item>
            </Form>
        </GuestLayout>
    );
}
