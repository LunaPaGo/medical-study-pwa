import { cloneElement, type ReactElement, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type PrimaryActionButtonProps = Omit<LinkProps, 'className'> & {
  children: ReactNode;
  iconOnlyOnMobile?: boolean;
  icon?: ReactElement<{ size?: number }>;
};

export function PrimaryActionButton({ children, icon, iconOnlyOnMobile = false, ...props }: PrimaryActionButtonProps) {
  return (
    <Link {...props} className={`primary-button primary-action-button ${iconOnlyOnMobile ? 'icon-only-mobile' : ''}`}>
      {icon ? cloneElement(icon, { size: 18 }) : null}
      <span>{children}</span>
    </Link>
  );
}
