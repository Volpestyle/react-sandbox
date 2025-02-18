import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold">NextJS Sandbox</h1>
      <div className="mt-6 flex flex-col">
        <Link
          href="/typeahead"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          typeahead search component
        </Link>
        <Link
          href="/users-search"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          users search
        </Link>
        <Link
          href="/todo-list"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          todo list
        </Link>
      </div>
    </div>
  );
}
