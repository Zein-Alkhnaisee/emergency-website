import React from 'react';
import FallbackUI from './FallbackUI';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // يمكن تسجيل الخطأ في خدمة خارجية هنا
        console.error('🔥 ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <FallbackUI
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    onReset={this.handleReset}
                    componentName={this.props.componentName || 'المكون'}
                />
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;