import { Stack } from 'expo-router';

import { PosScreen } from '@/screens/ventas/pos-screen';

export default function PosRoute() {
  return (
    <>
      <Stack.Title>Punto de venta</Stack.Title>
      <PosScreen />
    </>
  );
}
