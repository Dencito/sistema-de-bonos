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
  children,
  ...rest
}) {
  const hasContent = children || title;

  return (
    <Button
      onClick={onClick}
      type={type}
      shape={shape}
      size={size}
      loading={loading}
      danger={danger}
      {...rest}
    >
      {icon && <span className={hasContent ? 'mr-2' : ''}>{icon}</span>}
      {hasContent}
    </Button>
  );
}
