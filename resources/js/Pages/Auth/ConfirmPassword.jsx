import { useEffect } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    useEffect(() => {
        return () => {
            reset('password');
        };
    }, []);

    const submit = () => {
        post(route('password.confirm'));
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div className="mb-4 text-sm text-gray-600">
                This is a secure area of the application. Please confirm your password before continuing.
            </div>

            <Form onFinish={submit} layout="vertical">
                <Form.Item
                    label="Password"
                    validateStatus={errors.password ? 'error' : ''}
                    help={errors.password}
                >
                    <Input.Password
                        id="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoFocus
                    />
                </Form.Item>

                <Form.Item className="flex items-center justify-end mt-4">
                    <Button type="primary" htmlType="submit" loading={processing}>
                        Confirm
                    </Button>
                </Form.Item>
            </Form>
        </GuestLayout>
    );
}
