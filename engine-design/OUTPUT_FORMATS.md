# Output Format Specifications

## Overview

The Output Generator produces four structured JSON files that specify the detected system:

1. **schema.json** - Database schema specification
2. **relationships.json** - Entity relationship diagram
3. **automation_rules.json** - Business logic and workflows
4. **confirmation_ui.json** - Human validation interface spec

These outputs can be consumed by:
- Database migration tools (Prisma, TypeORM, Alembic)
- Workflow engines (n8n, Temporal, Directus)
- UI scaffolding tools (React, Vue, Angular)
- Code generators

## 1. Database Schema (schema.json)

### 1.1 Schema Structure

```json
{
  "version": "1.0",
  "metadata": {
    "source_file": "string",
    "generated_at": "ISO 8601 timestamp",
    "confidence": "number (0.0-1.0)",
    "engine_version": "string",
    "warnings": ["string"]
  },
  "entities": [
    {
      "name": "string",
      "table_name": "string",
      "description": "string",
      "primary_key": "string | null",
      "columns": [...],
      "indexes": [...],
      "constraints": [...]
    }
  ]
}
```

### 1.2 Column Specification

```json
{
  "name": "string",
  "type": "SQL_TYPE",
  "nullable": "boolean",
  "unique": "boolean",
  "default": "any | null",
  "auto_increment": "boolean (optional)",
  "description": "string",
  "validation": {
    "min": "number (optional)",
    "max": "number (optional)",
    "pattern": "regex (optional)",
    "enum": ["values"] (optional)
  },
  "foreign_key": {
    "references": "table.column",
    "on_delete": "CASCADE | SET NULL | RESTRICT | NO ACTION",
    "on_update": "CASCADE | SET NULL | RESTRICT | NO ACTION"
  } (optional),
  "metadata": {
    "original_column": "string",
    "semantic_type": "string",
    "confidence": "number"
  }
}
```

### 1.3 Type Mapping

**Column Type → SQL Type Mapping**:

```python
TYPE_MAPPING = {
    ColumnType.ID: "INTEGER",
    ColumnType.TEXT: "VARCHAR(255)",
    ColumnType.DATE: "DATE",
    ColumnType.DATETIME: "TIMESTAMP",
    ColumnType.NUMBER_INT: "INTEGER",
    ColumnType.NUMBER_FLOAT: "DECIMAL(10,2)",
    ColumnType.CURRENCY: "DECIMAL(10,2)",
    ColumnType.PERCENTAGE: "DECIMAL(5,2)",
    ColumnType.BOOLEAN: "BOOLEAN",
    ColumnType.EMAIL: "VARCHAR(255)",
    ColumnType.PHONE: "VARCHAR(20)",
    ColumnType.URL: "VARCHAR(500)",
    ColumnType.ENUM: "ENUM",  # With allowed_values
}
```

### 1.4 Complete Example

```json
{
  "version": "1.0",
  "metadata": {
    "source_file": "inventory_tracker.xlsx",
    "generated_at": "2025-11-02T10:30:00Z",
    "confidence": 0.87,
    "engine_version": "1.0.0",
    "warnings": [
      "Entity 'Orders' has no primary key; suggest creating auto-increment ID"
    ]
  },
  "entities": [
    {
      "name": "Product",
      "table_name": "products",
      "description": "Product catalog with inventory tracking",
      "primary_key": "product_id",
      "columns": [
        {
          "name": "product_id",
          "type": "INTEGER",
          "nullable": false,
          "unique": true,
          "auto_increment": true,
          "description": "Unique product identifier",
          "metadata": {
            "original_column": "ID",
            "semantic_type": "PRIMARY_KEY",
            "confidence": 0.95
          }
        },
        {
          "name": "product_name",
          "type": "VARCHAR(255)",
          "nullable": false,
          "unique": false,
          "description": "Product name",
          "validation": {
            "min": 1,
            "max": 255
          },
          "metadata": {
            "original_column": "Product Name",
            "semantic_type": "NAME",
            "confidence": 0.9
          }
        },
        {
          "name": "category",
          "type": "ENUM('Electronics', 'Furniture', 'Supplies')",
          "nullable": true,
          "description": "Product category",
          "validation": {
            "enum": ["Electronics", "Furniture", "Supplies"]
          },
          "metadata": {
            "original_column": "Category",
            "semantic_type": "ENUM",
            "confidence": 0.95
          }
        },
        {
          "name": "unit_price",
          "type": "DECIMAL(10,2)",
          "nullable": false,
          "description": "Price per unit in USD",
          "validation": {
            "min": 0,
            "max": 999999.99
          },
          "metadata": {
            "original_column": "Price",
            "semantic_type": "PRICE",
            "confidence": 0.92
          }
        },
        {
          "name": "quantity_on_hand",
          "type": "INTEGER",
          "nullable": false,
          "default": 0,
          "description": "Current inventory quantity",
          "validation": {
            "min": 0
          },
          "metadata": {
            "original_column": "Quantity",
            "semantic_type": "QUANTITY",
            "confidence": 0.9
          }
        },
        {
          "name": "reorder_level",
          "type": "INTEGER",
          "nullable": true,
          "description": "Minimum quantity before reorder",
          "validation": {
            "min": 0
          },
          "metadata": {
            "original_column": "Reorder Level",
            "semantic_type": "QUANTITY",
            "confidence": 0.88
          }
        },
        {
          "name": "supplier_id",
          "type": "INTEGER",
          "nullable": true,
          "description": "Reference to supplier",
          "foreign_key": {
            "references": "suppliers.supplier_id",
            "on_delete": "SET NULL",
            "on_update": "CASCADE"
          },
          "metadata": {
            "original_column": "Supplier ID",
            "semantic_type": "FOREIGN_KEY:supplier",
            "confidence": 0.93
          }
        },
        {
          "name": "last_updated",
          "type": "TIMESTAMP",
          "nullable": false,
          "default": "CURRENT_TIMESTAMP",
          "description": "Last modification timestamp",
          "metadata": {
            "original_column": "Last Updated",
            "semantic_type": "DATE_MODIFIED",
            "confidence": 0.95
          }
        }
      ],
      "indexes": [
        {
          "name": "idx_category",
          "columns": ["category"],
          "type": "BTREE",
          "unique": false
        },
        {
          "name": "idx_supplier",
          "columns": ["supplier_id"],
          "type": "BTREE",
          "unique": false
        }
      ],
      "constraints": [
        {
          "name": "chk_quantity_positive",
          "type": "CHECK",
          "expression": "quantity_on_hand >= 0"
        },
        {
          "name": "chk_price_positive",
          "type": "CHECK",
          "expression": "unit_price >= 0"
        }
      ]
    },
    {
      "name": "Supplier",
      "table_name": "suppliers",
      "description": "Supplier contact information",
      "primary_key": "supplier_id",
      "columns": [
        {
          "name": "supplier_id",
          "type": "INTEGER",
          "nullable": false,
          "unique": true,
          "auto_increment": true,
          "description": "Unique supplier identifier",
          "metadata": {
            "original_column": "Supplier ID",
            "semantic_type": "PRIMARY_KEY",
            "confidence": 0.95
          }
        },
        {
          "name": "supplier_name",
          "type": "VARCHAR(255)",
          "nullable": false,
          "description": "Supplier company name",
          "metadata": {
            "original_column": "Supplier Name",
            "semantic_type": "NAME",
            "confidence": 0.9
          }
        },
        {
          "name": "contact_email",
          "type": "VARCHAR(255)",
          "nullable": true,
          "description": "Primary contact email",
          "validation": {
            "pattern": "^[^@]+@[^@]+\\.[^@]+$"
          },
          "metadata": {
            "original_column": "Email",
            "semantic_type": "EMAIL",
            "confidence": 0.98
          }
        },
        {
          "name": "contact_phone",
          "type": "VARCHAR(20)",
          "nullable": true,
          "description": "Primary contact phone number",
          "metadata": {
            "original_column": "Phone",
            "semantic_type": "PHONE",
            "confidence": 0.95
          }
        }
      ],
      "indexes": [],
      "constraints": []
    }
  ]
}
```

## 2. Relationships (relationships.json)

### 2.1 Relationship Structure

```json
{
  "version": "1.0",
  "relationships": [
    {
      "id": "string",
      "from_entity": "string",
      "from_column": "string",
      "to_entity": "string",
      "to_column": "string",
      "type": "FOREIGN_KEY | FORMULA_REFERENCE | IMPLICIT",
      "cardinality": "ONE_TO_ONE | ONE_TO_MANY | MANY_TO_ONE | MANY_TO_MANY",
      "confidence": "number (0.0-1.0)",
      "description": "string",
      "on_delete": "CASCADE | SET NULL | RESTRICT",
      "on_update": "CASCADE | SET NULL | RESTRICT",
      "metadata": {
        "detection_method": "string",
        "value_overlap": "number",
        "name_similarity": "number"
      }
    }
  ],
  "diagram": {
    "layout": "hierarchical | force-directed | circular",
    "nodes": [...],
    "edges": [...]
  }
}
```

### 2.2 Diagram Specification

**Node Format**:
```json
{
  "id": "entity_id",
  "label": "Entity Name",
  "type": "entity",
  "position": {"x": 100, "y": 100},
  "color": "#hex",
  "size": "small | medium | large",
  "metadata": {
    "row_count": 100,
    "column_count": 5,
    "confidence": 0.9
  }
}
```

**Edge Format**:
```json
{
  "id": "relationship_id",
  "from": "entity_id",
  "to": "entity_id",
  "label": "column_name",
  "cardinality": "ONE_TO_MANY",
  "style": "solid | dashed | dotted",
  "color": "#hex",
  "thickness": 1-5
}
```

### 2.3 Complete Example

```json
{
  "version": "1.0",
  "relationships": [
    {
      "id": "rel_001",
      "from_entity": "products",
      "from_column": "supplier_id",
      "to_entity": "suppliers",
      "to_column": "supplier_id",
      "type": "FOREIGN_KEY",
      "cardinality": "MANY_TO_ONE",
      "confidence": 0.95,
      "description": "Each product has one supplier; suppliers can have multiple products",
      "on_delete": "SET NULL",
      "on_update": "CASCADE",
      "metadata": {
        "detection_method": "name_and_value_matching",
        "value_overlap": 0.92,
        "name_similarity": 1.0
      }
    },
    {
      "id": "rel_002",
      "from_entity": "orders",
      "from_column": "product_id",
      "to_entity": "products",
      "to_column": "product_id",
      "type": "FOREIGN_KEY",
      "cardinality": "MANY_TO_ONE",
      "confidence": 0.93,
      "description": "Each order line references a product",
      "on_delete": "RESTRICT",
      "on_update": "CASCADE",
      "metadata": {
        "detection_method": "name_and_value_matching",
        "value_overlap": 0.88,
        "name_similarity": 0.95
      }
    }
  ],
  "diagram": {
    "layout": "hierarchical",
    "nodes": [
      {
        "id": "suppliers",
        "label": "Suppliers",
        "type": "entity",
        "position": {"x": 100, "y": 100},
        "color": "#3B82F6",
        "size": "medium",
        "metadata": {
          "row_count": 8,
          "column_count": 4,
          "confidence": 0.92
        }
      },
      {
        "id": "products",
        "label": "Products",
        "type": "entity",
        "position": {"x": 300, "y": 100},
        "color": "#10B981",
        "size": "large",
        "metadata": {
          "row_count": 247,
          "column_count": 8,
          "confidence": 0.9
        }
      },
      {
        "id": "orders",
        "label": "Orders",
        "type": "entity",
        "position": {"x": 500, "y": 100},
        "color": "#F59E0B",
        "size": "large",
        "metadata": {
          "row_count": 1543,
          "column_count": 6,
          "confidence": 0.88
        }
      }
    ],
    "edges": [
      {
        "id": "rel_001",
        "from": "products",
        "to": "suppliers",
        "label": "supplier_id",
        "cardinality": "MANY_TO_ONE",
        "style": "solid",
        "color": "#6B7280",
        "thickness": 2
      },
      {
        "id": "rel_002",
        "from": "orders",
        "to": "products",
        "label": "product_id",
        "cardinality": "MANY_TO_ONE",
        "style": "solid",
        "color": "#6B7280",
        "thickness": 2
      }
    ]
  }
}
```

## 3. Automation Rules (automation_rules.json)

### 3.1 Rule Structure

```json
{
  "version": "1.0",
  "rules": [
    {
      "id": "string",
      "name": "string",
      "type": "TRIGGER | COMPUTED_FIELD | VALIDATION | AGGREGATE | LOOKUP",
      "entity": "string",
      "enabled": "boolean",
      "priority": "number (1-10)",
      "confidence": "number (0.0-1.0)",
      "description": "string",
      "source": {
        "type": "FORMULA | INFERRED | MANUAL",
        "location": "Sheet!Cell",
        "formula": "string"
      },
      "implementation": {
        // Type-specific implementation details
      }
    }
  ],
  "workflows": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "trigger": {...},
      "steps": [...]
    }
  ]
}
```

### 3.2 Rule Types

**TRIGGER Rule**:
```json
{
  "id": "rule_001",
  "name": "Low Stock Alert",
  "type": "TRIGGER",
  "entity": "products",
  "enabled": true,
  "priority": 8,
  "confidence": 0.85,
  "description": "Send alert when product stock falls below reorder level",
  "source": {
    "type": "FORMULA",
    "location": "Products!G2",
    "formula": "=IF(E2<=F2, \"REORDER\", \"OK\")"
  },
  "implementation": {
    "trigger": {
      "event": "UPDATE",
      "conditions": [
        {
          "field": "quantity_on_hand",
          "operator": "<=",
          "compare_to": "reorder_level"
        }
      ],
      "logic": "ALL"
    },
    "actions": [
      {
        "type": "NOTIFICATION",
        "channel": "email",
        "recipients": ["inventory@company.com"],
        "subject": "Low Stock Alert: {{product_name}}",
        "body": "Product {{product_name}} (ID: {{product_id}}) is below reorder level.\nCurrent: {{quantity_on_hand}}\nReorder at: {{reorder_level}}\nSupplier: {{supplier.supplier_name}}"
      },
      {
        "type": "CREATE_TASK",
        "task_type": "purchase_order",
        "assigned_to": "purchasing_team",
        "title": "Reorder: {{product_name}}",
        "details": {
          "product_id": "{{product_id}}",
          "supplier_id": "{{supplier_id}}",
          "suggested_quantity": "{{reorder_level * 2}}"
        }
      },
      {
        "type": "SET_FIELD",
        "field": "status",
        "value": "REORDER_NEEDED"
      }
    ]
  }
}
```

**COMPUTED_FIELD Rule**:
```json
{
  "id": "rule_002",
  "name": "Calculate Order Total",
  "type": "COMPUTED_FIELD",
  "entity": "orders",
  "enabled": true,
  "priority": 5,
  "confidence": 0.95,
  "description": "Calculate total order amount from quantity and price",
  "source": {
    "type": "FORMULA",
    "location": "Orders!E2",
    "formula": "=C2*D2"
  },
  "implementation": {
    "field": "order_total",
    "computation": {
      "type": "ARITHMETIC",
      "expression": "quantity * unit_price",
      "dependencies": ["quantity", "unit_price"]
    },
    "update_on": ["INSERT", "UPDATE"],
    "update_conditions": [
      {
        "field": "quantity",
        "event": "CHANGE"
      },
      {
        "field": "unit_price",
        "event": "CHANGE"
      }
    ]
  }
}
```

**VALIDATION Rule**:
```json
{
  "id": "rule_003",
  "name": "Validate Email Format",
  "type": "VALIDATION",
  "entity": "suppliers",
  "enabled": true,
  "priority": 10,
  "confidence": 1.0,
  "description": "Ensure contact_email is valid email format",
  "source": {
    "type": "INFERRED",
    "location": null,
    "formula": null
  },
  "implementation": {
    "field": "contact_email",
    "validation": {
      "type": "REGEX",
      "pattern": "^[^@]+@[^@]+\\.[^@]+$",
      "error_message": "Invalid email format. Must be name@domain.com",
      "severity": "ERROR"
    },
    "apply_on": ["INSERT", "UPDATE"]
  }
}
```

**AGGREGATE Rule**:
```json
{
  "id": "rule_004",
  "name": "Calculate Total Revenue",
  "type": "AGGREGATE",
  "entity": "orders",
  "enabled": true,
  "priority": 5,
  "confidence": 0.88,
  "description": "Sum order totals for active orders",
  "source": {
    "type": "FORMULA",
    "location": "Dashboard!B5",
    "formula": "=SUMIF(Orders!Status, \"Active\", Orders!Total)"
  },
  "implementation": {
    "operation": "SUM",
    "field": "order_total",
    "filter": {
      "field": "status",
      "operator": "=",
      "value": "Active"
    },
    "result_field": "total_active_revenue",
    "recalculate_on": ["ORDER_UPDATE", "STATUS_CHANGE"]
  }
}
```

**LOOKUP Rule**:
```json
{
  "id": "rule_005",
  "name": "Get Product Price",
  "type": "LOOKUP",
  "entity": "orders",
  "enabled": true,
  "priority": 7,
  "confidence": 0.92,
  "description": "Lookup product price when product is selected",
  "source": {
    "type": "FORMULA",
    "location": "Orders!D2",
    "formula": "=VLOOKUP(B2, Products!A:C, 3, FALSE)"
  },
  "implementation": {
    "lookup_field": "product_id",
    "target_entity": "products",
    "target_key": "product_id",
    "return_field": "unit_price",
    "destination_field": "unit_price",
    "update_on": ["PRODUCT_CHANGE"]
  }
}
```

### 3.3 Workflow Structure

```json
{
  "id": "workflow_001",
  "name": "Purchase Order Workflow",
  "description": "Automated workflow for creating and sending purchase orders",
  "trigger": {
    "type": "MANUAL",
    "entity": "products",
    "condition": "quantity_on_hand < reorder_level"
  },
  "steps": [
    {
      "id": "step_1",
      "name": "Create Purchase Order",
      "action": "CREATE_RECORD",
      "entity": "purchase_orders",
      "data": {
        "supplier_id": "{{product.supplier_id}}",
        "product_id": "{{product.product_id}}",
        "quantity": "{{product.reorder_level * 2}}",
        "status": "DRAFT",
        "created_at": "{{NOW}}"
      },
      "on_success": "step_2",
      "on_failure": "error_handler"
    },
    {
      "id": "step_2",
      "name": "Send to Supplier",
      "action": "SEND_EMAIL",
      "depends_on": ["step_1"],
      "recipient": "{{supplier.contact_email}}",
      "template": "purchase_order_email",
      "attachments": [
        {
          "type": "PDF",
          "template": "purchase_order_pdf",
          "data": "{{purchase_order}}"
        }
      ],
      "on_success": "step_3",
      "on_failure": "error_handler"
    },
    {
      "id": "step_3",
      "name": "Update PO Status",
      "action": "UPDATE_RECORD",
      "depends_on": ["step_2"],
      "entity": "purchase_orders",
      "record_id": "{{step_1.purchase_order.id}}",
      "data": {
        "status": "SENT",
        "sent_at": "{{NOW}}"
      },
      "on_success": "complete",
      "on_failure": "error_handler"
    }
  ],
  "error_handling": {
    "step_id": "error_handler",
    "action": "NOTIFICATION",
    "recipients": ["admin@company.com"],
    "message": "Purchase order workflow failed at step {{failed_step}}: {{error_message}}"
  }
}
```

## 4. Confirmation UI (confirmation_ui.json)

### 4.1 UI Structure

```json
{
  "version": "1.0",
  "title": "string",
  "subtitle": "string",
  "theme": {
    "primary_color": "#hex",
    "secondary_color": "#hex",
    "success_color": "#hex",
    "warning_color": "#hex",
    "error_color": "#hex"
  },
  "sections": [
    {
      "id": "string",
      "type": "SUMMARY_CARD | ENTITY_LIST | RELATIONSHIP_DIAGRAM | RULE_LIST | WARNING_LIST",
      "title": "string",
      "description": "string",
      "content": {...}
    }
  ],
  "actions": [
    {
      "id": "string",
      "label": "string",
      "type": "PRIMARY | SECONDARY | TERTIARY",
      "action": "string",
      "requires": ["section_id"],
      "icon": "string"
    }
  ]
}
```

### 4.2 Section Types

**SUMMARY_CARD**:
```json
{
  "id": "summary",
  "type": "SUMMARY_CARD",
  "title": "Detection Summary",
  "metrics": [
    {
      "label": "Entities Detected",
      "value": 3,
      "icon": "table",
      "trend": {
        "direction": "neutral",
        "value": null
      }
    },
    {
      "label": "Relationships Found",
      "value": 2,
      "icon": "link",
      "color": "blue"
    },
    {
      "label": "Automation Rules",
      "value": 5,
      "icon": "zap",
      "color": "green"
    },
    {
      "label": "Overall Confidence",
      "value": "87%",
      "icon": "check-circle",
      "color": "green",
      "tooltip": "Based on structure clarity, entity detection, and relationship confidence"
    }
  ]
}
```

**ENTITY_LIST**:
```json
{
  "id": "entities",
  "type": "ENTITY_LIST",
  "title": "Detected Entities",
  "description": "Review and edit the entities detected from your spreadsheet",
  "items": [
    {
      "entity_id": "products",
      "name": "Product",
      "source_sheet": "Products",
      "row_count": 247,
      "column_count": 8,
      "primary_key": "product_id",
      "confidence": 0.92,
      "status": "confirmed",
      "preview_columns": [
        "product_id",
        "product_name",
        "category",
        "unit_price",
        "quantity_on_hand"
      ],
      "editable_fields": [
        {
          "field": "name",
          "type": "text",
          "label": "Entity Name",
          "current_value": "Product",
          "validation": {
            "required": true,
            "pattern": "^[A-Z][a-zA-Z0-9]*$"
          }
        },
        {
          "field": "table_name",
          "type": "text",
          "label": "Table Name",
          "current_value": "products",
          "validation": {
            "required": true,
            "pattern": "^[a-z][a-z0-9_]*$"
          }
        },
        {
          "field": "primary_key",
          "type": "select",
          "label": "Primary Key",
          "options": [
            {"value": "product_id", "label": "product_id (recommended)"},
            {"value": "product_name", "label": "product_name"},
            {"value": null, "label": "None (create auto-increment ID)"}
          ],
          "current_value": "product_id"
        }
      ],
      "actions": [
        {
          "label": "View Columns",
          "action": "OPEN_COLUMN_EDITOR",
          "target": "products",
          "icon": "columns"
        },
        {
          "label": "Edit",
          "action": "EDIT_ENTITY",
          "target": "products",
          "icon": "edit"
        },
        {
          "label": "Remove",
          "action": "REMOVE_ENTITY",
          "target": "products",
          "icon": "trash",
          "confirm": true,
          "confirm_message": "Are you sure you want to remove this entity?"
        }
      ]
    }
  ],
  "actions": [
    {
      "label": "Add Entity",
      "action": "CREATE_ENTITY",
      "icon": "plus"
    }
  ]
}
```

**RELATIONSHIP_DIAGRAM**:
```json
{
  "id": "relationships",
  "type": "RELATIONSHIP_DIAGRAM",
  "title": "Entity Relationships",
  "description": "Review the detected relationships between entities",
  "view_modes": ["diagram", "list"],
  "default_view": "diagram",
  "diagram": {
    "type": "interactive_graph",
    "width": "100%",
    "height": 600,
    "nodes": [
      {
        "id": "suppliers",
        "label": "Suppliers",
        "type": "entity",
        "color": "#3B82F6",
        "icon": "building"
      },
      {
        "id": "products",
        "label": "Products",
        "type": "entity",
        "color": "#10B981",
        "icon": "package"
      }
    ],
    "edges": [
      {
        "id": "rel_001",
        "from": "products",
        "to": "suppliers",
        "label": "supplier_id",
        "confidence": 0.95,
        "editable": true,
        "details": {
          "cardinality": "MANY_TO_ONE",
          "description": "Each product has one supplier"
        }
      }
    ],
    "controls": {
      "zoom": true,
      "pan": true,
      "fit": true,
      "layout": ["hierarchical", "force-directed", "circular"]
    }
  },
  "list_view": [
    {
      "id": "rel_001",
      "from": "Products.supplier_id",
      "to": "Suppliers.supplier_id",
      "type": "Many-to-One",
      "confidence": 0.95,
      "status": "confirmed",
      "badges": [
        {
          "text": "High Confidence",
          "color": "green"
        }
      ],
      "actions": [
        {
          "label": "Edit",
          "action": "EDIT_RELATIONSHIP",
          "icon": "edit"
        },
        {
          "label": "Remove",
          "action": "REMOVE_RELATIONSHIP",
          "icon": "trash",
          "confirm": true
        }
      ]
    }
  ],
  "actions": [
    {
      "label": "Add Relationship",
      "action": "CREATE_RELATIONSHIP",
      "icon": "plus"
    }
  ]
}
```

**RULE_LIST**:
```json
{
  "id": "automation",
  "type": "RULE_LIST",
  "title": "Automation Rules",
  "description": "Business rules extracted from your formulas",
  "filters": [
    {
      "id": "type",
      "label": "Rule Type",
      "options": ["All", "Triggers", "Computed Fields", "Validations", "Aggregates"]
    },
    {
      "id": "confidence",
      "label": "Confidence",
      "options": ["All", "High (>80%)", "Medium (60-80%)", "Low (<60%)"]
    }
  ],
  "items": [
    {
      "rule_id": "rule_001",
      "name": "Low Stock Alert",
      "type": "TRIGGER",
      "description": "Send notification when product quantity falls below reorder level",
      "confidence": 0.85,
      "status": "pending_review",
      "enabled": false,
      "preview": {
        "trigger": "quantity_on_hand <= reorder_level",
        "action": "Send email to inventory@company.com"
      },
      "badges": [
        {
          "text": "From Formula",
          "color": "blue"
        },
        {
          "text": "85% Confident",
          "color": "green"
        }
      ],
      "actions": [
        {
          "label": "Enable",
          "action": "ENABLE_RULE",
          "target": "rule_001",
          "icon": "toggle-on"
        },
        {
          "label": "Edit",
          "action": "EDIT_RULE",
          "target": "rule_001",
          "icon": "edit"
        },
        {
          "label": "Disable",
          "action": "DISABLE_RULE",
          "target": "rule_001",
          "icon": "toggle-off"
        }
      ]
    }
  ]
}
```

**WARNING_LIST**:
```json
{
  "id": "warnings",
  "type": "WARNING_LIST",
  "title": "Warnings & Recommendations",
  "items": [
    {
      "severity": "HIGH",
      "message": "Entity 'Orders' has no primary key",
      "suggestion": "Add an auto-increment ID column or specify a composite key",
      "affected_entities": ["orders"],
      "action": {
        "label": "Fix Now",
        "action": "ADD_PRIMARY_KEY",
        "target": "orders"
      }
    },
    {
      "severity": "MEDIUM",
      "message": "Sheet 'Orders' contains multiple data regions. Only the primary region was analyzed.",
      "suggestion": "Consider splitting into separate sheets for better organization",
      "affected_entities": ["orders"],
      "action": {
        "label": "Review Sheet",
        "action": "NAVIGATE_TO_SHEET",
        "target": "Orders"
      }
    },
    {
      "severity": "LOW",
      "message": "Column 'Date' in 'Products' has mixed date formats",
      "suggestion": "Standardize date format before import for consistency",
      "affected_entities": ["products"],
      "action": null
    }
  ]
}
```

### 4.3 Complete Example

See `examples/confirmation_ui_example.json` for a complete working example with all sections.

## 5. Export Formats

### 5.1 SQL Migration

Generate SQL DDL from schema.json:

```sql
-- Generated from schema.json
-- Source: inventory_tracker.xlsx
-- Generated at: 2025-11-02T10:30:00Z

-- Table: products
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    product_name VARCHAR(255) NOT NULL,
    category ENUM('Electronics', 'Furniture', 'Supplies'),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    reorder_level INTEGER,
    supplier_id INTEGER,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_supplier FOREIGN KEY (supplier_id) 
        REFERENCES suppliers(supplier_id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

CREATE INDEX idx_category ON products(category);
CREATE INDEX idx_supplier ON products(supplier_id);

-- Table: suppliers
CREATE TABLE suppliers (
    supplier_id INTEGER PRIMARY KEY AUTO_INCREMENT,
    supplier_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) CHECK (contact_email REGEXP '^[^@]+@[^@]+\\.[^@]+$'),
    contact_phone VARCHAR(20)
);
```

### 5.2 Prisma Schema

Generate Prisma schema from schema.json:

```prisma
// Generated from schema.json
// Source: inventory_tracker.xlsx

model Product {
  id             Int       @id @default(autoincrement()) @map("product_id")
  name           String    @map("product_name") @db.VarChar(255)
  category       Category?
  unitPrice      Decimal   @map("unit_price") @db.Decimal(10, 2)
  quantityOnHand Int       @default(0) @map("quantity_on_hand")
  reorderLevel   Int?      @map("reorder_level")
  supplierId     Int?      @map("supplier_id")
  lastUpdated    DateTime  @default(now()) @map("last_updated")
  
  supplier       Supplier? @relation(fields: [supplierId], references: [id])
  
  @@index([category])
  @@index([supplierId])
  @@map("products")
}

model Supplier {
  id           Int       @id @default(autoincrement()) @map("supplier_id")
  name         String    @map("supplier_name") @db.VarChar(255)
  contactEmail String?   @map("contact_email") @db.VarChar(255)
  contactPhone String?   @map("contact_phone") @db.VarChar(20)
  
  products     Product[]
  
  @@map("suppliers")
}

enum Category {
  Electronics
  Furniture
  Supplies
}
```

## Summary

The output formats provide:

1. **schema.json**: Complete database schema with validation rules
2. **relationships.json**: Entity relationships with visual diagram specification
3. **automation_rules.json**: Business logic, triggers, and workflows
4. **confirmation_ui.json**: Interactive UI specification for human validation

These formats are:
- Machine-readable (JSON)
- Human-readable (descriptive fields)
- Implementation-agnostic (can target any platform)
- Extensible (metadata fields for custom needs)

All formats include confidence scores and metadata to support informed decision-making and iterative refinement.

