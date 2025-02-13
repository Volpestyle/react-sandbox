import SandboxItemLayout from "@/layouts/SandboxItem";
import TypeaheadCitySearch from "./TypeaheadCitySearch";
export default function Page() {
  return (
    <SandboxItemLayout title="Typeahead City Search">
      <div className="space-y-4">
        <div className="text-sm space-y-2 mb-12">
          <p className="text-gray-600 dark:text-gray-300">
            A city search component with typeahead that queries the{" "}
            <a
              href="https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/city-search"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Amadeus City Search API
            </a>{" "}
            😎 <br /> Features include:
          </p>
          <ul className="text-gray-500 dark:text-gray-400 space-y-0.5 list-disc ml-4">
            <li>
              handling the extreme flakeyness of the test API with retries,
              debouncing, and error boundaries.
            </li>
            <li>keyboard navigation support (↑/↓ arrows)</li>
            <li>
              <a
                href="https://tanstack.com/query/latest/docs/framework/react/guides/suspense"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Suspense
              </a>{" "}
            </li>
          </ul>
        </div>
        <TypeaheadCitySearch />
      </div>
    </SandboxItemLayout>
  );
}
