import { Button } from 'antd';

export function CustomButton({
    onClick,
    loading,
    type = 'default',
    shape,
    icon,
    size,
    danger = false,
    title,
    ...rest
}) {
    return (
        <Button
            onClick={onClick}
            type={type}
            shape={shape}
            icon={icon}
            size={size}
            loading={loading}
            danger={danger}
            {...rest}
        >
            {title}
        </Button>
    );
}
