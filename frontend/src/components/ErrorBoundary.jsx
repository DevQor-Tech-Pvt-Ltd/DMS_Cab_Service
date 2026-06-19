import React, { Component } from 'react';
import * as Sentry from '@sentry/react';
import { ShieldAlert, Loader2 } from '../utils/icons';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Send to Sentry
    Sentry.captureException(error, { extra: errorInfo });
    console.error('App Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-white">
          <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert size={36} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-serif font-bold tracking-tight">Something Went Wrong</h1>
              <p className="text-slate-400 text-xs leading-relaxed">
                An unexpected application error occurred. Sentry monitoring has registered this trace, and our engineers have been alerted.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left overflow-x-auto text-[10px] font-mono text-rose-400 max-h-40">
                {this.state.error.stack || this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full bg-[#003893] hover:bg-[#002d72] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer"
            >
              <Loader2 size={14} className="animate-spin" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
