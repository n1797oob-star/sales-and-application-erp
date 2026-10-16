import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ERP Application Error Caught:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('tmi-erp-storage-v6');
      localStorage.removeItem('tmi-erp-storage-v7');
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-lg font-bold text-slate-900">Application Recovered</h2>
            <p className="text-xs text-slate-600">
              {this.state.error?.message || 'An unexpected error occurred while loading this view.'}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow hover:bg-brand-700"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Reset Data &amp; Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
