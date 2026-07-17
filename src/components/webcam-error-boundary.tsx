"use client";

import React from "react";

interface Props {
  onError: () => void;
  children: React.ReactNode;
}

interface State {
  crashed: boolean;
}

export class WebcamErrorBoundary extends React.Component<Props, State> {
  state: State = { crashed: false };

  static getDerivedStateFromError(): State {
    return { crashed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  componentDidUpdate(prevProps: Props) {
    // Resetear el boundary cuando el padre indica que se reinició el webcam
    if (prevProps.onError !== this.props.onError && this.state.crashed) {
      this.setState({ crashed: false });
    }
  }

  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}
