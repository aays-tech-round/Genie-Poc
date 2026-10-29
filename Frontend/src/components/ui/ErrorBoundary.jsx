import { Component } from 'react';
import { CircleAlert } from 'lucide-react';

// Catches a render error in its children and shows a small notice in their place,
// so one bad result can't blank the whole app. Change `key` to try rendering again.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-soft px-[0.9rem] py-3 text-[0.85rem] text-secondary"
        role="alert"
      >
        <CircleAlert size={16} className="shrink-0" />
        {this.props.message || 'Something went wrong displaying this.'}
      </div>
    );
  }
}
