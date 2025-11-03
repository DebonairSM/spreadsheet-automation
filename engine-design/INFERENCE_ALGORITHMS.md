# Entity Inference and Relationship Detection Algorithms

## Overview

The Inference Engine transforms normalized DataFrames into a structured entity-relationship model. This document provides complete algorithms with pseudocode and implementation details.

## Component Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Inference Engine                            │
│                                                                │
│  ┌──────────────┐   ┌───────────────┐   ┌─────────────────┐ │
│  │   Column     │──▶│    Entity     │──▶│  Relationship   │ │
│  │  Classifier  │   │   Detector    │   │    Finder       │ │
│  └──────────────┘   └───────────────┘   └─────────────────┘ │
│         │                   │                     │           │
│         ▼                   ▼                     ▼           │
│  ColumnMetadata        Entities            Relationships      │
└───────────────────────────────────────────────────────────────┘
```

## 1. Column Classification

### 1.1 Data Type Detection

**Input**: Pandas Series (column data)
**Output**: ColumnType enum + confidence score

**Data Types**:
```python
from enum import Enum
from typing import List, Optional, Any
from dataclasses import dataclass

class ColumnType(Enum):
    """Column data types"""
    ID = "id"
    TEXT = "text"
    DATE = "date"
    DATETIME = "datetime"
    NUMBER_INT = "integer"
    NUMBER_FLOAT = "float"
    CURRENCY = "currency"
    PERCENTAGE = "percentage"
    BOOLEAN = "boolean"
    EMAIL = "email"
    PHONE = "phone"
    URL = "url"
    ENUM = "enum"  # Categorical with limited values
    FORMULA = "formula"
    EMPTY = "empty"
    UNKNOWN = "unknown"

@dataclass
class ColumnMetadata:
    """Complete column metadata"""
    name: str
    data_type: ColumnType
    semantic_type: Optional[str]  # 'PRIMARY_KEY', 'FOREIGN_KEY', 'NAME', etc.
    is_unique: bool
    is_nullable: bool
    null_count: int
    null_percentage: float
    unique_count: int
    sample_values: List[Any]
    statistics: dict  # Type-specific stats
    confidence: float  # 0.0 to 1.0
    enum_values: Optional[List[Any]] = None  # For ENUM type
    pattern: Optional[str] = None  # Regex pattern for validation
```

### 1.2 Type Classification Algorithm

**Complete Implementation**:

```python
import pandas as pd
import numpy as np
import re
from typing import Tuple

class ColumnClassifier:
    """Classify column data types and semantic meanings"""
    
    # Regex patterns for special types
    EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    URL_PATTERN = r'^https?://[^\s<>"{}|\\^`\[\]]+$'
    PHONE_PATTERN = r'^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$'
    
    # Thresholds
    UNIQUE_THRESHOLD_ID = 0.95  # 95% unique = likely ID
    ENUM_THRESHOLD = 0.1  # <10% unique = likely enum
    TYPE_CONFIDENCE_THRESHOLD = 0.8  # 80% match for type detection
    
    def classify(self, series: pd.Series) -> ColumnMetadata:
        """
        Classify column type and extract metadata
        
        Args:
            series: Pandas Series (column data)
        
        Returns:
            ColumnMetadata with type, stats, and confidence
        """
        
        # Basic statistics
        total_count = len(series)
        null_count = series.isna().sum()
        non_null_values = series.dropna()
        non_null_count = len(non_null_values)
        
        if non_null_count == 0:
            return self._create_empty_column(series.name, total_count)
        
        # Uniqueness
        unique_values = non_null_values.unique()
        unique_count = len(unique_values)
        uniqueness_ratio = unique_count / non_null_count
        
        # Detect type
        column_type, confidence, stats = self._detect_type(
            non_null_values,
            unique_values,
            uniqueness_ratio
        )
        
        # Detect semantic type
        semantic_type = self._infer_semantic_type(
            series.name,
            column_type,
            unique_values,
            uniqueness_ratio
        )
        
        # Sample values (up to 10)
        sample_values = list(non_null_values.head(10))
        
        # Enum values if applicable
        enum_values = None
        if column_type == ColumnType.ENUM:
            enum_values = list(unique_values)
        
        return ColumnMetadata(
            name=series.name,
            data_type=column_type,
            semantic_type=semantic_type,
            is_unique=(uniqueness_ratio >= self.UNIQUE_THRESHOLD_ID),
            is_nullable=(null_count > 0),
            null_count=null_count,
            null_percentage=null_count / total_count,
            unique_count=unique_count,
            sample_values=sample_values,
            statistics=stats,
            confidence=confidence,
            enum_values=enum_values
        )
    
    def _detect_type(
        self,
        values: pd.Series,
        unique_values: np.ndarray,
        uniqueness_ratio: float
    ) -> Tuple[ColumnType, float, dict]:
        """
        Detect the most likely column type
        
        Returns: (ColumnType, confidence, statistics)
        """
        
        # Priority order: specific patterns first, then general types
        
        # 1. Check for special patterns (email, URL, phone)
        pattern_result = self._check_pattern_types(values)
        if pattern_result:
            return pattern_result
        
        # 2. Check for ID columns (high uniqueness)
        if uniqueness_ratio >= self.UNIQUE_THRESHOLD_ID:
            # Check if sequential numbers (classic ID pattern)
            if self._is_sequential_numeric(values):
                return (
                    ColumnType.ID,
                    0.95,
                    {'min': values.min(), 'max': values.max(), 'sequential': True}
                )
            # High uniqueness but not sequential = still likely ID
            elif self._is_numeric_like(values):
                return (
                    ColumnType.ID,
                    0.85,
                    {'min': values.min(), 'max': values.max(), 'sequential': False}
                )
        
        # 3. Check for boolean
        bool_result = self._check_boolean(unique_values)
        if bool_result:
            return bool_result
        
        # 4. Check for datetime/date
        date_result = self._check_date_types(values)
        if date_result:
            return date_result
        
        # 5. Check for numeric types (currency, percentage, numbers)
        numeric_result = self._check_numeric_types(values, unique_values)
        if numeric_result:
            return numeric_result
        
        # 6. Check for enum (categorical with few unique values)
        if uniqueness_ratio < self.ENUM_THRESHOLD and len(unique_values) < 20:
            return (
                ColumnType.ENUM,
                0.9,
                {
                    'unique_count': len(unique_values),
                    'values': list(unique_values),
                    'most_common': values.value_counts().head(5).to_dict()
                }
            )
        
        # 7. Default to text
        return (
            ColumnType.TEXT,
            0.7,
            {
                'avg_length': values.astype(str).str.len().mean(),
                'max_length': values.astype(str).str.len().max(),
                'most_common': values.value_counts().head(5).to_dict()
            }
        )
    
    def _check_pattern_types(self, values: pd.Series) -> Optional[Tuple[ColumnType, float, dict]]:
        """Check for email, URL, phone patterns"""
        
        values_str = values.astype(str)
        total = len(values)
        
        # Email
        email_matches = values_str.str.match(self.EMAIL_PATTERN).sum()
        if email_matches / total >= self.TYPE_CONFIDENCE_THRESHOLD:
            return (
                ColumnType.EMAIL,
                email_matches / total,
                {'pattern': 'email', 'match_ratio': email_matches / total}
            )
        
        # URL
        url_matches = values_str.str.match(self.URL_PATTERN).sum()
        if url_matches / total >= self.TYPE_CONFIDENCE_THRESHOLD:
            return (
                ColumnType.URL,
                url_matches / total,
                {'pattern': 'url', 'match_ratio': url_matches / total}
            )
        
        # Phone
        phone_matches = values_str.str.match(self.PHONE_PATTERN).sum()
        if phone_matches / total >= self.TYPE_CONFIDENCE_THRESHOLD:
            return (
                ColumnType.PHONE,
                phone_matches / total,
                {'pattern': 'phone', 'match_ratio': phone_matches / total}
            )
        
        return None
    
    def _check_boolean(self, unique_values: np.ndarray) -> Optional[Tuple[ColumnType, float, dict]]:
        """Check if values are boolean"""
        
        unique_set = set(str(v).lower() for v in unique_values)
        
        boolean_sets = [
            {'true', 'false'},
            {'yes', 'no'},
            {'y', 'n'},
            {'1', '0'},
            {'t', 'f'},
            {1, 0},
            {True, False}
        ]
        
        for bool_set in boolean_sets:
            if unique_set <= bool_set or set(unique_values) <= bool_set:
                return (
                    ColumnType.BOOLEAN,
                    1.0,
                    {'values': list(unique_values)}
                )
        
        return None
    
    def _check_date_types(self, values: pd.Series) -> Optional[Tuple[ColumnType, float, dict]]:
        """Check for date/datetime types"""
        
        # If already datetime type
        if pd.api.types.is_datetime64_any_dtype(values):
            has_time = values.dt.hour.any() or values.dt.minute.any()
            
            return (
                ColumnType.DATETIME if has_time else ColumnType.DATE,
                1.0,
                {
                    'min': values.min(),
                    'max': values.max(),
                    'has_time_component': has_time
                }
            )
        
        # Try to parse as datetime
        try:
            parsed = pd.to_datetime(values, errors='coerce')
            parsed_count = parsed.notna().sum()
            parse_ratio = parsed_count / len(values)
            
            if parse_ratio >= self.TYPE_CONFIDENCE_THRESHOLD:
                has_time = parsed.dt.hour.any() or parsed.dt.minute.any()
                
                return (
                    ColumnType.DATETIME if has_time else ColumnType.DATE,
                    parse_ratio,
                    {
                        'min': parsed.min(),
                        'max': parsed.max(),
                        'has_time_component': has_time,
                        'parse_ratio': parse_ratio
                    }
                )
        except:
            pass
        
        return None
    
    def _check_numeric_types(
        self,
        values: pd.Series,
        unique_values: np.ndarray
    ) -> Optional[Tuple[ColumnType, float, dict]]:
        """Check for numeric types (currency, percentage, int, float)"""
        
        # If already numeric dtype
        if pd.api.types.is_numeric_dtype(values):
            # Check for currency indicators
            if self._has_currency_indicators(values.name):
                return (
                    ColumnType.CURRENCY,
                    0.95,
                    {
                        'min': values.min(),
                        'max': values.max(),
                        'mean': values.mean(),
                        'median': values.median()
                    }
                )
            
            # Check for percentage (values between 0-1 or 0-100)
            if values.min() >= 0 and values.max() <= 1:
                return (
                    ColumnType.PERCENTAGE,
                    0.9,
                    {
                        'min': values.min(),
                        'max': values.max(),
                        'mean': values.mean(),
                        'range': '0-1'
                    }
                )
            elif values.min() >= 0 and values.max() <= 100 and self._has_percentage_indicators(values.name):
                return (
                    ColumnType.PERCENTAGE,
                    0.85,
                    {
                        'min': values.min(),
                        'max': values.max(),
                        'mean': values.mean(),
                        'range': '0-100'
                    }
                )
            
            # Check if integers
            if (values == values.astype(int)).all():
                return (
                    ColumnType.NUMBER_INT,
                    0.95,
                    {
                        'min': int(values.min()),
                        'max': int(values.max()),
                        'mean': values.mean(),
                        'median': values.median()
                    }
                )
            
            # Float numbers
            return (
                ColumnType.NUMBER_FLOAT,
                0.95,
                {
                    'min': values.min(),
                    'max': values.max(),
                    'mean': values.mean(),
                    'median': values.median(),
                    'std': values.std()
                }
            )
        
        # Try to convert to numeric
        try:
            # Remove currency symbols if present
            values_clean = values.astype(str).str.replace(r'[$€£¥,]', '', regex=True)
            numeric = pd.to_numeric(values_clean, errors='coerce')
            numeric_count = numeric.notna().sum()
            numeric_ratio = numeric_count / len(values)
            
            if numeric_ratio >= self.TYPE_CONFIDENCE_THRESHOLD:
                # Detected numeric with currency symbols
                if values.astype(str).str.contains(r'[$€£¥]', regex=True).any():
                    return (
                        ColumnType.CURRENCY,
                        numeric_ratio,
                        {
                            'min': numeric.min(),
                            'max': numeric.max(),
                            'mean': numeric.mean(),
                            'median': numeric.median()
                        }
                    )
                
                # Regular number
                is_int = (numeric == numeric.astype(int)).all()
                return (
                    ColumnType.NUMBER_INT if is_int else ColumnType.NUMBER_FLOAT,
                    numeric_ratio,
                    {
                        'min': numeric.min(),
                        'max': numeric.max(),
                        'mean': numeric.mean()
                    }
                )
        except:
            pass
        
        return None
    
    def _is_sequential_numeric(self, values: pd.Series) -> bool:
        """Check if numeric values are sequential (1, 2, 3, ...)"""
        
        if not pd.api.types.is_numeric_dtype(values):
            return False
        
        sorted_values = values.sort_values()
        diffs = sorted_values.diff().dropna()
        
        # Check if all differences are 1 (or very close for floating point)
        return (diffs.abs() - 1).abs().mean() < 0.01
    
    def _is_numeric_like(self, values: pd.Series) -> bool:
        """Check if values can be interpreted as numeric"""
        return pd.api.types.is_numeric_dtype(values)
    
    def _has_currency_indicators(self, column_name: str) -> bool:
        """Check if column name suggests currency"""
        name_lower = column_name.lower()
        keywords = ['price', 'cost', 'amount', 'salary', 'revenue', 'total', 'subtotal', 'payment', 'fee', 'charge']
        return any(kw in name_lower for kw in keywords)
    
    def _has_percentage_indicators(self, column_name: str) -> bool:
        """Check if column name suggests percentage"""
        name_lower = column_name.lower()
        keywords = ['percent', 'percentage', 'rate', 'ratio', '%']
        return any(kw in name_lower for kw in keywords)
    
    def _infer_semantic_type(
        self,
        column_name: str,
        data_type: ColumnType,
        unique_values: np.ndarray,
        uniqueness_ratio: float
    ) -> Optional[str]:
        """Infer semantic meaning from column name and type"""
        
        name_lower = column_name.lower().strip()
        
        # Primary key indicators
        if data_type == ColumnType.ID or uniqueness_ratio >= 0.95:
            if name_lower in ['id', 'pk', 'key']:
                return 'PRIMARY_KEY'
            if name_lower.endswith('_id') and not any(ref in name_lower for ref in ['product', 'customer', 'order', 'supplier', 'user']):
                return 'PRIMARY_KEY'
        
        # Foreign key indicators
        if name_lower.endswith('_id'):
            # Extract entity name (e.g., "customer_id" -> "customer")
            entity_name = name_lower.replace('_id', '')
            return f'FOREIGN_KEY:{entity_name}'
        
        # Common semantic types
        semantic_patterns = {
            'NAME': ['name', 'title', 'label'],
            'DESCRIPTION': ['description', 'desc', 'notes', 'comments', 'details'],
            'STATUS': ['status', 'state', 'stage'],
            'QUANTITY': ['quantity', 'qty', 'count', 'number'],
            'PRICE': ['price', 'cost', 'rate'],
            'DATE_CREATED': ['created', 'created_at', 'date_created', 'created_date'],
            'DATE_MODIFIED': ['modified', 'updated', 'modified_at', 'updated_at', 'last_updated'],
            'EMAIL': ['email', 'email_address', 'e-mail'],
            'PHONE': ['phone', 'telephone', 'mobile', 'contact_number'],
            'ADDRESS': ['address', 'location', 'street'],
        }
        
        for semantic_type, patterns in semantic_patterns.items():
            if any(pattern in name_lower for pattern in patterns):
                return semantic_type
        
        return None
    
    def _create_empty_column(self, name: str, total_count: int) -> ColumnMetadata:
        """Create metadata for completely empty column"""
        return ColumnMetadata(
            name=name,
            data_type=ColumnType.EMPTY,
            semantic_type=None,
            is_unique=False,
            is_nullable=True,
            null_count=total_count,
            null_percentage=1.0,
            unique_count=0,
            sample_values=[],
            statistics={},
            confidence=1.0
        )
```

## 2. Entity Detection

### 2.1 Entity Extraction

**Goal**: Group columns into logical entities (database tables).

**Approach**: Each normalized DataFrame (from a data region) becomes a candidate entity.

```python
@dataclass
class Entity:
    """Represents a business entity (database table)"""
    id: str  # Unique identifier for this entity
    name: str  # Display name (e.g., "Products")
    table_name: str  # Database table name (e.g., "products")
    source_sheet: str
    columns: List[ColumnMetadata]
    primary_key: Optional[str]
    description: str
    row_count: int
    confidence: float

class EntityDetector:
    """Detect and extract entities from normalized DataFrames"""
    
    def extract_entities(
        self,
        dataframes: Dict[str, pd.DataFrame]
    ) -> List[Entity]:
        """
        Extract entities from normalized DataFrames
        
        Args:
            dataframes: Dict mapping sheet names to DataFrames
        
        Returns:
            List of detected entities
        """
        
        entities = []
        classifier = ColumnClassifier()
        
        for sheet_name, df in dataframes.items():
            # Classify all columns
            columns = []
            for col_name in df.columns:
                if col_name == '_row_number':  # Skip metadata columns
                    continue
                
                col_metadata = classifier.classify(df[col_name])
                columns.append(col_metadata)
            
            # Identify primary key
            primary_key = self._identify_primary_key(columns)
            
            # Generate entity name (singular form of sheet name)
            entity_name = self._singularize(sheet_name)
            table_name = self._to_snake_case(entity_name)
            
            # Generate description
            description = self._infer_description(sheet_name, columns)
            
            # Calculate confidence
            confidence = self._calculate_entity_confidence(columns, primary_key)
            
            entity = Entity(
                id=table_name,
                name=entity_name,
                table_name=table_name,
                source_sheet=sheet_name,
                columns=columns,
                primary_key=primary_key,
                description=description,
                row_count=len(df),
                confidence=confidence
            )
            
            entities.append(entity)
        
        return entities
    
    def _identify_primary_key(self, columns: List[ColumnMetadata]) -> Optional[str]:
        """
        Identify which column should be the primary key
        
        Priority:
        1. Column with semantic type 'PRIMARY_KEY'
        2. Column named 'id' that is unique
        3. First column with type ID that is unique
        4. Any unique non-nullable column
        5. None (will suggest creating auto-increment ID)
        """
        
        # Priority 1: Explicit PRIMARY_KEY semantic type
        for col in columns:
            if col.semantic_type == 'PRIMARY_KEY' and col.is_unique:
                return col.name
        
        # Priority 2: Column named 'id'
        for col in columns:
            if col.name.lower() in ['id', 'pk', 'key'] and col.is_unique:
                return col.name
        
        # Priority 3: ID type that's unique
        for col in columns:
            if col.data_type == ColumnType.ID and col.is_unique:
                return col.name
        
        # Priority 4: Any unique non-nullable column
        for col in columns:
            if col.is_unique and not col.is_nullable:
                return col.name
        
        # Priority 5: No suitable PK found
        return None
    
    def _singularize(self, name: str) -> str:
        """Convert plural sheet name to singular entity name"""
        
        name = name.strip()
        
        # Simple singularization rules
        if name.lower().endswith('ies'):
            return name[:-3] + 'y'
        elif name.lower().endswith('sses'):
            return name[:-2]
        elif name.lower().endswith('s') and len(name) > 1:
            return name[:-1]
        
        return name
    
    def _to_snake_case(self, name: str) -> str:
        """Convert name to snake_case for table name"""
        
        # Replace spaces and special characters with underscores
        name = re.sub(r'[^\w\s]', '', name)
        name = re.sub(r'\s+', '_', name)
        
        # Insert underscore before capital letters
        name = re.sub(r'([a-z])([A-Z])', r'\1_\2', name)
        
        return name.lower()
    
    def _infer_description(self, sheet_name: str, columns: List[ColumnMetadata]) -> str:
        """Generate entity description"""
        
        col_count = len(columns)
        col_names = ', '.join([c.name for c in columns[:3]])
        
        if col_count > 3:
            col_names += f', and {col_count - 3} more'
        
        return f"Entity from sheet '{sheet_name}' with {col_count} columns: {col_names}"
    
    def _calculate_entity_confidence(
        self,
        columns: List[ColumnMetadata],
        primary_key: Optional[str]
    ) -> float:
        """Calculate confidence score for entity detection"""
        
        if not columns:
            return 0.0
        
        # Start with base confidence
        confidence = 1.0
        
        # Penalize missing primary key
        if primary_key is None:
            confidence -= 0.3
        
        # Average column classification confidence
        avg_col_confidence = sum(c.confidence for c in columns) / len(columns)
        confidence *= avg_col_confidence
        
        # Penalize low row count
        # (This would require passing row_count, or we skip this check)
        
        # Penalize high percentage of empty columns
        empty_cols = sum(1 for c in columns if c.data_type == ColumnType.EMPTY)
        if empty_cols > 0:
            confidence -= 0.1 * (empty_cols / len(columns))
        
        return max(0.0, min(1.0, confidence))
```

## 3. Relationship Detection

### 3.1 Foreign Key Discovery

**Goal**: Find foreign key relationships between entities.

**Algorithm**:

```python
@dataclass
class Relationship:
    """Represents a relationship between two entities"""
    id: str
    from_entity: str  # Entity ID
    from_column: str
    to_entity: str  # Entity ID
    to_column: str
    type: str  # 'FOREIGN_KEY', 'FORMULA_REFERENCE', 'IMPLICIT'
    cardinality: str  # 'ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'
    confidence: float
    description: str
    metadata: dict  # Additional info (overlap_ratio, etc.)

class RelationshipFinder:
    """Find relationships between entities"""
    
    NAME_MATCH_THRESHOLD = 0.6
    VALUE_OVERLAP_THRESHOLD = 0.7
    OVERALL_CONFIDENCE_THRESHOLD = 0.6
    
    def detect_relationships(
        self,
        entities: List[Entity],
        dataframes: Dict[str, pd.DataFrame]
    ) -> List[Relationship]:
        """
        Detect all relationships between entities
        
        Args:
            entities: List of detected entities
            dataframes: Original DataFrames for value checking
        
        Returns:
            List of detected relationships
        """
        
        relationships = []
        
        # Check each pair of entities
        for source_entity in entities:
            for target_entity in entities:
                if source_entity.id == target_entity.id:
                    continue
                
                # Check each column in source against target's PK
                for source_col in source_entity.columns:
                    rel = self._check_foreign_key(
                        source_entity,
                        source_col,
                        target_entity,
                        dataframes
                    )
                    
                    if rel and rel.confidence >= self.OVERALL_CONFIDENCE_THRESHOLD:
                        relationships.append(rel)
        
        # Remove duplicate relationships
        relationships = self._deduplicate_relationships(relationships)
        
        return relationships
    
    def _check_foreign_key(
        self,
        source_entity: Entity,
        source_column: ColumnMetadata,
        target_entity: Entity,
        dataframes: Dict[str, pd.DataFrame]
    ) -> Optional[Relationship]:
        """
        Check if source_column is a foreign key to target_entity
        
        Scoring factors:
        1. Name similarity (50%)
        2. Value overlap (30%)
        3. Type compatibility (20%)
        """
        
        # Skip if source column is the primary key
        if source_column.name == source_entity.primary_key:
            return None
        
        # Skip if target has no primary key
        if target_entity.primary_key is None:
            return None
        
        # Get target PK column
        target_pk_col = next(
            (c for c in target_entity.columns if c.name == target_entity.primary_key),
            None
        )
        
        if target_pk_col is None:
            return None
        
        # Factor 1: Name matching
        name_score = self._calculate_name_similarity(
            source_column.name,
            target_entity.name,
            target_entity.table_name
        )
        
        # Factor 2: Value overlap
        value_score = self._calculate_value_overlap(
            source_entity.source_sheet,
            source_column.name,
            target_entity.source_sheet,
            target_pk_col.name,
            dataframes
        )
        
        # Factor 3: Type compatibility
        type_score = self._calculate_type_compatibility(
            source_column.data_type,
            target_pk_col.data_type
        )
        
        # Weighted confidence
        confidence = (
            name_score * 0.5 +
            value_score * 0.3 +
            type_score * 0.2
        )
        
        if confidence < self.OVERALL_CONFIDENCE_THRESHOLD:
            return None
        
        # Determine cardinality
        cardinality = self._determine_cardinality(
            source_column,
            target_pk_col
        )
        
        # Generate relationship ID
        rel_id = f"rel_{source_entity.id}_{source_column.name}_to_{target_entity.id}"
        
        # Generate description
        description = self._generate_relationship_description(
            source_entity.name,
            source_column.name,
            target_entity.name,
            cardinality
        )
        
        return Relationship(
            id=rel_id,
            from_entity=source_entity.id,
            from_column=source_column.name,
            to_entity=target_entity.id,
            to_column=target_pk_col.name,
            type='FOREIGN_KEY',
            cardinality=cardinality,
            confidence=confidence,
            description=description,
            metadata={
                'name_score': name_score,
                'value_score': value_score,
                'type_score': type_score
            }
        )
    
    def _calculate_name_similarity(
        self,
        column_name: str,
        entity_name: str,
        table_name: str
    ) -> float:
        """
        Calculate name similarity score
        
        Perfect matches:
        - customer_id → Customer entity
        - product_id → Product entity
        
        Partial matches:
        - customer_ref → Customer entity
        - prod_id → Product entity
        """
        
        col_lower = column_name.lower()
        entity_lower = entity_name.lower()
        table_lower = table_name.lower()
        
        # Exact pattern: {entity}_id
        if col_lower == f"{table_lower}_id":
            return 1.0
        if col_lower == f"{entity_lower}_id":
            return 1.0
        
        # Starts with entity name
        if col_lower.startswith(table_lower):
            return 0.9
        if col_lower.startswith(entity_lower):
            return 0.9
        
        # Contains entity name
        if table_lower in col_lower:
            return 0.7
        if entity_lower in col_lower:
            return 0.7
        
        # Handle plurals (customers -> customer)
        entity_singular = entity_lower.rstrip('s')
        if col_lower == f"{entity_singular}_id":
            return 0.95
        if entity_singular in col_lower:
            return 0.65
        
        return 0.0
    
    def _calculate_value_overlap(
        self,
        source_sheet: str,
        source_column: str,
        target_sheet: str,
        target_column: str,
        dataframes: Dict[str, pd.DataFrame]
    ) -> float:
        """
        Calculate value overlap ratio
        
        Returns: % of source values that exist in target values
        """
        
        if source_sheet not in dataframes or target_sheet not in dataframes:
            return 0.0
        
        source_df = dataframes[source_sheet]
        target_df = dataframes[target_sheet]
        
        if source_column not in source_df.columns or target_column not in target_df.columns:
            return 0.0
        
        # Get unique non-null values
        source_values = set(source_df[source_column].dropna().unique())
        target_values = set(target_df[target_column].dropna().unique())
        
        if len(source_values) == 0:
            return 0.0
        
        # Calculate overlap
        overlap = source_values & target_values
        overlap_ratio = len(overlap) / len(source_values)
        
        return overlap_ratio
    
    def _calculate_type_compatibility(
        self,
        source_type: ColumnType,
        target_type: ColumnType
    ) -> float:
        """Check if data types are compatible for foreign key"""
        
        # Exact match
        if source_type == target_type:
            return 1.0
        
        # Compatible numeric types
        numeric_types = {ColumnType.ID, ColumnType.NUMBER_INT, ColumnType.NUMBER_FLOAT}
        if source_type in numeric_types and target_type in numeric_types:
            return 0.9
        
        # Text types (can reference anything as string)
        if source_type == ColumnType.TEXT:
            return 0.7
        
        # Otherwise incompatible
        return 0.0
    
    def _determine_cardinality(
        self,
        source_column: ColumnMetadata,
        target_column: ColumnMetadata
    ) -> str:
        """
        Determine relationship cardinality
        
        Logic:
        - If source is unique and target is unique: ONE_TO_ONE
        - If source is not unique and target is unique: MANY_TO_ONE
        - If source is unique and target is not unique: ONE_TO_MANY
        - If both are not unique: MANY_TO_MANY
        """
        
        source_unique = source_column.is_unique
        target_unique = target_column.is_unique
        
        if source_unique and target_unique:
            return "ONE_TO_ONE"
        elif not source_unique and target_unique:
            return "MANY_TO_ONE"
        elif source_unique and not target_unique:
            return "ONE_TO_MANY"
        else:
            return "MANY_TO_MANY"
    
    def _generate_relationship_description(
        self,
        source_entity: str,
        source_column: str,
        target_entity: str,
        cardinality: str
    ) -> str:
        """Generate human-readable relationship description"""
        
        if cardinality == "MANY_TO_ONE":
            return f"Each {source_entity} belongs to one {target_entity}"
        elif cardinality == "ONE_TO_MANY":
            return f"Each {source_entity} has many {target_entity} records"
        elif cardinality == "ONE_TO_ONE":
            return f"Each {source_entity} is linked to one {target_entity}"
        elif cardinality == "MANY_TO_MANY":
            return f"{source_entity} and {target_entity} have a many-to-many relationship"
        
        return f"{source_entity}.{source_column} references {target_entity}"
    
    def _deduplicate_relationships(self, relationships: List[Relationship]) -> List[Relationship]:
        """Remove duplicate or conflicting relationships"""
        
        seen = {}
        unique_rels = []
        
        for rel in relationships:
            # Key: (from_entity, from_column)
            key = (rel.from_entity, rel.from_column)
            
            if key not in seen or rel.confidence > seen[key].confidence:
                seen[key] = rel
        
        return list(seen.values())
```

## 4. Confidence Scoring

**Aggregate confidence across entire analysis**:

```python
@dataclass
class ConfidenceScore:
    """Overall confidence assessment"""
    overall: float
    structure: float
    entities: float
    relationships: float
    warnings: List[str]

class ConfidenceCalculator:
    """Calculate overall confidence in detection results"""
    
    def calculate(
        self,
        entities: List[Entity],
        relationships: List[Relationship],
        dataframes: Dict[str, pd.DataFrame]
    ) -> ConfidenceScore:
        """Calculate overall confidence score"""
        
        # Structure confidence (from DataFrame quality scores)
        structure_scores = [
            df.attrs.get('quality_score', 0.7)
            for df in dataframes.values()
        ]
        structure_confidence = sum(structure_scores) / len(structure_scores) if structure_scores else 0.5
        
        # Entity confidence (average of all entities)
        entity_scores = [e.confidence for e in entities]
        entity_confidence = sum(entity_scores) / len(entity_scores) if entity_scores else 0.5
        
        # Relationship confidence (average of all relationships)
        if relationships:
            rel_scores = [r.confidence for r in relationships]
            rel_confidence = sum(rel_scores) / len(rel_scores)
        else:
            rel_confidence = 0.5  # Neutral if no relationships
        
        # Overall confidence (weighted average)
        overall = (
            structure_confidence * 0.3 +
            entity_confidence * 0.4 +
            rel_confidence * 0.3
        )
        
        # Generate warnings
        warnings = self._generate_warnings(entities, relationships)
        
        return ConfidenceScore(
            overall=overall,
            structure=structure_confidence,
            entities=entity_confidence,
            relationships=rel_confidence,
            warnings=warnings
        )
    
    def _generate_warnings(
        self,
        entities: List[Entity],
        relationships: List[Relationship]
    ) -> List[str]:
        """Generate warnings about potential issues"""
        
        warnings = []
        
        # Check for entities without primary keys
        no_pk_entities = [e.name for e in entities if e.primary_key is None]
        if no_pk_entities:
            warnings.append(
                f"Entities without primary keys: {', '.join(no_pk_entities)}"
            )
        
        # Check for isolated entities (no relationships)
        entity_ids = {e.id for e in entities}
        connected_entities = set()
        for rel in relationships:
            connected_entities.add(rel.from_entity)
            connected_entities.add(rel.to_entity)
        
        isolated = entity_ids - connected_entities
        if len(isolated) > 1:  # More than 1 isolated is unusual
            warnings.append(
                f"{len(isolated)} entities have no relationships with other entities"
            )
        
        # Check for low confidence entities
        low_conf_entities = [e.name for e in entities if e.confidence < 0.6]
        if low_conf_entities:
            warnings.append(
                f"Low confidence entities: {', '.join(low_conf_entities)}"
            )
        
        return warnings
```

## Summary

The Inference Engine provides:

1. **Column Classification**: Detect 15+ data types with pattern matching and semantic inference
2. **Entity Detection**: Transform DataFrames into structured entities with primary keys
3. **Relationship Discovery**: Find foreign keys using name matching, value overlap, and type compatibility
4. **Confidence Scoring**: Assess quality of detection with actionable warnings

These algorithms form the core intelligence of the auto-detection system, bridging raw spreadsheet data and structured system specifications.

