import TypeAheadPlacesSearch from "./TypeAheadPlacesSearch";
import SandboxItem from "@/layouts/SandboxItem";

export default function Page() {
  return (
    <SandboxItem title="Google Places">
      <TypeAheadPlacesSearch />
    </SandboxItem>
  );
}
