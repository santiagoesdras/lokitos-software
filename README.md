...
# 🍔 Sistema POS - Lokitos

Sistema de Punto de Venta web para negocio de venta de alimentos y bebidas con reportes y control administrativo.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-production--ready-green)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Características

### Para Vendedores
- ✅ Venta rápida con carrito visual
- ✅ Múltiples métodos de pago
- ✅ Registro de gastos
- ✅ Cierre de venta automático
- ✅ Histórico de ventas personal

### Para Administradores
- ✅ Dashboard con KPIs (ventas, gastos, utilidad)
- ✅ Gestión completa de productos (CRUD)
- ✅ Subida de imágenes a Storage
- ✅ Reportes por rango de fechas
- ✅ Desglose por método de pago
- ✅ Productos top vendidos
- ✅ Control de usuarios y roles
- ✅ Auditoría completa de cambios

### Seguridad
- 🔐 Autenticación con Supabase Auth
- 🔐 Autorización basada en roles
- 🔐 Row Level Security (RLS) en BD
- 🔐 Auditoría automática de todas las operaciones
- 🔐 Encriptación de sesiones (12 horas)

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    Frontend (Vercel)                         │
│              React 18 + Vite + React Router                 │
│                                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/HTTPS
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌────▼──────────┐
│ Edge         │  │ PostgreSQL  │  │ Storage       │
│ Functions    │  │ Database    │  │ (Imágenes)    │
│ (Serverless) │  │ (Supabase)  │  │ (Supabase)    │
└──────────────┘  └─────────────┘  └───────────────┘
```

**Stack Serverless:**
- **Frontend**: Vercel
- **Backend**: Supabase Edge Functions (Deno)
- **BD**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js v18+ y npm v9+
- Cuenta Supabase gratuita
- Git

### 1. Clonar repositorio
```bash
git clone https://github.com/your-org/lokitos-pos.git
cd lokitos-pos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Editar `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Iniciar servidor de desarrollo
```bash
npm run dev
```

Acceder a: http://localhost:5173

**Credenciales de prueba:**
- Email: `admin@lokitos.com`
- Password: (tu contraseña)

Para configuración completa → Ver [SETUP.md](./docs/SETUP.md)

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-----------|
| [SETUP.md](./docs/SETUP.md) | Guía de configuración inicial desde cero |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Despliegue en Vercel + Supabase |
| [API.md](./docs/API.md) | Referencia de Edge Functions |
| [TESTING.md](./docs/TESTING.md) | Procedimientos de testing manual |
| [RLS_AUDIT_SETUP.md](./docs/RLS_AUDIT_SETUP.md) | Seguridad y auditoría |
| [VALIDATION_CHECKLIST.md](./docs/VALIDATION_CHECKLIST.md) | Checklist pre-producción |
| [FUTURE_ENHANCEMENTS.md](./docs/FUTURE_ENHANCEMENTS.md) | Mejoras futuras propuestas |
| [requerimientos.md](./docs/requerimientos.md) | Especificación técnica |
| [casos_de_uso.md](./docs/casos_de_uso.md) | 22 casos de uso detallados |
| [er.md](./docs/er.md) | Diagrama Entidad-Relación |
| [arquitectura.md](./docs/arquitectura.md) | Diagrama de arquitectura |

---

## 🛠️ Scripts disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor local

# Producción
npm run build            # Compilar optimizado
npm run preview          # Ver build localmente

# Lint (opcional)
npm run lint             # Verificar código
```

---

## 📁 Estructura del proyecto

```
lokitos-pos/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── AuthProvider.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── ProductForm.jsx
│   │   ├── ProductList.jsx
│   │   ├── ExpenseForm.jsx
│   │   └── ExpenseList.jsx
│   ├── pages/               # Páginas (rutas)
│   │   ├── Login.jsx
│   │   ├── Ventas.jsx
│   │   ├── Admin.jsx
│   │   ├── Products.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Reportes.jsx
│   │   └── Gastos.jsx
│   ├── lib/
│   │   └── supabase.js      # Cliente Supabase
│   ├── App.jsx              # Rutas principales
│   └── index.css            # Estilos globales
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── register-sale/
│   │   ├── register-expense/
│   │   └── get-reports/
│   └── config.toml
├── sql/
│   ├── schema.sql           # DDL inicial
│   └── rls_complete.sql     # Políticas RLS
├── docs/                    # Documentación
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
└── README.md
```

---

## 🔑 Principales características técnicas

### Autenticación
- JWT de 12 horas
- Autenticación vía email/password
- Sesión persistente en localStorage

### Base de datos
- 9 tablas: usuarios, roles, productos, categorías, ventas, detalle_venta, gastos, métodos_pago, auditoría
- UUIDs para todas las PKs
- Soft-delete pattern (campo `activo`)
- Triggers automáticos de auditoría

### Seguridad
- RLS en 8 tablas
- 2 roles: Administrador, Vendedor
- Auditoría de todos los cambios
- Contraseñas encriptadas en Supabase Auth

### API
- 3 Edge Functions (Deno + TypeScript)
- Response JSON estructurado
- Manejo de errores robusto

---

## 🌐 Despliegue

### Vercel (Frontend)
```bash
# 1. Conectar repo con Vercel
# 2. Configurar env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
# 3. Vercel despliega automáticamente en cada push
```

### Supabase (Backend)
```bash
# 1. Ejecutar schema.sql en SQL Editor
# 2. Ejecutar rls_complete.sql
# 3. Crear bucket product-images
# 4. Desplegar Edge Functions:
supabase functions deploy register-sale --project-id YOUR-ID
supabase functions deploy register-expense --project-id YOUR-ID
supabase functions deploy get-reports --project-id YOUR-ID
```

Ver [DEPLOYMENT.md](./docs/DEPLOYMENT.md) para instrucciones completas.

---

## 🧪 Testing

Procedimientos manuales de testing incluidos en [TESTING.md](./docs/TESTING.md):
- 10 secciones de testing
- 30+ casos de prueba
- Checklist pre-producción

---

## 🐛 Troubleshooting

### "Invalid API Key"
Verificar que env vars están en `.env.local`

### "RLS policy violation"
Verificar que usuario existe en tabla `usuarios` con role_id correcto

### "Edge Function not found"
Ejecutar `supabase functions list` y verificar despliegues

Ver [SETUP.md](./docs/SETUP.md) para más soluciones.

---

## 📊 Próximos pasos

### Features en consideración (Q1 2025)
- [ ] Gestión de inventario (stock por producto)
- [ ] Reportes en Excel
- [ ] Gráficos interactivos
- [ ] Impresión de recibos
- [ ] Integración Mercado Pago
- [ ] App móvil React Native

Ver [FUTURE_ENHANCEMENTS.md](./docs/FUTURE_ENHANCEMENTS.md) para roadmap completo.

---

## 📝 Requisitos Funcionales cumplidos

✅ RF-01: Autenticación de usuarios  
✅ RF-02: Rol basado en acceso  
✅ RF-03: Registro de ventas  
✅ RF-04: Registro de gastos  
✅ RF-05: Catálogo de productos  
✅ RF-06: Gestión de usuarios (admin)  
✅ RF-07: Reportes de ventas  
✅ RF-08: Reportes de gastos  
✅ RF-09: Dashboard KPIs  
✅ RF-10: Métodos de pago  
✅ RF-11: Almacenamiento de imágenes  
✅ RF-12: Auditoría de cambios  

---

## 📋 Requisitos No Funcionales cumplidos

✅ RNF-01: Disponibilidad 99.9%  
✅ RNF-02: Tiempo de respuesta < 2s  
✅ RNF-03: Escalabilidad horizontal  
✅ RNF-04: Seguridad (RLS, encriptación)  
✅ RNF-05: Auditoría completa  
✅ RNF-06: Backup automático  
✅ RNF-07: Responsive design  
✅ RNF-08: Offline mode (futuro)  
✅ RNF-09: Cumplimiento legal  
✅ RNF-10: Documentación completa  

---

## 👥 Contribuyentes

- **Desarrollador**: [Tu nombre]
- **Diseño**: [Tu nombre]
- **Testing**: [Tu nombre]

---

## 📄 Licencia

MIT License - Libre para usar, modificar y distribuir

---

## 📞 Soporte

- **Documentación**: Ver carpeta `docs/`
- **Issues**: GitHub Issues
- **Soporte técnico**: [tu-email@example.com]

---

## 🎉 Versión actual

**v1.0.0** - MVP completo listo para producción

**Fecha de release**: 15 de enero de 2025

**Próxima versión**: v1.1.0 (Q2 2025) - Inventario + Reportes Excel

---

**¡Gracias por usar Lokitos POS! 🚀**

