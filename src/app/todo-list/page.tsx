import SandboxItemLayout from "@/layouts/SandboxItem";
import TodoList from "./TodoList";

export default function Page() {
  return (
    <SandboxItemLayout title="Todo List">
      <TodoList />
    </SandboxItemLayout>
  );
}
