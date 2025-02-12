import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showStack?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError && !this.state.error?.message)
      return this.props.fallback;
    if (this.state.hasError && this.state.error?.message) {
      return (
        <div className="p-4 border border-red-900">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <div className="mt-2 text-sm text-red-700">
            <p>{this.state.error?.message}</p>
            {this.props.showStack && (
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto">
                {this.state.error?.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
