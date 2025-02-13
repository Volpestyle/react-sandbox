import { useEffect, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader } from "lucide-react";
import {
  QueryErrorResetBoundary,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import ErrorMessage from "./components/ErrorMessage";

const USERS_ENDPOINT = "https://jsonplaceholder.typicode.com/users";
type User = {
  name: string;
};
const PAGE_SIZE = 4;

export const Users = () => {
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className=" space-y-4">
      <div className=" flex justify-between items-center mb-8 w-full">
        <h2 className="text-xl font-semibold truncate">Users</h2>
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap ml-4"
        >
          Back to Home
        </Link>
      </div>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ error, resetErrorBoundary }) => (
              <ErrorMessage
                error={error}
                showStack={false}
                resetErrorBoundary={resetErrorBoundary}
              />
            )}
          >
            <div className="space-y-4">
              <Suspense
                fallback={
                  <div className="text-center">
                    <p>Loading users...</p>
                    <Loader className="animate-spin h-6 w-6 mx-auto" />
                  </div>
                }
              >
                <input
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full p-2 border rounded-lg"
                />
                <UsersList search={search} page={page} setPage={setPage} />
              </Suspense>
            </div>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
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
  const { data: users } = useSuspenseQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch(USERS_ENDPOINT);
      return response.json();
    },
  });
  const filteredUsers = users.filter((user: User) =>
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
  return (
    <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 transition-colors duration-200 text-gray-100 shadow-lg backdrop-blur-sm">
      {user.name}
    </div>
  );
};
