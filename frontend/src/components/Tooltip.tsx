interface TooltipProps {
  content: React.ReactNode;
  link?: {
    href: string;
    text: string;
  };
}

export function Tooltip({ content, link }: TooltipProps) {
  return (
    <div className="group relative">
      <span className="cursor-help text-[#6A737D] font-bold text-xl shadow-lg rounded-full px-3 py-1">?</span>
      <div className="invisible group-hover:visible hover:visible absolute left-full top-1/4 -translate-y-1/2 w-80 p-4 bg-white shadow-lg rounded-lg text-sm text-[#24272A]">
        <p className="mb-2">{content}</p>
        {link && (
          <a 
            href={link.href}
            target="_blank"
            rel="noopener noreferrer" 
            className="text-[#037DD6] hover:underline"
          >
            {link.text}
          </a>
        )}
      </div>
    </div>
  );
} 