import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="h-[600px] overflow-hidden">
          <CardContent className="h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60">Unable to load map. Please try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;