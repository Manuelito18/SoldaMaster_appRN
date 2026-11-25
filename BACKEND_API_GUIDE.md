# Solda Master — Guía de integración para app React Native

Documento de referencia para construir una app móvil (React Native) que consuma el **backend REST de Solda Master** (Spring Boot 4.1). Se generó leyendo el código fuente completo: 17 controladores, 45 endpoints, 53 DTOs, configuración de seguridad/CORS, esquema SQL y servicios.

>backend: `/home/manuel/Proyectos/university/courses/DesarrolloApps/Grupo03_DA_APP_MOVIL/Solda_Maste`  
>este documento: `.../Grupo03_DA_APP_MOVIL/app_react/BACKEND_API_GUIDE.md`

---

## 1. Arranque rápido

```bash
# En la carpeta del backend:
docker compose up -d        # PostgreSQL 16 + pgAdmin (5432 / 5050)
./mvnw spring-boot:run      # API en http://localhost:8080
```

- pgAdmin: `http://localhost:5050` — `cleo@cuquin.com` / `admin123`; servidor: host `postgres`, puerto `5432`, usuario `postgres`, password `admin123`, BD `smaster_bd`.
- `pom.xml` fija Lombok `1.18.48` para que funcione con JDK 27.
- `init-scripts/01_schema.sql` crea las 25 tablas (solo DDL, sin datos).
- Usuario de prueba: **admin / admin123** (hash BCrypt guardado en la BD).

### URL base según el dispositivo

| Destino | URL |
|---|---|
| Android emulator | `http://10.0.2.2:8080` |
| iOS simulator | `http://localhost:8080` |
| Dispositivo físico (misma WiFi) | `http://192.168.18.47:8080` (IP LAN de la máquina del backend) |

Android con HTTP claro requiere `android:usesCleartextTraffic="true"` en `AndroidManifest.xml`; en iOS hay que permitir excepciones ATS o usar HTTPS.

---

## 2. Resumen ejecutivo (leer antes de programar)

| Tema | Comportamiento real |
|---|---|
| Autenticación | **No existe.** `SecurityConfig`: CSRF desactivado y `anyRequest().permitAll()`. `POST /auth/login` solo valida BCrypt y devuelve `{idUsuario, entidad, nombreRol}`; **no emite token**. No enviar `Authorization`. |
| Autorización | No hay comprobación de roles; `nombreRol` es solo informativo. |
| CORS | `*` para GET/POST/PUT/DELETE/PATCH. En nativo no aplica, pero útil si luego hay web. |
| Errores | **No hay `@RestControllerAdvice`**: "no encontrado" y validaciones lanzan excepciones → **HTTP 500**, nunca 404. Cuerpo de error genérico de Spring (`timestamp`, `status`, `error`, `path`). |
| Validación | Los DTOs tienen anotaciones `@NotNull`, `@Size`, etc., pero **ningún controlador usa `@Valid`**: no se aplican. Validar en la app. |
| Dinero | `BigDecimal` → **números JSON** (ej. `236.00`). Usar `decimal.js`, no float. |
| Fechas | ISO strings: `LocalDate` = `YYYY-MM-DD`, `LocalDateTime` = `YYYY-MM-DDTHH:mm:ss`. Enviar igual. |
| Paginación | Respuestas `Page<T>` con forma `{content, totalElements, totalPages, size, number, ...}`, **no** un array plano. No hay paginación en `GET /productos/todos`, `/entidad/todas`, `/venta`, `/kardex/*`. |
| Seguridad de datos | ⚠️ `UsuarioResponse` incluye el campo `password` con el **hash BCrypt** dentro de respuestas anidadas. Nunca mostrarlo ni loguearlo. |
| Seriales | El backend genera `F001-000001` si `tipoComprobante="Factura"` (case-insensitive), si no `B001-000001`. El valor enviado se ignora. |
| Zona horaria | Fechas generadas por servidor usan `America/Lima`. |

**Reglas de negocio críticas en `POST /venta`** (el servidor las valida y falla con 500 si no cuadran):

- `precioUnitario` debe ser exactamente `precioVenta`, `precioMayorista` o `precioDistribuidor` del producto.
- `cantidad <= stock`.
- `subTotal = precioUnitario * cantidad - descuentoProducto` (tolerancia 0.05).
- `total = sum(subtotales) - descuentoGlobal + 18% IGV` (tolerancia 0.05).
- `pagosList + cuotasList` debe cubrir el total (tolerancia 0.05).
- Estado de venta: **8** (pagado) si los pagos cubren el total; si no, **6** (crédito). El `idEstadoVenta` enviado se ignora.

---

## 3. Datos semilla necesarios (el backend asume estos IDs)

El esquema no incluye INSERTs y el código usa IDs fijos. Ejecuta **una sola vez** sobre una BD recién creada:

```bash
docker exec -i postgres_db psql -U postgres -d smaster_bd <<'SQL'
INSERT INTO estados_sistema (id_estado, tipo_codigo, nombre) VALUES
 (1,'GENERAL','ACTIVO'), (3,'ORDEN','PENDIENTE'), (5,'ORDEN','RECHAZADO'),
 (6,'VENTA','CREDITO'), (7,'VENTA','ANULADO'), (8,'VENTA','PAGADO'),
 (9,'CUOTA','POR COBRAR'), (10,'CUOTA','CANCELADO'), (11,'CUOTA','PENDIENTE'),
 (23,'ORDEN','APROBADO')
ON CONFLICT (id_estado) DO NOTHING;
SELECT setval(pg_get_serial_sequence('estados_sistema','id_estado'), 23, true);

INSERT INTO tipos_movimiento (id_tipo_movimiento, nombre) VALUES (1,'ENTRADA'),(2,'SALIDA')
ON CONFLICT (id_tipo_movimiento) DO NOTHING;
SELECT setval(pg_get_serial_sequence('tipos_movimiento','id_tipo_movimiento'), 2, true);

INSERT INTO roles (nombre) VALUES ('ADMIN'),('VENDEDOR'),('CONTADOR');
INSERT INTO tipos_entidad (nombre) VALUES ('CLIENTE'),('PROVEEDOR'),('EMPLEADO');
INSERT INTO metodos_pago (nombre) VALUES ('EFECTIVO'),('CREDITO'),('TRANSFERENCIA');
INSERT INTO categorias (id_estado, nombre, descripcion) VALUES
 (1,'SOLDADURA','Equipos de soldadura'), (1,'FERRETERIA','Materiales y herramientas');
INSERT INTO medidas (id_estado, nombre) VALUES (1,'UNIDAD'),(1,'KILO');

INSERT INTO entidades (id_estado, id_tipo_entidad, nombre_razon_social, tipo_documento, numero_documento)
SELECT 1, te.id_tipo_entidad, 'Cliente Demo', 'DNI', '12345678'
FROM tipos_entidad te WHERE te.nombre = 'CLIENTE' LIMIT 1;

INSERT INTO usuarios (id_entidad, id_estado, id_rol, usuario, password)
SELECT e.id_entidad, 1, r.id_rol, 'admin',
       '$2a$10$l3eYbIXlaUzWLxdzsyXxY.KwLjnd36d7y2dHYXKv6r.a5t59q4txu'
FROM entidades e, roles r
WHERE e.nombre_razon_social = 'Cliente Demo' AND r.nombre = 'ADMIN' LIMIT 1;
SQL
```

| ID / nombre | Para qué sirve |
|---|---|
| estado `1` | Activo; auto-creación de categorías/medidas por nombre. |
| estado `3` / `5` / `23` | Orden pendiente / rechazada / aprobada. |
| estado `6` / `8` / `7` | Venta crédito / pagada / anulada. |
| estado `9`, `11` / `10` | Cuota por cobrar / cancelada. |
| tipo movimiento `1` / `2` | Entrada / salida de stock. |
| tipo entidad `CLIENTE` | Métrica `totalClientes` del dashboard. |
| `tipoComprobante = "Factura"` | Prefijo de serie `F001-`; cualquier otro valor → `B001-`. |
| `"Todos"` | Comodín en filtros `tipoEntidad`, `tipoDocumento` y `docType`. |

---

## 4. Referencia detallada de la API

El resto del documento contiene: índice de los 45 endpoints, detalle por controlador con parámetros y respuestas exactas, tablas de todos los DTOs de request/response y los requisitos de datos semilla. Los nombres de campos están en inglés porque son los literales del JSON.


## Apéndice A — Referencia técnica completa (generada del código fuente)


**Source-of-truth for the React Native client.** Generated by reading **all** classes under
`src/main/java/com/soldaMaster/solda/controller/`, **all** classes under `.../dto/`, the
`config/`, `exception/`, `mapper/`, `repository/` and `service/` packages,
`src/main/resources/application.properties`, `init-scripts/01_schema.sql` and `pom.xml`.

> **Controller count correction:** the task description mentioned 19 controllers, but the
> repository actually contains **17** `@RestController` classes (verified by a repo-wide search).
> All 17 are documented below. They expose **45 endpoints**.

---

## 1. Global conventions (read this first)

| Topic | Exact behavior |
|---|---|
| Base URL | `http://localhost:8080` — `application.properties` sets **no** `server.port` and **no** `server.servlet.context-path`, so Spring Boot default port 8080 and root context `/` apply. |
| Content type | `application/json` for all request bodies and responses. `@RestController` = `@ResponseBody`; no `produces`/`consumes` are declared on any mapping. |
| Framework | Spring Boot **4.1.0**, Java 25, `spring-boot-starter-webmvc`, Spring Data JPA, MapStruct 1.6.3, Bean Validation present. |
| Database | PostgreSQL `jdbc:postgresql://localhost:5432/smaster_bd`, user `postgres`, password `admin123`. `spring.jpa.hibernate.ddl-auto=validate` — schema must already exist (`init-scripts/01_schema.sql` has the DDL, **no INSERT/seed rows**). |
| Authentication | **None.** `SecurityConfig` sets `csrf.disable()` and `authorizeHttpRequests(auth -> auth.anyRequest().permitAll())`. No JWT, no session, no Basic/OAuth configured. Do **not** send an `Authorization` header; it is ignored. `POST /auth/login` returns profile data only — **no token**. |
| Authorization | No role checks anywhere; every endpoint is reachable by anyone. `nombreRol` from login is informational only. |
| CORS | `CorsConfig` registers `/**` with `allowedOrigins("*")`, `allowedMethods("GET","POST","PUT","DELETE","PATCH")`. `allowedHeaders`, `exposedHeaders`, `allowCredentials` and `maxAge` are not customized (Spring `CorsRegistration` defaults). `HEAD` is not explicitly allowed. CORS is configured via `WebMvcConfigurer` (not `http.cors()`), which is fine because all requests are `permitAll` (including preflight `OPTIONS`). |
| `@Valid` on request bodies | **Not used anywhere.** Although DTOs carry `jakarta.validation` annotations and the validation starter is on the classpath, no controller method annotates `@RequestBody` with `@Valid`/`@Validated`. **Constraints are therefore not enforced** — treat all listed constraints as advisory documentation, not runtime behavior. |
| Bean-validation errors | Would be `400` via Spring's default handler *if* `@Valid` were present, but this never happens in the current code. |
| `BigDecimal` serialization | No `@JsonFormat`/`@JsonSerialize` on any `BigDecimal` field → Jackson emits **JSON numbers** (not quoted strings), e.g. `"montoTotal": 125.50`. Mobile clients should parse as `double`/`decimal` and be aware of precision. |
| `LocalDateTime` / `LocalDate` | No custom Jackson config → ISO-8601 **strings**: `"2026-11-25T10:30:00"` and `"2026-11-25"` respectively. Send the same format in request bodies. Note: `DetalleCompraService` creates lot dates with `LocalDateTime.now(ZoneId.of("America/Lima"))`; sale `fechaEmision` also defaults to `America/Lima` now. |
| `Page<T>` JSON shape | Spring Data `PageImpl` serialized by Jackson: `{ content: [...], pageable: {...}, last: boolean, totalElements: number, totalPages: number, size: number, number: number, sort: {...}, numberOfElements: number, first: boolean, empty: boolean }`. `pageable` typically includes `pageNumber`, `pageSize`, `offset`, `sort`, `paged`, `unpaged`, `instance`. |
| Error handling | **There is no `@RestControllerAdvice`, no `@ExceptionHandler` and no `@ResponseStatus` anywhere in the project** (verified repo-wide). `RecursoNoEncontradoException` is a plain `RuntimeException` (no status annotation). Consequently every "not found" case returns **HTTP 500 Internal Server Error**, *not* 404. `IllegalArgumentException`, `RuntimeException`, `DateTimeParseException`, `NullPointerException` also surface as 500 with Spring's default error body (`timestamp`, `status`, `error`, `path`, possibly `message`/`trace` depending on error settings). There is **no** structured API error envelope. |
| Error message typos | Recurso messages contain literal typos, e.g. `"5 Orden no encotrada"`, `"3 Producto no encotrado"`, `"X Cuota no encotrada"`. Match on status code, not message text. |
| Negative `page` | Some services clamp `page < 0` to `0` (`/entidad`, `/compra/proveedor/{id}`, `/venta/cliente/{id}`, `/reporte/ventas`); others do **not** (`/compra/global`, `/orden-compra/global`, `/productos`, `/reporte/compras`) and will throw `IllegalArgumentException` → 500. |
| Entities returned directly | **None.** Every endpoint returns a DTO, a `List<DTO>`, a `Page<DTO>` or a DTO wrapper. No JPA entity leaks to JSON. |

---

## 2. Quick endpoint index

| # | Method | Path | Response type |
|---|---|---|---|
| 1 | POST | `/auth/login` | `LoginResponse` |
| 2 | GET | `/categoria` | `List<CategoriaResponse>` |
| 3 | POST | `/compra` | `CompraResponse` |
| 4 | GET | `/compra/{idCompra}` | `CompraResponse` |
| 5 | GET | `/compra/global` | `Page<CompraResponse>` |
| 6 | GET | `/compra/proveedor/{idProveedor}` | `Page<CompraResponse>` |
| 7 | GET | `/dashboard/actividad` | `List<ActividadDTO>` |
| 8 | GET | `/dashboard/resumen` | `ResumenDashboardDTO` |
| 9 | GET | `/entidad` | `Page<EntidadResponse>` |
| 10 | GET | `/entidad/todas` | `List<EntidadResponse>` |
| 11 | POST | `/entidad` | `EntidadResponse` |
| 12 | GET | `/entidad/{id}` | `EntidadResponse` |
| 13 | PUT | `/entidad/{id}` | `EntidadResponse` |
| 14 | GET | `/estado` | `List<EstadoResponse>` |
| 15 | GET | `/estado/{codigo}` | `List<EstadoResponse>` |
| 16 | POST | `/inventario/producto` | `MovimientoInventarioResponse` |
| 17 | POST | `/inventario/lote` | `LoteResponse` |
| 18 | POST | `/inventario/certificado/{id}` | `LoteResponse` |
| 19 | GET | `/lote/producto/{id}` | `List<LoteResponse>` |
| 20 | GET | `/medida` | `List<MedidaResponse>` |
| 21 | GET | `/kardex/producto/{id}` | `List<MovimientoInventarioResponse>` |
| 22 | GET | `/kardex/global` | `List<MovimientoInventarioResponse>` |
| 23 | POST | `/orden-compra` | `OrdenCompraResponse` |
| 24 | GET | `/orden-compra/global` | `Page<OrdenCompraResponse>` |
| 25 | GET | `/orden-compra/{id}` | `OrdenCompraResponse` |
| 26 | GET | `/orden-compra/pendientes` | `List<OrdenCompraResponse>` |
| 27 | PUT | `/orden-compra/{id}/rechazar` | `OrdenCompraResponse` |
| 28 | POST | `/pago` | `PagoResponse` |
| 29 | GET | `/pago/cuotas/{idVenta}` | `List<CuotaResponse>` |
| 30 | GET | `/pago/cuotas` | `List<CuotaResponse>` |
| 31 | GET | `/pago` | `List<PagoResponse>` |
| 32 | GET | `/productos/todos` | `List<ProductoResponse>` |
| 33 | GET | `/productos` | `Page<ProductoResponse>` |
| 34 | GET | `/productos/{id}` | `ProductoResponse` |
| 35 | PUT | `/productos/{id}` | `ProductoResponse` |
| 36 | GET | `/reporte/compras` | `ReporteCompraDTO` |
| 37 | GET | `/reporte/ventas` | `ReporteVentaDTO` |
| 38 | GET | `/tipo-entidad` | `List<TipoEntidadResponse>` |
| 39 | GET | `/usuarios/roles` | `List<RolResponse>` |
| 40 | POST | `/venta` | `VentaResponse` |
| 41 | GET | `/venta/metodo-pago` | `List<MetodoPagoResponse>` |
| 42 | GET | `/venta/credito` | `List<VentaCreditoResponse>` |
| 43 | GET | `/venta` | `List<VentaResponse>` |
| 44 | GET | `/venta/{idVenta}` | `VentaResponse` |
| 45 | GET | `/venta/cliente/{idCliente}` | `Page<VentaResponse>` |

> **Routing note:** literal paths (`/compra/global`, `/compra/proveedor/{id}`,
> `/entidad/todas`, `/orden-compra/global`, `/orden-compra/pendientes`, `/productos/todos`,
> `/pago/cuotas`, `/venta/metodo-pago`, `/venta/credito`, `/venta/cliente/{id}`) win over
> competing `@GetMapping("/{id}")` patterns — Spring MVC prefers exact/literal matches.

---

## 3. Endpoint details

### 3.1 `AuthController` — base `/auth`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 1 | `POST /auth/login` | `@RequestBody UsuarioCredenciales`: `usuario: String`, `password: String` (no validation annotations) | `LoginResponse`: `idUsuario: Integer`, `entidad: EntidadResponse` (nested), `nombreRol: String` | Authenticates `usuario` via `findByUsuario` and checks `password` with `BCryptPasswordEncoder.matches` against the stored hash. Returns user id, the associated `EntidadResponse` profile and the role **name** only. **No token, no session, no cookie is issued** — since all endpoints are `permitAll`, login is purely informational. Unknown user → `RecursoNoEncontradoException("Usuario o contraseña incorrecta")` → **500**; wrong password → `RuntimeException("Usuario o contraseña incorrectos")` → **500**. Stored password is a BCrypt hash, so sending a plain-text comparison value will fail. |

### 3.2 `CategoriaController` — base `/categoria`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 2 | `GET /categoria` | none | `List<CategoriaResponse>` → `idCategoria: Integer`, `nombre: String` | Lists all categories (`findAll()`), no pagination, no filters. |

### 3.3 `CompraController` — base `/compra`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 3 | `POST /compra` | `@RequestBody CompraRequest`: `tipoComprobante: String`, `serieCorrelativa: String`, `fechaCompra: LocalDateTime`, `montoTotal: BigDecimal`, `idOrden: Integer`, `idProveedor: Integer`, `idUsuario: Integer`, `listaDetalleCompra: List<DetalleCompraRequest>` (nested: `cantidad: Integer`, `precioCostoUnitario: BigDecimal`, `idCompra: Integer`, `idLote: Integer`, `numeroLote: String`, `idProducto: Integer`) | `CompraResponse`: `idCompra: Integer`, `tipoComprobante: String`, `serieCorrelativa: String`, `fechaCompra: LocalDateTime`, `montoTotal: BigDecimal`, `idOrden: OrdenCompraResponse` (nested), `idProveedor: EntidadResponse` (nested), `idUsuario: UsuarioResponse` (nested), `listaDetalleCompra: List<DetalleCompraResponse>` (nested) | Creates a purchase and its details in one transaction, then increases stock for each detail (`idTipoMovimiento=1`, `referencia="COMPRA: {serieCorrelativa}"`). `serieCorrelativa` is **client-supplied** (no auto-generation for purchases). If a detail has non-blank `numeroLote`, a new `Lote` is auto-created (`fechaEntrada` = now in `America/Lima`, `stockLote` = `cantidad`, no certificate) and its generated id replaces the sent `idLote`; otherwise `idLote` is forced to null. `idCompra`/`idLote` sent in details are overwritten. If `idOrden != null`, the linked order's state is set to id **23** (approved) — estado 23 must exist, else 500. Invalid `idProveedor`/`idUsuario`/`idOrden`/`idProducto` → `RecursoNoEncontradoException` → 500. **No amount validation** is performed for purchases. |
| 4 | `GET /compra/{idCompra}` | `@PathVariable Integer idCompra` | `CompraResponse` (same fields as above, with `listaDetalleCompra` populated from detail repository) | Returns one purchase with details. Missing id → `RecursoNoEncontradoException("{id} Compra no encontrada")` → **500**, not 404. |
| 5 | `GET /compra/global` | `@RequestParam(defaultValue="0") int page`, `@RequestParam(defaultValue="10") int size`, `@RequestParam(required=false) String search` | `Page<CompraResponse>` (Jackson page object; `content` items as row 3) | Paginated purchases sorted by `idCompra DESC`. `search` (case-insensitive) matches `serieCorrelativa` or supplier `nombreRazonSocial`; null/empty = no filter. Negative `page` is **not** clamped → 500. |
| 6 | `GET /compra/proveedor/{idProveedor}` | `@PathVariable Integer idProveedor`; query `page` (int, default 0), `size` (int, default 10) | `Page<CompraResponse>` | Purchases for one supplier sorted by `fechaCompra DESC`. `page < 0` is clamped to 0. |

### 3.4 `DashboardController` — base `/dashboard`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 7 | `GET /dashboard/actividad` | none | `List<ActividadDTO>`: `time: String`, `label: String`, `desc: String`; **`fechaFiltro: LocalDateTime` is `@JsonIgnore` and is NOT serialized** | Merges the 20 newest sales and the 20 newest inventory movements, sorts by timestamp descending, returns at most 20 items. Sale labels: `"Venta Anulada"` when sale state id **10**, else `"Venta Registrada"`; `desc = "Comprobante: {serieCorrelativa or S/N}"`. Movement labels: `"Kardex: ENTRADA"` when `idTipoMovimiento == 1`, else `"Kardex: SALIDA"`; `desc = "{referencia} ({cantidad} {unidadMedida.nombre})"`. `time` is `LocalDateTime.toString()`. Quirk: it calls `obtenerProducto` for each movement, so a movement pointing at a deleted product causes 500; a product without `idUnidadMedida` causes NPE → 500. Note the inconsistency: dashboard treats state **10** as annulled while report/dashboard sums exclude state **7**. |
| 8 | `GET /dashboard/resumen` | none | `ResumenDashboardDTO`: `ventasHoy: BigDecimal`, `ventasMes: BigDecimal`, `comprasMes: BigDecimal`, `utilidadNeta: BigDecimal`, `totalClientes: Long`, `totalProductos: Long`, `inventarioUnidades: Long`, `inventarioValor: BigDecimal`, `alertasStockCritico: Long` | Aggregates KPIs. `utilidadNeta = ventasMes - comprasMes`; `totalClientes` counts entities whose `tipoEntidad.nombre` uppercases to `'CLIENTE'`; `inventarioUnidades = SUM(stock)`; `inventarioValor = SUM(stock * precioVenta)`; `alertasStockCritico = COUNT(stock <= stockMinimo)`. Sales with state id **7** are excluded from `ventasHoy`/`ventasMes`. `comprasMes` uses current year+month. |

### 3.5 `EntidadController` — base `/entidad`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 9 | `GET /entidad` | query `page` (int, default 0), `size` (int, default 10), `tipoEntidad: String` (optional), `tipoDocumento: String` (optional), `busqueda: String` (optional) | `Page<EntidadResponse>` (`idEntidad: Integer`, `tipoDocumento`, `numeroDocumento`, `nombreRazonSocial`, `direccion`, `telefono`, `email`: String, `idEstado: EstadoResponse`, `idTipoEntidad: TipoEntidadResponse`) | Paginated entities sorted by `idEntidad DESC`. Magic value `"Todos"` (case-insensitive for `tipoEntidad`, exact for `tipoDocumento`) and empty strings mean "no filter". `busqueda` is trimmed and matches `nombreRazonSocial` or `numeroDocumento` (case-insensitive for name). `page < 0` clamped to 0. |
| 10 | `GET /entidad/todas` | none | `List<EntidadResponse>` | All entities, unpaginated. Useful for populating client/provider pickers. |
| 11 | `POST /entidad` | `@RequestBody EntidadRequest`: `tipoDocumento: String` `@Size(max=20)`; `numeroDocumento: String` `@Size(max=20)`; `nombreRazonSocial: String` `@NotNull @Size(min=1,max=150)`; `direccion: String` `@Size(max=250)`; `telefono: String` `@Size(max=20)`; `email: String` `@Size(max=100)`; `idEstado: Integer` `@NotNull`; `idTipoEntidad: Integer` (optional) | `EntidadResponse` (fields as row 9) | Creates an entity. `idEstado` is resolved through `EstadoMapper.map` → missing id gives 500; `idTipoEntidad` null is allowed and stored as null. **Constraints are not enforced** (no `@Valid`). No duplicate-document check is performed (`existsByNumeroDocumento` exists but is unused). |
| 12 | `GET /entidad/{id}` | `@PathVariable Integer id` | `EntidadResponse` | Fetches entity by id; missing → `RecursoNoEncontradoException` → 500. |
| 13 | `PUT /entidad/{id}` | `@PathVariable Integer id`; `@RequestBody EntidadRequest` (same fields/constraints as row 11) | `EntidadResponse` | Full update of all scalar fields plus `idEstado`; `idTipoEntidad` is overwritten with null when omitted. Missing id → 500. |

### 3.6 `EstadoController` — base `/estado`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 14 | `GET /estado` | none | `List<EstadoResponse>`: `idEstado: Integer`, `tipoCodigo: String`, `nombre: String` | Lists every system state. |
| 15 | `GET /estado/{codigo}` | `@PathVariable String codigo` — this is **`tipoCodigo`, not the numeric id** | `List<EstadoResponse>` | Returns states matching exact `tipoCodigo` via `findByTipoCodigo`. Returns an **empty list** (HTTP 200) when nothing matches, never an error. Use `GET /estado` to discover valid `tipoCodigo` values. |

### 3.7 `InventarioController` — base `/inventario`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 16 | `POST /inventario/producto` | `@RequestBody ProductoInventarioRequest`: `producto: ProductoRequest` (nested), `lote: LoteRequest` (nested), `certificado: CertificadoRequest` (nested, optional). `ProductoRequest` fields: `codigoBarras: String @Size(max=100)`, `nombreDescripcion: String @NotBlank`, `precioVenta: BigDecimal @NotNull @DecimalMin("0.0")`, `stock: Integer @Min(0)`, `stockMinimo: Integer @Min(0)`, `imagenUrl: String`, `manejaLote: Boolean`, `precioMayorista: BigDecimal @DecimalMin("0.0")`, `precioDistribuidor: BigDecimal @DecimalMin("0.0")`, `codigoUnico: String @NotBlank @Size(max=10)`, `idCategoria: String`, `idEstado: Integer @NotNull`, `idUnidadMedida: String`. `LoteRequest`: `numeroLote: String`, `fechaEntrada: LocalDateTime`, `stockLote: Integer`, `idCertificado: Integer`, `idProducto: Integer`. `CertificadoRequest`: `numero: String`, `fechaEmision: LocalDate`, `archivoUrl: String`. | `MovimientoInventarioResponse`: `idMovimiento: Integer`, `cantidad: int`, `fecha: LocalDateTime`, `referencia: String`, `idLote: LoteResponse` (nested), `idProducto: ProductoResponse` (nested), `idTipoMovimiento: TipoMovimientoResponse` (nested) | Creates product + opening inventory movement in one transaction. If `producto.manejaLote == true`: optionally creates the certificate (when `certificado != null`), sets `lote.idProducto`, creates the lot, and records a movement with `cantidad = stockLote`, `referencia="Saldo Inicial"`, `idTipoMovimiento=1`. Otherwise records movement with `cantidad = producto.stock`, `idLote=null`, same reference/tipo. `lote` is effectively required when `manejaLote=true` (null → NPE → 500). `idCategoria`/`idUnidadMedida` are **names**, not ids: mapstruct looks them up with `findByNombre` and **auto-creates** missing records with state id 1. |
| 17 | `POST /inventario/lote` | `@RequestBody LoteRequest`: `numeroLote: String`, `fechaEntrada: LocalDateTime`, `stockLote: Integer`, `idCertificado: Integer`, `idProducto: Integer` | `LoteResponse`: `idLote: Integer`, `numeroLote: String`, `fechaEntrada: LocalDateTime`, `stockLote: Integer`, `idCertificado: CertificadoResponse` (nested), `idProducto: ProductoResponse` (nested) | Creates a lot and increases product stock (`idTipoMovimiento=1`, `referencia="Ingreso Manual"`) using FIFO lot consumption internally. `idProducto` must exist (500 otherwise). `fechaEntrada` is sent by the client; nothing auto-fills it here (contrast with purchase-created lots). |
| 18 | `POST /inventario/certificado/{id}` | `@PathVariable Integer id` — **this is the lot id (`idLote`)**; `@RequestBody CertificadoRequest`: `numero: String`, `fechaEmision: LocalDate`, `archivoUrl: String` | `LoteResponse` (fields as row 17) | Creates a certificate and attaches it to the existing lot. Missing lot → `RecursoNoEncontradoException("{id} Lote no encontrado")` → 500. |

### 3.8 `LoteController` — base `/lote`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 19 | `GET /lote/producto/{id}` | `@PathVariable Integer id` = `idProducto` | `List<LoteResponse>` (fields as row 17) | Lists all lots for a product via `findByIdProducto_IdProducto` — **no explicit ordering** (unlike internal FIFO which uses `OrderByFechaEntradaAsc`). Empty list if product has none/unknown id. |

### 3.9 `MedidaController` — base `/medida`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 20 | `GET /medida` | none | `List<MedidaResponse>`: `idMedida: Integer`, `nombre: String` | Lists units of measure. Use `nombre` (not `idMedida`) for `ProductoRequest.idUnidadMedida`. |

### 3.10 `MovimientoController` — base `/kardex`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 21 | `GET /kardex/producto/{id}` | `@PathVariable Integer id` = `idProducto` | `List<MovimientoInventarioResponse>`: `idMovimiento: Integer`, `cantidad: int`, `fecha: LocalDateTime`, `referencia: String`, `idLote: LoteResponse`, `idProducto: ProductoResponse`, `idTipoMovimiento: TipoMovimientoResponse` | Full movement history (kardex) for a product, no pagination, no explicit sort. |
| 22 | `GET /kardex/global` | none | `List<MovimientoInventarioResponse>` | Global kardex: **only the latest 100 movements** (`findTop100ByOrderByFechaDesc`) with non-null `fecha`, newest first. |

### 3.11 `OrdenCompraController` — base `/orden-compra`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 23 | `POST /orden-compra` | `@RequestBody OrdenCompraRequest`: `fechaPedido: LocalDateTime`, `fechaEntrega: LocalDate`, `totalEstimado: BigDecimal`, `idProveedor: Integer`, `idEstadoOrden: Integer`, `idUsuario: Integer`, `listaDetalles: List<DetalleOrdenRequest>` (nested: `cantidadPedida: Integer`, `precioUnitarioPactado: BigDecimal`, `idOrden: Integer`, `idProducto: Integer`) | `OrdenCompraResponse`: `idOrden: Integer`, `fechaPedido: LocalDateTime`, `fechaEntrega: LocalDate`, `totalEstimado: BigDecimal`, `idProveedor: EntidadResponse`, `idEstadoOrden: EstadoResponse`, `idUsuario: UsuarioResponse`, `listaDetalles: List<DetalleOrdenResponse>` (nested) | Creates a purchase order and its details transactionally. `idEstadoOrden` is **client-supplied** — send state id **3** for a pending order so it appears in `GET /orden-compra/pendientes`. Detail `idOrden` is overwritten. No amount validation. |
| 24 | `GET /orden-compra/global` | query `page` (int, default 0), `size` (int, default 10), `search: String` (optional) | `Page<OrdenCompraResponse>` | Orders sorted `idOrden DESC`; `search` matches `idOrden` (cast to string, substring) or supplier `nombreRazonSocial` (case-insensitive). Negative `page` not clamped → 500. |
| 25 | `GET /orden-compra/{id}` | `@PathVariable Integer id` | `OrdenCompraResponse` with `listaDetalles` populated | Missing → `RecursoNoEncontradoException("{id} Orden no encotrada")` → 500. |
| 26 | `GET /orden-compra/pendientes` | none | `List<OrdenCompraResponse>` | Orders whose `idEstadoOrden == 3` (hard-coded pending state id). Empty list if none. |
| 27 | `PUT /orden-compra/{id}/rechazar` | `@PathVariable Integer id` | `OrdenCompraResponse` | Sets order state to id **5** (hard-coded rejected state) and saves. Missing order → 500; missing state 5 in DB → 500. There is **no** corresponding approve endpoint — approval happens implicitly when a purchase with `idOrden` is created (state → 23). |

### 3.12 `PagoController` — base `/pago`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 28 | `POST /pago` | `@RequestBody PagoRequest`: `montoTotal: BigDecimal`, `referenciaPago: String`, `idMetodoPago: Integer`, `idVenta: Integer` | `PagoResponse`: `idPago: Integer`, `montoTotal: BigDecimal`, `fecha: LocalDateTime`, `referenciaPago: String`, `idMetodoPago: MetodoPagoResponse` (nested), `idVenta: VentaResponse` (nested) | Records a payment and **distributes** it across the sale's unpaid installments (FIFO by `numeroCuota`), skipping quotas in state id **10**, creating `DetallePago` rows, marking fully-paid quotas state 10, and finally setting the sale to state 8 if all quotas are cancelled. Missing quota state/entities → 500. `fecha` is generated by the entity default (now in `America/Lima`), not client-supplied. |
| 29 | `GET /pago/cuotas/{idVenta}` | `@PathVariable Integer idVenta` | `List<CuotaResponse>`: `idCuota: Integer`, `numeroCuota: Integer`, `fechaVencimiento: LocalDate`, `monto: BigDecimal`, `idEstadoCuota: EstadoResponse`, `idVenta: VentaResponse`, `montoPagado: BigDecimal`, `montoPendiente: BigDecimal` | All installments for a sale ordered by `numeroCuota ASC`, each enriched with `montoPagado` (sum of payment details) and `montoPendiente = monto - montoPagado`. Empty list for unknown sale. |
| 30 | `GET /pago/cuotas` | none | `List<CuotaResponse>` | Only quotas with `idEstadoCuota IN (9, 11)` ("por cobrar") — hard-coded in JPQL. Enriched with paid/pending amounts as above. |
| 31 | `GET /pago` | none | `List<PagoResponse>` | All payments, mapped to DTOs; includes nested `idVenta` → `VentaResponse` → `idCliente`/`idEstadoVenta`/`idUsuario`. |

### 3.13 `ProductoController` — base `/productos`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 32 | `GET /productos/todos` | none | `List<ProductoResponse>`: `idProducto: Integer`, `codigoBarras: String`, `nombreDescripcion: String`, `precioVenta: BigDecimal`, `stock: Integer`, `stockMinimo: Integer`, `imagenUrl: String`, `manejaLote: Boolean`, `precioMayorista: BigDecimal`, `precioDistribuidor: BigDecimal`, `codigoUnico: String`, `idCategoria: CategoriaResponse`, `idEstado: EstadoResponse`, `idUnidadMedida: MedidaResponse` | All products, unpaginated. |
| 33 | `GET /productos` | query `page` (int, default 0), `size` (int, default 10), `busqueda: String` (optional), `idCategoria: Integer` (optional) | `Page<ProductoResponse>` | Products sorted `idProducto DESC`. `busqueda` trimmed, case-insensitive match on `nombreDescripcion`, `codigoBarras`, `codigoUnico`; `idCategoria` exact. Negative `page` not clamped → 500. |
| 34 | `GET /productos/{id}` | `@PathVariable Integer id` | `ProductoResponse` | Missing → `RecursoNoEncontradoException("{id} Producto no encontrado")` → 500. |
| 35 | `PUT /productos/{id}` | `@PathVariable Integer id`; `@RequestBody ProductoRequest` (fields/constraints as row 16) | `ProductoResponse` | Full update via MapStruct `@InheritConfiguration`. `idCategoria`/`idUnidadMedida` are **names** (`findByNombre`, auto-create with state id 1). Missing product → 500. Constraints not enforced (no `@Valid`). |

### 3.14 `ReportesController` — base `/reporte`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 36 | `GET /reporte/compras` | query `page` (int, default 0), `size` (int, default 10), `proveedor: Integer` (optional), `dateStart: String` (optional), `dateEnd: String` (optional) | `ReporteCompraDTO`: `pagina: Page<CompraResponse>`, `totalRango: BigDecimal`, `totalGlobal: BigDecimal`, `cantidadGlobal: Long` | Purchase report. `dateStart`/`dateEnd` are parsed with `LocalDate.parse` → **must be `YYYY-MM-DD`**; start becomes `00:00:00`, end `23:59:59`. Bad format → `DateTimeParseException` → 500. `proveedor` is an entity id. `totalRango` sums only filtered purchases; `totalGlobal` and `cantidadGlobal` are global (`count()` over all purchases). Negative `page` not clamped → 500. |
| 37 | `GET /reporte/ventas` | query `page` (int, default 0), `size` (int, default 10), `dateStart: String`, `dateEnd: String`, `docType: String`, `client: String` (all optional) | `ReporteVentaDTO`: `pagina: Page<VentaResponse>`, `totalRango: BigDecimal`, `totalGlobal: BigDecimal`, `cantidadGlobal: Long`, `ventasHoy: BigDecimal`, `ventasMes: BigDecimal` | Sales report. Dates parsed as `YYYY-MM-DD` (same 00:00:00/23:59:59 boundaries; bad format → 500). `docType` exact match on `tipoComprobante`, with magic sentinel **`"Todos"`** meaning no filter (also empty string). `client` matches `nombreRazonSocial` (case-insensitive) or `numeroDocumento` (substring). Sales with state **7** excluded from sums. `page < 0` clamped to 0. |

### 3.15 `TipoEntidadController` — base `/tipo-entidad`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 38 | `GET /tipo-entidad` | none | `List<TipoEntidadResponse>`: `idTipoEntidad: Integer`, `nombre: String` | Lists entity types. Use the numeric `idTipoEntidad` in `EntidadRequest`; the name `CLIENTE` is special-cased in the dashboard metric. |

### 3.16 `UsuarioController` — base `/usuarios`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 39 | `GET /usuarios/roles` | none | `List<RolResponse>`: `idRol: Integer`, `nombre: String` | Lists roles. There is no user CRUD endpoint; `UsuarioRequest` exists in DTOs but is unused by controllers. |

### 3.17 `VentaController` — base `/venta`

| # | Method & full path | Inputs | Response fields | Description & quirks |
|---|---|---|---|---|
| 40 | `POST /venta` | `@RequestBody VentaRequest`: `idVentaOrigen: Integer`, `serieCorrelativa: String` (**overwritten** by server), `tipoComprobante: String`, `fechaEmision: LocalDateTime` (**ignored** — entity defaults to now `America/Lima`), `total: BigDecimal`, `subtotal: BigDecimal`, `descuentoGlobal: BigDecimal`, `idCliente: Integer`, `idEstadoVenta: Integer` (**overwritten** by server), `idUsuario: Integer`, `detallesVentasList: List<DetalleVentaRequest>` (nested: `cantidad: Integer`, `precioUnitario: BigDecimal`, `descuentoProducto: BigDecimal`, `subTotal: BigDecimal`, `idLote: Integer`, `idProducto: Integer`, `idVenta: Integer` (overwritten)), `pagosList: List<PagoRequest>` (nested: `montoTotal: BigDecimal`, `referenciaPago: String`, `idMetodoPago: Integer`, `idVenta: Integer`), `cuotasList: List<CuotaRequest>` (nested: `numeroCuota: Integer`, `fechaVencimiento: LocalDate`, `monto: BigDecimal`, `idEstadoCuota: Integer`, `idVenta: Integer`) | `VentaResponse`: `idVenta: Integer`, `idVentaOrigen: Integer`, `tipoComprobante: String`, `fechaEmision: LocalDateTime`, `serieCorrelativa: String`, `total: BigDecimal`, `subtotal: BigDecimal`, `descuentoGlobal: BigDecimal`, `idCliente: EntidadResponse`, `idEstadoVenta: EstadoResponse`, `idUsuario: UsuarioResponse`, `detallesVentasList: List<DetalleVentaResponse>` (nested) | Creates a sale with details, payments and installments transactionally. **Server overrides:** `serieCorrelativa` is generated as `F001-000001` for `tipoComprobante` equal (case-insensitively) to `"Factura"`, otherwise `B001-000001`, incrementing from the last sale of that type (splits on `-` and parses the numeric suffix — a malformed stored serie → 500). `idEstadoVenta` is forced to **8** (cash/paid) when `sum(pagosList.montoTotal) >= total`, else **6** (credit); the client-sent value is ignored. Strict server-side amount checks: each detail's `precioUnitario` must exactly equal one of the product's `precioVenta`/`precioMayorista`/`precioDistribuidor`, stock must suffice, `subTotal` must match `precio*cantidad - descuento` within 0.05, and `total` must equal `sum(subtotals) - descuentoGlobal + 18% IGV` within 0.05; `pagosList + cuotasList` must cover the computed total within 0.05. Failures throw `IllegalArgumentException` → **500** (messages are Spanish, e.g. `"Descuadre: El sistema calculó un Total de ..."`). Each detail decrements stock (`idTipoMovimiento=2`, `referencia="{tipoComprobante}: {serieCorrelativa}"`). |
| 41 | `GET /venta/metodo-pago` | none | `List<MetodoPagoResponse>`: `idMetodoPago: Integer`, `nombre: String` | Lists payment methods to fill `PagoRequest.idMetodoPago`. |
| 42 | `GET /venta/credito` | none | `List<VentaCreditoResponse>`: `idVenta: Integer`, `serieCorrelativa: String`, `total: BigDecimal`, `totalPendiente: BigDecimal`, `estado: String`, `cliente: EntidadResponse` (nested) | Sales that **have installments**. `total` = sum of quota amounts (not the sale total), `totalPendiente = total - sum(montoPagado)`, `estado` computed as `"Cancelada"` / `"Parcial"` / `"Pendiente"`. Sales without quotas are skipped. |
| 43 | `GET /venta` | none | `List<VentaResponse>` | All sales, mapped to DTOs; `detallesVentasList` is whatever the mapper produced (mapper ignores explicit back-reference fields; use `/venta/{idVenta}` to guarantee details are loaded). |
| 44 | `GET /venta/{idVenta}` | `@PathVariable Integer idVenta` | `VentaResponse` with `detallesVentasList` explicitly loaded | Missing → `RecursoNoEncontradoException("{id} Venta no encontrada")` → 500. |
| 45 | `GET /venta/cliente/{idCliente}` | `@PathVariable Integer idCliente`; query `page` (int, default 0), `size` (int, default 10) | `Page<VentaResponse>` | Sales for a client sorted by `fechaEmision DESC`; `page < 0` clamped to 0. |

---

## 4. Request DTOs — fields & validations

> Remember: **none of these constraints are enforced** because no controller uses `@Valid`.
> Fields marked *(internal)* are never bound from an HTTP body; they are built by services.

| DTO | Field | Java type | Constraints (as declared) | Notes |
|---|---|---|---|---|
| `UsuarioCredenciales` | `usuario` | `String` | none | Login body. |
| | `password` | `String` | none | Plain password; compared against BCrypt hash. |
| `ProductoInventarioRequest` | `producto` | `ProductoRequest` | none | Nested object. |
| | `lote` | `LoteRequest` | none | Nested; required when product `manejaLote=true`. |
| | `certificado` | `CertificadoRequest` | none | Nested; optional. |
| `ProductoRequest` | `codigoBarras` | `String` | `@Size(max=100, message="El código de barras no puede superar 100 caracteres")` | |
| | `nombreDescripcion` | `String` | `@NotBlank(message="El nombre del producto es obligatorio")` | |
| | `precioVenta` | `BigDecimal` | `@NotNull`, `@DecimalMin("0.0")` | |
| | `stock` | `Integer` | `@Min(0)` | |
| | `stockMinimo` | `Integer` | `@Min(0)` | |
| | `imagenUrl` | `String` | none | |
| | `manejaLote` | `Boolean` | none | If null, `if (ingresado.getManejaLote())` may NPE in `/inventario/producto` → 500. |
| | `precioMayorista` | `BigDecimal` | `@DecimalMin("0.0")` | |
| | `precioDistribuidor` | `BigDecimal` | `@DecimalMin("0.0")` | |
| | `codigoUnico` | `String` | `@NotBlank`, `@Size(max=10)` | |
| | `idCategoria` | `String` | none | **Category name**, not id — `findByNombre`, auto-created with state 1 if absent. |
| | `idEstado` | `Integer` | `@NotNull` | Must reference existing `EstadoResponse.idEstado`. |
| | `idUnidadMedida` | `String` | none | **Unit-of-measure name**, not id — `findByNombre`, auto-created with state 1 if absent. |
| `LoteRequest` | `numeroLote` | `String` | none | |
| | `fechaEntrada` | `LocalDateTime` | none | |
| | `stockLote` | `Integer` | none | |
| | `idCertificado` | `Integer` | none | |
| | `idProducto` | `Integer` | none | Existing product id; overwritten for lots created from purchases / `/inventario/producto`. |
| `CertificadoRequest` | `numero` | `String` | none | |
| | `fechaEmision` | `LocalDate` | none | |
| | `archivoUrl` | `String` | none | |
| `EntidadRequest` | `tipoDocumento` | `String` | `@Size(max=20)` | |
| | `numeroDocumento` | `String` | `@Size(max=20)` | |
| | `nombreRazonSocial` | `String` | `@NotNull`, `@Size(min=1,max=150)` | |
| | `direccion` | `String` | `@Size(max=250)` | |
| | `telefono` | `String` | `@Size(max=20)` | |
| | `email` | `String` | `@Size(max=100)` | |
| | `idEstado` | `Integer` | `@NotNull` | Resolved via `EstadoMapper.map`. |
| | `idTipoEntidad` | `Integer` | none | Optional; omitted ⇒ null on create/update. |
| `CompraRequest` | `tipoComprobante` | `String` | none | |
| | `serieCorrelativa` | `String` | none | Client-supplied (no auto-generation). |
| | `fechaCompra` | `LocalDateTime` | none | |
| | `montoTotal` | `BigDecimal` | none | No total validation for purchases. |
| | `idOrden` | `Integer` | none | If present, linked order state → 23. |
| | `idProveedor` | `Integer` | none | |
| | `idUsuario` | `Integer` | none | |
| | `listaDetalleCompra` | `List<DetalleCompraRequest>` | none | Nested list. |
| `DetalleCompraRequest` | `cantidad` | `Integer` | none | |
| | `precioCostoUnitario` | `BigDecimal` | none | |
| | `idCompra` | `Integer` | none | Overwritten by service. |
| | `idLote` | `Integer` | none | Overwritten: new lot created when `numeroLote` non-blank, else null. |
| | `numeroLote` | `String` | none | Non-blank triggers auto lot creation (`fechaEntrada` = now `America/Lima`). |
| | `idProducto` | `Integer` | none | |
| `OrdenCompraRequest` | `fechaPedido` | `LocalDateTime` | none | |
| | `fechaEntrega` | `LocalDate` | none | |
| | `totalEstimado` | `BigDecimal` | none | |
| | `idProveedor` | `Integer` | none | |
| | `idEstadoOrden` | `Integer` | none | Send 3 for pending. |
| | `idUsuario` | `Integer` | none | |
| | `listaDetalles` | `List<DetalleOrdenRequest>` | none | Nested list. |
| `DetalleOrdenRequest` | `cantidadPedida` | `Integer` | none | |
| | `precioUnitarioPactado` | `BigDecimal` | none | |
| | `idOrden` | `Integer` | none | Overwritten by service. |
| | `idProducto` | `Integer` | none | |
| `VentaRequest` | `idVentaOrigen` | `Integer` | none | For credit-note origin. |
| | `serieCorrelativa` | `String` | none | **Overwritten** by server generator. |
| | `tipoComprobante` | `String` | none | `"Factura"` (case-insensitive) ⇒ `F001-`, anything else ⇒ `B001-`. |
| | `fechaEmision` | `LocalDateTime` | none | **Ignored**; entity defaults to now `America/Lima`. |
| | `total` | `BigDecimal` | none | Validated against computed total incl. 18% IGV (tolerance 0.05). |
| | `subtotal` | `BigDecimal` | none | Not used in server validation (recomputed from details). |
| | `descuentoGlobal` | `BigDecimal` | none | Null treated as 0; result clamped at 0. |
| | `idCliente` | `Integer` | none | |
| | `idEstadoVenta` | `Integer` | none | **Overwritten** (8 or 6). |
| | `idUsuario` | `Integer` | none | |
| | `detallesVentasList` | `List<DetalleVentaRequest>` | none | Nested list. |
| | `pagosList` | `List<PagoRequest>` | none | Nested list; may be null/empty. |
| | `cuotasList` | `List<CuotaRequest>` | none | Nested list; may be null/empty. |
| `DetalleVentaRequest` | `cantidad` | `Integer` | none | Must be <= product stock. |
| | `precioUnitario` | `BigDecimal` | none | Must equal one of the product's three prices. |
| | `descuentoProducto` | `BigDecimal` | none | Null treated as 0. |
| | `subTotal` | `BigDecimal` | none | Validated against `precio*cantidad - descuento` (±0.05). |
| | `idLote` | `Integer` | none | |
| | `idProducto` | `Integer` | none | |
| | `idVenta` | `Integer` | none | Overwritten by service. |
| `PagoRequest` | `montoTotal` | `BigDecimal` | none | For `POST /pago`, distributed over installments. |
| | `referenciaPago` | `String` | none | |
| | `idMetodoPago` | `Integer` | none | |
| | `idVenta` | `Integer` | none | Required for `POST /pago`; overwritten when nested in `VentaRequest`. |
| `CuotaRequest` | `numeroCuota` | `Integer` | none | Sort order for installments. |
| | `fechaVencimiento` | `LocalDate` | none | |
| | `monto` | `BigDecimal` | none | |
| | `idEstadoCuota` | `Integer` | none | |
| | `idVenta` | `Integer` | none | Overwritten when nested in `VentaRequest`. |
| `EstadoRequest` *(unused by controllers)* | `tipoCodigo` | `String` | `@NotBlank`, `@Size(min=1,max=20)` | Service methods exist but no endpoint exposes them. |
| | `nombre` | `String` | `@NotBlank`, `@Size(min=1,max=50)` | |
| `TipoEntidadRequest` *(unused)* | `nombre` | `String` | `@NotNull`, `@Size(min=1,max=50)` | |
| `UsuarioRequest` *(unused)* | `usuario` | `String` | none | |
| | `password` | `String` | none | |
| | `idEntidad` | `Integer` | none | |
| | `idEstado` | `Integer` | none | |
| | `idRol` | `Integer` | none | |
| `ActualizarStockRequest` *(internal)* | `idProducto` | `Integer` | none | Built by services for stock updates. |
| | `idTipoMovimiento` | `Integer` | none | 1 = entry, 2 = exit. |
| | `cantidad` | `Integer` | none | |
| | `idLote` | `Integer` | none | |
| | `referencia` | `String` | none | |
| `MovimientoInventarioRequest` *(internal)* | `cantidad` | `int` (primitive) | none | |
| | `fecha` | `LocalDateTime` | none | |
| | `referencia` | `String` | none | |
| | `idLote` | `Integer` | none | |
| | `idProducto` | `Integer` | none | |
| | `idTipoMovimiento` | `Integer` | none | |
| `DetallePagoRequest` *(internal)* | `monto` | `BigDecimal` | none | |
| | `idCuota` | `Integer` | none | |
| | `idPago` | `Integer` | none | |

---

## 5. Response DTOs — fields

Nested DTO fields are named exactly as the Java fields (e.g. `idProveedor` is an object, **not** an integer). All are serialized by Lombok getters via Jackson.

| DTO | Field | Java type | Notes |
|---|---|---|---|
| `ActividadDTO` | `time` | `String` | `LocalDateTime.toString()` of the source event. |
| | `label` | `String` | See `/dashboard/actividad` labels. |
| | `desc` | `String` | |
| | `fechaFiltro` | `LocalDateTime` | `@JsonIgnore` — **not serialized**. |
| `CategoriaResponse` | `idCategoria` | `Integer` | |
| | `nombre` | `String` | |
| `CertificadoResponse` | `idCertificado` | `Integer` | |
| | `numero` | `String` | |
| | `fechaEmision` | `LocalDate` | |
| | `archivoUrl` | `String` | |
| `CompraResponse` | `idCompra` | `Integer` | |
| | `tipoComprobante` | `String` | |
| | `serieCorrelativa` | `String` | |
| | `fechaCompra` | `LocalDateTime` | |
| | `montoTotal` | `BigDecimal` | |
| | `idOrden` | `OrdenCompraResponse` | Nested object. |
| | `idProveedor` | `EntidadResponse` | Nested object. |
| | `idUsuario` | `UsuarioResponse` | Nested object — **contains `password` hash** (see warning). |
| | `listaDetalleCompra` | `List<DetalleCompraResponse>` | Populated on `GET /compra/{idCompra}` and `POST /compra` response. |
| `CuotaResponse` | `idCuota` | `Integer` | |
| | `numeroCuota` | `Integer` | |
| | `fechaVencimiento` | `LocalDate` | |
| | `monto` | `BigDecimal` | |
| | `idEstadoCuota` | `EstadoResponse` | Nested object. |
| | `idVenta` | `VentaResponse` | Nested object. |
| | `montoPagado` | `BigDecimal` | Computed by `CuotaService` from payment details. |
| | `montoPendiente` | `BigDecimal` | `monto - montoPagado`. |
| `DetalleCompraResponse` | `idDetalleCompra` | `Integer` | |
| | `cantidad` | `Integer` | |
| | `precioCostoUnitario` | `BigDecimal` | |
| | `idCompra` | `CompraResponse` | Nested but mapper ignores it ⇒ typically `null` in responses. |
| | `idLote` | `LoteResponse` | Nested; null for details without lot. |
| | `idProducto` | `ProductoResponse` | Nested. |
| `DetalleOrdenResponse` | `idDetalleOrden` | `Integer` | |
| | `cantidadPedida` | `Integer` | |
| | `precioUnitarioPactado` | `BigDecimal` | |
| | `idOrden` | `OrdenCompraResponse` | Nested but ignored by mapper ⇒ typically `null`. |
| | `idProducto` | `ProductoResponse` | Nested. |
| `DetallePagoResponse` | `idDetallePago` | `Integer` | |
| | `monto` | `BigDecimal` | |
| | `idCuota` | `CuotaResponse` | Nested. |
| | `idPago` | `PagoResponse` | Nested but mapper ignores it ⇒ typically `null`. |
| `DetalleVentaResponse` | `cantidad` | `Integer` | |
| | `precioUnitario` | `BigDecimal` | |
| | `descuentoProducto` | `BigDecimal` | |
| | `subTotal` | `BigDecimal` | |
| | `idLote` | `LoteResponse` | Nested. |
| | `idProducto` | `ProductoResponse` | Nested. |
| | `idVenta` | `VentaResponse` | Nested but ignored by mapper ⇒ typically `null`. |
| `EntidadResponse` | `idEntidad` | `Integer` | |
| | `tipoDocumento` | `String` | |
| | `numeroDocumento` | `String` | |
| | `nombreRazonSocial` | `String` | |
| | `direccion` | `String` | |
| | `telefono` | `String` | |
| | `email` | `String` | |
| | `idEstado` | `EstadoResponse` | Nested. |
| | `idTipoEntidad` | `TipoEntidadResponse` | Nested; may be null. |
| `EstadoResponse` | `idEstado` | `Integer` | |
| | `tipoCodigo` | `String` | Used by `GET /estado/{codigo}`. |
| | `nombre` | `String` | |
| `LoginResponse` | `idUsuario` | `Integer` | |
| | `entidad` | `EntidadResponse` | Nested. |
| | `nombreRol` | `String` | Role name (e.g. from `/usuarios/roles`). No token. |
| `LoteResponse` | `idLote` | `Integer` | |
| | `numeroLote` | `String` | |
| | `fechaEntrada` | `LocalDateTime` | |
| | `stockLote` | `Integer` | |
| | `idCertificado` | `CertificadoResponse` | Nested; may be null. |
| | `idProducto` | `ProductoResponse` | Nested. |
| `MedidaResponse` | `idMedida` | `Integer` | |
| | `nombre` | `String` | Use as `ProductoRequest.idUnidadMedida`. |
| `MetodoPagoResponse` | `idMetodoPago` | `Integer` | |
| | `nombre` | `String` | |
| `MovimientoInventarioResponse` | `idMovimiento` | `Integer` | |
| | `cantidad` | `int` | Primitive `int` in DTO; serialized as number. |
| | `fecha` | `LocalDateTime` | |
| | `referencia` | `String` | e.g. `"Saldo Inicial"`, `"Ingreso Manual"`, `"COMPRA: ..."`, `"{tipo}: {serie}"`. |
| | `idLote` | `LoteResponse` | Nested; may be null. |
| | `idProducto` | `ProductoResponse` | Nested. |
| | `idTipoMovimiento` | `TipoMovimientoResponse` | Nested; id 1 = entry. |
| `OrdenCompraResponse` | `idOrden` | `Integer` | |
| | `fechaPedido` | `LocalDateTime` | |
| | `fechaEntrega` | `LocalDate` | |
| | `totalEstimado` | `BigDecimal` | |
| | `idProveedor` | `EntidadResponse` | Nested. |
| | `idEstadoOrden` | `EstadoResponse` | Nested. |
| | `idUsuario` | `UsuarioResponse` | Nested — contains `password` hash. |
| | `listaDetalles` | `List<DetalleOrdenResponse>` | Populated on `POST`, `GET /{id}`, and pending list (mapper maps entity collection). |
| `PagoResponse` | `idPago` | `Integer` | |
| | `montoTotal` | `BigDecimal` | |
| | `fecha` | `LocalDateTime` | Generated server-side. |
| | `referenciaPago` | `String` | |
| | `idMetodoPago` | `MetodoPagoResponse` | Nested. |
| | `idVenta` | `VentaResponse` | Nested. |
| `ProductoResponse` | `idProducto` | `Integer` | |
| | `codigoBarras` | `String` | |
| | `nombreDescripcion` | `String` | |
| | `precioVenta` | `BigDecimal` | |
| | `stock` | `Integer` | |
| | `stockMinimo` | `Integer` | |
| | `imagenUrl` | `String` | |
| | `manejaLote` | `Boolean` | |
| | `precioMayorista` | `BigDecimal` | |
| | `precioDistribuidor` | `BigDecimal` | |
| | `codigoUnico` | `String` | |
| | `idCategoria` | `CategoriaResponse` | Nested. |
| | `idEstado` | `EstadoResponse` | Nested. |
| | `idUnidadMedida` | `MedidaResponse` | Nested. |
| `ReporteCompraDTO` | `pagina` | `Page<CompraResponse>` | Jackson page object. |
| | `totalRango` | `BigDecimal` | Sum within filters. |
| | `totalGlobal` | `BigDecimal` | Sum of all purchases. |
| | `cantidadGlobal` | `Long` | `COUNT(*)` of all purchases. |
| `ReporteVentaDTO` | `pagina` | `Page<VentaResponse>` | Jackson page object. |
| | `totalRango` | `BigDecimal` | Sum within filters, excluding state 7. |
| | `totalGlobal` | `BigDecimal` | Global sales total, excluding state 7. |
| | `cantidadGlobal` | `Long` | `COUNT(*)` of all sales (including state 7). |
| | `ventasHoy` | `BigDecimal` | Today's sales, excluding state 7. |
| | `ventasMes` | `BigDecimal` | Current month's sales, excluding state 7. |
| `ResumenDashboardDTO` | `ventasHoy` | `BigDecimal` | Excludes state 7. |
| | `ventasMes` | `BigDecimal` | Excludes state 7. |
| | `comprasMes` | `BigDecimal` | Current year+month. |
| | `utilidadNeta` | `BigDecimal` | `ventasMes - comprasMes`. |
| | `totalClientes` | `Long` | Entities with tipoEntidad name `CLIENTE`. |
| | `totalProductos` | `Long` | `COUNT(productos)`. |
| | `inventarioUnidades` | `Long` | `SUM(stock)`. |
| | `inventarioValor` | `BigDecimal` | `SUM(stock * precioVenta)`. |
| | `alertasStockCritico` | `Long` | `COUNT(stock <= stockMinimo)`. |
| `RolResponse` | `idRol` | `Integer` | |
| | `nombre` | `String` | |
| `TipoEntidadResponse` | `idTipoEntidad` | `Integer` | |
| | `nombre` | `String` | `CLIENTE` is special-cased. |
| `TipoMovimientoResponse` | `idTipoMovimiento` | `Integer` | 1 = entry. |
| | `nombre` | `String` | |
| `UsuarioResponse` | `idUsuario` | `Integer` | |
| | `usuario` | `String` | |
| | `password` | `String` | ⚠️ **BCrypt hash is serialized** in every nested `idUsuario`/`idVenta`/`idOrden`/`idCompra` object. Do not display or log it. |
| | `idEntidad` | `EntidadResponse` | Nested. |
| | `idEstado` | `EstadoResponse` | Nested. |
| | `idRol` | `RolResponse` | Nested. |
| `VentaCreditoResponse` | `idVenta` | `Integer` | |
| | `serieCorrelativa` | `String` | |
| | `total` | `BigDecimal` | Sum of installments, not sale `total`. |
| | `totalPendiente` | `BigDecimal` | |
| | `estado` | `String` | `"Cancelada"` / `"Parcial"` / `"Pendiente"`. |
| | `cliente` | `EntidadResponse` | Nested. |
| `VentaResponse` | `idVenta` | `Integer` | |
| | `idVentaOrigen` | `Integer` | |
| | `tipoComprobante` | `String` | |
| | `fechaEmision` | `LocalDateTime` | Server-generated (`America/Lima` now) on creation. |
| | `serieCorrelativa` | `String` | Server-generated `F001-`/`B001-` + 6 digits. |
| | `total` | `BigDecimal` | |
| | `subtotal` | `BigDecimal` | |
| | `descuentoGlobal` | `BigDecimal` | |
| | `idCliente` | `EntidadResponse` | Nested. |
| | `idEstadoVenta` | `EstadoResponse` | Nested. |
| | `idUsuario` | `UsuarioResponse` | Nested — contains `password` hash. |
| | `detallesVentasList` | `List<DetalleVentaResponse>` | Guaranteed populated by `GET /venta/{idVenta}`; otherwise mapper-driven. |

---

## 6. Seed / demo data requirements (hard-coded lookups)

There are **no seed INSERTs** in the repo (`init-scripts/01_schema.sql` is DDL only, and
`ddl-auto=validate` means the database must be prepared externally). The code relies on the
following exact ids/names existing in the DB, otherwise many endpoints throw 500:

### `estados_sistema` (numeric ids are hard-coded)

| Id | Required meaning (inferred from usage) | Used by |
|---|---|---|
| **1** | "Activo" / default active state | Auto-created `Categorias` and `Medidas` via `mapNombre` when a product request sends a category/unit name not yet in the DB. |
| **3** | Pending purchase order | `GET /orden-compra/pendientes`; client should send `idEstadoOrden=3` when creating an order. |
| **5** | Rejected purchase order | `PUT /orden-compra/{id}/rechazar`. |
| **6** | Credit sale | `POST /venta` when payments < total. |
| **7** | Annulled sale | Excluded from all sales sums (`idEstadoVenta != 7`) in dashboard and reports. |
| **8** | Paid / cash sale | `POST /venta` when payments >= total; also set by `PagoService`/`CuotaService` when all installments are cancelled. |
| **9** and **11** | Installment "por cobrar" states | `GET /pago/cuotas` (`findCuotasPorCobrar` uses `IN (9, 11)`). |
| **10** | Cancelled installment (also used as "annulled sale" by dashboard activity labels) | `CuotaService.cuotaPagada`, `PagoService` skip rule, `DashboardService` label, `VentaCreditoResponse` logic. |
| **23** | Approved purchase order | Implicitly set when `POST /compra` includes `idOrden`. |

`GET /estado` and `GET /estado/{codigo}` let the client discover the rows and their
`tipoCodigo` grouping; the controller accepts any `codigo` and returns an empty list if unknown.
However, **the numeric ids above must pre-exist** — e.g. creating an order and then rejecting it
fails if id 5 is absent because services use `findById(5)`.

### Other required reference data

| Table | Requirement | Where used |
|---|---|---|
| `tipos_entidad` | A row whose `nombre` uppercases to **`CLIENTE`** | `EntidadRepository.contarClientes()` → `/dashboard/resumen.totalClientes`. `GET /tipo-entidad` returns the ids to send in `EntidadRequest.idTipoEntidad`. |
| `tipos_movimiento` | Id **1** = entry (salt/ingreso). Any other id is displayed as "SALIDA" by the dashboard. | All stock increases use `idTipoMovimiento=1`; sales use 2. |
| `medidas` / `categorias` | At least one row each with meaningful `nombre` values; names are used as `ProductoRequest.idCategoria` / `idUnidadMedida`. Missing names are auto-created with state id 1. | `CategoriaMapper.mapNombre`, `MedidaMapper.mapNombre`; `GET /categoria`, `GET /medida` return them. |
| `metodos_pago` | Rows with names for `PagoRequest.idMetodoPago`. | `GET /venta/metodo-pago`. |
| `roles` | Rows to return from `GET /usuarios/roles`; `LoginResponse.nombreRol` is taken from the user's role. | `UsuarioService.mostrarRoles`, `logear`. |
| `usuarios` | Username must match `UsuarioCredenciales.usuario`; `password` column must hold a **BCrypt hash**. | `POST /auth/login`. |
| Literal strings | `"Factura"` (case-insensitive) ⇒ sale series prefix `F001-`; any other `tipoComprobante` ⇒ `B001-`. `"Todos"` is a wildcard sentinel for `GET /reporte/ventas.docType` and for `GET /entidad.tipoEntidad`/`tipoDocumento`. Movement references generated by backend: `"Saldo Inicial"`, `"Ingreso Manual"`, `"COMPRA: {serie}"`, `"{tipoComprobante}: {serieCorrelativa}"`. | `VentaService.generarSerieCorrelativa`, `ReporteService`, `EntidadService`, `InventarioService`, `DetalleCompraService`, `DetallesVentaService`. |

### Numeric / formatting gotchas for the mobile client

- All money fields are `BigDecimal` → JSON **numbers**; format on device.
- All dates are ISO-8601 strings; `LocalDate` fields are `YYYY-MM-DD`, `LocalDateTime` fields include time.
- Report date query params must be exactly `YYYY-MM-DD` (server calls `LocalDate.parse`).
- `Page` responses use Spring Data's `content`/`totalElements`/`number`/`size` shape, not a flat array.
- There is no 404: missing ids produce 500. Treat non-2xx uniformly and show a generic error.
- `UsuarioResponse.password` (a BCrypt hash) leaks inside many nested responses — never render it.
---

## 7. Ejemplos prácticos (curl)

### Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"admin","password":"admin123"}'
```

```json
{
  "idUsuario": 1,
  "entidad": {
    "idEntidad": 1,
    "nombreRazonSocial": "Cliente Demo",
    "tipoDocumento": "DNI",
    "numeroDocumento": "12345678",
    "idEstado": { "idEstado": 1, "tipoCodigo": "GENERAL", "nombre": "ACTIVO" },
    "idTipoEntidad": { "idTipoEntidad": 1, "nombre": "CLIENTE" }
  },
  "nombreRol": "ADMIN"
}
```

### Listar productos (paginado)

```bash
curl 'http://localhost:8080/productos?page=0&size=20&busqueda=ariete'
```

```json
{
  "content": [
    {
      "idProducto": 1,
      "nombreDescripcion": "Ariete soldador 200A",
      "codigoUnico": "P001",
      "precioVenta": 250.00,
      "stock": 10,
      "idCategoria": { "idCategoria": 1, "nombre": "SOLDADURA" },
      "idUnidadMedida": { "idMedida": 1, "nombre": "UNIDAD" },
      "idEstado": { "idEstado": 1, "nombre": "ACTIVO" }
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0,
  "first": true,
  "last": true,
  "empty": false
}
```

### Crear producto con saldo inicial

`idCategoria` e `idUnidadMedida` son **nombres**, no IDs. Si no existen, el backend los crea con estado 1.

```bash
curl -X POST http://localhost:8080/inventario/producto \
  -H 'Content-Type: application/json' \
  -d '{
    "producto": {
      "codigoBarras": "7741234567890",
      "nombreDescripcion": "Ariete soldador 200A",
      "precioVenta": 250.00,
      "precioMayorista": 220.00,
      "precioDistribuidor": 200.00,
      "stock": 10,
      "stockMinimo": 2,
      "manejaLote": true,
      "codigoUnico": "P001",
      "idCategoria": "SOLDADURA",
      "idUnidadMedida": "UNIDAD",
      "idEstado": 1
    },
    "lote": { "numeroLote": "L-001", "fechaEntrada": "2026-11-25T10:00:00", "stockLote": 10 },
    "certificado": null
  }'
```

### Crear una venta al contado

Supongamos producto con `precioVenta = 250`, `stock >= 2`:

- `subTotal = 250 * 2 = 500`
- `IGV 18% = 90`, `total = 590`
- Los pagos cubren el total ⇒ el backend fuerza estado `8` y genera `F001-000001` si `tipoComprobante="Factura"`.

```bash
curl -X POST http://localhost:8080/venta \
  -H 'Content-Type: application/json' \
  -d '{
    "tipoComprobante": "Factura",
    "total": 590.00,
    "subtotal": 500.00,
    "descuentoGlobal": 0,
    "idCliente": 1,
    "idUsuario": 1,
    "detallesVentasList": [
      { "cantidad": 2, "precioUnitario": 250.00, "descuentoProducto": 0,
        "subTotal": 500.00, "idProducto": 1 }
    ],
    "pagosList": [
      { "montoTotal": 590.00, "referenciaPago": "P-001", "idMetodoPago": 1 }
    ],
    "cuotasList": []
  }'
```

Para venta a crédito, deja `pagosList` vacío y envía `cuotasList` con la suma de cuotas igual al total; el estado será `6` y aparecerá en `GET /venta/credito`.

### Dashboard y reportes

```bash
curl http://localhost:8080/dashboard/resumen
curl 'http://localhost:8080/reporte/ventas?dateStart=2026-11-01&dateEnd=2026-11-30&docType=Todos'
curl 'http://localhost:8080/entidad?page=0&size=10&tipoEntidad=CLIENTE&busqueda=demo'
```

### Errores

Cualquier fallo (ID inexistente, descuadre de montos, fecha mal formada) devuelve **500**. No confíes en el mensaje (tiene erratas como `"Orden no encotrada"`). En la app:

```ts
try {
  await api.post('/venta', body);
} catch (e: any) {
  const status = e.response?.status;
  Alert.alert('Error', status >= 500 ? 'No se pudo completar la operación' : 'Revisa los datos');
}
```

---

## 8. Guía React Native / integración

Configuración del cliente, sesión, librerías recomendadas, pantallas y arranque.

### Configuración base

- Backend: Spring Boot en `http://<HOST>:8080` (Tomcat escucha en todas las interfaces; el puerto se define en `application.properties` / `--server.port`).
- Según dónde corra el emulador/dispositivo:
  - **Android emulator**: `http://10.0.2.2:8080`
  - **iOS simulator**: `http://localhost:8080`
  - **Dispositivo físico**: `http://192.168.18.47:8080` (IP LAN de la máquina del backend; misma WiFi). En Android, para HTTP claro añade `android:usesCleartextTraffic="true"` en `AndroidManifest.xml`; en iOS, ATS exception o usa HTTPS.
- El backend no sirve archivos estáticos: **es solo API JSON**. No hay Swagger/OpenAPI.
- `Content-Type: application/json` en todas las peticiones con body.
- CORS está abierto (`allowedOrigins("*")`), aunque en React Native el navegador no aplica CORS; sí importa si luego se genera una web.

### Sesión / autenticación (importantísimo)

- `POST /auth/login` valida la contraseña con BCrypt y devuelve `{ idUsuario, entidad, nombreRol }`.
- **No hay JWT, ni tokens, ni sesión**: `SecurityConfig` tiene `csrf.disable()` y `anyRequest().permitAll()`. Todos los endpoints están abiertos y el backend **no comprueba roles**.
- La app debe guardar `idUsuario`, `nombreRol` y `entidad` (AsyncStorage / SecureStore) solo para personalizar la UI; si algún día se añade seguridad, reenvíalos como headers (por ejemplo `X-Usuario-Id`) y adapta el backend.
- Errores de login: usuario inexistente → `RecursoNoEncontradoException`; contraseña incorrecta → `RuntimeException`. Sin un `@RestControllerAdvice`, esto se traduce en respuestas de error genéricas de Spring (revisa la sección de errores).

### Cliente API recomendado (TypeScript)

```ts
// src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = __DEV__ ? 'http://10.0.2.2:8080' : 'https://TU-SERVIDOR';

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

export async function login(usuario: string, password: string) {
  const { data } = await api.post('/auth/login', { usuario, password });
  await AsyncStorage.setItem('solda_session', JSON.stringify(data));
  return data; // { idUsuario, entidad, nombreRol }
}
```

- Librerías sugeridas: `axios` o `fetch`, `@tanstack/react-query` para cache/listas, `zustand` o Context para sesión, `@react-native-async-storage/async-storage`, `date-fns` para fechas y `decimal.js` para montos (evita float en dinero).
- **No hay paginación**: los `GET` devuelven la lista completa. Cachea y considera filtrar en cliente.
- **Dinero**: `BigDecimal` se serializa como número JSON (ej. `250.00`). Usa `decimal.js` para sumar/restar y `Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })` para mostrar.
- **Fechas**: `LocalDate` → `"YYYY-MM-DD"`; `LocalDateTime` → `"2026-11-25T14:30:00"`. `new Date('2026-11-25')` funciona, pero cuidado con zonas horarias; usa `date-fns` con formato explícito.

### Pantallas sugeridas y endpoints que las alimentan

| Pantalla | Endpoints |
|---|---|
| Login | `POST /auth/login` |
| Inicio / Dashboard | `GET /dashboard/resumen`, `GET /dashboard/actividad` |
| Catálogo de productos | `GET /productos/todos`, `GET /productos`, `GET /productos/{id}`, `PUT /productos/{id}` |
| Categorías y medidas | `GET /categoria`, `GET /medida`, `GET /tipo-entidad`, `GET /estado`, `GET /estado/{codigo}` |
| Clientes / entidades | `GET /entidad`, `GET /entidad/todas`, `GET /entidad/{id}`, `POST /entidad`, `PUT /entidad/{id}` |
| Ventas | `POST /venta`, `GET /venta`, `GET /venta/{idVenta}`, `GET /venta/cliente/{idCliente}`, `GET /venta/credito`, `GET /venta/metodo-pago` |
| Compras y órdenes | `POST /compra`, `GET /compra/global`, `GET /compra/{id}`, `POST /orden-compra`, `GET /orden-compra/global`, `GET /orden-compra/pendientes` |
| Pagos y cuotas | `POST /pago`, `GET /pago`, `GET /pago/cuotas`, `GET /pago/cuotas/{idVenta}` |
| Inventario / kardex | `POST /inventario/producto`, `POST /inventario/lote`, `POST /inventario/certificado/{id}`, `GET /kardex/producto/{id}`, `GET /kardex/global`, `GET /lote/producto/{id}` |
| Reportes | `GET /reporte/ventas`, `GET /reporte/compras` |
| Roles (perfil) | `GET /usuarios/roles` |

### Datos mínimos para poder probar la app

El esquema se crea con `init-scripts/01_schema.sql` al levantar Docker. Para tener un usuario y catálogo de prueba:

```bash
docker exec -i postgres_db psql -U postgres -d smaster_bd <<'SQL'
WITH r AS (INSERT INTO roles (nombre) VALUES ('ADMIN') RETURNING id_rol),
e AS (INSERT INTO estados_sistema (tipo_codigo, nombre) VALUES ('USUARIO','ACTIVO') RETURNING id_estado),
t AS (INSERT INTO tipos_entidad (nombre) VALUES ('EMPLEADO') RETURNING id_tipo_entidad),
en AS (
  INSERT INTO entidades (id_estado, id_tipo_entidad, nombre_razon_social, tipo_documento, numero_documento)
  SELECT e.id_estado, t.id_tipo_entidad, 'Administrador', 'DNI', '00000000' FROM e, t RETURNING id_entidad
)
INSERT INTO usuarios (id_entidad, id_estado, id_rol, usuario, password)
SELECT en.id_entidad, e.id_estado, r.id_rol, 'admin',
       '$2a$10$l3eYbIXlaUzWLxdzsyXxY.KwLjnd36d7y2dHYXKv6r.a5t59q4txu' FROM en, e, r;
SQL
```

Credenciales de prueba: **admin / admin123**.

Sin datos semilla, los `GET` devuelven `[]` y el dashboard ceros. El login falla si no existe el usuario o si no tiene `rol` y `entidad` asociados (el servicio los usa para construir la respuesta).

### Orden de arranque para desarrollo

```bash
# 1. Base de datos (en la carpeta del backend Solda_Maste)
docker compose up -d

# 2. Backend (JDK 27 ya corregido en pom.xml con lombok 1.18.48)
./mvnw spring-boot:run      # http://localhost:8080

# 3. App React Native
npx expo start              # o: npm run android / npm run ios
```

Si el backend corre en otra máquina, cambia `BASE_URL` a la IP LAN y abre el puerto 8080 en el firewall.

---

## 9. Checklist: ¿está todo para conectar la app cuando la crees?

**Sí, en este documento está la información del backend que necesitas para conectarte:**

| Dato | Dónde está en este documento |
|---|---|
| URL base y puerto | §1 y §8 (emulador Android `10.0.2.2:8080`, iOS `localhost:8080`, móvil físico IP LAN) |
| Credenciales de prueba | §1 y §3 (`admin` / `admin123`) |
| Login: body y respuesta | §2, §7 y Apéndice A.3 (`UsuarioCredenciales` → `LoginResponse`; **sin token**) |
| Los 45 endpoints (método, ruta, parámetros, body, respuesta) | Apéndice A.2 y A.3 |
| Nombres exactos de campos y tipos de todos los DTOs | Apéndice A.4 y A.5 |
| Formatos de dinero y fechas | §2 y Apéndice A.1 / A.6 |
| Errores (500, sin 404, sin mensajes fiables) | §2 y §7 |
| IDs y datos fijos que el servidor asume | §3 y Apéndice A.6 |
| Ejemplos listos para copiar (curl) | §7 |
| Cliente Axios y sesión en AsyncStorage | §8 |

**Lo que el documento NO hace (decisiones que quedan de tu lado al crear la app):**

- No genera el proyecto React Native (para eso, cuando quieras: `npx create-expo-app SoldaMasterApp --template ts`).
- No instala dependencias (`npm install axios @react-native-async-storage/async-storage @tanstack/react-query date-fns decimal.js`).
- No elige librería de navegación ni escribe las pantallas: solo mapea pantalla → endpoint (§8).
- No genera tipos TypeScript automáticamente: se escriben a mano desde las tablas del Apéndice A.4/A.5.
- Es una **foto del código actual**: si el backend cambia (nuevos endpoints, validación real, JWT), hay que actualizar esta guía.

Resumen: con este `.md` puedes crear la app desde cero y conectarla sin volver a leer el Java. Para probar gráficamente aún necesitas crear/probar la app en un emulador o móvil con el backend corriendo.
