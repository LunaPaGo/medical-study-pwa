import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type PrimaryActionButtonProps = Omit<LinkProps, 'className'> & {
  children: ReactNode;
  icon?: ReactElement<{ size?: number }>;
};

export function PrimaryActionButton({ children, icon, ...props }: PrimaryActionButtonProps) {
  return (
    <Link {...props} className="primary-button primary-action-button">
      {icon ? cloneElement(icon, { size: 18 }) : null}
      <span>{children}</span>
    </Link>
  );
}
