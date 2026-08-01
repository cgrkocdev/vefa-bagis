import type { SVGProps } from "react";

export function CowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M7 5 3.5 3.5 5 8" />
      <path d="m17 5 3.5-1.5L19 8" />
      <path d="M7 5.5C8.2 4.5 9.8 4 12 4s3.8.5 5 1.5l2 4.5v5.5A4.5 4.5 0 0 1 14.5 20h-5A4.5 4.5 0 0 1 5 15.5V10l2-4.5Z" />
      <path d="M8 10h.01M16 10h.01" />
      <path d="M9 15.5c.8-.7 1.8-1 3-1s2.2.3 3 1V18H9v-2.5Z" />
      <path d="M11 16.5h.01M13 16.5h.01" />
    </svg>
  );
}
