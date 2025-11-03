# Spreadsheet Auto-Detection Engine Architecture

## Executive Summary

This document specifies the technical architecture for a spreadsheet auto-detection engine that transforms Excel and CSV files into structured system specifications. The engine analyzes spreadsheet structure, infers business entities and relationships, translates formulas into automation rules, and generates implementable system schemas.

**Target Use Case**: 80% of common business spreadsheets that follow recognizable patterns (tabular data with headers, cross-sheet references, standard formulas).

**Core Principle**: Pattern recognition over universal interpretation. The system identifies common spreadsheet structures rather than attempting to interpret arbitrary layouts.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Input Layer                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Excel      │  │ CSV Files  │  │ Google     │                │
│  │ (.xlsx/.xls│  │            │  │ Sheets     │                │
│  └────────────┘  └────────────┘  └────────────┘                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Parser Layer                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  File Ingestion → Normalization → Structure Detection│      │
│  └──────────────────────────────────────────────────────┘      │
│  Output: Normalized DataFrames + Metadata                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Analysis Layer                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐     │
│  │ Column         │  │ Entity         │  │ Formula      │     │
│  │ Classifier     │  │ Inference      │  │ Translator   │     │
│  └────────────────┘  └────────────────┘  └──────────────┘     │
│  Output: Typed Columns, Entities, Relationships, Rules          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Validation Layer                               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  Confidence Scoring → Edge Case Detection → Ambiguity│      │
│  │  Flagging                                             │      │
│  └──────────────────────────────────────────────────────┘      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Output Generator                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐     │
│  │ JSON Schema    │  │ Relationship   │  │ Confirmation │     │
│  │ Generator      │  │ Diagram        │  │ UI Spec      │     │
│  └────────────────┘  └────────────────┘  └──────────────┘     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Output Files                               │
│  • schema.json (database schema)                                │
│  • relationships.json (entity relationship diagram)              │
│  • automation_rules.json (business logic)                        │
│  • confirmation_ui.json (human validation interface spec)        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Pipeline Flow

1. **Ingestion**: Load file → Parse sheets → Extract raw data
2. **Normalization**: Identify data regions → Separate headers from data → Clean empty rows/columns
3. **Classification**: Analyze column types → Detect patterns → Build column metadata
4. **Inference**: Group columns into entities → Find relationships → Calculate confidence
5. **Translation**: Parse formulas → Extract logic → Generate automation rules
6. **Validation**: Score confidence → Flag ambiguities → Generate warnings
7. **Generation**: Create JSON schemas → Build relationship maps → Prepare UI mockup

## Technology Stack

### Core Dependencies

**Python 3.9+**
- Mature data processing ecosystem
- Rich library support for Excel/CSV
- Strong regex and pattern matching
- Easy prototyping and iteration

**Primary Libraries:**

```python
pandas==2.1.0           # DataFrames, column analysis, type inference
openpyxl==3.1.2         # Excel file parsing, formula extraction
xlrd==2.0.1             # Legacy .xls support
python-magic==0.4.27    # File type detection
networkx==3.1           # Relationship graph analysis
jsonschema==4.19.0      # Schema validation and generation
numpy==1.24.3           # Numerical operations
scipy==1.11.1           # Statistical analysis for pattern detection
```

**Optional Libraries:**
```python
pyarrow==12.0.1         # High-performance data processing (if needed)
chardet==5.2.0          # CSV encoding detection
fuzzywuzzy==0.18.0      # Fuzzy string matching for entity names
```

### Why Python over Node.js

1. **Pandas**: Superior tabular data manipulation and analysis
2. **Type Inference**: Built-in statistical methods for column classification
3. **Formula Parsing**: Better regex and AST libraries
4. **Data Science Tools**: NetworkX for relationship graphs, SciPy for pattern detection
5. **Prototyping Speed**: Jupyter notebooks for algorithm development
6. **Excel Libraries**: openpyxl provides deep Excel introspection

Node.js would be preferable for real-time web integration, but Python excels at the heavy analytical lifting required for detection.

## Component Specifications

### 1. Parser Layer

**Responsibility**: Transform raw spreadsheet files into normalized, analyzable data structures.

#### 1.1 File Ingestion

**Input**: File path or binary stream
**Output**: Dictionary of sheet names → raw data

```python
class SpreadsheetLoader:
    """Load and parse spreadsheet files"""
    
    def load(self, file_path: str) -> Dict[str, RawSheetData]:
        """
        Load spreadsheet and extract all sheets
        
        Returns:
            {
                'Products': RawSheetData(cells, formulas, metadata),
                'Orders': RawSheetData(cells, formulas, metadata),
                ...
            }
        """
```

**Algorithm**:
1. Detect file type (xlsx, xls, csv)
2. Load with appropriate library (openpyxl, xlrd, pandas)
3. Extract all sheets
4. Preserve formulas separately from calculated values
5. Extract metadata (sheet names, cell formats, named ranges)

#### 1.2 Structure Detection

**Goal**: Find rectangular data regions with headers within each sheet.

**Algorithm**: Rectangular Region Detection

```
FUNCTION detect_data_regions(sheet_data):
    regions = []
    
    # Step 1: Find potential header rows
    header_candidates = find_header_rows(sheet_data)
    
    FOR EACH header_row IN header_candidates:
        # Step 2: Detect the data region below this header
        region = {
            'header_row': header_row,
            'header_range': (start_col, end_col),
            'data_start_row': header_row + 1,
            'data_end_row': find_last_populated_row(sheet_data, header_row),
            'columns': extract_column_names(sheet_data, header_row)
        }
        
        # Step 3: Calculate region quality score
        region['quality_score'] = score_region(region)
        
        regions.append(region)
    
    # Step 4: Return highest-quality region
    RETURN max(regions, key=lambda r: r['quality_score'])

FUNCTION find_header_rows(sheet_data):
    """
    Heuristics for header detection:
    1. First non-empty row
    2. Row where >50% cells are text and <50% are empty
    3. Row followed by consistent data types in columns below
    4. Row with bolded or styled cells (formatting hint)
    5. Row containing words like "ID", "Name", "Date", "Total"
    """
    candidates = []
    
    FOR row_idx IN range(len(sheet_data)):
        row = sheet_data[row_idx]
        
        # Check if row looks like a header
        text_cell_count = count_text_cells(row)
        total_cells = count_non_empty_cells(row)
        
        IF text_cell_count / total_cells > 0.5:
            IF has_header_keywords(row) OR is_formatted_as_header(row):
                candidates.append(row_idx)
    
    RETURN candidates

FUNCTION find_last_populated_row(sheet_data, start_row):
    """
    Find the last row that is part of the data table
    
    Stops when:
    - 3+ consecutive empty rows
    - Row with merged cells spanning multiple columns
    - Row with summary keywords ("Total", "Summary", "Grand Total")
    """
    empty_row_count = 0
    
    FOR row_idx FROM start_row + 1 TO len(sheet_data):
        row = sheet_data[row_idx]
        
        IF is_empty_row(row):
            empty_row_count += 1
            IF empty_row_count >= 3:
                RETURN row_idx - 3
        ELSE:
            empty_row_count = 0
            
        IF has_summary_keywords(row):
            RETURN row_idx - 1
    
    RETURN len(sheet_data) - 1
```

**Output**: For each sheet, extract:
```python
@dataclass
class DataRegion:
    sheet_name: str
    header_row: int
    data_start_row: int
    data_end_row: int
    column_names: List[str]
    quality_score: float  # 0.0 to 1.0
    warnings: List[str]   # Empty column names, duplicates, etc.
```

#### 1.3 Normalization

Convert detected regions into Pandas DataFrames:

```python
def normalize_region(region: DataRegion, sheet_data) -> pd.DataFrame:
    """
    Create clean DataFrame from detected region
    
    Steps:
    1. Extract header and data rows
    2. Handle duplicate column names (append _1, _2, etc.)
    3. Handle empty column names (use position: Column_A, Column_B)
    4. Remove completely empty columns
    5. Infer and set data types
    6. Preserve original row numbers for reference
    """
```

### 2. Column Classifier

**Responsibility**: Analyze each column to determine its data type and semantic meaning.

#### 2.1 Type Classification

**Types Detected**:
- `ID`: Unique identifier (integer or string)
- `TEXT`: General text content
- `DATE`: Date or datetime values
- `NUMBER`: Numeric values (integer or float)
- `CURRENCY`: Monetary values
- `PERCENTAGE`: Percentage values
- `BOOLEAN`: True/false, Yes/no, 1/0
- `EMAIL`: Email addresses
- `PHONE`: Phone numbers
- `URL`: Web URLs
- `ENUM`: Limited set of repeated values (categories)
- `FORMULA`: Calculated values

**Algorithm**: Column Type Detection

```
FUNCTION classify_column(column_data: List[Any]) -> ColumnType:
    # Step 1: Remove empty/null values for analysis
    non_null_values = [v for v in column_data if v is not None and v != '']
    
    IF len(non_null_values) == 0:
        RETURN ColumnType.EMPTY
    
    # Step 2: Check for special patterns first (high specificity)
    IF all_match_pattern(non_null_values, EMAIL_REGEX):
        RETURN ColumnType.EMAIL
    
    IF all_match_pattern(non_null_values, URL_REGEX):
        RETURN ColumnType.URL
    
    IF all_match_pattern(non_null_values, PHONE_REGEX):
        RETURN ColumnType.PHONE
    
    # Step 3: Check for ID columns
    IF is_unique(non_null_values) AND is_sequential(non_null_values):
        RETURN ColumnType.ID
    
    # Step 4: Check for numeric types
    numeric_ratio = count_numeric(non_null_values) / len(non_null_values)
    
    IF numeric_ratio > 0.9:  # 90% numeric threshold
        # Check for currency indicators
        IF has_currency_symbols(column_data) OR column_name_indicates_currency():
            RETURN ColumnType.CURRENCY
        
        # Check for percentages
        IF all_in_range(non_null_values, 0, 100) OR has_percentage_format():
            RETURN ColumnType.PERCENTAGE
        
        # Check if integers only
        IF all_are_integers(non_null_values):
            RETURN ColumnType.NUMBER_INT
        ELSE:
            RETURN ColumnType.NUMBER_FLOAT
    
    # Step 5: Check for dates
    date_ratio = count_date_like(non_null_values) / len(non_null_values)
    IF date_ratio > 0.8:
        RETURN ColumnType.DATE
    
    # Step 6: Check for booleans
    unique_values = set(non_null_values)
    IF unique_values <= {'True', 'False', 'true', 'false', '1', '0', 'Yes', 'No', 'Y', 'N'}:
        RETURN ColumnType.BOOLEAN
    
    # Step 7: Check for enums (categorical data)
    unique_count = len(unique_values)
    total_count = len(non_null_values)
    
    # If <10% unique values, it's likely a category
    IF unique_count < 10 AND unique_count / total_count < 0.1:
        RETURN ColumnType.ENUM(allowed_values=list(unique_values))
    
    # Step 8: Default to text
    RETURN ColumnType.TEXT
```

#### 2.2 Semantic Classification

Beyond data types, infer semantic meaning from column names:

```python
SEMANTIC_PATTERNS = {
    'ID': ['id', '_id', 'identifier', 'key', 'code'],
    'NAME': ['name', 'title', 'label', 'description'],
    'DATE_CREATED': ['created', 'created_at', 'date_created', 'created_date'],
    'DATE_MODIFIED': ['modified', 'updated', 'modified_at', 'updated_at'],
    'STATUS': ['status', 'state', 'stage'],
    'QUANTITY': ['quantity', 'qty', 'amount', 'count'],
    'PRICE': ['price', 'cost', 'rate', 'value'],
    'TOTAL': ['total', 'sum', 'subtotal'],
    'REFERENCE': ['ref', 'reference', 'related', 'parent', 'foreign'],
}

def infer_semantic_type(column_name: str) -> Optional[str]:
    """Match column name against semantic patterns"""
    column_lower = column_name.lower().strip()
    
    for semantic_type, patterns in SEMANTIC_PATTERNS.items():
        for pattern in patterns:
            if pattern in column_lower:
                return semantic_type
    
    return None
```

**Output**:
```python
@dataclass
class ColumnMetadata:
    name: str
    data_type: ColumnType
    semantic_type: Optional[str]
    is_unique: bool
    is_nullable: bool
    null_count: int
    sample_values: List[Any]
    statistics: Dict[str, Any]  # min, max, mean for numbers; length stats for text
    confidence: float  # 0.0 to 1.0
```

### 3. Entity Inference Engine

**Responsibility**: Group columns into logical entities (tables) and identify relationships.

#### 3.1 Entity Detection

**Approach**: Each rectangular data region (sheet or named range) is a candidate entity.

**Algorithm**: Entity Extraction

```
FUNCTION extract_entities(regions: List[DataRegion]) -> List[Entity]:
    entities = []
    
    FOR EACH region IN regions:
        entity = Entity(
            name=sanitize_name(region.sheet_name),
            table_name=to_snake_case(region.sheet_name),
            columns=[],
            primary_key=None,
            description=infer_description(region)
        )
        
        # Add all columns
        FOR EACH column IN region.columns:
            column_meta = classify_column(column)
            entity.columns.append(column_meta)
        
        # Identify primary key
        entity.primary_key = identify_primary_key(entity.columns)
        
        entities.append(entity)
    
    RETURN entities

FUNCTION identify_primary_key(columns: List[ColumnMetadata]) -> Optional[str]:
    """
    Identify which column should be the primary key
    
    Criteria (in order of priority):
    1. Column named 'id', 'ID', or ends with '_id'
    2. First column that is unique and non-null
    3. Column with semantic type ID that is unique
    4. Composite key suggestion if no single unique column
    """
    
    # Check for explicit ID column by name
    for col in columns:
        if col.name.lower() in ['id', 'pk', 'key']:
            if col.is_unique:
                return col.name
    
    # Check for columns ending in _id
    for col in columns:
        if col.name.lower().endswith('_id'):
            if col.is_unique:
                return col.name
    
    # Find first unique non-null column
    for col in columns:
        if col.is_unique and not col.is_nullable:
            return col.name
    
    # No suitable primary key found
    return None  # Suggest creating auto-increment ID
```

#### 3.2 Relationship Detection

**Goal**: Find foreign key relationships between entities.

**Algorithm**: Foreign Key Discovery

```
FUNCTION detect_relationships(entities: List[Entity]) -> List[Relationship]:
    relationships = []
    
    FOR EACH entity_a IN entities:
        FOR EACH entity_b IN entities WHERE entity_b != entity_a:
            # Check each column in entity_a against entity_b's primary key
            FOR EACH column IN entity_a.columns:
                relationship = check_foreign_key(
                    source_entity=entity_a,
                    source_column=column,
                    target_entity=entity_b
                )
                
                IF relationship:
                    relationships.append(relationship)
    
    RETURN relationships

FUNCTION check_foreign_key(
    source_entity: Entity,
    source_column: ColumnMetadata,
    target_entity: Entity
) -> Optional[Relationship]:
    """
    Determine if source_column references target_entity
    
    Indicators:
    1. Column name matches pattern: {target_entity_name}_id
    2. Column values are subset of target entity's primary key values
    3. Column data type matches target primary key data type
    4. Semantic reference pattern (e.g., 'product_id' -> 'Products' table)
    """
    
    # Step 1: Name pattern matching
    col_name_lower = source_column.name.lower()
    target_name_lower = target_entity.name.lower()
    
    name_matches = False
    if col_name_lower == f"{target_name_lower}_id":
        name_matches = True
    elif col_name_lower.startswith(target_name_lower):
        name_matches = True
    elif target_name_lower.rstrip('s') in col_name_lower:  # Handle plurals
        name_matches = True
    
    # Step 2: Value subset checking
    IF target_entity.primary_key IS None:
        RETURN None
    
    target_pk_column = get_column(target_entity, target_entity.primary_key)
    source_values = set(source_column.sample_values)
    target_values = set(target_pk_column.sample_values)
    
    # Check if at least 70% of source values exist in target
    overlap = len(source_values & target_values)
    overlap_ratio = overlap / len(source_values) if len(source_values) > 0 else 0
    
    value_matches = overlap_ratio >= 0.7
    
    # Step 3: Type compatibility
    type_matches = source_column.data_type == target_pk_column.data_type
    
    # Step 4: Calculate confidence
    confidence = 0.0
    if name_matches:
        confidence += 0.5
    if value_matches:
        confidence += 0.3
    if type_matches:
        confidence += 0.2
    
    IF confidence >= 0.6:  # Threshold for relationship detection
        # Determine cardinality
        cardinality = determine_cardinality(source_column, target_pk_column)
        
        RETURN Relationship(
            from_entity=source_entity.name,
            from_column=source_column.name,
            to_entity=target_entity.name,
            to_column=target_entity.primary_key,
            cardinality=cardinality,
            confidence=confidence,
            type='FOREIGN_KEY'
        )
    
    RETURN None

FUNCTION determine_cardinality(
    source_column: ColumnMetadata,
    target_column: ColumnMetadata
) -> str:
    """
    Determine relationship cardinality
    
    Returns: "ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_ONE", "MANY_TO_MANY"
    """
    
    source_is_unique = source_column.is_unique
    target_is_unique = target_column.is_unique
    
    IF source_is_unique AND target_is_unique:
        RETURN "ONE_TO_ONE"
    ELIF NOT source_is_unique AND target_is_unique:
        RETURN "MANY_TO_ONE"
    ELIF source_is_unique AND NOT target_is_unique:
        RETURN "ONE_TO_MANY"
    ELSE:
        RETURN "MANY_TO_MANY"
```

### 4. Formula Translation Layer

**Responsibility**: Parse Excel formulas and convert them into automation rules.

#### 4.1 Formula Extraction

```python
class FormulaExtractor:
    """Extract and parse formulas from spreadsheet"""
    
    def extract_formulas(self, workbook) -> List[FormulaDefinition]:
        """
        Extract all formulas from the workbook
        
        For each formula, capture:
        - Cell location (sheet, row, column)
        - Formula string
        - Referenced cells/ranges
        - Formula result (calculated value)
        """
```

#### 4.2 Formula Pattern Recognition

**Common Patterns**:

```python
FORMULA_PATTERNS = {
    'SUM': {
        'pattern': r'=SUM\((.*?)\)',
        'meaning': 'Calculate total of column/range',
        'automation': 'CREATE aggregate rule: SUM(field)',
    },
    'SUMIF': {
        'pattern': r'=SUMIF\((.*?),(.*?),(.*?)\)',
        'meaning': 'Conditional sum',
        'automation': 'CREATE filter + aggregate: SUM(field) WHERE condition',
    },
    'COUNTIF': {
        'pattern': r'=COUNTIF\((.*?),(.*?)\)',
        'meaning': 'Count rows matching condition',
        'automation': 'CREATE filter + count: COUNT(*) WHERE condition',
    },
    'IF': {
        'pattern': r'=IF\((.*?),(.*?),(.*?)\)',
        'meaning': 'Conditional logic',
        'automation': 'CREATE conditional rule: IF condition THEN value ELSE value',
    },
    'VLOOKUP': {
        'pattern': r'=VLOOKUP\((.*?),(.*?),(.*?),(.*?)\)',
        'meaning': 'Lookup value from another table',
        'automation': 'CREATE relationship query: JOIN table ON key',
    },
    'CONCATENATE': {
        'pattern': r'=CONCATENATE\((.*?)\)',
        'meaning': 'Combine text fields',
        'automation': 'CREATE computed field: CONCAT(field1, field2)',
    },
}
```

**Algorithm**: Formula Translation

```
FUNCTION translate_formula(formula_string: str, context: FormulaContext) -> AutomationRule:
    """
    Convert Excel formula into automation rule
    
    Steps:
    1. Parse formula into AST (Abstract Syntax Tree)
    2. Identify formula type (lookup pattern)
    3. Extract operands and conditions
    4. Map cell references to entity fields
    5. Generate automation rule specification
    """
    
    # Step 1: Parse formula
    parsed = parse_excel_formula(formula_string)
    
    # Step 2: Identify pattern
    formula_type = identify_formula_type(parsed)
    
    # Step 3: Extract components
    IF formula_type == 'SUMIF':
        range_ref = parsed.args[0]      # Range to sum
        condition = parsed.args[1]      # Condition to match
        sum_range = parsed.args[2]      # Values to sum
        
        # Map cell ranges to entity fields
        entity = resolve_entity_from_range(range_ref)
        field_to_sum = resolve_field_from_range(sum_range)
        condition_field = resolve_field_from_range(range_ref)
        
        # Generate automation rule
        RETURN AutomationRule(
            type='AGGREGATE',
            action='SUM',
            entity=entity.name,
            field=field_to_sum,
            filter={
                'field': condition_field,
                'operator': extract_operator(condition),
                'value': extract_value(condition)
            },
            description=f"Sum {field_to_sum} where {condition_field} {condition}"
        )
    
    ELIF formula_type == 'IF':
        condition = parsed.args[0]
        true_value = parsed.args[1]
        false_value = parsed.args[2]
        
        RETURN AutomationRule(
            type='CONDITIONAL',
            condition=translate_condition(condition),
            then_action=translate_value(true_value),
            else_action=translate_value(false_value),
            description=f"If {condition} then {true_value} else {false_value}"
        )
    
    ELIF formula_type == 'VLOOKUP':
        lookup_value = parsed.args[0]
        table_range = parsed.args[1]
        column_index = parsed.args[2]
        
        target_entity = resolve_entity_from_range(table_range)
        lookup_field = resolve_field_from_reference(lookup_value)
        return_field = resolve_field_from_index(target_entity, column_index)
        
        RETURN AutomationRule(
            type='LOOKUP',
            source_field=lookup_field,
            target_entity=target_entity.name,
            target_field=return_field,
            description=f"Lookup {return_field} from {target_entity.name}"
        )
    
    # For unrecognized formulas, capture as-is
    RETURN AutomationRule(
        type='FORMULA',
        formula=formula_string,
        description=f"Custom formula: {formula_string}"
    )
```

#### 4.3 Cross-Sheet Reference Resolution

```
FUNCTION resolve_cross_sheet_references(formulas: List[FormulaDefinition]) -> List[Relationship]:
    """
    Identify relationships implied by cross-sheet references
    
    Example: =Orders!B5 creates a reference from current sheet to Orders sheet
    """
    
    references = []
    
    FOR EACH formula IN formulas:
        # Extract sheet references (e.g., Sheet2!A1, Orders!B:B)
        sheet_refs = extract_sheet_references(formula.formula_string)
        
        FOR EACH ref IN sheet_refs:
            references.append(
                Relationship(
                    from_entity=formula.sheet_name,
                    from_column=formula.column_name,
                    to_entity=ref.sheet_name,
                    to_column=ref.column_reference,
                    type='FORMULA_REFERENCE',
                    confidence=0.9
                )
            )
    
    RETURN references
```

### 5. Validation Layer

**Responsibility**: Score detection confidence and flag potential issues.

#### 5.1 Confidence Scoring

```python
@dataclass
class ConfidenceScore:
    overall: float  # 0.0 to 1.0
    structure: float
    entities: float
    relationships: float
    formulas: float
    warnings: List[str]
    ambiguities: List[Ambiguity]
```

**Scoring Algorithm**:

```
FUNCTION calculate_confidence(analysis_result: AnalysisResult) -> ConfidenceScore:
    
    # Structure confidence
    structure_score = 0.0
    for region in analysis_result.regions:
        if region.quality_score > 0.8:
            structure_score += 1.0
        elif region.quality_score > 0.5:
            structure_score += 0.5
    structure_score /= len(analysis_result.regions)
    
    # Entity confidence
    entity_score = 0.0
    for entity in analysis_result.entities:
        entity_confidence = 1.0
        
        # Penalize missing primary key
        if entity.primary_key is None:
            entity_confidence -= 0.3
        
        # Penalize low column classification confidence
        avg_column_confidence = mean([col.confidence for col in entity.columns])
        entity_confidence *= avg_column_confidence
        
        entity_score += entity_confidence
    
    entity_score /= len(analysis_result.entities)
    
    # Relationship confidence
    relationship_score = mean([rel.confidence for rel in analysis_result.relationships])
    
    # Formula confidence
    formula_score = 1.0 if len(analysis_result.automation_rules) > 0 else 0.5
    
    # Overall confidence (weighted average)
    overall = (
        structure_score * 0.3 +
        entity_score * 0.3 +
        relationship_score * 0.25 +
        formula_score * 0.15
    )
    
    RETURN ConfidenceScore(
        overall=overall,
        structure=structure_score,
        entities=entity_score,
        relationships=relationship_score,
        formulas=formula_score,
        warnings=collect_warnings(analysis_result),
        ambiguities=detect_ambiguities(analysis_result)
    )
```

#### 5.2 Edge Case Detection

**Common Issues**:

1. **Multiple Data Regions**: Multiple tables in one sheet
2. **No Headers**: Data without clear column names
3. **Merged Cells**: Header spanning multiple columns
4. **Inconsistent Data Types**: Mixed types in same column
5. **Circular References**: Formula dependencies that loop
6. **Ambiguous Relationships**: Multiple possible foreign keys
7. **Missing Primary Keys**: No unique identifier column
8. **Duplicate Column Names**: Same header used multiple times

```python
def detect_edge_cases(analysis_result: AnalysisResult) -> List[Warning]:
    warnings = []
    
    # Check for multiple regions per sheet
    sheet_counts = count_regions_per_sheet(analysis_result.regions)
    for sheet, count in sheet_counts.items():
        if count > 1:
            warnings.append(Warning(
                severity='MEDIUM',
                message=f"Sheet '{sheet}' contains {count} data regions. Only the primary region was analyzed.",
                suggestion="Consider splitting into separate sheets."
            ))
    
    # Check for entities without primary keys
    for entity in analysis_result.entities:
        if entity.primary_key is None:
            warnings.append(Warning(
                severity='HIGH',
                message=f"Entity '{entity.name}' has no unique identifier column.",
                suggestion="Add an auto-increment ID column or specify a composite key."
            ))
    
    # Check for ambiguous relationships
    relationship_groups = group_relationships_by_source(analysis_result.relationships)
    for source, rels in relationship_groups.items():
        if len(rels) > 3:
            warnings.append(Warning(
                severity='LOW',
                message=f"Entity '{source}' has {len(rels)} relationships. Some may be incorrect.",
                suggestion="Review detected relationships in confirmation UI."
            ))
    
    return warnings
```

### 6. Output Generator

**Responsibility**: Generate structured output files for system implementation.

#### 6.1 JSON Schema Format

**schema.json** - Database schema specification

```json
{
  "version": "1.0",
  "metadata": {
    "source_file": "inventory_tracker.xlsx",
    "generated_at": "2025-11-02T10:30:00Z",
    "confidence": 0.87,
    "engine_version": "1.0.0"
  },
  "entities": [
    {
      "name": "Products",
      "table_name": "products",
      "description": "Product catalog",
      "primary_key": "product_id",
      "columns": [
        {
          "name": "product_id",
          "type": "INTEGER",
          "nullable": false,
          "unique": true,
          "auto_increment": true,
          "description": "Unique product identifier"
        },
        {
          "name": "product_name",
          "type": "VARCHAR(255)",
          "nullable": false,
          "unique": false,
          "description": "Product name"
        },
        {
          "name": "category",
          "type": "ENUM",
          "allowed_values": ["Electronics", "Furniture", "Supplies"],
          "nullable": true,
          "description": "Product category"
        },
        {
          "name": "unit_price",
          "type": "DECIMAL(10,2)",
          "nullable": false,
          "description": "Price per unit",
          "validation": {
            "min": 0,
            "max": 999999.99
          }
        },
        {
          "name": "quantity_on_hand",
          "type": "INTEGER",
          "nullable": false,
          "default": 0,
          "description": "Current inventory quantity"
        },
        {
          "name": "reorder_level",
          "type": "INTEGER",
          "nullable": true,
          "description": "Minimum quantity before reorder"
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
          }
        }
      ],
      "indexes": [
        {
          "name": "idx_category",
          "columns": ["category"],
          "type": "BTREE"
        }
      ]
    },
    {
      "name": "Suppliers",
      "table_name": "suppliers",
      "description": "Supplier information",
      "primary_key": "supplier_id",
      "columns": [
        {
          "name": "supplier_id",
          "type": "INTEGER",
          "nullable": false,
          "unique": true,
          "auto_increment": true
        },
        {
          "name": "supplier_name",
          "type": "VARCHAR(255)",
          "nullable": false
        },
        {
          "name": "contact_email",
          "type": "VARCHAR(255)",
          "nullable": true,
          "validation": {
            "pattern": "^[^@]+@[^@]+\\.[^@]+$"
          }
        },
        {
          "name": "contact_phone",
          "type": "VARCHAR(20)",
          "nullable": true
        }
      ]
    }
  ]
}
```

#### 6.2 Relationship Diagram Format

**relationships.json** - Entity-relationship mapping

```json
{
  "version": "1.0",
  "relationships": [
    {
      "id": "rel_001",
      "from_entity": "Products",
      "from_column": "supplier_id",
      "to_entity": "Suppliers",
      "to_column": "supplier_id",
      "type": "FOREIGN_KEY",
      "cardinality": "MANY_TO_ONE",
      "confidence": 0.95,
      "description": "Each product has one supplier; suppliers can have multiple products",
      "on_delete": "SET NULL",
      "on_update": "CASCADE"
    },
    {
      "id": "rel_002",
      "from_entity": "Orders",
      "from_column": "product_id",
      "to_entity": "Products",
      "to_column": "product_id",
      "type": "FOREIGN_KEY",
      "cardinality": "MANY_TO_ONE",
      "confidence": 0.92,
      "description": "Each order line references a product"
    }
  ],
  "diagram": {
    "layout": "hierarchical",
    "nodes": [
      {
        "entity": "Suppliers",
        "position": {"x": 100, "y": 100},
        "color": "#3B82F6"
      },
      {
        "entity": "Products",
        "position": {"x": 300, "y": 100},
        "color": "#10B981"
      },
      {
        "entity": "Orders",
        "position": {"x": 500, "y": 100},
        "color": "#F59E0B"
      }
    ],
    "edges": [
      {
        "from": "Products",
        "to": "Suppliers",
        "label": "supplier_id",
        "style": "dashed"
      },
      {
        "from": "Orders",
        "to": "Products",
        "label": "product_id",
        "style": "solid"
      }
    ]
  }
}
```

#### 6.3 Automation Rules Format

**automation_rules.json** - Business logic and workflow specifications

```json
{
  "version": "1.0",
  "rules": [
    {
      "id": "rule_001",
      "name": "Low Stock Alert",
      "type": "TRIGGER",
      "entity": "Products",
      "trigger": {
        "event": "UPDATE",
        "condition": "quantity_on_hand <= reorder_level"
      },
      "actions": [
        {
          "type": "NOTIFICATION",
          "channel": "email",
          "recipients": ["inventory@company.com"],
          "template": "Product {{product_name}} is below reorder level. Current: {{quantity_on_hand}}, Reorder at: {{reorder_level}}"
        },
        {
          "type": "CREATE_TASK",
          "task_type": "reorder",
          "assigned_to": "purchasing_team",
          "details": {
            "product_id": "{{product_id}}",
            "supplier_id": "{{supplier_id}}",
            "suggested_quantity": "{{reorder_level * 2}}"
          }
        }
      ],
      "confidence": 0.85,
      "source": {
        "type": "FORMULA",
        "location": "Products!G2",
        "formula": "=IF(E2<=F2, \"REORDER\", \"OK\")"
      }
    },
    {
      "id": "rule_002",
      "name": "Calculate Order Total",
      "type": "COMPUTED_FIELD",
      "entity": "Orders",
      "field": "order_total",
      "computation": {
        "formula": "SUM(quantity * unit_price)",
        "dependencies": ["quantity", "unit_price"],
        "update_on": ["INSERT", "UPDATE"]
      },
      "confidence": 0.95,
      "source": {
        "type": "FORMULA",
        "location": "Orders!E2",
        "formula": "=C2*D2"
      }
    },
    {
      "id": "rule_003",
      "name": "Validate Supplier Email",
      "type": "VALIDATION",
      "entity": "Suppliers",
      "field": "contact_email",
      "validation": {
        "type": "REGEX",
        "pattern": "^[^@]+@[^@]+\\.[^@]+$",
        "error_message": "Invalid email format"
      },
      "confidence": 1.0
    }
  ],
  "workflows": [
    {
      "id": "workflow_001",
      "name": "Purchase Order Workflow",
      "trigger": {
        "type": "MANUAL",
        "entity": "Products",
        "condition": "quantity_on_hand < reorder_level"
      },
      "steps": [
        {
          "id": "step_1",
          "name": "Create PO",
          "action": "CREATE_RECORD",
          "entity": "PurchaseOrders",
          "data": {
            "supplier_id": "{{product.supplier_id}}",
            "status": "DRAFT"
          }
        },
        {
          "id": "step_2",
          "name": "Send to Supplier",
          "action": "SEND_EMAIL",
          "depends_on": ["step_1"],
          "recipient": "{{supplier.contact_email}}",
          "template": "purchase_order"
        },
        {
          "id": "step_3",
          "name": "Update Status",
          "action": "UPDATE_RECORD",
          "depends_on": ["step_2"],
          "entity": "PurchaseOrders",
          "data": {
            "status": "SENT"
          }
        }
      ]
    }
  ]
}
```

#### 6.4 Confirmation UI Specification

**confirmation_ui.json** - Specification for human validation interface

```json
{
  "version": "1.0",
  "title": "Spreadsheet Analysis Results",
  "subtitle": "Review detected entities and relationships",
  "sections": [
    {
      "id": "summary",
      "type": "SUMMARY_CARD",
      "title": "Detection Summary",
      "metrics": [
        {
          "label": "Entities Detected",
          "value": 3,
          "icon": "table"
        },
        {
          "label": "Relationships Found",
          "value": 2,
          "icon": "link"
        },
        {
          "label": "Automation Rules",
          "value": 5,
          "icon": "zap"
        },
        {
          "label": "Overall Confidence",
          "value": "87%",
          "icon": "check-circle",
          "color": "green"
        }
      ]
    },
    {
      "id": "entities",
      "type": "ENTITY_LIST",
      "title": "Detected Entities",
      "description": "We identified these tables in your spreadsheet. Confirm or edit as needed.",
      "items": [
        {
          "entity_id": "products",
          "name": "Products",
          "source_sheet": "Products",
          "row_count": 247,
          "column_count": 7,
          "primary_key": "product_id",
          "confidence": 0.92,
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
              "current_value": "Products"
            },
            {
              "field": "table_name",
              "type": "text",
              "current_value": "products"
            },
            {
              "field": "primary_key",
              "type": "select",
              "options": ["product_id", "product_name", "None (create auto-increment ID)"],
              "current_value": "product_id"
            }
          ],
          "actions": [
            {
              "label": "Edit Columns",
              "action": "OPEN_COLUMN_EDITOR",
              "target": "products"
            },
            {
              "label": "Remove",
              "action": "REMOVE_ENTITY",
              "target": "products",
              "confirm": true
            }
          ]
        }
      ]
    },
    {
      "id": "relationships",
      "type": "RELATIONSHIP_DIAGRAM",
      "title": "Detected Relationships",
      "description": "These relationships were inferred from your data. Review the connections.",
      "diagram": {
        "type": "interactive_graph",
        "nodes": [
          {
            "id": "suppliers",
            "label": "Suppliers",
            "type": "entity",
            "color": "#3B82F6"
          },
          {
            "id": "products",
            "label": "Products",
            "type": "entity",
            "color": "#10B981"
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
        ]
      },
      "list_view": [
        {
          "id": "rel_001",
          "from": "Products.supplier_id",
          "to": "Suppliers.supplier_id",
          "type": "Many-to-One",
          "confidence": 0.95,
          "status": "confirmed",
          "actions": [
            {
              "label": "Edit",
              "action": "EDIT_RELATIONSHIP"
            },
            {
              "label": "Remove",
              "action": "REMOVE_RELATIONSHIP",
              "confirm": true
            }
          ]
        }
      ]
    },
    {
      "id": "automation",
      "type": "RULE_LIST",
      "title": "Automation Rules",
      "description": "These business rules were extracted from your formulas.",
      "items": [
        {
          "rule_id": "rule_001",
          "name": "Low Stock Alert",
          "type": "TRIGGER",
          "description": "Send notification when product quantity falls below reorder level",
          "confidence": 0.85,
          "status": "pending_review",
          "preview": {
            "trigger": "quantity_on_hand <= reorder_level",
            "action": "Send email to inventory@company.com"
          },
          "actions": [
            {
              "label": "Enable",
              "action": "ENABLE_RULE"
            },
            {
              "label": "Edit",
              "action": "EDIT_RULE"
            },
            {
              "label": "Disable",
              "action": "DISABLE_RULE"
            }
          ]
        }
      ]
    },
    {
      "id": "warnings",
      "type": "WARNING_LIST",
      "title": "Warnings & Recommendations",
      "items": [
        {
          "severity": "MEDIUM",
          "message": "Sheet 'Orders' contains multiple data regions. Only the primary region was analyzed.",
          "suggestion": "Consider splitting into separate sheets.",
          "action": {
            "label": "Review",
            "action": "NAVIGATE_TO_SHEET",
            "target": "Orders"
          }
        },
        {
          "severity": "LOW",
          "message": "Column 'Date' in 'Products' has mixed date formats.",
          "suggestion": "Standardize date format before import.",
          "action": null
        }
      ]
    }
  ],
  "actions": [
    {
      "id": "confirm",
      "label": "Confirm & Generate System",
      "type": "PRIMARY",
      "action": "CONFIRM_ANALYSIS",
      "requires": ["entities", "relationships"]
    },
    {
      "id": "export",
      "label": "Export Schemas",
      "type": "SECONDARY",
      "action": "EXPORT_SCHEMAS",
      "formats": ["JSON", "SQL", "Prisma"]
    },
    {
      "id": "cancel",
      "label": "Cancel",
      "type": "TERTIARY",
      "action": "CANCEL"
    }
  ]
}
```

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goals**: Core parsing and structure detection

**Deliverables**:
- File loader supporting .xlsx, .xls, .csv
- Structure detection algorithm
- Rectangular region extraction
- Basic column type classification

**Tech Stack**:
```python
# requirements.txt
pandas==2.1.0
openpyxl==3.1.2
xlrd==2.0.1
numpy==1.24.3
```

**File Structure**:
```
engine/
├── __init__.py
├── parsers/
│   ├── __init__.py
│   ├── excel_parser.py      # openpyxl-based Excel parsing
│   ├── csv_parser.py         # CSV parsing with encoding detection
│   └── structure_detector.py # Region detection algorithms
├── models/
│   ├── __init__.py
│   ├── data_region.py        # DataRegion class
│   ├── column_metadata.py    # ColumnMetadata class
│   └── entity.py              # Entity class
└── utils/
    ├── __init__.py
    └── type_inference.py      # Type detection utilities
```

**Key Algorithm**: `detect_data_regions()` (see Parser Layer section)

### Phase 2: Analysis (Weeks 3-4)

**Goals**: Entity inference and relationship detection

**Deliverables**:
- Column semantic classification
- Entity extraction
- Primary key identification
- Foreign key discovery
- Relationship cardinality detection

**Additional Dependencies**:
```python
networkx==3.1           # Relationship graph analysis
scipy==1.11.1           # Statistical pattern detection
fuzzywuzzy==0.18.0      # Fuzzy string matching
```

**File Structure**:
```
engine/
├── inference/
│   ├── __init__.py
│   ├── entity_detector.py    # Entity extraction
│   ├── key_detector.py       # Primary/foreign key detection
│   ├── relationship_finder.py # Relationship inference
│   └── semantic_classifier.py # Semantic type detection
└── models/
    ├── relationship.py        # Relationship class
    └── confidence.py          # ConfidenceScore class
```

**Key Algorithms**:
- `extract_entities()` (see Entity Inference section)
- `detect_relationships()` (see Relationship Detection section)
- `check_foreign_key()` (see Foreign Key Discovery section)

### Phase 3: Formula Translation (Week 5)

**Goals**: Parse and translate Excel formulas into automation rules

**Deliverables**:
- Formula extraction from Excel
- Pattern recognition for common formulas
- Formula AST parsing
- Automation rule generation

**Additional Dependencies**:
```python
parsimonious==0.10.0    # PEG parser for formula grammar (optional)
```

**File Structure**:
```
engine/
├── formulas/
│   ├── __init__.py
│   ├── extractor.py          # Extract formulas from workbook
│   ├── parser.py             # Parse formula strings
│   ├── translator.py         # Convert formulas to rules
│   └── patterns.py           # Formula pattern definitions
└── models/
    └── automation_rule.py    # AutomationRule class
```

**Key Algorithm**: `translate_formula()` (see Formula Translation section)

### Phase 4: Output Generation (Week 6)

**Goals**: Generate structured output files

**Deliverables**:
- JSON schema generator
- Relationship diagram generator
- Automation rules generator
- Confirmation UI spec generator

**Additional Dependencies**:
```python
jsonschema==4.19.0      # JSON schema validation
jinja2==3.1.2           # Template rendering (for SQL generation)
```

**File Structure**:
```
engine/
├── generators/
│   ├── __init__.py
│   ├── schema_generator.py   # Generate schema.json
│   ├── diagram_generator.py  # Generate relationships.json
│   ├── rules_generator.py    # Generate automation_rules.json
│   └── ui_generator.py       # Generate confirmation_ui.json
└── templates/
    ├── schema_template.json
    └── sql_migration.sql.j2
```

### Phase 5: Validation & Testing (Week 7)

**Goals**: Confidence scoring, edge case handling, comprehensive testing

**Deliverables**:
- Confidence scoring algorithm
- Edge case detection
- Warning generation
- Test suite with example spreadsheets

**File Structure**:
```
engine/
├── validation/
│   ├── __init__.py
│   ├── confidence_scorer.py  # Calculate confidence scores
│   ├── edge_case_detector.py # Detect problematic patterns
│   └── validator.py          # Overall validation logic
└── tests/
    ├── __init__.py
    ├── test_parser.py
    ├── test_inference.py
    ├── test_formulas.py
    ├── fixtures/
    │   ├── simple_inventory.xlsx
    │   ├── crm_with_relationships.xlsx
    │   ├── project_tracker.xlsx
    │   └── complex_manufacturing.xlsx
    └── expected_outputs/
        ├── simple_inventory_schema.json
        └── ...
```

### Phase 6: Integration & Orchestration (Week 8)

**Goals**: Main engine orchestration, CLI interface, documentation

**Deliverables**:
- Main engine class that orchestrates all components
- CLI tool for analysis
- API for programmatic access
- Complete documentation

**File Structure**:
```
engine/
├── __init__.py
├── engine.py                 # Main SpreadsheetAnalysisEngine class
├── cli.py                    # Command-line interface
└── api.py                    # API interface

# Root level
├── setup.py
├── requirements.txt
├── README.md
└── examples/
    ├── basic_usage.py
    ├── custom_patterns.py
    └── batch_processing.py
```

**Main Engine Interface**:

```python
# engine/engine.py
class SpreadsheetAnalysisEngine:
    """
    Main engine for spreadsheet analysis
    
    Usage:
        engine = SpreadsheetAnalysisEngine()
        result = engine.analyze('inventory.xlsx')
        result.export_json('output/')
    """
    
    def __init__(self, config: Optional[Dict] = None):
        self.parser = ParserLayer()
        self.classifier = ColumnClassifier()
        self.inference = InferenceEngine()
        self.formula_translator = FormulaTranslator()
        self.validator = Validator()
        self.generator = OutputGenerator()
    
    def analyze(self, file_path: str) -> AnalysisResult:
        """
        Analyze spreadsheet and generate system specification
        
        Steps:
        1. Parse file and detect structure
        2. Classify columns and infer entities
        3. Detect relationships
        4. Translate formulas
        5. Validate results and calculate confidence
        6. Generate output specifications
        """
        
        # Step 1: Parse
        regions = self.parser.parse(file_path)
        
        # Step 2: Classify & Infer
        entities = self.inference.extract_entities(regions)
        
        # Step 3: Detect Relationships
        relationships = self.inference.detect_relationships(entities)
        
        # Step 4: Translate Formulas
        formulas = self.parser.extract_formulas(file_path)
        automation_rules = self.formula_translator.translate_all(formulas, entities)
        
        # Step 5: Validate
        confidence = self.validator.calculate_confidence(entities, relationships, automation_rules)
        warnings = self.validator.detect_edge_cases(entities, relationships)
        
        # Step 6: Generate Outputs
        schema = self.generator.generate_schema(entities)
        diagram = self.generator.generate_diagram(entities, relationships)
        rules = self.generator.generate_rules(automation_rules)
        ui_spec = self.generator.generate_ui(entities, relationships, automation_rules, confidence)
        
        return AnalysisResult(
            entities=entities,
            relationships=relationships,
            automation_rules=automation_rules,
            schema=schema,
            diagram=diagram,
            rules=rules,
            ui_spec=ui_spec,
            confidence=confidence,
            warnings=warnings
        )
    
    def export(self, result: AnalysisResult, output_dir: str):
        """Export all generated files to directory"""
        result.export_json(output_dir)
```

**CLI Interface**:

```bash
# Analyze a spreadsheet
python -m engine.cli analyze inventory.xlsx --output ./output

# With custom configuration
python -m engine.cli analyze inventory.xlsx --config config.json --output ./output

# Batch processing
python -m engine.cli batch --input-dir ./spreadsheets --output-dir ./results

# Generate SQL migration
python -m engine.cli analyze inventory.xlsx --format sql --output migration.sql
```

## Testing Strategy

### Unit Tests

Test each component in isolation:

- **Parser Layer**: Test with various Excel formats, CSV encodings, edge cases
- **Column Classifier**: Test type detection accuracy with sample data
- **Entity Inference**: Test with known entity structures
- **Relationship Detection**: Test with explicit foreign key patterns
- **Formula Translator**: Test with known formula patterns

### Integration Tests

Test end-to-end analysis on sample spreadsheets:

1. **Simple Inventory**: Single sheet, clear structure
2. **CRM with Relationships**: Multiple sheets with foreign keys
3. **Project Tracker**: Complex formulas, nested IF statements
4. **Manufacturing**: Multiple data regions, cross-sheet references
5. **Edge Cases**: Missing headers, merged cells, circular references

### Accuracy Metrics

Measure detection accuracy:

```python
metrics = {
    'structure_detection_accuracy': 0.0,  # % of regions correctly identified
    'entity_detection_accuracy': 0.0,     # % of entities correctly identified
    'relationship_precision': 0.0,        # % of detected relationships that are correct
    'relationship_recall': 0.0,           # % of actual relationships detected
    'formula_translation_accuracy': 0.0,  # % of formulas correctly translated
}
```

### Confidence Threshold Tuning

Determine appropriate confidence thresholds through testing:

- **High Confidence (>0.85)**: Auto-approve for generation
- **Medium Confidence (0.60-0.85)**: Require human review
- **Low Confidence (<0.60)**: Flag for manual analysis

## Future Enhancements

### Beyond Minimum Viable Product

1. **Machine Learning Integration**
   - Train models on labeled spreadsheets for better pattern recognition
   - Learn from user corrections to improve detection
   - Use NLP for column name semantic understanding

2. **Advanced Formula Translation**
   - Handle VBA macros
   - Translate complex array formulas
   - Support user-defined functions

3. **Multi-File Analysis**
   - Analyze multiple related spreadsheets as one system
   - Detect relationships across files
   - Handle file references (external links)

4. **Real-Time Collaboration**
   - WebSocket-based live analysis updates
   - Collaborative review of detected entities
   - Multi-user confirmation UI

5. **Code Generation**
   - Generate complete database migrations (Prisma, TypeORM, Alembic)
   - Scaffold API endpoints (Express, FastAPI, Django)
   - Generate UI components (React, Vue, Angular)
   - Create workflow engine configs (n8n, Temporal, Camunda)

6. **Intelligent Suggestions**
   - Suggest data normalization improvements
   - Recommend indexes based on query patterns
   - Identify data quality issues
   - Suggest performance optimizations

## Conclusion

This architecture provides a realistic path to the "Auto-Detection → Live System Generated" promise on your landing page. By focusing on pattern recognition for the 80% of common cases and incorporating human validation for ambiguous situations, the system delivers practical value without overreaching.

The phased implementation approach allows for iterative development and validation, ensuring each component works correctly before building the next layer.

The key to success is setting appropriate confidence thresholds and designing the confirmation UI to make human validation quick and intuitive. Users should feel that the system did most of the work while still giving them control over the final output.

