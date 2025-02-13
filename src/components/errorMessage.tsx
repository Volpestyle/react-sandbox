const ErrorMessage = ({
  error,
  resetErrorBoundary,
  showStack = false,
}: {
  error: Error;
  showStack?: boolean;
  resetErrorBoundary: () => void;
}) => {
  return (
    <div className="p-4 border border-red-900">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <div className="mt-2 text-sm text-red-700">
        <p>{error.message}</p>
        {showStack && (
          <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
            {error.stack}
          </pre>
        )}
      </div>
      <button
        className="mt-4 px-4 py-2 text-sm border font-medium rounded-md hover:bg-gray-200 hover:text-gray-800 transition-colors"
        onClick={resetErrorBoundary}
      >
        Try again
      </button>
    </div>
  );
};

export default ErrorMessage;
