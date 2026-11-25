# MEMORIA DEL PROYECTO — ERP/POS Ferretería (Solda Master)

> Archivo de continuidad. Contiene **todos los prompts enviados por el usuario** y el
> registro de avance por fases. Se actualiza al terminar cada fase y ante cada decisión
> relevante para no perder contexto al avanzar.

---

## 1. Prompts del usuario (texto literal)

### Mensaje 1 — Prompt inicial y especificación completa

```text
# ERP/POS para Ferretería — React Native + Expo

Actúa como un desarrollador senior especializado en React Native, Expo, TypeScript, arquitectura, diseño UI/UX y optimización móvil.

Vamos a desarrollar una aplicación ERP/POS para una empresa de ferretería, con una interfaz profesional, moderna, intuitiva y eficiente.

**Objetivo:** construir una aplicación funcional, mantenible y optimizada, compatible al 100% con Expo Go.

Trabaja por fases. No avances a la siguiente sin mi aprobación.

## 1. Fuente de verdad

Antes de escribir código, lee completely `BACKEND_API_GUIDE.md`.

Este archivo contiene los endpoints, URL, parámetros, DTOs, respuestas y reglas del backend.

- Respeta exactamente los contratos y nombres de campos documentados.
- No inventes endpoints, parámetros, respuestas ni reglas de negocio.
- Si falta información o existe una contradicción, indícalo antes de implementar.
- No modifiques el backend ni su documentación.

## 2. Skills locales: uso obligatorio

Antes de programar:

1. Identifica las skills instaladas localmente en el proyecto, especialmente en `.opencode/skills/`.
2. Lee los `SKILL.md` completos de las skills relevantes para Expo, React Native, diseño, arquitectura, rendimiento y pruebas.
3. Consulta nuevamente las skills pertinentes al implementar cada módulo.
4. Combina sus recomendaciones sin duplicar código ni introducir conflictos.
5. No instales, modifiques ni elimines skills sin mi autorización.
6. No dependas de skills globales. Si alguna skill no está disponible, comunícalo.

Aplica las skills para producir código moderno, interfaces profesionales, arquitectura modular y buen rendimiento.

Prioridad de instrucciones: este prompt → `BACKEND_API_GUIDE.md` → compatibilidad con Expo Go y documentación oficial → recomendaciones de las skills.

Antes de cada fase, indica brevemente qué skills utilizarás. Al finalizar, indica cuáles aplicaste y qué verificaste.

## 3. Stack técnico y restricciones

- **Framework:** React Native + Expo + TypeScript.
- **Compatibilidad:** Expo Go. No utilizar módulos que requieran prebuild o development builds.
- **Paquetes:** exclusivamente `pnpm`. No usar npm ni yarn.
- **Navegación:** `expo-router` (Tabs + Stacks).
- **API y estado del servidor:** Axios + TanStack React Query.
- **Estado global y persistencia:** Zustand + AsyncStorage.
- **Formularios:** React Hook Form + Zod + @hookform/resolvers.
- **UI:** NativeWind + lucide-react-native o @expo/vector-icons.
- **Configuración:** `EXPO_PUBLIC_API_URL` desde `.env`; crear `.env.example` usando la IP local del backend, nunca `localhost`.

Verifica las versiones y compatibilidad de las dependencias antes de instalarlas. Reutiliza las existentes y no agregues dependencias innecesarias.

## 4. Arquitectura

Adapta la estructura existente y organiza el código así:

- `src/api/client.ts`: Axios, baseURL e interceptores de errores.
- `src/api/services/`: servicios tipados de auth, catálogos, productos, inventario, entidades, órdenes de compra, compras, ventas, pagos, reportes y dashboard.
- `src/types/`: tipos basados en `BACKEND_API_GUIDE.md`.
- `src/store/`: `useAuthStore.ts` y `useCartStore.ts`.
- `src/hooks/`: `useCatalogos.ts`.
- `src/components/`: StatusBadge, SearchBar, PaginationControls, EntityPicker, LoadingState y EmptyState.
- `app/`: rutas mediante expo-router.

### Navegación

- `(auth)/login.tsx`
- `(tabs)/index.tsx`: Inicio, dashboard, alertas de stock y actividad.
- `(tabs)/ventas/`: listado, POS, créditos y pagos.
- `(tabs)/inventario/`: productos, stock, lotes, certificados y Kardex.
- `(tabs)/compras/`: órdenes, pendientes, rechazo, registro e historial.
- `(tabs)/mas/`: entidades, reportes y cerrar sesión.

Mantén separados los componentes, servicios, lógica de negocio y estado.

## 5. Reglas de negocio obligatorias

### Autenticación
- `POST /auth/login` no devuelve token.
- Las rutas del backend están abiertas (`permitAll`).
- Guarda perfil y rol (`ADMIN`, `VENDEDOR`, `CONTADOR`) en Zustand + AsyncStorage.
- Los roles controlan únicamente la visibilidad de menús y acciones en la UI; no son seguridad del backend.

### Catálogos
Precarga y cachea con `staleTime: Infinity`:
`/categoria`, `/medida`, `/estado`, `/estado/{codigo}`, `/tipo-entidad`, `/usuarios/roles` y `/venta/metodo-pago`.

### Productos e inventario
- NO existe `POST /productos`.
- Crear productos mediante `POST /inventario/producto`, incluyendo saldo inicial, lote y certificado opcional.
- Editar mediante `PUT /productos/{id}`.
- Lotes: `POST /inventario/lote`, `GET /lote/producto/{idProducto}`.
- Certificados: `POST /inventario/certificado/{idLote}`.
- Kardex: `GET /kardex/producto/{idProducto}` y `GET /kardex/global`.

### Entidades
CRUD completo, paginación y filtros `tipoEntidad`, `tipoDocumento`, `busqueda`. Utiliza `GET /entidad/todas` para pickers.

### Órdenes de Compra y Compras
Crear OC: `POST /orden-compra`.
Listar globales y pendientes (estado `3`).
Rechazar: `PUT /orden-compra/{id}/rechazar` → estado `5`.
En el detalle de una OC pendiente, incluir **Convertir en Compra**, que precargue `POST /compra`.
El backend aprueba automáticamente la compra a estado `23`.

### Ventas
Registrar mediante `POST /venta`.
Calcular subtotales, IGV y total en tiempo real.
Validar stock y que `pagos + cuotas === total`.
Contado: estado `8`. Crédito: estado `6`.
Mostrar comprobante generado (`F001-...` / `B001-...`).
Implementar `GET /venta/credito` y detalle de venta.

No inventes reglas tributarias ni cálculos que no estén definidos en la documentación.

### Pagos y cuotas
- Cuotas por cobrar: `GET /pago/cuotas`.
- Cuotas por venta: `GET /pago/cuotas/{idVenta}`.
- Historial: `GET /pago`.
- Registrar pagos: `POST /pago`.

### Reportes
Implementar `/reporte/compras` y `/reporte/ventas`, con filtros por fechas, proveedor/cliente y tipo de comprobante. Mostrar lista paginada, totales del rango, totales globales y cantidad.

### Dashboard
- KPI: `GET /dashboard/resumen`.
- Alertas de stock.
- Últimos movimientos: `GET /dashboard/actividad`.

Respeta siempre los parámetros, DTOs y respuestas de la guía.

## 6. Diseño y rendimiento

Aplica las skills de diseño y rendimiento para crear una interfaz consistente, moderna y profesional.

- Define colores, tipografía, espaciados, componentes reutilizables y estados visuales.
- Prioriza usabilidad, accesibilidad, adaptación a pantallas y facilidad de uso en un POS.
- Incluye estados de carga, error, vacío, éxito y confirmaciones cuando corresponda.
- Evita interfaces sobrecargadas y botones sin funcionalidad.
- Optimiza listas, consultas y renderizados; utiliza paginación cuando corresponda.
- No dupliques el estado de React Query en Zustand.
- Usa `React.memo`, `useMemo` y `useCallback` solo cuando aporten valor.
- Mantén el código tipado, modular y sin duplicaciones innecesarias.
- No dejes datos ficticios, implementaciones incompletas ni errores ocultos.

## 7. Trabajo por fases

### Fase 1 — API y configuración
Leer backend y skills. Revisar proyecto y dependencias. Configurar `.env.example`, `src/api/client.ts`, `src/types/` y todos los servicios de `src/api/services/`. Instalar dependencias faltantes con pnpm y verificar contratos y TypeScript.

### Fase 2 — Autenticación y navegación
Implementar `useAuthStore`, `useCatalogos`, Login y navegación completa con los 5 Tabs. Configurar visibilidad según roles y verificar persistencia.

### Fase 3 — Entidades e Inventario
Implementar entidades, productos, inventario, lotes, certificados y Kardex.

### Fase 4 — Compras
Implementar órdenes de compra, pendientes, rechazo, conversión de OC a Compra, registro e historial.

### Fase 5 — Ventas y Pagos
Implementar POS, ventas al contado y crédito, comprobantes, créditos pendientes, cuotas y pagos.

### Fase 6 — Dashboard y finalización
Implementar dashboard, reportes, manejo de errores, estados vacíos, refresco pull-to-refresh, optimización y revisión visual general.

**Al finalizar cada fase, detente y espera mi aprobación.**

## 8. Verificaciones y comunicación

Al terminar cada fase, informa:

1. Qué implementaste.
2. Skills consultadas y aplicadas.
3. Archivos creados o modificados.
4. Dependencias instaladas.
5. Verificaciones realizadas y resultados.
6. Problemas o limitaciones pendientes.

Ejecuta las verificaciones disponibles de TypeScript, pruebas y compatibilidad. No inventes resultados; indica cuando algo no pudo verificarse.

No avances sin mi aprobación. No modifiques archivos fuera del proyecto ni elimines funcionalidades existentes sin autorización.

## 9. Inicio

Empieza ahora:

1. Confirma que estás en la raíz del proyecto.
2. Inspecciona las skills locales y lee las relevantes.
3. Lee completamente `BACKEND_API_GUIDE.md`.
4. Revisa las versiones y dependencias existentes.
5. Informa brevemente sobre skills disponibles, dependencias faltantes e incompatibilidades.

Después ejecuta la **Fase 1**.

No avances a la Fase 2 hasta que revise y apruebe la Fase 1.
```

### Mensaje 2 — Aprobación de la Fase 1

```text
listo continua con la fase 2, pero antes de eso, crea un archivo (en markdawn) de memoria con todo el prompt que te envie y actualizalo conforme vas avanzando para que no pierdas memorias al avanzar, despues continua con la fase 2
```

### Mensaje 3 — Aprobación de la Fase 2 y solicitud de Fase 3

```text
Continua con la fase 3 y al terminar actualiza lo que sea necesario de la memoria
```

### Mensaje 4 — Verificación en dispositivo y backend

```text
Ya conecte el telefono y se podra ejecutar con expo go, para que verifiques y corrigas algunas cosas antes de avanzar con la siguiente fase. ademas para que pueds probar la yo usaba esto con curl "curl -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"admin","password":"admin123"}' ", con admin y admin123 en la api
```

### Mensaje 5 — Teléfono conectado y Fase 4

```text
ya esta el telefono conectactado, revisa eso y despues continua con la siguiente fase 4
```

### Mensaje 6 — Preferencia de verificación y aprobación de Fase 4

```text
evita hacer la verificacion con el telefono (con el adb de tomar capturas abrir y cerrar o asi,), porque demora mucho mas, solo hazlo cuando te lo pida o sea muy necesario, y ademas usa los logs para ver los errores o bugs.
Listo apruebo la fase 4 y continua con la fase 5
```

### Mensaje 7 — Aprobación de Fase 5 y datos cargados

```text
Apruebo la Fase 5, ademas ya cargue varios datos para poder probar la app. considerando eso ya puedes avanzar a la Fase 6.
```

### Mensaje 8 — Reporte de solapamiento con la barra de estado

```text
haz una pequeño arreglo a ui, porque actualmente en el home el bloque principal donde esta "Hola Administrador ususario #2 Administrados", esta muy pegado arriba lo que ocasiona que se se ponga debajo de la barra superior del telefono y lo cubre la hora, la bateria del telefono, el logo de la red, arregla ese error; pero antes dime cual es el error y como lo arreglaras
```

### Mensaje 9 — Aplicación del arreglo

```text
aplicalo
```

---

## 2. Decisiones y contradicciones detectadas (acuerdo implícito)

1. **No había proyecto Expo**: la carpeta solo tenía `BACKEND_API_GUIDE.md`, `skills-lock.json` y `.agents/skills/`. Se creó el proyecto desde cero.
2. **Skills en `.agents/skills/`**, no en `.opencode/skills/`. No se usaron skills globales. No hay skill local de pruebas ni `expo-tailwind-setup`.
3. **Entidades**: no existe `DELETE /entidad/{id}` en los 45 endpoints. No se inventa; se implementa alta/consulta/actualización/listado.
4. **Paginación**: §8 de la guía dice "no hay paginación", pero §1/§2/§4 y los curl muestran `Page<T>`. Se sigue la referencia detallada.
5. **`/reporte/compras`** no tiene filtro `docType`; solo `/reporte/ventas` lo tiene. No se inventa.
6. **`/estado/{codigo}`** requiere `tipoCodigo`: se precargan `GENERAL`, `ORDEN`, `VENTA`, `CUOTA` (según datos semilla de la guía).
7. Prioridad de instrucciones del usuario sobre recomendaciones de skills: **Axios** (no fetch), **NativeWind** (no "inline styles only"), **pnpm** (no npm/yarn ni agent-cli para instalar).
8. Sin token: perfil y rol se guardan en AsyncStorage (no SecureStore). Errores del backend → 500 sin mensaje fiable; el interceptor usa mensajes genéricos.
9. `.env.example` con `http://192.168.18.47:8080` (IP LAN verificada; nunca localhost).
10. **Preferencia del usuario**: no usar ADB para abrir/cerrar app ni tomar capturas salvo petición explícita o necesidad crítica. Para detectar errores, usar logs (Metro/Expo), `tsc` y exports.

---

## 3. Registro de avance

### Fase 1 — API y configuración ✅ COMPLETADA (aprobada por el usuario)

- Proyecto Expo SDK 58.0.26 / React 19.3.0 / RN 0.88.1 / expo-router 58.0.32.
- TypeScript 6.0.3 (versión esperada por el SDK), NativeWind 4.2.7 + Tailwind 3.4.19 (preset incluido), lucide-react-native 1.80.0, React Query 5.108.4, Zustand 5.1.0, RHF 7.92.0, Zod 4.6.7, @hookform/resolvers 7.0.9, Axios 1.21.1, AsyncStorage 2.2.0, decimal.js 10.6.0, date-fns 4.4.0.
- Archivos: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`, `global.d.ts`, `.env`, `.env.example`, `.gitignore`, `src/api/client.ts`, `src/types/api.ts`, `src/constants/system.ts` y 11 servicios en `src/api/services/`.
- Verificaciones: `pnpm typecheck` ✅, `pnpm exec expo install --check` ✅, `pnpm dlx expo-doctor@1.21.8` ✅ 20/20.
- Generado automáticamente: `nativewind-env.d.ts`, entrada en `tsconfig.json`, `pnpm-workspace.yaml`.
- Pendiente para fases posteriores: verificación en dispositivo (aún no existen rutas `app/`).

### Fase 2 — Autenticación y navegación ✅ COMPLETADA Y APROBADA

- Skills aplicadas: `expo-router` (+ `references/tabs.md` y `route-structure.md`: NativeTabs, stacks anidados, `hidden` estático, `Stack.Protected`), `expo-data-fetching` (caché infinita + prefetch), `expo-design-system` + `expo-native-ui` (tokens y estados), `expo-ui` (revisión: no se necesitaron sheets/pickers aún), `appllama-app-design-skill` (login como one-way door con `replace`), `react-native-architecture`.
- Implementado:
  - `src/store/useAuthStore.ts`: Zustand + `persist` + AsyncStorage (`solda_auth`), guarda `idUsuario`, `entidad`, `nombreRol` (sin token), marca `hydrated` vía `onRehydrateStorage`, `setSession`, `clearSession`, `hasRole`.
  - `src/constants/roles.ts`: roles ADMIN/VENDEDOR/CONTADOR y mapa de visibilidad de pestañas (UI únicamente). ADMIN ve todo; VENDEDOR sin Compras; CONTADOR sin Inventario; rol desconocido solo Inicio y Más.
  - `src/hooks/useCatalogos.ts`: 7 catálogos con `staleTime: Infinity`, `useQueries` para `/estado/{codigo}` (GENERAL/ORDEN/VENTA/CUOTA), `usePrecargarCatalogos` y `refetchAll`.
  - `src/providers/query-provider.tsx`: QueryClient con `staleTime` 5 min, `retry: 1`, sin refetch en foco.
  - `src/theme/index.ts` + `tailwind.config.js`: tokens de color, espaciado y radius compartidos.
  - Componentes: `status-badge`, `loading-state`, `empty-state`, `search-bar`, `pagination-controls`, `entity-picker`, `module-hub`.
  - Rutas: `app/_layout.tsx` (gate de hidratación + `Stack.Protected`), `(auth)/login.tsx` (RHF+Zod, error inline, `router.replace('/')`), `(tabs)/_layout.tsx` (NativeTabs con 5 tabs y visibilidad por rol), stacks anidados en ventas/inventario/compras/más, `+not-found.tsx`.
  - Inicio muestra datos reales de catálogos (loading/error/content). Más muestra perfil, catálogos y cerrar sesión con confirmación nativa y `replace('/login')`.
  - Las pantallas de Ventas/Inventario/Compras son hubs informativos con sus submódulos y fase asignada (no botones falsos); se completan en Fases 3-5.
- Decisiones nuevas: `useCartStore` se difiere a Fase 5 (POS); modo oscuro pendiente de revisión visual en Fase 6; `styles.d.ts` añadido para imports CSS con TS 6.
- Verificaciones: `pnpm typecheck` ✅, `pnpm exec expo install --check` ✅, `pnpm dlx expo-doctor@1.21.8` ✅ 20/20, `expo export --platform android` ✅ (6.4 MB bundle), `expo export --platform ios` ✅ (6.4 MB bundle). Sin verificación en simulador/dispositivo ni backend levantado.

### Fase 3 — Entidades e Inventario ✅ COMPLETADA (pendiente de aprobación)

- Skills aplicadas: `expo-data-fetching` (React Query, paginación, estados loading/error/empty, RefreshControl), `expo-design-system`/`expo-native-ui` (formularios y filas consistentes), `expo-router` (stacks anidados y rutas dinámicas con `Stack.Title`), `react-native-best-practices` (FlatList + `useCallback`/`useMemo` solo donde aportan), `appllama-app-design-skill` (ciclos de estado completos).
- Implementado:
  - Hooks: `src/hooks/query-keys.ts`, `useEntidades.ts`, `useProductos.ts`, `useInventario.ts` con keys centralizadas e invalidaciones tras mutaciones.
  - Utilidades `src/utils/format.ts` (moneda es-PE/PEN, fechas ISO, now local).
  - Formularios reutilizables: `form-field`, `submit-button`, `entity-form`, `producto-form` (alta con saldo inicial/lote/certificado y edición con PUT), `lote-form`, `certificado-form` (RHF + Zod).
  - Entidades: listado paginado con búsqueda, filtros `tipoEntidad`/`tipoDocumento`, alta y edición. Sin DELETE (no existe en la API). Acceso desde Más.
  - Inventario: listado de productos con búsqueda/filtro por categoría, alta vía `POST /inventario/producto`, edición vía `PUT /productos/{id}`, detalle con accesos a lotes y kardex, pantalla de stock crítico, lotes por producto con registro y certificados, kardex global/por producto.
  - El hub de Inventario se sustituyó por accesos reales: Productos, Stock, Lotes y Kardex.
- Decisiones nuevas: `ProductoForm` es un `View` reutilizable (el contenedor ScrollView lo aporta cada pantalla) para anidar la edición dentro del detalle; los certificados se crean desde el listado de lotes o en el alta del producto; `tipoDocumento` se filtra con texto libre (no hay catálogo de tipos de documento en la API).
- Verificaciones: `pnpm typecheck` ✅ (tras regenerar tipos de rutas), `expo install --check` ✅, `expo-doctor` ✅ 20/20, `expo export --platform android` ✅ (6.8 MB). Sin verificación en dispositivo ni backend levantado.

### Verificación en vivo (backend + Expo Go) — sin avanzar de fase

- Backend confirmado en `http://localhost:8080` y `http://192.168.18.47:8080`: `POST /auth/login` con `admin/admin123` devuelve 200 y `{idUsuario:2, entidad, nombreRol:"ADMIN"}`. Los 29 GET usados por la app devuelven 200.
- Hallazgo real corregido: en esta BD `/estado` solo contiene `{idEstado:2, nombre:"ACTIVO", tipoCodigo:"USUARIO"}`. El valor documentado `1` en la guía no existe aquí, por lo que los formularios habrían enviado `idEstado:1` y recibido 500. Corregido en `entity-form.tsx` y `producto-form.tsx`: el id por defecto se deriva de `/estado` (ACTIVO o el primero) y se aplica vía `setValue` cuando el catálogo llega tarde.
- Otros datos reales: `/venta/metodo-pago` está vacío (el POS de Fase 5 no podrá registrar pagos hasta sembrar métodos de pago); `/tipo-entidad` solo tiene EMPLEADO; `/categoria` tiene `nombre: " soldadura"` (con espacio inicial); hay 1 producto y 1 entidad.
- `adb devices` no lista ningún dispositivo y `192.168.18.114:5555` rechaza conexión: el teléfono aún no es detectable por ADB. Servidor Expo levantado en `exp://192.168.18.47:8081` (verificado HTTP 200 por LAN). Falta que el usuario autorice depuración USB o escanee el QR/abra esa URL en Expo Go para la verificación visual y de interacción.
- Error de runtime recibido desde el bundle del teléfono: `NativeTabs.Trigger.Icon md icons on Android require 'expo-symbols'` y aviso de deprecación de `expo-router/unstable-native-tabs`. Corregido: import cambiado a `expo-router/native-tabs` e instalados `expo-symbols@~58.0.5` + su peer `expo-font@~58.0.12` (con pnpm). Verificado: `pnpm typecheck` ✅, `expo install --check` ✅, `expo-doctor` ✅ 20/20, `expo export --platform android` ✅ (incluye la fuente MaterialSymbols, 6.9 MB).
- Segundo error de runtime: las clases de NativeWind no se aplicaban. Causa: faltaba el transformador JSX. Corregido en `babel.config.js` (`babel-preset-expo` con `jsxImportSource: 'nativewind'` + preset `nativewind/babel`) e instalada como dependencia directa `react-native-css-interop@0.2.7` (pnpm estricto no la resolvía desde `nativewind`). Tras reiniciar Metro con `--clear`, la UI se ve estilizada correctamente en el teléfono.
- Verificación visual en dispositivo (ADB conectado, `host.exp.exponent`): Inicio con KPIs y tab bar nativa, Más con perfil/catálogos/cerrar sesión, listado de entidades, formulario de alta (ACTIVO preseleccionado desde `/estado` id 2), alta de entidad confirmada por alerta, listado y detalle de productos con edición anidada. `pnpm typecheck` ✅ tras los cambios.
- Quirk real del backend detectado: `GET /entidad` paginado **excluye entidades con `idTipoEntidad` null**, aunque `/entidad/todas` las incluye. Corregido en `entity-form.tsx`: al crear se predetermina el primer tipo de entidad del catálogo (en esta BD, EMPLEADO). Datos QA creados durante la prueba: `EntidadQA` (id 3, sin tipo) y `EntidadQA2` (id 4, EMPLEADO). No se pueden borrar: la API no tiene DELETE.
- Ajuste visual: las tarjetas de KPI de Inicio pasan de `flex-1` a `w-[46%]` para evitar Texto partido en sílabas en pantalla de 720 px.
- Servidor Expo activo en `exp://192.168.18.47:8081`.

### Fase 4 — Compras ✅ COMPLETADA Y APROBADA

- Skills aplicadas: `expo-data-fetching`, `expo-router`, `expo-design-system`/`expo-native-ui`, `react-native-best-practices` (FieldArray + Decimal para totales), `appllama-app-design-skill`.
- Implementado:
  - `src/hooks/useCompras.ts`: keys e hooks de órdenes (global, pendientes, detalle), compras (listado, detalle) y mutaciones (crear OC, rechazar, crear compra con invalidación de productos/inventario).
  - Formularios `orden-compra-form.tsx` y `compra-form.tsx` (RHF + Zod + `useFieldArray`, totales con `decimal.js`). El de compra precarga desde una OC cuando se abre con `?orden=<id>` (serie `OC-<id>`, proveedor, productos y costos pactados).
  - Pantallas: hub de Compras con accesos reales, listado global de órdenes con búsqueda/paginación, pendientes, alta de OC, detalle con **Rechazar** (confirmación) y **Convertir en Compra**, historial de compras, alta de compra y detalle de compra.
- Limitación real del backend confirmada por curl: en esta BD `/estado` solo tiene id 2 (`ACTIVO`/`USUARIO`); no existen los estados `PENDIENTE`(3), `RECHAZADO`(5) ni `APROBADO`(23). `POST /orden-compra` con `idEstadoOrden:3` devuelve 500. Por eso el formulario de OC busca el estado PENDIENTE en el catálogo y, si no existe, muestra un mensaje inline en lugar de enviar un id inventado. Rechazo y aprobación siguen implementados según el contrato; fallarán en este entorno hasta que el backend siembre esos estados (no se modificó el backend).
- Verificación en dispositivo: hub de Compras y formulario de OC renderizan correctamente; se ajustó el layout de KPIs de Inicio a 2 columnas (`w-[46%]`).
- Dependencias añadidas para cumplir peers de NativeWind/Reanimated: `react-native-reanimated@4.7.1` y `react-native-worklets@0.13.0` (pnpm). `expo-doctor` vuelve a 20/20.
- Verificaciones: `pnpm typecheck` ✅, `expo install --check` ✅, `expo-doctor` ✅ 20/20, `expo export --platform android` ✅ (8.2 MB). Servidor Expo reiniciado en `exp://192.168.18.47:8081`.
### Fase 5 — Ventas y Pagos ✅ COMPLETADA Y APROBADA

- Skills aplicadas: `expo-data-fetching`, `expo-router`, `expo-design-system`/`expo-native-ui`, `react-native-best-practices`, `react-native-architecture` (Zustand), `appllama-app-design-skill`.
- Implementado:
  - `src/store/useCartStore.ts`: carrito con `add/update/remove/clear/descuentoGlobal`, selectores `subtotal`, `base imponible`, `IGV 18%` y `total` con `decimal.js`. Cantidad nunca supera el stock.
  - `src/hooks/useVentas.ts` y `usePagos.ts`: queries de ventas/créditos/detalle, pagos/cuotas/historial y mutaciones con invalidación de ventas, productos, inventario, dashboard y reportes.
  - POS (`src/screens/ventas/pos-screen.tsx`): búsqueda de productos, selección de precio (venta/mayorista/distribuidor), cantidad/descuento por producto, carrito editable, descuento global con recálculo en tiempo real, contado vs crédito, tipo de comprobante (F001/B001), validaciones de stock, cliente, método de pago y estado de cuota, y `POST /venta` con `detalles/pagos/cuotas` según el contrato. El comprobante se muestra en la alerta de éxito y se navega al detalle.
  - Pantallas: hub de Ventas, listado, créditos, pagos/cuotas con selector `Por cobrar`/`Historial`, formulario de pago (`POST /pago`), detalle de venta con comprobante, productos y cuotas.
- Reglas respetadas: `precioUnitario` sale de los tres precios del producto; `subTotal = precio*cantidad - descuento`; `total = sum(subtotales) - descuentoGlobal + 18% IGV`; `pagos + cuotas = total`; el servidor decide serie y estado (8/6). No se inventaron reglas tributarias.
- Limitación del entorno: `/venta/metodo-pago` está vacío y no hay estados de cuota (`POR COBRAR`) en la BD, por lo que contado/crédito no pueden completarse hasta sembrar esos datos. La UI lo indica con mensajes inline; no se envían ids inventados.
- Incidente detectado por logs del servidor Expo (bundle previo al fix): `ReferenceError: Property 'PointOfSale' doesn't exist` en `app/(tabs)/ventas/index.tsx` y, como cascada, `Cannot read property 'displayName' of undefined` en el shim de `react-native-safe-area-context` de `react-native-css-interop`. Causa raíz: `PointOfSale` no es un export de `lucide-react-native`. Corregido usando `Store`. Verificado: no quedan referencias a `PointOfSale`, `pnpm typecheck` ✅ y `expo export --platform android` ✅ posterior sin errores.
- Verificación (sin ADB, según preferencia del usuario): `pnpm typecheck` ✅, `expo install --check` ✅, `expo-doctor` ✅ 20/20, `expo export --platform android` ✅ (8.2 MB, sin errores en logs).
### Fase 6 — Dashboard y finalización ✅ COMPLETADA

- Skills aplicadas: `expo-data-fetching`, `expo-router`, `expo-design-system`/`expo-native-ui`, `react-native-best-practices`, `appllama-app-design-skill`.
- Implementado:
  - `src/hooks/useDashboard.ts` y `src/hooks/useReportes.ts` con keys e invalidaciones coherentes.
  - Inicio enriquecido: KPIs reales de `/dashboard/resumen` (9 indicadores), actividad de `/dashboard/actividad` con estados loading/error/empty y catalogos; `RefreshControl` que recarga dashboard + catálogos.
  - Reportes en Más (`app/(tabs)/mas/reportes/index.tsx`): pestañas Ventas/Compras, filtros por fechas (`YYYY-MM-DD`), proveedor, cliente y `docType` con comodín `Todos`, totales del rango/globales/cantidad, `ventasHoy`/`ventasMes`, lista paginada y pull-to-refresh.
  - `src/components/error-boundary.tsx` envuelve el root layout como red de seguridad; muestra mensaje y botón de reintento.
  - Enlace a Reportes desde Más.
- Datos reales verificados por curl con la BD ya cargada: `/dashboard/resumen` 200 con 8 productos, 5 clientes, 285 unidades, valor 12949, ventas mes 1163.75; `/dashboard/actividad` 16 eventos; `/reporte/ventas?docType=Todos` 6 registros y total 1163.75; `/reporte/compras` 3 registros y total 1450.
- Nota de herramientas: los tipos de rutas de Expo Router se regeneraron al iniciar el servidor (`expo start --clear`); `expo export` por sí solo no actualizó el tipo de la nueva ruta `/mas/reportes`. Sin ADB, según preferencia del usuario.
- Verificaciones finales: `pnpm typecheck` ✅, `expo install --check` ✅, `expo-doctor` ✅ 20/20, `expo export --platform android` ✅ (8.2 MB, sin errores en logs).
- Estado final: las 6 fases están completadas. Pendientes conocidos (datos/backend, no código): estados de orden/cuota y métodos de pago deben sembrarse en el backend para poder registrar OC/ventas a crédito y pagos; modo oscuro no fue verificado visualmente tras la última revisión; no se ejecutó verificación en dispositivo en esta fase por preferencia del usuario.

### Ajuste posterior al cierre (warning de ImageBackground)

- Warning reportado por el usuario: `ImageBackground is deprecated and will be removed in a future release`. Origen: `react-native-css-interop` (dependencia de NativeWind) remapea `ImageBackground` de RN 0.88; no es un componente de la app y no hay versión nueva de esa librería que lo evite.
- Solución aplicada sin tocar `node_modules`: entry propio `index.js` que importa `src/utils/suppress-known-warnings.ts` antes que `expo-router/entry`; el filtro ignora **solo** ese mensaje exacto y deja pasar cualquier otro `console.warn`. `package.json.main` cambiado a `index.js`.
- Verificado: `pnpm typecheck` ✅, `expo install --check` ✅, `expo-doctor` ✅ 20/20, `expo export --platform android` ✅ (8.2 MB).

### Ajuste UI posterior (home / status bar)

- Reporte del usuario: la tarjeta principal de Inicio («Hola, Administrador…») quedaba debajo de la barra de estado del teléfono (hora, batería, red).
- Causa: root `Stack` con `headerShown: false` + `NativeTabs` sin header; el `ScrollView` de Inicio solo tenía `padding: 16` y `contentInsetAdjustmentBehavior="automatic"`, que no aporta inset superior en Android con edge-to-edge.
- Arreglo aplicado en `app/(tabs)/index.tsx`: `useSafeAreaInsets()` de `react-native-safe-area-context`, `paddingTop: insets.top + 16`, `paddingHorizontal: 16`, `paddingBottom: 32` y eliminación de `contentInsetAdjustmentBehavior="automatic"` en ese ScrollView para no duplicar el inset en iOS.
- Verificado con `pnpm typecheck` ✅ y `expo export --platform android` ✅ (8.2 MB, sin errores en logs). Sin ADB, según preferencia del usuario.

---

## 4. Regla de actualización

Al terminar cada fase o tomar una decisión que cambie el plan, actualizar este archivo: marcar la fase como ✅, añadir archivos creados, verificaciones y nuevos acuerdos. No borrar los prompts originales.
