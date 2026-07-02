# Payloads — Pase de Entrada Transportista

Estructura actual del payload para cada tipo de operación.

> `fecha_pase_transportista_hasta` es opcional — solo aparece si el usuario activa el rango de fechas.
> `horario_disponible` es opcional — vacío si el toggle de horario está inactivo.
> `lugar_recoleccion` solo existe en tipos 2 y 3.
> `cantidad` se envía como entero o `null`.
> `dominio` se envía siempre con el origen del navegador para que el back pueda construir URLs (QR, links, etc.).
> `material.documentos` es un array vacío si no se subieron archivos.

---

## 1. Entrega de materia prima

```json
{
  "tipo_de_operacion": "entrega_de_materia_prima",
  "creado_desde": "pase_de_entrada_web",
  "dominio": "https://web.clave10.com",
  "crea_el_pase": {
    "nombre": "Carlos Mendoza",
    "email": "carlos@planta.com",
    "telefono": "+52 55 1234 5678"
  },
  "recibe_el_pase": {
    "nombre": "Contacto del proveedor",
    "email": "proveedor@empresa.com",
    "telefono": null
  },
  "material": {
    "proveedor_cliente": "Plastipack de México S.A.",
    "material": "Resina PET virgen",
    "cantidad": 20,
    "orden_compra": "OC-2026-0042",
    "documentos": [
      {
        "file_name": "factura_OC20260042.pdf",
        "file_url": "https://f001.backblazeb2.com/file/app-linkaform/..."
      }
    ]
  },
  "lugar_entrega_recepcion": {
    "ubicacion": "Planta Norte",
    "direccion": "Av. Industrial 420, Monterrey",
    "fecha_pase_transportista_desde": "2026-06-04",
    "fecha_pase_transportista_hasta": "2026-06-08",
    "horario_disponible": "08:00-10:00",
    "anden": "Andén 3"
  }
}
```

---

## 2. Recolección de materia prima

```json
{
  "tipo_de_operacion": "recoleccion_de_materia_prima",
  "creado_desde": "pase_de_entrada_web",
  "dominio": "https://app.clave10.com",
  "crea_el_pase": {
    "nombre": "Carlos Mendoza",
    "email": "carlos@planta.com",
    "telefono": "+52 55 1234 5678"
  },
  "recibe_el_pase": {
    "nombre": "Contacto del proveedor",
    "email": "proveedor@empresa.com",
    "telefono": null
  },
  "material": {
    "proveedor_cliente": "Aceros del Norte S.A.",
    "material": "Lámina rolada calibre 18",
    "cantidad": 50,
    "orden_compra": "OC-2026-0055",
    "documentos": [
      {
        "file_name": "carta_porte_MS00087.pdf",
        "file_url": "https://f001.backblazeb2.com/file/app-linkaform/..."
      }
    ]
  },
  "lugar_entrega_recepcion": {
    "ubicacion": "Planta Norte",
    "direccion": "Av. Industrial 420, Monterrey",
    "fecha_pase_transportista_desde": "2026-06-05",
    "fecha_pase_transportista_hasta": "2026-06-07",
    "horario_disponible": "14:00-16:00",
    "anden": "Andén 1"
  },
  "lugar_recoleccion": {
    "lugar": "Planta proveedor Monterrey",
    "direccion": "Blvd. Industrial 540, Monterrey, N.L.",
    "fecha": "2026-06-04",
    "horario": "07:00-09:00",
    "anden": null,
    "transporte": {
      "responsable": "Sergio Villanueva",
      "email": "sergio@fletes.com",
      "telefono": "+52 81 9876 5432"
    },
    "metodo_embarque": "Terrestre",
    "incoterm": "EXW"
  }
}
```

---

## 3. Entrega de producto terminado

```json
{
  "tipo_de_operacion": "entrega_de_producto_terminado",
  "creado_desde": "pase_de_entrada_web",
  "dominio": "https://app.clave10.com",
  "crea_el_pase": {
    "nombre": "Carlos Mendoza",
    "email": "carlos@planta.com",
    "telefono": "+52 55 1234 5678"
  },
  "recibe_el_pase": {
    "nombre": "Armando Pérez Castro",
    "email": "armando@cliente.com",
    "telefono": null
  },
  "material": {
    "proveedor_cliente": "Envases del Bajío S.A.",
    "material": "Tapas PET rosca 28mm",
    "cantidad": 5,
    "orden_compra": "OV-2026-0018",
    "documentos": [
      {
        "file_name": "remision_OV20260018.pdf",
        "file_url": "https://f001.backblazeb2.com/file/app-linkaform/..."
      }
    ]
  },
  "lugar_entrega_recepcion": {
    "ubicacion": "Planta Norte",
    "direccion": "Av. Industrial 420, Monterrey",
    "fecha_pase_transportista_desde": "2026-06-03",
    "fecha_pase_transportista_hasta": "2026-06-05",
    "horario_disponible": "08:00-10:00",
    "anden": "Andén 5"
  },
  "lugar_recoleccion": {
    "lugar": "Almacén cliente Irapuato",
    "direccion": "Km 12 Carr. Irapuato-La Luz, Gto.",
    "fecha": "2026-06-03",
    "horario": "07:00-09:00",
    "anden": null,
    "transporte": {
      "responsable": "Martín Hernández Jr.",
      "email": "martin@transportes.com",
      "telefono": "+52 81 5555 1234"
    },
    "metodo_embarque": "Terrestre",
    "incoterm": "DAP"
  }
}
```

---

## 4. Recolección de producto terminado

```json
{
  "tipo_de_operacion": "recoleccion_de_producto_terminado",
  "creado_desde": "pase_de_entrada_web",
  "dominio": "https://app.clave10.com",
  "crea_el_pase": {
    "nombre": "Carlos Mendoza",
    "email": "carlos@planta.com",
    "telefono": "+52 55 1234 5678"
  },
  "recibe_el_pase": {
    "nombre": "Ing. Carlos Ruiz",
    "email": "carlos.ruiz@distribuidora.com",
    "telefono": null
  },
  "material": {
    "proveedor_cliente": "Grupo Distribuidora Norte S.A.",
    "material": "Producto terminado A",
    "cantidad": 3,
    "orden_compra": "OV-2026-0025",
    "documentos": [
      {
        "file_name": "remision_OV20260025.pdf",
        "file_url": "https://f001.backblazeb2.com/file/app-linkaform/..."
      }
    ]
  },
  "lugar_entrega_recepcion": {
    "ubicacion": "Planta Norte",
    "direccion": "Av. Industrial 420, Monterrey",
    "fecha_pase_transportista_desde": "2026-06-06",
    "fecha_pase_transportista_hasta": "2026-06-09",
    "horario_disponible": "10:00-12:00",
    "anden": "Andén 2"
  }
}
```

---

## Referencia de campos

| Campo                                                    | Tipo              | Obligatorio   | Notas                                                                                                                                  |
| -------------------------------------------------------- | ----------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `tipo_de_operacion`                                      | `string`          | ✓             | `entrega_de_materia_prima` \| `recoleccion_de_materia_prima` \| `entrega_de_producto_terminado` \| `recoleccion_de_producto_terminado` |
| `creado_desde`                                           | `string`          | ✓             | Siempre `"pase_de_entrada_web"`                                                                                                        |
| `dominio`                                                | `string`          | ✓             | Origen del navegador — el back lo usa para construir URLs del QR                                                                       |
| `crea_el_pase.nombre`                                    | `string`          | ✓             |                                                                                                                                        |
| `crea_el_pase.email`                                     | `string`          | ✓             |                                                                                                                                        |
| `recibe_el_pase.nombre`                                  | `string`          | ✓             | Label varía por tipo                                                                                                                   |
| `material.cantidad`                                      | `integer \| null` | —             | Entero positivo                                                                                                                        |
| `material.documentos`                                    | `array`           | —             | `[{ file_name, file_url }]` — vacío si no se subieron archivos                                                                         |
| `lugar_entrega_recepcion.ubicacion`                      | `string \| null`  | —             | Del selector de ubicaciones                                                                                                            |
| `lugar_entrega_recepcion.fecha_pase_transportista_desde` | `string`          | —             | `YYYY-MM-DD`                                                                                                                           |
| `lugar_entrega_recepcion.fecha_pase_transportista_hasta` | `string`          | —             | Solo si rango activo                                                                                                                   |
| `lugar_entrega_recepcion.horario_disponible`             | `string \| null`  | —             | `HH:MM-HH:MM`, null si toggle inactivo                                                                                                 |
| `lugar_entrega_recepcion.anden`                          | `string \| null`  | —             | Del servicio `get_andenes`                                                                                                             |
| `lugar_recoleccion`                                      | `object`          | —             | Solo tipos 2 y 3                                                                                                                       |
| `lugar_recoleccion.transporte.responsable`               | `string`          | ✓ (tipos 2-3) |                                                                                                                                        |
| `lugar_recoleccion.metodo_embarque`                      | `string \| null`  | —             | `Terrestre` \| `Aéreo` \| `Marítimo` \| `Ferroviario` \| `Multimodal`                                                                  |
| `lugar_recoleccion.incoterm`                             | `string \| null`  | —             | Estándar Incoterms 2020                                                                                                                |
