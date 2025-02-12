import { use, useEffect, useState, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const USERS_ENDPOINT = "https://jsonplaceholder.typicode.com/users";
type User = {
  name: string;
};
const PAGE_SIZE = 4;

const usersPromise = fetch(USERS_ENDPOINT).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
});

export const Users = () => {
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="flex flex-col w-full max-w-2xl space-y-4 mb-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold">Users</h2>
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          Back to Home
        </Link>
      </div>
      <ErrorBoundary
        fallback={<div className="text-center">Unable to load users.</div>}
      >
        <div className="space-y-4">
          <input
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full p-2 border rounded-lg"
          />
          <Suspense
            fallback={<div className="text-center">Loading users...</div>}
          >
            <UsersList search={search} page={page} setPage={setPage} />
          </Suspense>
        </div>
      </ErrorBoundary>
    </div>
  );
};

const UsersList = ({
  search,
  page,
  setPage,
}: {
  search: string;
  page: number;
  setPage: (page: number) => void;
}) => {
  const users = use(usersPromise) as User[];
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );
  return (
    <>
      {paginatedUsers.map((user, index) => (
        <UserRow key={index} user={user} />
      ))}
      <Pagination
        page={page}
        setPage={setPage}
        totalUsers={filteredUsers.length}
      />
    </>
  );
};

const Pagination = ({
  page,
  setPage,
  totalUsers,
}: {
  page: number;
  setPage: (page: number) => void;
  totalUsers: number;
}) => {
  return (
    <div className="flex justify-center gap-4">
      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="bg-white rounded-lg p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => setPage(page + 1)}
        disabled={page === Math.ceil(totalUsers / PAGE_SIZE)}
        className="bg-white rounded-lg p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

const UserRow = ({ user }: { user: User }) => {
  return <div className="rounded-lg shadow-sm">{user.name}</div>;
};
