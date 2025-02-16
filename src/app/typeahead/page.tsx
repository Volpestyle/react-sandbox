import SandboxItemLayout from "@/layouts/SandboxItem";
import TypeaheadCitySearch from "./TypeaheadCitySearch";
import TypeaheadPlacesSearch from "./TypeaheadPlacesSearch";
export default function Page() {
  return (
    <SandboxItemLayout title="Typeahead/Autocomplete component">
      <div>
        <div className="text-md space-y-2">
          <h4 className="mt-4 text-md font-semibold">Features include:</h4>
          <ul className="text-gray-500 dark:text-gray-400 space-y-0.5 list-disc ml-4">
            <li>keyboard navigation support (↑/↓ arrows)</li>
            <li>client-side query results caching (react query)</li>
            <li>secure API key handling through server-side implementation</li>
            <li>debounced search input for optimal performance</li>
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

        <hr className="border-gray-200 dark:border-gray-700 my-10" />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Google Places Autocomplete</h2>
          <p className="text-gray-600 dark:text-gray-300">
            A place search input with typeahead that queries the{" "}
            <a
              href="https://developers.google.com/places/web-service/autocomplete"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Google Places Autocomplete API
            </a>{" "}
          </p>
        </div>
        <div className="mt-8">
          <TypeaheadPlacesSearch />
        </div>

        <hr className="border-gray-200 dark:border-gray-700 my-10" />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Amadeus City Search</h2>
          <p className="text-gray-600 dark:text-gray-300">
            A city search input with typeahead that queries the{" "}
            <a
              href="https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/city-search"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Amadeus City Search API
            </a>{" "}
          </p>

          <span className="mt-2">
            If the request is failing, you can usually retry until it works.{" "}
            <span className="italic">(this test api is flakey af)</span>
          </span>
          <h4 className="mt-4 text-md font-semibold">Features include:</h4>
          <ul className="text-gray-500 dark:text-gray-400 space-y-0.5 list-disc ml-4">
            <li>
              manually caching the Amadeus API auth token server-side for
              security and to avoid unnecessary token requests on each
              serverless function invocation. (dynamoDB. was it necessary? idk,
              but good luck getting that token! &gt;:D )
            </li>
          </ul>
        </div>
        <div className="mt-8">
          <TypeaheadCitySearch />
        </div>
      </div>
    </SandboxItemLayout>
  );
}
