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
      <div className="flex flex-col sm:flex-row justify-between mb-8 w-full gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap"
        >
          Back to Home
        </Link>
      </div>
      {children}
    </div>
  );
};

export default SandboxItemLayout;
