import SandboxItemLayout from "@/layouts/SandboxItem";
import TravelPlanner from "./TravelPlanner";

export default function Page() {
  return (
    <SandboxItemLayout title="Travel Planner (GraphQL BFF)">
      <TravelPlanner />
    </SandboxItemLayout>
  );
}
