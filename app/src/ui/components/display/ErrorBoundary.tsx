import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
   children: ReactNode;
   fallback?:
      | (({ error, resetError }: { error: Error; resetError: () => void }) => ReactNode)
      | ReactNode;
}

interface ErrorBoundaryState {
   hasError: boolean;
   error?: Error | undefined;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
   constructor(props: ErrorBoundaryProps) {
      super(props);
      this.state = { hasError: false, error: undefined };
   }

   static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      return { hasError: true, error };
   }

   override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
   }

   resetError = () => {
      this.setState({ hasError: false, error: undefined });
   };

   override render() {
      if (this.state.hasError) {
         return this.props.fallback ? (
            typeof this.props.fallback === "function" ? (
               this.props.fallback({ error: this.state.error!, resetError: this.resetError })
            ) : (
               this.props.fallback
            )
         ) : (
            <div>
               <h2>Something went wrong.</h2>
               <button onClick={this.resetError}>Try Again</button>
            </div>
         );
      }

      return this.props.children;
   }
}

export default ErrorBoundary;
