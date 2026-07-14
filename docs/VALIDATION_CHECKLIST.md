# Checklist de Validación Post-Despliegue

## 1. Acceso y Autenticación

- [ ] Frontend accesible desde URL de Vercel
- [ ] Página de login carga correctamente
- [ ] Puede registrarse usuario nuevo (si está habilitado)
- [ ] Puede autenticarse con usuario existente
- [ ] Session persiste después de refrescar página
- [ ] Logout funciona correctamente

## 2. Autenticación y Roles

- [ ] Login con usuario Administrador funciona
- [ ] Login con usuario Vendedor funciona
- [ ] Rol correcto se muestra en dashboard
- [ ] Usuario Admin ve opción de panel administrativo
- [ ] Usuario Vendedor no ve opción de productos
- [ ] RLS está bloqueando acceso no autorizado (verificar DevTools Network)

## 3. Catálogo de Productos

- [ ] Página /admin/products solo accesible por Admin
- [ ] Vendedor no puede acceder a /admin/products
- [ ] Listar productos funciona
- [ ] Crear producto funciona
- [ ] Editar producto funciona
- [ ] Deactivar producto funciona (no aparece en Ventas)
- [ ] Imagen se sube a Storage correctamente
- [ ] Imagen se muestra en tabla de productos

## 4. Módulo de Ventas

- [ ] Página de ventas carga productos activos
- [ ] Agregar producto al carrito funciona
- [ ] Actualizar cantidad en carrito funciona
- [ ] Remover producto del carrito funciona
- [ ] Total se calcula correctamente
- [ ] Método de pago se selecciona
- [ ] Botón Cerrar Venta desactiva hasta completar
- [ ] Venta se registra en base de datos
- [ ] Auditoría registra la venta con usuario correcto
- [ ] Carrito se limpia después de cerrar venta

## 5. Registro de Gastos

- [ ] Usuario Vendedor puede ver /gastos
- [ ] Usuario Administrador puede ver /gastos
- [ ] Agregar gasto funciona
- [ ] Gastos aparecen en lista
- [ ] Gasto se registra en base de datos
- [ ] Auditoría registra el gasto

## 6. Reportes y Dashboard

- [ ] Dashboard Admin carga correctamente
- [ ] KPIs muestran valores correctos (ventas hoy, gastos hoy, utilidad)
- [ ] Página de reportes carga
- [ ] Rango de fechas se selecciona
- [ ] Botón Generar reportes funciona
- [ ] Reporte muestra: totalVendido, totalGastos, utilidadEstim, cantidadVentas
- [ ] Top productos se listan correctamente
- [ ] Métodos de pago se desglosan

## 7. Seguridad RLS

- [ ] Consulta SQL como Admin ve todos los datos: `SELECT COUNT(*) FROM ventas;`
- [ ] Consulta como Vendedor solo ve sus ventas: 
  ```sql
  SELECT COUNT(*) FROM ventas WHERE usuario_id = auth.uid();
  ```
- [ ] Tabla auditoria registra usuario_id correcto
- [ ] Intentar acceso directo a DB sin token retorna 401
- [ ] Vendedor no puede editar ventas de otro usuario

## 8. Almacenamiento y Imágenes

- [ ] Bucket product-images existe en Storage
- [ ] Imágenes subidas aparecen en carpeta
- [ ] URLs de imágenes cargan correctamente
- [ ] URLs públicas funcionan desde navegador incógnito

## 9. Edge Functions

- [ ] Function register-sale se ejecuta sin errores
- [ ] Function register-expense se ejecuta sin errores
- [ ] Function get-reports retorna datos correctos
- [ ] Logs muestran ejecución exitosa:
  ```bash
  supabase functions logs register-sale --project-id YOUR-ID
  ```

## 10. Performance y Carga

- [ ] Frontend carga en menos de 3 segundos (First Contentful Paint)
- [ ] Carrito es responsive (agregar/remover ítems es rápido)
- [ ] Reportes cargan en menos de 5 segundos
- [ ] No hay memory leaks en DevTools
- [ ] Console no muestra errores críticos

## 11. Navegación y UI

- [ ] Header muestra logo y usuario actual
- [ ] Logout button visible y funcional
- [ ] Links de navegación funcionan
- [ ] Página 404 maneja rutas inválidas
- [ ] Responsive design en mobile/tablet/desktop
- [ ] Estilos CSS cargan correctamente

## 12. Base de Datos

- [ ] Datos iniciales (roles, categorías, métodos de pago) existen
- [ ] Índices están creados (verificar performance de queries)
- [ ] Triggers de auditoría se disparan correctamente
- [ ] No hay errores de constraint violation

## 13. Integraciones

- [ ] Supabase Auth email confirmations funcionan (si es requerido)
- [ ] Supabase Storage CDN delivery es rápido
- [ ] Variables de entorno están configuradas en Vercel

## 14. Documentación

- [ ] README.md tiene instrucciones de setup
- [ ] DEPLOYMENT.md tiene pasos claros
- [ ] API.md documenta Edge Functions
- [ ] Código tiene comentarios en secciones complejas

## 15. Rollback y Contingencia

- [ ] Backups de base de datos están configurados
- [ ] Versión anterior en Vercel puede recuperarse
- [ ] Plan de rollback documentado

---

## Pruebas End-to-End Completas

### Flujo Admin
1. Login como admin
2. Crear categoría
3. Crear producto (subir imagen)
4. Ver producto en Ventas (como vendedor)
5. Ver reportes de hoy

### Flujo Vendedor
1. Login como vendedor
2. Agregar 2-3 productos al carrito
3. Cerrar venta
4. Registrar 1-2 gastos
5. Ver resumen de ventas y gastos

---

**Estado**: [ ] Todo validado - LISTO PARA PRODUCCIÓN

**Fecha de validación**: ________________

**Tester**: ________________

**Observaciones**:
```
[Escribir aquí]
```
