# Aurelle — Armario Virtual (Digital Atelier & Capsule Intelligence)

Aplicación web de gestión inteligente de armario cápsula, curaduría diaria de outfits, estudio creativo por capas y auditoría económica y ecológica del vestuario (*Cost-Per-Wear*, CPW).

---

## ¿Para qué sirve la aplicación?

**Aurelle** ayuda a sacar el máximo partido a tu armario diario combinando planificación por contexto climático, diseño visual de conjuntos y control financiero de cada prenda. La aplicación se organiza en **4 módulos principales**:

### 1. Hoy (Curaduría diaria y contexto climático)
- **Contexto por ciudad y clima:** Permite alternar entre ciudades preconfiguradas (`Milano`, `Londres`, `Madrid`) mostrando temperatura actual, evolución mañana/tarde y probabilidad de lluvia.
- **Estrategia modular de 3 capas:** Recomienda combinaciones pensadas para cambios térmicos (*Capa 1 Base Skin*, *Capa 2 Confort A/C* y *Capa 3 Escudo Exterior*), además de un modo rápido de transición día/noche (*Alternativa Cena 19:30*).
- **Agenda sincronizada:** Muestra los compromisos del día con su *dress code* y permite añadir nuevos eventos personalizados.
- **Outfit recomendado e interacción:** Presenta un collage asimétrico con puntuación de armonía (`CLIP %`), paleta cromática en hexadecimal e inspector individual de cada prenda. Permite alternar piezas (*Alternar Pieza (AI)*), registrar que has llevado el look hoy (*Vestir Hoy & Registrar Uso*), valorar la propuesta y guardarla en tu Lookbook.

### 2. Armario (Inventario y digitalización de prendas)
- **Catálogo filtrable y ordenable:** Filtra tus prendas por categoría (`capispalla`, `knits`, `bottoms`, `calzature`, `accessori`), busca por nombre, tejido o subcategoría y ordena por *CPW* (menor o mayor), número de usos o precio de compra.
- **Flujos de alta de prendas:** Incluye accesos para añadir prendas manualmente o mediante flujos simulados de captura (*Cámara Directa*, *Carga Masiva*, *Parsing Pedidos*, *Catálogo Global* y *Disección Outfit*), además de editar, eliminar o enviar cualquier prenda directamente al lienzo de **Studio**.

### 3. Studio (Lienzo creativo por capas y maleta de viaje)
- **Canvas interactivo por capas:** Coloca prendas sobre un lienzo mediante arrastrar y soltar, ajusta escala, volteo horizontal, orden de capas (*z-index*), rotación (clic rápido para rotar 45°), alineación magnética al centro, deshacer/rehacer y guardado de conjuntos como Lookbook.
- **Modo Viaje / Maleta Cápsula:** Planificador de equipaje (por ejemplo, *Escapada Londres 4D*) con control del límite de peso en kilogramos y selección de prendas empaquetadas.

### 4. CPW & Eco (Auditoría textil patrimonial)
- **Métricas del armario:** Calcula el valor total del inventario, el **CPW promedio ponderado**, la tasa de rotación (prendas con 10 o más usos), el número de prendas en cápsula y el ahorro anual proyectado.
- **Fórmula de Cost-Per-Wear (`calculateGarmentCpw`):**
  $$\text{CPW} = \frac{\max(\text{Precio} \times 0.15,\; \text{Precio} + \text{Mantenimiento} - \text{Reventa Estimada})}{\max(1,\; \text{Usos})}$$
- **Circularidad y exportación:** Permite marcar prendas de baja rotación para reventa (`listed_resale`), resolver brechas de armario cápsula, consultar guías de conservación textil y descargar un informe completo en JSON (`Aurelle-GDPR-Art20-v1.0`).

### Persistencia de datos
Todos los cambios (prendas, usos registrados, lookbooks, capas del Studio, plan de viaje y ciudad seleccionada) se guardan automáticamente en el `localStorage` del navegador (`aurelle_atelier_state_v1`). Desde el modal de perfil puedes revisar tus Lookbooks o restaurar los datos iniciales de demostración.

---

## Stack tecnológico

- **Frontend:** React 19, TypeScript, Vite 8
- **Estilos e iconos:** Tailwind CSS v4 (`@tailwindcss/vite`), Material Symbols Outlined, Lucide React, Motion
- **Dependencias de plantilla (`google-gemini/aistudio-repository-template`):** `@google/genai`, Express y `dotenv`

> **Nota:** La versión actual funciona íntegramente en el navegador con datos locales y `localStorage`, sin requerir un servidor externo ni claves API para arrancar y usar la interfaz.

---

## Requisitos previos

1. **Node.js** (versión LTS recomendada, v20 o superior; incluye `npm`).
   - Descarga directa: [https://nodejs.org/](https://nodejs.org/)
   - O en Windows mediante `winget`:
     ```powershell
     winget install --id OpenJS.NodeJS.LTS --exact
     ```
2. **Git** *(opcional, si prefieres clonar el repositorio en lugar de descargar el ZIP desde GitHub)*.

---

## Instalación y ejecución en local

### 1. Obtener el código
Clona el repositorio con Git:

```bash
git clone https://github.com/mogdar75-carver/Armario-virtual.git
cd Armario-virtual
```

*(Alternativamente, en GitHub pulsa **Code -> Download ZIP**, descomprime la carpeta y abre una terminal dentro de ella).*

### 2. Instalar dependencias

```bash
npm install
```

> **En Windows PowerShell:** Si la política de ejecución bloquea `npm.ps1`, ejecuta `npm.cmd install` en su lugar.

### 3. Variables de entorno *(opcional)*
El archivo `.env.example` incluye las variables usadas por la plantilla de AI Studio (`GEMINI_API_KEY` y `APP_URL`). Si quieres definirlas localmente:

```bash
cp .env.example .env
```

*(En PowerShell: `Copy-Item .env.example .env`). Para probar la aplicación tal cual está en `src/`, este paso no es obligatorio.*

### 4. Arrancar la aplicación en modo desarrollo

```bash
npm run dev
```

*(En Windows PowerShell si `npm.ps1` está bloqueado: `npm.cmd run dev`).*

Una vez iniciado, abre tu navegador en:

```text
http://localhost:3000
```

---

## Otros scripts disponibles

Definidos en `package.json`:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite en el puerto `3000` (`--host=0.0.0.0`). |
| `npm run build` | Genera la compilación de producción en `dist/` y copia `src/assets` si existe. |
| `npm run preview` | Sirve localmente la compilación generada en `dist/`. |
| `npm run lint` | Comprueba los tipos de TypeScript sin emitir archivos (`tsc --noEmit`). |
| `npm run clean` | Elimina los artefactos de compilación (`dist` y `server.js`). |

---

## Estructura del proyecto

```text
Armario-virtual/
├── index.html                  # Documento HTML principal y fuentes editoriales
├── metadata.json               # Metadatos de la aplicación Aurelle
├── package.json                # Dependencias y scripts de Vite/React/TS
├── tsconfig.json               # Configuración de TypeScript
├── vite.config.ts              # Configuración de Vite, Tailwind y copia de assets
├── .env.example                # Plantilla de variables de entorno
├── public/assets/aistudio/     # Recursos estáticos públicos
└── src/
    ├── App.tsx                 # Shell principal y navegación entre vistas
    ├── main.tsx                # Punto de entrada React
    ├── index.css               # Estilos globales y tokens de diseño
    ├── components/             # Cabecera, navegación inferior, modal de perfil e imagen resiliente
    ├── data/                   # Catálogo inicial, ciudades, lookbooks y plan de viaje
    ├── hooks/                  # Store global con React Context y cálculo de métricas CPW
    ├── types/                  # Interfaces TypeScript (Garment, Lookbook, CanvasLayer, etc.)
    └── views/                  # Vistas: HoyView, ArmarioView, StudioView y CpwEcoView
```
