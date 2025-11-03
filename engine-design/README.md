# Spreadsheet Auto-Detection Engine - Technical Architecture

## Overview

This directory contains the complete technical architecture for building a spreadsheet auto-detection engine that transforms Excel and CSV files into structured system specifications. The engine analyzes spreadsheet structure, infers business entities and relationships, translates formulas into automation rules, and generates implementable system schemas.

**Target Use Case**: 80% of common business spreadsheets that follow recognizable patterns (tabular data with headers, cross-sheet references, standard formulas).

**Core Principle**: Pattern recognition over universal interpretation. The system identifies common spreadsheet structures rather than attempting to interpret arbitrary layouts.

## Documentation Structure

### Core Architecture

**[ARCHITECTURE.md](ARCHITECTURE.md)** - Main technical specification
- High-level system architecture
- Component interaction flow
- Technology stack rationale (Python + Pandas + openpyxl)
- Complete data pipeline (Ingestion → Analysis → Validation → Output)
- Implementation roadmap (8-week phased approach)
- Testing strategy and confidence scoring

### Component Specifications

**[PARSER_SPECS.md](PARSER_SPECS.md)** - Parser Layer
- File ingestion (Excel, CSV, multiple formats)
- Structure detection algorithms
- Header row detection heuristics
- Data region boundary detection
- Normalization into Pandas DataFrames
- Formula extraction with reference tracking

**[INFERENCE_ALGORITHMS.md](INFERENCE_ALGORITHMS.md)** - Inference Engine
- Column classification (15+ data types)
- Semantic type detection
- Entity extraction from DataFrames
- Primary key identification
- Foreign key discovery (name + value matching)
- Relationship cardinality detection
- Confidence scoring

**[FORMULA_TRANSLATION.md](FORMULA_TRANSLATION.md)** - Formula Translation
- Pattern library (SUM, SUMIF, IF, VLOOKUP, etc.)
- Formula parsing into AST
- Translation algorithms (formulas → automation rules)
- Cross-sheet reference resolution
- Business logic extraction

**[OUTPUT_FORMATS.md](OUTPUT_FORMATS.md)** - Output Generation
- `schema.json` - Database schema specification
- `relationships.json` - Entity relationship diagram
- `automation_rules.json` - Business logic and workflows
- `confirmation_ui.json` - Human validation interface
- Export formats (SQL, Prisma, workflow engines)

### Examples

**[examples/EXAMPLE_WALKTHROUGH.md](examples/EXAMPLE_WALKTHROUGH.md)** - Complete Example
- Real-world inventory management spreadsheet
- Step-by-step analysis through all pipeline stages
- Sample output for all four JSON files
- Confidence scores and detection quality

## Quick Start

### Understanding the Pipeline

1. **Input**: Upload Excel/CSV file
2. **Parse**: Detect structure, extract data regions
3. **Classify**: Identify column types and semantic meaning
4. **Infer**: Extract entities and relationships
5. **Translate**: Convert formulas to automation rules
6. **Validate**: Calculate confidence, generate warnings
7. **Output**: Generate JSON schemas and confirmation UI

### Key Capabilities

**Structure Detection**
- Finds headers regardless of row position
- Handles empty rows, summary rows, metadata
- Scores region quality (0.0 to 1.0 confidence)

**Type Classification**
- 15+ data types (ID, TEXT, DATE, CURRENCY, EMAIL, ENUM, etc.)
- Pattern matching (regex for email, phone, URL)
- Statistical inference (uniqueness, value distribution)

**Relationship Discovery**
- Name similarity matching (e.g., "supplier_id" → Suppliers table)
- Value overlap analysis (foreign key values exist in target)
- Type compatibility checking
- Multi-factor confidence scoring

**Formula Translation**
- IF statements → Triggers or Computed Fields
- SUMIF/COUNTIF → Aggregate queries
- VLOOKUP → Lookup/Join operations
- Arithmetic → Computed fields
- Cross-sheet refs → Relationship inference

### Confidence Scoring

**Overall Confidence** = Weighted average of:
- Structure confidence (30%): Data region quality
- Entity confidence (40%): Column classification accuracy
- Relationship confidence (30%): Foreign key detection quality

**Thresholds**:
- **High (>85%)**: Auto-approve for generation
- **Medium (60-85%)**: Require human review
- **Low (<60%)**: Flag for manual analysis

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- File loader (xlsx, xls, csv)
- Structure detection
- Column type classification

### Phase 2: Analysis (Weeks 3-4)
- Entity extraction
- Primary/foreign key detection
- Relationship inference

### Phase 3: Formula Translation (Week 5)
- Formula pattern recognition
- AST parsing
- Automation rule generation

### Phase 4: Output Generation (Week 6)
- JSON schema generator
- Relationship diagram
- Automation rules

### Phase 5: Validation (Week 7)
- Confidence scoring
- Edge case detection
- Test suite

### Phase 6: Integration (Week 8)
- Main engine orchestration
- CLI tool
- API interface

## Technology Stack

**Core**: Python 3.9+

**Dependencies**:
```python
pandas==2.1.0           # DataFrame manipulation
openpyxl==3.1.2         # Excel parsing
xlrd==2.0.1             # Legacy .xls support
numpy==1.24.3           # Numerical operations
networkx==3.1           # Relationship graphs
jsonschema==4.19.0      # Schema validation
scipy==1.11.1           # Statistical analysis
```

**Why Python over Node.js**:
- Superior data manipulation (Pandas)
- Better statistical libraries (SciPy, NumPy)
- Mature Excel parsing (openpyxl)
- Graph analysis (NetworkX)
- Faster prototyping

## Output Formats

### 1. Database Schema (schema.json)
- Entity definitions with columns
- Data types (SQL-compatible)
- Primary keys and foreign keys
- Indexes and constraints
- Validation rules

**Use Cases**:
- Generate database migrations (SQL, Prisma, TypeORM)
- Scaffold database tables
- Document data model

### 2. Relationships (relationships.json)
- Foreign key relationships
- Cardinality (1:1, 1:N, N:M)
- Visual diagram specification
- Confidence scores

**Use Cases**:
- Generate ER diagrams
- Configure ORM relationships
- Document system architecture

### 3. Automation Rules (automation_rules.json)
- Triggers (event-driven actions)
- Computed fields (calculated values)
- Validations (data integrity)
- Aggregates (summary calculations)
- Workflows (multi-step processes)

**Use Cases**:
- Configure workflow engines (n8n, Temporal)
- Generate business logic code
- Set up no-code automation platforms

### 4. Confirmation UI (confirmation_ui.json)
- Summary metrics
- Entity list with editing controls
- Relationship diagram (interactive)
- Rule list with enable/disable
- Warning list with suggestions

**Use Cases**:
- Human-in-the-loop validation
- Allow corrections before generation
- Build confidence in automation

## Key Algorithms

### Structure Detection
```
1. Find potential header rows (text-heavy, formatted, keywords)
2. Score each candidate (position, formatting, consistency below)
3. Detect data boundaries (stop at empty rows, summary keywords)
4. Extract rectangular data region
5. Score region quality
```

### Foreign Key Discovery
```
1. Name matching: "supplier_id" → Suppliers entity (50% weight)
2. Value overlap: Check if values exist in target (30% weight)
3. Type compatibility: Numeric matches numeric (20% weight)
4. Combined confidence: Threshold at 60%
5. Determine cardinality from uniqueness
```

### Formula Translation
```
1. Parse formula into AST (tokens → tree structure)
2. Recognize pattern (IF, SUMIF, VLOOKUP, etc.)
3. Extract arguments (conditions, ranges, values)
4. Map cell references to entity fields
5. Generate automation rule specification
```

## Edge Cases Handled

1. **Multiple data regions per sheet**: Detect and warn
2. **No headers**: Generate default column names
3. **Merged cells**: Handle header spanning columns
4. **Mixed data types**: Use majority type with warnings
5. **Circular formula references**: Detect and flag
6. **Ambiguous relationships**: Score and suggest alternatives
7. **Missing primary keys**: Suggest auto-increment ID
8. **Empty columns**: Remove or warn based on context

## Testing Strategy

### Unit Tests
- Parser (various Excel formats, edge cases)
- Classifier (type detection accuracy)
- Inference (relationship detection)
- Translator (formula patterns)

### Integration Tests
- End-to-end analysis on sample spreadsheets
- Accuracy metrics (precision, recall)
- Confidence calibration

### Sample Spreadsheets
1. Simple inventory (single sheet, clear structure)
2. CRM with relationships (multiple sheets)
3. Project tracker (complex formulas)
4. Manufacturing (edge cases, merged cells)

## Future Enhancements

1. **Machine Learning**: Train models on labeled spreadsheets
2. **VBA Translation**: Handle macro-enabled workbooks
3. **Multi-file Analysis**: Analyze related spreadsheets together
4. **Code Generation**: Generate full applications (API + UI)
5. **Real-time Collaboration**: Live analysis updates
6. **Intelligent Suggestions**: Data normalization recommendations

## Success Criteria

The engine successfully delivers on the "Auto-Detection → Live System Generated" promise when:

1. **Structure detection accuracy** >90% for common spreadsheets
2. **Relationship detection precision** >85% (few false positives)
3. **Relationship detection recall** >70% (finds most relationships)
4. **Formula translation success** >75% for common patterns
5. **Overall confidence correlation** with actual accuracy >0.8

## Integration Points

### For Web Interface
- Upload endpoint receives file
- Analysis runs asynchronously
- Returns confirmation UI JSON
- User reviews and approves
- Generates final schemas

### For CLI Tool
```bash
python -m engine analyze spreadsheet.xlsx --output ./results
```

### For Code Generators
- Read schema.json → Generate database migrations
- Read automation_rules.json → Generate workflow configs
- Read confirmation_ui.json → Build review interface

## License

This architecture is designed for the "Spreadsheet Exit Plan" product. All rights reserved.

## Contact

For questions about this architecture:
- Email: hello@spreadsheetexit.com
- Phone: (555) 123-4567

---

**Document Version**: 1.0  
**Last Updated**: November 2, 2025  
**Status**: Complete Technical Specification

