# Formula Translation and Business Logic Extraction

## Overview

The Formula Translation Layer converts Excel formulas into automation rules that can be implemented in modern workflow systems. Rather than replicating Excel's full calculation engine, we focus on recognizing common formula patterns and extracting the underlying business logic.

## Philosophy

**Key Principle**: We don't execute formulas; we translate their intent into automation rules.

**Example**:
```
Excel: =IF(E2<=F2, "REORDER", "OK")
Translation: "When quantity_on_hand <= reorder_level, set status to REORDER"
Automation: Trigger-based rule that sends notification when condition is met
```

## Component Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                  Formula Translation Layer                      │
│                                                                 │
│  ┌───────────┐   ┌──────────────┐   ┌────────────────────┐   │
│  │  Formula  │──▶│   Pattern    │──▶│   Automation       │   │
│  │  Extractor│   │  Recognizer  │   │   Rule Generator   │   │
│  └───────────┘   └──────────────┘   └────────────────────┘   │
│        │                 │                     │               │
│        ▼                 ▼                     ▼               │
│   Formulas        Formula AST          AutomationRules        │
└────────────────────────────────────────────────────────────────┘
```

## 1. Formula Patterns

### 1.1 Pattern Library

**Common Excel Formulas and Their Meanings**:

```python
from enum import Enum
from dataclasses import dataclass
from typing import List, Optional, Any

class FormulaType(Enum):
    """Types of recognized formulas"""
    SUM = "sum"
    SUMIF = "sumif"
    SUMIFS = "sumifs"
    COUNT = "count"
    COUNTIF = "countif"
    COUNTIFS = "countifs"
    AVERAGE = "average"
    AVERAGEIF = "averageif"
    IF = "if"
    IFS = "ifs"
    VLOOKUP = "vlookup"
    HLOOKUP = "hlookup"
    XLOOKUP = "xlookup"
    INDEX_MATCH = "index_match"
    CONCATENATE = "concatenate"
    TEXTJOIN = "textjoin"
    MAX = "max"
    MIN = "min"
    DATE_FUNCTIONS = "date_functions"
    MATH = "math"
    UNKNOWN = "unknown"

@dataclass
class FormulaPattern:
    """Pattern definition for formula recognition"""
    type: FormulaType
    regex_pattern: str
    description: str
    automation_type: str
    example: str

FORMULA_PATTERNS = {
    FormulaType.SUM: FormulaPattern(
        type=FormulaType.SUM,
        regex_pattern=r'=SUM\s*\(([^)]+)\)',
        description='Calculate sum of a range',
        automation_type='COMPUTED_FIELD',
        example='=SUM(A1:A10)'
    ),
    
    FormulaType.SUMIF: FormulaPattern(
        type=FormulaType.SUMIF,
        regex_pattern=r'=SUMIF\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)',
        description='Conditional sum based on criteria',
        automation_type='AGGREGATE',
        example='=SUMIF(A:A, "Active", B:B)'
    ),
    
    FormulaType.SUMIFS: FormulaPattern(
        type=FormulaType.SUMIFS,
        regex_pattern=r'=SUMIFS\s*\(([^)]+)\)',
        description='Sum with multiple conditions',
        automation_type='AGGREGATE',
        example='=SUMIFS(C:C, A:A, "Active", B:B, ">100")'
    ),
    
    FormulaType.COUNTIF: FormulaPattern(
        type=FormulaType.COUNTIF,
        regex_pattern=r'=COUNTIF\s*\(([^,]+),\s*([^)]+)\)',
        description='Count cells matching condition',
        automation_type='AGGREGATE',
        example='=COUNTIF(A:A, "Complete")'
    ),
    
    FormulaType.IF: FormulaPattern(
        type=FormulaType.IF,
        regex_pattern=r'=IF\s*\(([^,]+),\s*([^,]+),\s*([^)]+)\)',
        description='Conditional logic',
        automation_type='CONDITIONAL',
        example='=IF(A1>100, "High", "Low")'
    ),
    
    FormulaType.VLOOKUP: FormulaPattern(
        type=FormulaType.VLOOKUP,
        regex_pattern=r'=VLOOKUP\s*\(([^,]+),\s*([^,]+),\s*([^,]+)(?:,\s*([^)]+))?\)',
        description='Vertical lookup from table',
        automation_type='LOOKUP',
        example='=VLOOKUP(A2, Products!A:D, 3, FALSE)'
    ),
    
    FormulaType.CONCATENATE: FormulaPattern(
        type=FormulaType.CONCATENATE,
        regex_pattern=r'=(?:CONCATENATE|CONCAT)\s*\(([^)]+)\)',
        description='Combine text values',
        automation_type='COMPUTED_FIELD',
        example='=CONCATENATE(A1, " ", B1)'
    ),
}
```

### 1.2 Formula Parser

**Goal**: Parse Excel formula string into structured Abstract Syntax Tree (AST).

```python
import re
from typing import List, Dict, Any, Optional

@dataclass
class FormulaToken:
    """A token in a formula"""
    type: str  # 'FUNCTION', 'CELL_REF', 'RANGE', 'STRING', 'NUMBER', 'OPERATOR'
    value: str
    position: int

@dataclass
class FormulaAST:
    """Abstract Syntax Tree for a formula"""
    function_name: str
    arguments: List[Any]  # Can be nested FormulaAST or values
    cell_references: List[str]
    range_references: List[str]
    literal_values: List[Any]

class FormulaParser:
    """Parse Excel formulas into structured representation"""
    
    def parse(self, formula: str) -> FormulaAST:
        """
        Parse formula string into AST
        
        Examples:
            "=SUM(A1:A10)" → FormulaAST(function='SUM', arguments=[RangeRef('A1:A10')])
            "=IF(A1>10, B1, C1)" → FormulaAST(function='IF', arguments=[Condition(...), CellRef('B1'), CellRef('C1')])
        """
        
        # Remove leading '=' if present
        formula = formula.strip()
        if formula.startswith('='):
            formula = formula[1:]
        
        # Tokenize
        tokens = self._tokenize(formula)
        
        # Build AST
        ast = self._build_ast(tokens)
        
        return ast
    
    def _tokenize(self, formula: str) -> List[FormulaToken]:
        """Tokenize formula string"""
        
        tokens = []
        position = 0
        
        # Token patterns (order matters)
        patterns = [
            ('FUNCTION', r'[A-Z]+(?=\()'),  # Function name followed by (
            ('RANGE', r'(?:[A-Za-z_][A-Za-z0-9_]*!)?[A-Z]+[0-9]*:[A-Z]+[0-9]*'),  # Range ref
            ('CELL_REF', r'(?:[A-Za-z_][A-Za-z0-9_]*!)?[A-Z]+[0-9]+'),  # Cell ref
            ('STRING', r'"[^"]*"'),  # String literal
            ('NUMBER', r'-?\d+(?:\.\d+)?'),  # Number
            ('OPERATOR', r'[+\-*/=<>!&|]+'),  # Operators
            ('COMMA', r','),
            ('LPAREN', r'\('),
            ('RPAREN', r'\)'),
            ('WHITESPACE', r'\s+'),  # Skip whitespace
        ]
        
        while position < len(formula):
            match_found = False
            
            for token_type, pattern in patterns:
                regex = re.compile(pattern)
                match = regex.match(formula, position)
                
                if match:
                    value = match.group(0)
                    
                    if token_type != 'WHITESPACE':  # Skip whitespace tokens
                        tokens.append(FormulaToken(
                            type=token_type,
                            value=value,
                            position=position
                        ))
                    
                    position = match.end()
                    match_found = True
                    break
            
            if not match_found:
                # Skip unknown character
                position += 1
        
        return tokens
    
    def _build_ast(self, tokens: List[FormulaToken]) -> FormulaAST:
        """Build AST from tokens"""
        
        if not tokens:
            return FormulaAST(
                function_name='',
                arguments=[],
                cell_references=[],
                range_references=[],
                literal_values=[]
            )
        
        # Find main function
        if tokens[0].type == 'FUNCTION':
            function_name = tokens[0].value
            
            # Extract arguments between parentheses
            arguments = self._extract_arguments(tokens[1:])
            
            # Collect references and literals
            cell_refs = []
            range_refs = []
            literals = []
            
            for token in tokens:
                if token.type == 'CELL_REF':
                    cell_refs.append(token.value)
                elif token.type == 'RANGE':
                    range_refs.append(token.value)
                elif token.type in ['STRING', 'NUMBER']:
                    literals.append(token.value)
            
            return FormulaAST(
                function_name=function_name,
                arguments=arguments,
                cell_references=cell_refs,
                range_references=range_refs,
                literal_values=literals
            )
        
        # Simple expression (no function)
        return FormulaAST(
            function_name='EXPRESSION',
            arguments=[tokens],
            cell_references=[t.value for t in tokens if t.type == 'CELL_REF'],
            range_references=[t.value for t in tokens if t.type == 'RANGE'],
            literal_values=[t.value for t in tokens if t.type in ['STRING', 'NUMBER']]
        )
    
    def _extract_arguments(self, tokens: List[FormulaToken]) -> List[Any]:
        """Extract function arguments from token list"""
        
        arguments = []
        current_arg = []
        paren_depth = 0
        
        # Skip opening paren
        start_idx = 0
        if tokens and tokens[0].type == 'LPAREN':
            start_idx = 1
        
        for token in tokens[start_idx:]:
            if token.type == 'LPAREN':
                paren_depth += 1
                current_arg.append(token)
            elif token.type == 'RPAREN':
                if paren_depth == 0:
                    # End of arguments
                    if current_arg:
                        arguments.append(current_arg)
                    break
                else:
                    paren_depth -= 1
                    current_arg.append(token)
            elif token.type == 'COMMA' and paren_depth == 0:
                # Argument separator
                if current_arg:
                    arguments.append(current_arg)
                    current_arg = []
            else:
                current_arg.append(token)
        
        return arguments
```

## 2. Pattern Recognition

### 2.1 Formula Type Detection

```python
class FormulaRecognizer:
    """Recognize formula patterns and classify them"""
    
    def __init__(self):
        self.parser = FormulaParser()
        self.patterns = FORMULA_PATTERNS
    
    def recognize(self, formula: str) -> Tuple[FormulaType, float, FormulaAST]:
        """
        Recognize formula type and return confidence
        
        Returns:
            (FormulaType, confidence, parsed_ast)
        """
        
        # Parse formula
        ast = self.parser.parse(formula)
        
        # Match against known patterns
        function_name = ast.function_name.upper()
        
        # Direct function name matching
        if function_name in ['SUM']:
            return (FormulaType.SUM, 1.0, ast)
        elif function_name in ['SUMIF']:
            return (FormulaType.SUMIF, 1.0, ast)
        elif function_name in ['SUMIFS']:
            return (FormulaType.SUMIFS, 1.0, ast)
        elif function_name in ['COUNT', 'COUNTA']:
            return (FormulaType.COUNT, 1.0, ast)
        elif function_name in ['COUNTIF']:
            return (FormulaType.COUNTIF, 1.0, ast)
        elif function_name in ['COUNTIFS']:
            return (FormulaType.COUNTIFS, 1.0, ast)
        elif function_name in ['AVERAGE', 'AVERAGEA']:
            return (FormulaType.AVERAGE, 1.0, ast)
        elif function_name in ['AVERAGEIF']:
            return (FormulaType.AVERAGEIF, 1.0, ast)
        elif function_name in ['IF']:
            return (FormulaType.IF, 1.0, ast)
        elif function_name in ['IFS']:
            return (FormulaType.IFS, 1.0, ast)
        elif function_name in ['VLOOKUP']:
            return (FormulaType.VLOOKUP, 1.0, ast)
        elif function_name in ['HLOOKUP']:
            return (FormulaType.HLOOKUP, 1.0, ast)
        elif function_name in ['XLOOKUP']:
            return (FormulaType.XLOOKUP, 1.0, ast)
        elif function_name in ['CONCATENATE', 'CONCAT']:
            return (FormulaType.CONCATENATE, 1.0, ast)
        elif function_name in ['TEXTJOIN']:
            return (FormulaType.TEXTJOIN, 1.0, ast)
        elif function_name in ['MAX']:
            return (FormulaType.MAX, 1.0, ast)
        elif function_name in ['MIN']:
            return (FormulaType.MIN, 1.0, ast)
        elif function_name in ['DATE', 'TODAY', 'NOW', 'YEAR', 'MONTH', 'DAY']:
            return (FormulaType.DATE_FUNCTIONS, 1.0, ast)
        elif function_name == 'INDEX':
            # Check if paired with MATCH (INDEX-MATCH pattern)
            if self._has_match_function(ast):
                return (FormulaType.INDEX_MATCH, 0.95, ast)
        
        # Check for arithmetic expressions
        if function_name == 'EXPRESSION' and self._is_arithmetic(ast):
            return (FormulaType.MATH, 0.8, ast)
        
        # Unknown formula
        return (FormulaType.UNKNOWN, 0.5, ast)
    
    def _has_match_function(self, ast: FormulaAST) -> bool:
        """Check if AST contains MATCH function (for INDEX-MATCH detection)"""
        # Simplified check - would need recursive search in full implementation
        return any('MATCH' in str(arg) for arg in ast.arguments)
    
    def _is_arithmetic(self, ast: FormulaAST) -> bool:
        """Check if expression is arithmetic (+, -, *, /)"""
        operators = ['+', '-', '*', '/']
        return any(
            any(op in str(token.value) for op in operators)
            for token in ast.arguments[0] if isinstance(token, FormulaToken)
        )
```

## 3. Automation Rule Generation

### 3.1 Rule Types

```python
@dataclass
class AutomationRule:
    """Represents an automation rule extracted from a formula"""
    id: str
    name: str
    type: str  # 'TRIGGER', 'COMPUTED_FIELD', 'VALIDATION', 'AGGREGATE', 'LOOKUP'
    entity: str
    source_formula: str
    source_location: str  # Sheet!Cell
    confidence: float
    description: str
    implementation: Dict[str, Any]  # Implementation-specific details

class AutomationRuleGenerator:
    """Generate automation rules from recognized formulas"""
    
    def __init__(self, entities: List[Entity]):
        self.entities = entities
        self.entity_map = {e.table_name: e for e in entities}
        self.recognizer = FormulaRecognizer()
    
    def translate(
        self,
        formula_def: FormulaDefinition,
        context: Dict[str, Any]
    ) -> Optional[AutomationRule]:
        """
        Translate a formula into an automation rule
        
        Args:
            formula_def: Formula definition with location and formula string
            context: Additional context (entity info, column mappings)
        
        Returns:
            AutomationRule or None if translation fails
        """
        
        # Recognize formula type
        formula_type, confidence, ast = self.recognizer.recognize(formula_def.formula_string)
        
        # Translate based on type
        if formula_type == FormulaType.IF:
            return self._translate_if(formula_def, ast, context, confidence)
        elif formula_type == FormulaType.SUMIF:
            return self._translate_sumif(formula_def, ast, context, confidence)
        elif formula_type == FormulaType.COUNTIF:
            return self._translate_countif(formula_def, ast, context, confidence)
        elif formula_type == FormulaType.VLOOKUP:
            return self._translate_vlookup(formula_def, ast, context, confidence)
        elif formula_type == FormulaType.CONCATENATE:
            return self._translate_concatenate(formula_def, ast, context, confidence)
        elif formula_type == FormulaType.MATH:
            return self._translate_arithmetic(formula_def, ast, context, confidence)
        elif formula_type in [FormulaType.SUM, FormulaType.AVERAGE, FormulaType.MAX, FormulaType.MIN]:
            return self._translate_aggregate(formula_def, ast, formula_type, context, confidence)
        else:
            # Unknown or unsupported formula type
            return self._translate_generic(formula_def, ast, context, confidence * 0.5)
```

### 3.2 Translation Algorithms

**IF Statement Translation**:

```python
def _translate_if(
    self,
    formula_def: FormulaDefinition,
    ast: FormulaAST,
    context: Dict[str, Any],
    confidence: float
) -> AutomationRule:
    """
    Translate IF formula to conditional rule
    
    Example:
        =IF(E2<=F2, "REORDER", "OK")
        →
        Trigger: When quantity_on_hand <= reorder_level
        Action: Set status to "REORDER"
    """
    
    if len(ast.arguments) < 3:
        return None
    
    # Extract components
    condition_tokens = ast.arguments[0]
    true_value_tokens = ast.arguments[1]
    false_value_tokens = ast.arguments[2]
    
    # Parse condition
    condition = self._parse_condition(condition_tokens, context)
    
    # Extract values
    true_value = self._extract_value(true_value_tokens)
    false_value = self._extract_value(false_value_tokens)
    
    # Determine if this is a trigger or computed field
    # If setting to action words like "REORDER", "ALERT", likely a trigger
    # If calculating a value, likely a computed field
    
    is_trigger = self._is_action_value(true_value) or self._is_action_value(false_value)
    
    if is_trigger:
        # Generate trigger-based rule
        return AutomationRule(
            id=f"rule_{formula_def.sheet_name}_{formula_def.row}_{formula_def.column}",
            name=f"Conditional Alert: {formula_def.column_name}",
            type='TRIGGER',
            entity=context.get('entity_name', formula_def.sheet_name),
            source_formula=formula_def.formula_string,
            source_location=f"{formula_def.sheet_name}!{self._cell_address(formula_def.row, formula_def.column)}",
            confidence=confidence,
            description=f"When {condition['description']}, trigger action",
            implementation={
                'trigger': {
                    'event': 'UPDATE',
                    'condition': condition
                },
                'actions': [
                    {
                        'type': 'SET_FIELD',
                        'field': formula_def.column_name,
                        'value': true_value
                    },
                    {
                        'type': 'NOTIFICATION',
                        'when': condition,
                        'message': f"Condition met: {condition['description']}"
                    }
                ]
            }
        )
    else:
        # Generate computed field rule
        return AutomationRule(
            id=f"rule_{formula_def.sheet_name}_{formula_def.row}_{formula_def.column}",
            name=f"Computed Field: {formula_def.column_name}",
            type='COMPUTED_FIELD',
            entity=context.get('entity_name', formula_def.sheet_name),
            source_formula=formula_def.formula_string,
            source_location=f"{formula_def.sheet_name}!{self._cell_address(formula_def.row, formula_def.column)}",
            confidence=confidence,
            description=f"Calculate {formula_def.column_name} based on condition",
            implementation={
                'field': formula_def.column_name,
                'computation': {
                    'type': 'CONDITIONAL',
                    'condition': condition,
                    'then_value': true_value,
                    'else_value': false_value
                },
                'update_on': ['INSERT', 'UPDATE']
            }
        )

def _parse_condition(self, tokens: List[FormulaToken], context: Dict) -> Dict[str, Any]:
    """
    Parse condition tokens into structured condition
    
    Example:
        [Token('CELL_REF', 'E2'), Token('OPERATOR', '<='), Token('CELL_REF', 'F2')]
        →
        {
            'left': 'quantity_on_hand',
            'operator': '<=',
            'right': 'reorder_level',
            'description': 'quantity_on_hand <= reorder_level'
        }
    """
    
    # Find operator
    operator = None
    operator_idx = -1
    
    for idx, token in enumerate(tokens):
        if token.type == 'OPERATOR':
            operator = token.value
            operator_idx = idx
            break
    
    if operator is None:
        return {'description': 'unknown condition', 'raw': tokens}
    
    # Split into left and right sides
    left_tokens = tokens[:operator_idx]
    right_tokens = tokens[operator_idx + 1:]
    
    # Resolve references to field names
    left_field = self._resolve_reference(left_tokens, context)
    right_field = self._resolve_reference(right_tokens, context)
    
    return {
        'left': left_field,
        'operator': operator,
        'right': right_field,
        'description': f"{left_field} {operator} {right_field}"
    }

def _resolve_reference(self, tokens: List[FormulaToken], context: Dict) -> str:
    """
    Resolve cell reference to field name
    
    Example:
        Token('CELL_REF', 'E2') + context[column_map] → 'quantity_on_hand'
    """
    
    if not tokens:
        return 'unknown'
    
    token = tokens[0]
    
    if token.type == 'CELL_REF':
        # Extract column letter
        col_letter = ''.join(c for c in token.value if c.isalpha())
        
        # Map to field name using context
        column_map = context.get('column_map', {})
        return column_map.get(col_letter, token.value)
    
    elif token.type == 'STRING':
        return token.value.strip('"')
    
    elif token.type == 'NUMBER':
        return token.value
    
    else:
        return str(token.value)

def _is_action_value(self, value: Any) -> bool:
    """Check if value is an action word suggesting a trigger"""
    
    if not isinstance(value, str):
        return False
    
    action_keywords = [
        'reorder', 'alert', 'notify', 'flag', 'warning',
        'error', 'pending', 'approved', 'rejected', 'escalate'
    ]
    
    value_lower = value.lower().strip('"')
    return any(keyword in value_lower for keyword in action_keywords)
```

**SUMIF Translation**:

```python
def _translate_sumif(
    self,
    formula_def: FormulaDefinition,
    ast: FormulaAST,
    context: Dict[str, Any],
    confidence: float
) -> AutomationRule:
    """
    Translate SUMIF to aggregate rule
    
    Example:
        =SUMIF(Status, "Active", Amount)
        →
        Aggregate: SUM(amount) WHERE status = 'Active'
    """
    
    if len(ast.arguments) < 3:
        return None
    
    # Extract arguments
    range_arg = ast.arguments[0]  # Range to check condition
    criteria_arg = ast.arguments[1]  # Condition
    sum_range_arg = ast.arguments[2]  # Range to sum
    
    # Resolve to field names
    condition_field = self._resolve_reference(range_arg, context)
    criteria_value = self._extract_value(criteria_arg)
    sum_field = self._resolve_reference(sum_range_arg, context)
    
    return AutomationRule(
        id=f"rule_{formula_def.sheet_name}_{formula_def.row}_{formula_def.column}",
        name=f"Conditional Sum: {formula_def.column_name}",
        type='AGGREGATE',
        entity=context.get('entity_name', formula_def.sheet_name),
        source_formula=formula_def.formula_string,
        source_location=f"{formula_def.sheet_name}!{self._cell_address(formula_def.row, formula_def.column)}",
        confidence=confidence,
        description=f"Sum {sum_field} where {condition_field} = {criteria_value}",
        implementation={
            'action': 'SUM',
            'field': sum_field,
            'filter': {
                'field': condition_field,
                'operator': '=',
                'value': criteria_value
            },
            'result_field': formula_def.column_name
        }
    )
```

**VLOOKUP Translation**:

```python
def _translate_vlookup(
    self,
    formula_def: FormulaDefinition,
    ast: FormulaAST,
    context: Dict[str, Any],
    confidence: float
) -> AutomationRule:
    """
    Translate VLOOKUP to lookup/join rule
    
    Example:
        =VLOOKUP(A2, Products!A:D, 3, FALSE)
        →
        Lookup: JOIN Products ON product_id, return column 3 (price)
    """
    
    if len(ast.arguments) < 3:
        return None
    
    # Extract arguments
    lookup_value = ast.arguments[0]  # Value to search for
    table_range = ast.arguments[1]  # Range containing lookup table
    col_index = ast.arguments[2]  # Column index to return
    
    # Parse table range to get sheet/entity
    table_ref = self._extract_value(table_range)
    target_entity = self._extract_sheet_name(table_ref)
    
    # Resolve fields
    lookup_field = self._resolve_reference(lookup_value, context)
    
    return AutomationRule(
        id=f"rule_{formula_def.sheet_name}_{formula_def.row}_{formula_def.column}",
        name=f"Lookup: {formula_def.column_name}",
        type='LOOKUP',
        entity=context.get('entity_name', formula_def.sheet_name),
        source_formula=formula_def.formula_string,
        source_location=f"{formula_def.sheet_name}!{self._cell_address(formula_def.row, formula_def.column)}",
        confidence=confidence,
        description=f"Lookup from {target_entity} using {lookup_field}",
        implementation={
            'lookup_field': lookup_field,
            'target_entity': target_entity,
            'target_column_index': self._extract_value(col_index),
            'result_field': formula_def.column_name,
            'match_type': 'EXACT'
        }
    )
```

## 4. Cross-Sheet Reference Resolution

**Goal**: Identify relationships implied by formulas that reference other sheets.

```python
class CrossSheetAnalyzer:
    """Analyze cross-sheet references in formulas"""
    
    def analyze_references(
        self,
        formulas: List[FormulaDefinition]
    ) -> List[Relationship]:
        """
        Find relationships implied by cross-sheet formula references
        
        Example:
            Sheet "Orders" has formula: =Products!B5
            → Creates relationship: Orders references Products
        """
        
        relationships = []
        
        for formula in formulas:
            # Extract cross-sheet references
            for ref in formula.referenced_cells + formula.referenced_ranges:
                if '!' in ref:
                    # This is a cross-sheet reference
                    target_sheet, cell_range = ref.split('!', 1)
                    
                    # Create relationship
                    rel = Relationship(
                        id=f"ref_{formula.sheet_name}_to_{target_sheet}",
                        from_entity=formula.sheet_name,
                        from_column=formula.column_name,
                        to_entity=target_sheet,
                        to_column=self._extract_column_from_range(cell_range),
                        type='FORMULA_REFERENCE',
                        cardinality='MANY_TO_ONE',  # Assumption
                        confidence=0.8,
                        description=f"{formula.sheet_name} references {target_sheet} via formula",
                        metadata={
                            'formula': formula.formula_string,
                            'reference': ref
                        }
                    )
                    
                    relationships.append(rel)
        
        # Deduplicate
        return self._deduplicate(relationships)
    
    def _extract_column_from_range(self, cell_range: str) -> str:
        """Extract column name from cell range (e.g., 'B5' → 'B', 'A:A' → 'A')"""
        
        # Extract letters only
        col = ''.join(c for c in cell_range if c.isalpha())
        return col if col else 'unknown'
    
    def _deduplicate(self, relationships: List[Relationship]) -> List[Relationship]:
        """Remove duplicate relationships"""
        
        seen = set()
        unique = []
        
        for rel in relationships:
            key = (rel.from_entity, rel.to_entity)
            if key not in seen:
                seen.add(key)
                unique.append(rel)
        
        return unique
```

## 5. Formula Confidence Scoring

**Assess translation quality**:

```python
class FormulaConfidenceScorer:
    """Score confidence in formula translation"""
    
    def score(
        self,
        formula_def: FormulaDefinition,
        automation_rule: AutomationRule,
        formula_type: FormulaType
    ) -> float:
        """
        Calculate confidence score for translation
        
        Factors:
        1. Formula type recognition (known vs unknown)
        2. Argument resolution success
        3. Cross-entity reference clarity
        4. Complexity (nested formulas reduce confidence)
        """
        
        score = 1.0
        
        # Factor 1: Known formula type
        if formula_type == FormulaType.UNKNOWN:
            score *= 0.5
        
        # Factor 2: Argument resolution
        unresolved_count = automation_rule.implementation.get('unresolved_references', 0)
        if unresolved_count > 0:
            score -= 0.1 * unresolved_count
        
        # Factor 3: Complexity
        nesting_level = self._count_nesting_level(formula_def.formula_string)
        if nesting_level > 2:
            score -= 0.1 * (nesting_level - 2)
        
        # Ensure score is in [0, 1]
        return max(0.0, min(1.0, score))
    
    def _count_nesting_level(self, formula: str) -> int:
        """Count maximum nesting depth of parentheses"""
        
        max_depth = 0
        current_depth = 0
        
        for char in formula:
            if char == '(':
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif char == ')':
                current_depth -= 1
        
        return max_depth
```

## Summary

The Formula Translation Layer provides:

1. **Pattern Library**: Recognition of 15+ common Excel formula types
2. **Formula Parser**: Convert formula strings into structured AST
3. **Translation Algorithms**: Map formulas to automation rules (triggers, computed fields, aggregates, lookups)
4. **Cross-Sheet Analysis**: Detect relationships implied by formula references
5. **Confidence Scoring**: Assess translation quality

**Key Translation Mappings**:

| Excel Formula | Automation Type | Example Output |
|---------------|----------------|----------------|
| `IF()` | TRIGGER or COMPUTED_FIELD | Conditional rule with action |
| `SUMIF()` | AGGREGATE | Filtered sum query |
| `COUNTIF()` | AGGREGATE | Filtered count query |
| `VLOOKUP()` | LOOKUP | Join/relationship query |
| `CONCATENATE()` | COMPUTED_FIELD | String concatenation |
| `=A1+B1` | COMPUTED_FIELD | Arithmetic computation |

These translations enable the "Live System Generated" promise by converting spreadsheet logic into executable automation rules.

