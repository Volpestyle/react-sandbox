import Link from "next/link";

const SandboxItemLayout = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-8 w-full">
        <h2 className="text-xl font-semibold truncate">{title}</h2>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap ml-4"
        >
          Back to Home
        </Link>
      </div>
      {children}
    </div>
  );
};

export default SandboxItemLayout;
