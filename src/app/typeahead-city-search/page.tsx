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
            😎 <br />
            <p className="mt-2">
              If the request is failing, you can usually retry until it works.{" "}
              <span className="italic">(this test api is flakey af)</span>
            </p>
            <h4 className="mt-4 text-md font-semibold">Features include:</h4>
          </p>
          <ul className="text-gray-500 dark:text-gray-400 space-y-0.5 list-disc ml-4">
            <li>keyboard navigation support (↑/↓ arrows)</li>
            <li>client-side query results caching (react query)</li>
            <li>
              manually storing and reusing the Amadeus API auth token in a
              server-side cache for security and to avoid unnecessary token requests on each
              serverless function invocation. (dynamoDB. was it necessary? idk,
              but good luck getting that token! >:D )
            </li>
            <li>robust error handling with automatic retries</li>
            <li>
              <a
                href="https://tanstack.com/query/latest/docs/framework/react/guides/suspense#using-usequerypromise-and-reactuse-experimental"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Suspense
              </a>{" "}
              +{" "}
              <a
                href="https://react.dev/reference/react/use"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                use
              </a>{" "}
              React 19 pattern
            </li>
          </ul>
        </div>
        <TypeaheadCitySearch />
      </div>
    </SandboxItemLayout>
  );
}
