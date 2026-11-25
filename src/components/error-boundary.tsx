import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Última red de seguridad: muestra una pantalla de error sin ocultar la causa. */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Solo identificadores de componentes; nunca datos del backend.
    console.warn('[AppErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
          gap: 12,
        }}
        className="bg-canvas"
      >
        <View className="gap-2 rounded-2xl border border-danger/30 bg-danger-soft p-4">
          <Text className="text-lg font-bold text-danger">
            Algo salió mal
          </Text>
          <Text className="text-sm text-danger" selectable>
            {this.state.error.message}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          onPress={() => this.setState({ error: null })}
          className="items-center rounded-xl bg-brand px-4 py-3"
        >
          <Text className="font-semibold text-white">Reintentar</Text>
        </Pressable>
      </ScrollView>
    );
  }
}
