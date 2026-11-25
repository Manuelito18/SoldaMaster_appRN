# SoldaMaster_appRN

Aplicación móvil **ERP/POS para una ferretería** ("Solda Master"), construida con React Native + Expo y TypeScript. El objetivo es digitalizar la operación diaria del negocio —ventas en mostrador (POS), control de inventario, compras a proveedores, créditos/cobros y reportes— en una sola app compatible con **Expo Go**.

La app es el cliente móvil de una API REST (Spring Boot) documentada en `BACKEND_API_GUIDE.md`. Todo el manejo de negocio y la persistencia viven en el backend; aquí solo se consume la API y se presenta la información.

---

## 🏪 ¿Qué hace la app? (contexto de negocio)

Una ferretería vende productos (tornillería, herramientas, materiales de soldadura, etc.) y necesita llevar el control de:

- **Ventas:** registrar ventas al contado y al crédito desde un punto de venta (POS), calcular subtotal, IGV y total en tiempo real, validar stock y generar el comprobante (`F001-...` / `B001-...`).
- **Créditos y cobros:** consultar ventas a crédito, cuotas por cobrar e historial de pagos, y registrar nuevos pagos.
- **Inventario:** altas de productos (con saldo inicial, lote y certificado opcional), control de stock, lotes, certificados y el Kardex (historial de movimientos).
- **Compras:** crear órdenes de compra a proveedores, ver pendientes, rechazarlas, convertir una orden pendiente en compra y consultar el historial.
- **Entidades:** gestionar clientes y proveedores con CRUD, paginación y filtros.
- **Reportes:** reportes de ventas y compras filtrables por fechas, cliente/proveedor y tipo de comprobante, con totales del rango y globales.
- **Inicio / Dashboard:** KPIs del negocio (productos, clientes, unidades, valor de inventario, ventas del mes, etc.), alertas de stock y últimos movimientos.

El perfil del usuario (`ADMIN`, `VENDEDOR` o `CONTADOR`) controla **únicamente qué menús ve** en la app; la API está abierta (`permitAll`) y no usa el rol como mecanismo de seguridad.

---

## 🧱 Estructura del proyecto

```
SoldaMaster_appRN/
├── app/                          # Rutas (Expo Router, file-based routing)
│   ├── _layout.tsx               # Layout raíz (Stack + ErrorBoundary)
│   ├── +not-found.tsx            # Pantalla 404
│   ├── (auth)/
│   │   └── login.tsx             # Inicio de sesión
│   └── (tabs)/                   # Navegación principal con 5 pestañas
│       ├── index.tsx             # Inicio / dashboard / alertas
│       ├── ventas/               # Listado, POS, créditos y pagos
│       ├── inventario/           # Productos, stock, lotes, certificados y Kardex
│       ├── compras/              # Órdenes, pendientes y compras
│       └── mas/                  # Entidades, reportes y cerrar sesión
│
├── src/
│   ├── api/
│   │   ├── client.ts             # Cliente Axios: baseURL e interceptores
│   │   └── services/             # Servicios tipados por dominio:
│   │       #   auth, catalogos, productos, inventario, entidades,
│   │       #   ordenes, compras, ventas, pagos, reportes, dashboard
│   ├── components/               # Componentes reutilizables y formularios
│   │   ├── forms/                # Producto, entidad, compra, orden, lote, certificado...
│   │   └── *.tsx                 # SearchBar, StatusBadge, EmptyState, etc.
│   ├── constants/                # Roles y constantes del sistema
│   ├── hooks/                    # Hooks de React Query por dominio + query keys
│   ├── providers/                # QueryClientProvider
│   ├── screens/                  # Pantallas complejas extraídas (ej. POS)
│   ├── store/                    # Estado global con Zustand + AsyncStorage
│   │   ├── useAuthStore.ts       # Perfil/rol del usuario
│   │   └── useCartStore.ts       # Carrito del POS
│   ├── theme/                    # Tokens de color/tipografía (NativeWind)
│   ├── types/                    # Tipos de la API (api.ts)
│   └── utils/                    # Formato y utilidades
│
├── index.js                      # Entry point (filtro de warnings + expo-router)
├── app.json                      # Configuración de Expo (nombre, scheme, bundle id)
├── package.json                  # Dependencias y scripts
├── pnpm-lock.yaml                # Lockfile (gestor obligatorio: pnpm)
├── tsconfig.json                 # Configuración de TypeScript
├── tailwind.config.js            # Configuración de NativeWind / Tailwind
├── global.css                    # Estilos globales
├── .env.example                  # Plantilla de variables de entorno
├── BACKEND_API_GUIDE.md          # Fuente de verdad de endpoints y DTOs
└── MEMORIA.md                    # Registro de fases y decisiones del proyecto
```

**Separación de responsabilidades:** las rutas (`app/`) solo componen pantallas; la lógica de servidor vive en `src/hooks/` + `src/api/services/` (React Query), el estado global en `src/store/`, los formularios y componentes visuales en `src/components/` y los tipos en `src/types/`.

---

## 🛠️ Stack tecnológico

| Área | Tecnología |
|------|------------|
| Framework | React Native + Expo SDK 58 (compatible con Expo Go) |
| Lenguaje | TypeScript |
| Navegación | `expo-router` (Tabs + Stacks, rutas tipadas) |
| API / caché | Axios + TanStack React Query |
| Estado / persistencia | Zustand + AsyncStorage |
| Formularios | React Hook Form + Zod |
| Estilos | NativeWind (Tailwind CSS) |
| Iconos | lucide-react-native |
| Gestor de paquetes | **pnpm** (no usar npm ni yarn) |

---

## 📋 Requisitos previos

- **Node.js** 20 LTS o superior y **pnpm** instalado (`corepack enable` o `npm i -g pnpm`).
- **Expo Go** en el teléfono ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)), o un emulador Android / simulador iOS.
- Un **backend de Solda Master corriendo y accesible por red**, con la base de datos cargada (ver `BACKEND_API_GUIDE.md`).

> La app usa la IP LAN del servidor, nunca `localhost`. El teléfono y la PC deben estar en la misma red Wi-Fi.

---

## 🚀 Cómo ejecutarlo en tu PC

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Manuelito18/SoldaMaster_appRN.git
   cd SoldaMaster_appRN
   ```

2. **Instalar dependencias** (usar siempre pnpm)
   ```bash
   pnpm install
   ```

3. **Configurar la URL del backend**
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y ajusta `EXPO_PUBLIC_API_URL` con la **IP LAN** de la máquina donde corre el backend:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.18.47:8080
   ```

   Referencias según el dispositivo:
   - Emulador Android: `http://10.0.2.2:8080`
   - Simulador iOS: `http://localhost:8080`
   - Teléfono físico: `http://<IP-LAN-DE-TU-PC>:8080`

4. **Iniciar Expo**
   ```bash
   pnpm start
   ```
   Se abrirá el servidor de desarrollo (Metro) con un código QR.

5. **Abrir la app**
   - Escanea el QR con **Expo Go** en tu teléfono (misma red Wi-Fi), o
   - Presiona `a` para emulador Android, `i` para simulador iOS o `w` para la versión web.

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm start` | Inicia el servidor de desarrollo de Expo |
| `pnpm android` | Inicia y abre en emulador/dispositivo Android |
| `pnpm ios` | Inicia y abre en simulador iOS |
| `pnpm web` | Inicia la versión web |
| `pnpm typecheck` | Verifica tipos con TypeScript (`tsc --noEmit`) |

---

## ⚠️ Notas sobre el backend

- La guía `BACKEND_API_GUIDE.md` es la **fuente de verdad**: no se inventan endpoints ni reglas de negocio.
- Existen productos creados únicamente vía `POST /inventario/producto` (no hay `POST /productos`).
- Según la base de datos de pruebas, algunos catálogos (estados de orden/cuota y métodos de pago) deben estar sembrados en el backend para poder registrar órdenes de compra, ventas a crédito y pagos. Si faltan, la app lo indica en el formulario en lugar de enviar identificadores inventados.

---

## 👥 Proyecto

Desarrollado por el **Grupo 03** del curso Desarrollo de Aplicaciones Móviles. Versión inicial: `app_react_v1`.
