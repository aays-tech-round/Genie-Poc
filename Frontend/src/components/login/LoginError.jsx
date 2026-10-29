import { CircleAlert } from 'lucide-react';

// Red alert above the sign-in button: a short title and the full message.
export default function LoginError({ title, message }) {
  return (
    <div
      role="alert"
      className="mb-4 flex animate-[panelRise_0.3s_ease-out_both] gap-2.5 rounded-[10px] border border-danger bg-main px-3.5 py-3 text-[13.5px] leading-normal text-danger"
    >
      <CircleAlert className="mt-px size-[18px] flex-none" />
      <div>
        <span className="mb-0.5 block font-semibold">{title}</span>
        <p className="wrap-break-word text-danger">{message}</p>
      </div>
    </div>
  );
}
