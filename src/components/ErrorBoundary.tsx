import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ color: '#dc2626', fontSize: 24, marginBottom: 16 }}>
            Something went wrong
          </h1>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <p style={{ color: '#991b1b', fontWeight: 600, marginBottom: 8 }}>
              {this.state.error?.name}: {this.state.error?.message}
            </p>
            {this.state.error?.stack && (
              <pre style={{ fontSize: 12, overflow: 'auto', background: '#fff', padding: 12, borderRadius: 4, color: '#444' }}>
                {this.state.error.stack}
              </pre>
            )}
          </div>
          {this.state.errorInfo?.componentStack && (
            <div>
              <h3 style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Component Stack:</h3>
              <pre style={{ fontSize: 11, overflow: 'auto', background: '#f9fafb', padding: 12, borderRadius: 4, color: '#666' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
