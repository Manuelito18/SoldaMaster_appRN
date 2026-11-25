// Entry de la app: se aplica antes de cargar Expo Router para poder filtrar
// avisos de dependencias que se emiten al evaluar sus módulos.
import './src/utils/suppress-known-warnings';
import 'expo-router/entry';
