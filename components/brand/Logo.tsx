import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <Image
      src="/brand/logo.svg"
      alt=""
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
