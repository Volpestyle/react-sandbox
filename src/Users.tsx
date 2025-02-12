import { use, useEffect, useState, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Users</h2>
        <button
          onClick={() => navigate("/")}
          className="text-blue-600 hover:text-blue-800"
        >
          Back to Home
        </button>
      </div>
      <ErrorBoundary fallback={<div>Unable to load users.</div>}>
        <input
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full p-2 border rounded-lg"
        />
        <Suspense
          fallback={<div className="text-center">Loading users...</div>}
        >
          <UsersData search={search} page={page} setPage={setPage} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

const UsersData = ({
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

  return (
    <>
      <UserContent filteredUsers={filteredUsers} page={page} />
      <Pagination
        page={page}
        setPage={setPage}
        totalUsers={filteredUsers.length}
      />
    </>
  );
};

const UserContent = ({
  filteredUsers,
  page,
}: {
  filteredUsers: User[];
  page: number;
}) => {
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return <UserList users={paginatedUsers} />;
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
    <div className="flex justify-center gap-2">
      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="px-3 py-1 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {"<"}
      </button>
      <button
        onClick={() => setPage(page + 1)}
        disabled={page === Math.ceil(totalUsers / PAGE_SIZE)}
        className="px-3 py-1 bg-blue-500 text-white rounded-lg disabled:opacity-50"
      >
        {">"}
      </button>
    </div>
  );
};

const UserList = ({ users }: { users: User[] }) => {
  return (
    <div className="space-y-2">
      {users.map((user, index) => (
        <div key={index} className="p-3 bg-white rounded-lg shadow-sm">
          {user.name}
        </div>
      ))}
    </div>
  );
};
