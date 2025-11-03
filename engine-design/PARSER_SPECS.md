# Parser Layer Specifications

## Overview

The Parser Layer is the foundation of the auto-detection engine. It transforms raw spreadsheet files into normalized, analyzable data structures. This document provides detailed specifications for all parsing algorithms.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Parser Layer                             │
│                                                              │
│  ┌──────────────┐   ┌─────────────┐   ┌─────────────────┐ │
│  │   File       │──▶│  Structure  │──▶│  Normalization  │ │
│  │  Ingestion   │   │  Detection  │   │    Engine       │ │
│  └──────────────┘   └─────────────┘   └─────────────────┘ │
│         │                   │                    │          │
│         ▼                   ▼                    ▼          │
│    RawSheetData      DataRegions          DataFrames       │
└─────────────────────────────────────────────────────────────┘
```

## 1. File Ingestion

### 1.1 File Type Detection

**Purpose**: Identify file format before parsing.

**Supported Formats**:
- `.xlsx` - Office Open XML (Excel 2007+)
- `.xls` - Binary Excel format (Excel 97-2003)
- `.xlsm` - Macro-enabled Excel
- `.csv` - Comma-separated values
- `.tsv` - Tab-separated values

**Algorithm**:

```python
import magic
import mimetypes
from pathlib import Path

def detect_file_type(file_path: str) -> str:
    """
    Detect spreadsheet file type
    
    Returns: 'xlsx', 'xls', 'csv', 'tsv', or raises UnsupportedFileType
    """
    
    # Step 1: Check file extension
    extension = Path(file_path).suffix.lower()
    
    # Step 2: Verify MIME type for security
    mime_type = magic.from_file(file_path, mime=True)
    
    # Step 3: Map to parser type
    if extension in ['.xlsx', '.xlsm']:
        if mime_type in ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'application/vnd.ms-excel.sheet.macroEnabled.12']:
            return 'xlsx'
    
    elif extension == '.xls':
        if mime_type in ['application/vnd.ms-excel', 'application/msexcel']:
            return 'xls'
    
    elif extension == '.csv':
        if mime_type in ['text/csv', 'text/plain', 'application/csv']:
            return 'csv'
    
    elif extension == '.tsv':
        if mime_type in ['text/tab-separated-values', 'text/plain']:
            return 'tsv'
    
    raise UnsupportedFileType(f"Cannot parse file type: {extension} ({mime_type})")
```

### 1.2 Excel File Loading (XLSX/XLS)

**Library**: `openpyxl` for .xlsx, `xlrd` for .xls

**Implementation**:

```python
import openpyxl
import xlrd
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class CellData:
    """Raw cell information"""
    value: Any
    data_type: str  # 'n' (number), 's' (string), 'b' (boolean), 'd' (date), 'f' (formula)
    formula: Optional[str] = None
    format: Optional[str] = None
    is_merged: bool = False
    style: Optional[Dict] = None

@dataclass
class RawSheetData:
    """Raw sheet data before structure detection"""
    name: str
    cells: List[List[CellData]]  # 2D array of cells
    max_row: int
    max_col: int
    merged_cells: List[str]  # e.g., ['A1:B2', 'C3:D4']
    named_ranges: Dict[str, str]  # {name: cell_range}
    metadata: Dict[str, Any]

class ExcelLoader:
    """Load Excel files and extract raw data"""
    
    def load_xlsx(self, file_path: str) -> Dict[str, RawSheetData]:
        """Load .xlsx file using openpyxl"""
        
        workbook = openpyxl.load_workbook(
            filename=file_path,
            data_only=False,  # Keep formulas, not calculated values
            keep_vba=False,   # Skip VBA for now
            rich_text=True
        )
        
        sheets = {}
        
        for sheet_name in workbook.sheetnames:
            sheet = workbook[sheet_name]
            
            # Extract all cells
            cells = self._extract_cells_xlsx(sheet)
            
            # Extract merged cell ranges
            merged_cells = [str(merged_range) for merged_range in sheet.merged_cells.ranges]
            
            # Extract named ranges (if any reference this sheet)
            named_ranges = self._extract_named_ranges(workbook, sheet_name)
            
            sheets[sheet_name] = RawSheetData(
                name=sheet_name,
                cells=cells,
                max_row=sheet.max_row,
                max_col=sheet.max_column,
                merged_cells=merged_cells,
                named_ranges=named_ranges,
                metadata={
                    'sheet_state': sheet.sheet_state,  # 'visible', 'hidden', 'veryHidden'
                    'sheet_format': sheet.sheet_format,
                }
            )
        
        workbook.close()
        return sheets
    
    def _extract_cells_xlsx(self, sheet) -> List[List[CellData]]:
        """Extract all cells from openpyxl worksheet"""
        
        cells = []
        
        for row in sheet.iter_rows():
            row_cells = []
            
            for cell in row:
                cell_data = CellData(
                    value=cell.value,
                    data_type=cell.data_type,
                    formula=cell.value if cell.data_type == 'f' else None,
                    format=cell.number_format,
                    is_merged=cell.coordinate in sheet.merged_cells,
                    style={
                        'bold': cell.font.bold if cell.font else False,
                        'italic': cell.font.italic if cell.font else False,
                        'color': cell.font.color.rgb if cell.font and cell.font.color else None,
                        'fill': cell.fill.fgColor.rgb if cell.fill and cell.fill.fgColor else None,
                    }
                )
                row_cells.append(cell_data)
            
            cells.append(row_cells)
        
        return cells
    
    def _extract_named_ranges(self, workbook, sheet_name: str) -> Dict[str, str]:
        """Extract named ranges that reference this sheet"""
        
        named_ranges = {}
        
        for name, definition in workbook.defined_names.items():
            # Parse the definition to see if it references this sheet
            for title, coord in definition.destinations:
                if title == sheet_name:
                    named_ranges[name] = coord
        
        return named_ranges
    
    def load_xls(self, file_path: str) -> Dict[str, RawSheetData]:
        """Load .xls file using xlrd (legacy format)"""
        
        workbook = xlrd.open_workbook(file_path, formatting_info=True)
        
        sheets = {}
        
        for sheet_idx in range(workbook.nsheets):
            sheet = workbook.sheet_by_index(sheet_idx)
            
            cells = self._extract_cells_xls(sheet, workbook)
            
            sheets[sheet.name] = RawSheetData(
                name=sheet.name,
                cells=cells,
                max_row=sheet.nrows,
                max_col=sheet.ncols,
                merged_cells=[],  # xlrd doesn't easily expose merged cells
                named_ranges={},
                metadata={
                    'visibility': sheet.visibility
                }
            )
        
        return sheets
    
    def _extract_cells_xls(self, sheet, workbook) -> List[List[CellData]]:
        """Extract all cells from xlrd worksheet"""
        
        cells = []
        
        for row_idx in range(sheet.nrows):
            row_cells = []
            
            for col_idx in range(sheet.ncols):
                cell = sheet.cell(row_idx, col_idx)
                
                # Get cell type
                ctype_map = {
                    xlrd.XL_CELL_EMPTY: 'empty',
                    xlrd.XL_CELL_TEXT: 's',
                    xlrd.XL_CELL_NUMBER: 'n',
                    xlrd.XL_CELL_DATE: 'd',
                    xlrd.XL_CELL_BOOLEAN: 'b',
                    xlrd.XL_CELL_ERROR: 'e',
                    xlrd.XL_CELL_BLANK: 'empty',
                }
                
                cell_data = CellData(
                    value=cell.value,
                    data_type=ctype_map.get(cell.ctype, 'unknown'),
                    formula=None,  # xlrd doesn't expose formulas in old format
                    format=None,
                    is_merged=False,
                    style={}
                )
                row_cells.append(cell_data)
            
            cells.append(row_cells)
        
        return cells
```

### 1.3 CSV File Loading

**Challenge**: CSV files have no inherent structure metadata (no multiple sheets, no formulas, no formatting).

**Approach**: Treat entire CSV as a single sheet, infer encoding and delimiter.

**Implementation**:

```python
import csv
import chardet
from typing import Dict, List

class CSVLoader:
    """Load CSV/TSV files"""
    
    def load_csv(self, file_path: str, delimiter: str = None) -> Dict[str, RawSheetData]:
        """
        Load CSV file
        
        Auto-detects:
        - File encoding (UTF-8, Latin-1, etc.)
        - Delimiter (comma, tab, semicolon, pipe)
        """
        
        # Step 1: Detect encoding
        encoding = self._detect_encoding(file_path)
        
        # Step 2: Detect delimiter if not provided
        if delimiter is None:
            delimiter = self._detect_delimiter(file_path, encoding)
        
        # Step 3: Load data
        with open(file_path, 'r', encoding=encoding, newline='') as f:
            reader = csv.reader(f, delimiter=delimiter)
            rows = list(reader)
        
        # Step 4: Convert to CellData format
        cells = []
        for row in rows:
            row_cells = [
                CellData(
                    value=cell,
                    data_type='s',  # All CSV values are strings initially
                    formula=None,
                    format=None,
                    is_merged=False,
                    style={}
                )
                for cell in row
            ]
            cells.append(row_cells)
        
        # Step 5: Package as RawSheetData
        # Use filename (without extension) as sheet name
        sheet_name = Path(file_path).stem
        
        return {
            sheet_name: RawSheetData(
                name=sheet_name,
                cells=cells,
                max_row=len(cells),
                max_col=max(len(row) for row in cells) if cells else 0,
                merged_cells=[],
                named_ranges={},
                metadata={
                    'encoding': encoding,
                    'delimiter': delimiter,
                    'source_format': 'csv'
                }
            )
        }
    
    def _detect_encoding(self, file_path: str) -> str:
        """Detect file encoding using chardet"""
        
        with open(file_path, 'rb') as f:
            raw_data = f.read(10000)  # Sample first 10KB
            result = chardet.detect(raw_data)
            return result['encoding']
    
    def _detect_delimiter(self, file_path: str, encoding: str) -> str:
        """Detect CSV delimiter"""
        
        with open(file_path, 'r', encoding=encoding, newline='') as f:
            sample = f.read(4096)  # Sample first 4KB
            
            # Use csv.Sniffer to detect delimiter
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample)
            return dialect.delimiter
```

### 1.4 Unified Loader Interface

**Main Entry Point**:

```python
class SpreadsheetLoader:
    """Unified interface for loading any spreadsheet format"""
    
    def __init__(self):
        self.excel_loader = ExcelLoader()
        self.csv_loader = CSVLoader()
    
    def load(self, file_path: str) -> Dict[str, RawSheetData]:
        """
        Load spreadsheet file and return raw sheet data
        
        Returns:
            Dictionary mapping sheet names to RawSheetData
        
        Raises:
            UnsupportedFileType: If file format is not supported
            FileNotFoundError: If file doesn't exist
            CorruptedFileError: If file cannot be parsed
        """
        
        # Validate file exists
        if not Path(file_path).exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Detect file type
        file_type = detect_file_type(file_path)
        
        # Load with appropriate loader
        try:
            if file_type == 'xlsx':
                return self.excel_loader.load_xlsx(file_path)
            elif file_type == 'xls':
                return self.excel_loader.load_xls(file_path)
            elif file_type in ['csv', 'tsv']:
                delimiter = '\t' if file_type == 'tsv' else None
                return self.csv_loader.load_csv(file_path, delimiter=delimiter)
            else:
                raise UnsupportedFileType(f"Unsupported file type: {file_type}")
        
        except Exception as e:
            raise CorruptedFileError(f"Failed to parse file: {str(e)}")
```

## 2. Structure Detection

### 2.1 Header Row Detection

**Challenge**: Headers can be in different rows (row 1, row 2, row 3, etc.) and may have varying formats.

**Heuristics**:

1. **Position**: First non-empty row is often the header
2. **Content**: Row with predominantly text values
3. **Following Pattern**: Rows below have consistent data types
4. **Formatting**: Bold, colored background, larger font
5. **Keywords**: Contains words like "ID", "Name", "Date", "Total", "Status"

**Implementation**:

```python
import re
from typing import List, Tuple, Optional

class HeaderDetector:
    """Detect header rows in spreadsheet data"""
    
    HEADER_KEYWORDS = [
        'id', 'name', 'date', 'total', 'status', 'type', 'description',
        'email', 'phone', 'address', 'quantity', 'price', 'cost',
        'amount', 'number', 'code', 'reference', 'category', 'title'
    ]
    
    def find_header_rows(self, cells: List[List[CellData]]) -> List[int]:
        """
        Find candidate header row indices
        
        Returns:
            List of row indices (0-based) that might be headers
        """
        
        candidates = []
        
        for row_idx in range(min(10, len(cells))):  # Check first 10 rows only
            row = cells[row_idx]
            
            score = self._score_header_candidate(row, cells, row_idx)
            
            if score > 0.5:  # Threshold for header detection
                candidates.append((row_idx, score))
        
        # Return sorted by score (highest first)
        candidates.sort(key=lambda x: x[1], reverse=True)
        return [idx for idx, score in candidates]
    
    def _score_header_candidate(
        self,
        row: List[CellData],
        all_cells: List[List[CellData]],
        row_idx: int
    ) -> float:
        """
        Score how likely a row is to be a header
        
        Returns: 0.0 to 1.0 confidence score
        """
        
        score = 0.0
        weights = {
            'position': 0.15,
            'text_ratio': 0.25,
            'non_empty_ratio': 0.15,
            'formatting': 0.15,
            'keywords': 0.15,
            'consistency_below': 0.15
        }
        
        # 1. Position score (earlier rows more likely)
        position_score = 1.0 - (row_idx / 10.0)
        score += position_score * weights['position']
        
        # 2. Text ratio score
        non_empty = [c for c in row if c.value not in [None, '', ' ']]
        text_cells = [c for c in non_empty if c.data_type == 's']
        
        if len(non_empty) > 0:
            text_ratio = len(text_cells) / len(non_empty)
            score += text_ratio * weights['text_ratio']
            
            # 3. Non-empty ratio
            total_cols = len(row)
            non_empty_ratio = len(non_empty) / total_cols if total_cols > 0 else 0
            score += non_empty_ratio * weights['non_empty_ratio']
        else:
            return 0.0  # Empty row can't be header
        
        # 4. Formatting score (bold, background color)
        formatted_count = sum(1 for c in row if c.style and c.style.get('bold'))
        if len(row) > 0:
            formatting_score = formatted_count / len(row)
            score += formatting_score * weights['formatting']
        
        # 5. Keyword score
        keyword_count = 0
        for cell in text_cells:
            if cell.value and any(kw in str(cell.value).lower() for kw in self.HEADER_KEYWORDS):
                keyword_count += 1
        
        if len(text_cells) > 0:
            keyword_score = keyword_count / len(text_cells)
            score += keyword_score * weights['keywords']
        
        # 6. Consistency below (rows below have consistent types)
        if row_idx < len(all_cells) - 3:  # Need at least 3 rows below to check
            consistency = self._check_column_consistency(all_cells, row_idx + 1, num_rows=5)
            score += consistency * weights['consistency_below']
        
        return score
    
    def _check_column_consistency(
        self,
        cells: List[List[CellData]],
        start_row: int,
        num_rows: int
    ) -> float:
        """
        Check if columns have consistent data types in rows below header
        
        Returns: 0.0 to 1.0 consistency score
        """
        
        if start_row + num_rows > len(cells):
            num_rows = len(cells) - start_row
        
        if num_rows == 0:
            return 0.0
        
        # Get column count
        max_cols = max(len(row) for row in cells[start_row:start_row + num_rows])
        
        consistent_columns = 0
        
        for col_idx in range(max_cols):
            # Get data types for this column across rows
            types = []
            for row_idx in range(start_row, start_row + num_rows):
                if col_idx < len(cells[row_idx]):
                    cell = cells[row_idx][col_idx]
                    if cell.value not in [None, '', ' ']:
                        types.append(cell.data_type)
            
            # Check if majority have same type
            if types:
                most_common_type = max(set(types), key=types.count)
                type_ratio = types.count(most_common_type) / len(types)
                
                if type_ratio >= 0.7:  # 70% same type = consistent
                    consistent_columns += 1
        
        return consistent_columns / max_cols if max_cols > 0 else 0.0
```

### 2.2 Data Region Boundary Detection

**Goal**: Find where the data table ends (last row, last column).

**Challenges**:
- Empty rows within the table
- Summary rows after the table
- Notes or metadata below the table

**Algorithm**:

```python
@dataclass
class DataRegion:
    """Represents a rectangular data region in a sheet"""
    sheet_name: str
    header_row: int
    data_start_row: int
    data_end_row: int
    start_col: int
    end_col: int
    column_names: List[str]
    quality_score: float
    warnings: List[str]

class RegionDetector:
    """Detect rectangular data regions"""
    
    SUMMARY_KEYWORDS = ['total', 'subtotal', 'grand total', 'summary', 'sum', 'average', 'count']
    
    def detect_regions(self, sheet_data: RawSheetData) -> List[DataRegion]:
        """
        Detect all data regions in a sheet
        
        Typically returns one region per sheet, but may find multiple
        if the sheet contains separate tables
        """
        
        header_detector = HeaderDetector()
        header_candidates = header_detector.find_header_rows(sheet_data.cells)
        
        regions = []
        
        for header_row in header_candidates:
            region = self._extract_region(sheet_data, header_row)
            
            if region:
                regions.append(region)
        
        # If no headers found, try headerless detection
        if not regions:
            region = self._detect_headerless_region(sheet_data)
            if region:
                regions.append(region)
        
        return regions
    
    def _extract_region(
        self,
        sheet_data: RawSheetData,
        header_row: int
    ) -> Optional[DataRegion]:
        """Extract data region starting from detected header row"""
        
        cells = sheet_data.cells
        
        # Step 1: Determine column range
        start_col, end_col = self._find_column_range(cells[header_row])
        
        if end_col - start_col < 1:  # Need at least 2 columns
            return None
        
        # Step 2: Extract column names
        column_names = []
        for col_idx in range(start_col, end_col + 1):
            if col_idx < len(cells[header_row]):
                cell = cells[header_row][col_idx]
                name = str(cell.value) if cell.value else f"Column_{col_idx}"
                column_names.append(name)
            else:
                column_names.append(f"Column_{col_idx}")
        
        # Step 3: Find last data row
        data_start = header_row + 1
        data_end = self._find_last_data_row(
            cells,
            data_start,
            start_col,
            end_col
        )
        
        if data_end <= data_start:  # No data rows
            return None
        
        # Step 4: Calculate quality score
        quality, warnings = self._score_region_quality(
            cells,
            header_row,
            data_start,
            data_end,
            start_col,
            end_col,
            column_names
        )
        
        return DataRegion(
            sheet_name=sheet_data.name,
            header_row=header_row,
            data_start_row=data_start,
            data_end_row=data_end,
            start_col=start_col,
            end_col=end_col,
            column_names=column_names,
            quality_score=quality,
            warnings=warnings
        )
    
    def _find_column_range(self, header_row: List[CellData]) -> Tuple[int, int]:
        """Find the start and end column indices of the data table"""
        
        # Find first non-empty cell
        start_col = 0
        for idx, cell in enumerate(header_row):
            if cell.value not in [None, '', ' ']:
                start_col = idx
                break
        
        # Find last non-empty cell
        end_col = len(header_row) - 1
        for idx in range(len(header_row) - 1, -1, -1):
            if header_row[idx].value not in [None, '', ' ']:
                end_col = idx
                break
        
        return start_col, end_col
    
    def _find_last_data_row(
        self,
        cells: List[List[CellData]],
        start_row: int,
        start_col: int,
        end_col: int
    ) -> int:
        """
        Find the last row that belongs to the data table
        
        Stops when:
        - 3+ consecutive completely empty rows
        - Row contains summary keywords
        - Detected merged cell region (usually indicates a note or section break)
        """
        
        empty_row_count = 0
        last_data_row = start_row
        
        for row_idx in range(start_row, len(cells)):
            row = cells[row_idx]
            
            # Check if row is empty in the column range
            is_empty = self._is_row_empty(row, start_col, end_col)
            
            if is_empty:
                empty_row_count += 1
                if empty_row_count >= 3:
                    # Found end of data
                    return last_data_row
            else:
                empty_row_count = 0
                last_data_row = row_idx
                
                # Check for summary row
                if self._is_summary_row(row, start_col, end_col):
                    return row_idx - 1  # Don't include summary row
        
        return last_data_row
    
    def _is_row_empty(
        self,
        row: List[CellData],
        start_col: int,
        end_col: int
    ) -> bool:
        """Check if row is empty within the column range"""
        
        for col_idx in range(start_col, end_col + 1):
            if col_idx < len(row):
                if row[col_idx].value not in [None, '', ' ']:
                    return False
        
        return True
    
    def _is_summary_row(
        self,
        row: List[CellData],
        start_col: int,
        end_col: int
    ) -> bool:
        """Check if row appears to be a summary/total row"""
        
        for col_idx in range(start_col, min(start_col + 2, end_col + 1)):
            if col_idx < len(row):
                value = str(row[col_idx].value).lower() if row[col_idx].value else ''
                
                if any(keyword in value for keyword in self.SUMMARY_KEYWORDS):
                    return True
        
        return False
    
    def _score_region_quality(
        self,
        cells: List[List[CellData]],
        header_row: int,
        data_start: int,
        data_end: int,
        start_col: int,
        end_col: int,
        column_names: List[str]
    ) -> Tuple[float, List[str]]:
        """
        Score the quality of detected region
        
        Returns: (quality_score, warnings)
        """
        
        score = 1.0
        warnings = []
        
        # Check for duplicate column names
        if len(column_names) != len(set(column_names)):
            score -= 0.2
            warnings.append("Duplicate column names detected")
        
        # Check for empty column names
        empty_cols = sum(1 for name in column_names if not name or name.startswith('Column_'))
        if empty_cols > 0:
            score -= 0.1 * (empty_cols / len(column_names))
            warnings.append(f"{empty_cols} columns have no header names")
        
        # Check data density (% of non-empty cells)
        total_cells = (data_end - data_start + 1) * (end_col - start_col + 1)
        non_empty = 0
        
        for row_idx in range(data_start, data_end + 1):
            if row_idx < len(cells):
                for col_idx in range(start_col, end_col + 1):
                    if col_idx < len(cells[row_idx]):
                        if cells[row_idx][col_idx].value not in [None, '', ' ']:
                            non_empty += 1
        
        density = non_empty / total_cells if total_cells > 0 else 0
        
        if density < 0.3:
            score -= 0.3
            warnings.append(f"Low data density: {density:.1%}")
        elif density < 0.5:
            score -= 0.1
        
        # Check for reasonable table dimensions
        num_rows = data_end - data_start + 1
        num_cols = end_col - start_col + 1
        
        if num_rows < 2:
            score -= 0.3
            warnings.append("Very few data rows")
        
        if num_cols < 2:
            score -= 0.2
            warnings.append("Very few columns")
        
        # Ensure score is in [0, 1]
        score = max(0.0, min(1.0, score))
        
        return score, warnings
    
    def _detect_headerless_region(self, sheet_data: RawSheetData) -> Optional[DataRegion]:
        """
        Attempt to detect data region even without clear header row
        
        Strategy:
        - Assume first row is header
        - Look for consistent column types
        - Generate default column names
        """
        
        cells = sheet_data.cells
        
        if len(cells) < 2:
            return None
        
        # Use first non-empty row as pseudo-header
        header_row = 0
        for idx, row in enumerate(cells[:5]):
            if not self._is_row_empty(row, 0, len(row) - 1):
                header_row = idx
                break
        
        start_col, end_col = self._find_column_range(cells[header_row])
        
        # Generate column names based on position
        column_names = [f"Column_{chr(65 + i)}" for i in range(start_col, end_col + 1)]
        
        data_start = header_row
        data_end = self._find_last_data_row(cells, data_start, start_col, end_col)
        
        if data_end <= data_start:
            return None
        
        return DataRegion(
            sheet_name=sheet_data.name,
            header_row=header_row,
            data_start_row=data_start,
            data_end_row=data_end,
            start_col=start_col,
            end_col=end_col,
            column_names=column_names,
            quality_score=0.5,  # Lower confidence for headerless detection
            warnings=["No clear header row detected; using generated column names"]
        )
```

## 3. Normalization

### 3.1 DataFrame Conversion

**Goal**: Convert detected `DataRegion` into a clean Pandas DataFrame.

**Implementation**:

```python
import pandas as pd
import numpy as np

class DataFrameNormalizer:
    """Convert DataRegion to normalized Pandas DataFrame"""
    
    def normalize(
        self,
        region: DataRegion,
        cells: List[List[CellData]]
    ) -> pd.DataFrame:
        """
        Create normalized DataFrame from data region
        
        Steps:
        1. Extract data rows
        2. Handle duplicate column names
        3. Handle empty column names
        4. Remove completely empty columns
        5. Infer and set data types
        6. Add metadata (original row numbers)
        """
        
        # Step 1: Extract data
        data_rows = []
        
        for row_idx in range(region.data_start_row, region.data_end_row + 1):
            if row_idx < len(cells):
                row_data = []
                for col_idx in range(region.start_col, region.end_col + 1):
                    if col_idx < len(cells[row_idx]):
                        cell = cells[row_idx][col_idx]
                        value = cell.value
                        
                        # Handle formulas - use calculated value not formula string
                        if cell.data_type == 'f' and hasattr(cell, 'calculated_value'):
                            value = cell.calculated_value
                        
                        row_data.append(value)
                    else:
                        row_data.append(None)
                
                data_rows.append(row_data)
        
        # Step 2: Create DataFrame with original column names
        df = pd.DataFrame(data_rows, columns=region.column_names)
        
        # Step 3: Handle duplicate column names
        df = self._handle_duplicate_columns(df)
        
        # Step 4: Remove completely empty columns
        df = df.dropna(axis=1, how='all')
        
        # Step 5: Infer and set data types
        df = self._infer_types(df)
        
        # Step 6: Add metadata
        df.attrs['source_sheet'] = region.sheet_name
        df.attrs['header_row'] = region.header_row
        df.attrs['start_row'] = region.data_start_row
        df.attrs['end_row'] = region.data_end_row
        df.attrs['quality_score'] = region.quality_score
        df.attrs['warnings'] = region.warnings
        
        # Add original row number as index metadata
        df['_row_number'] = range(region.data_start_row, region.data_end_row + 1)
        
        return df
    
    def _handle_duplicate_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Rename duplicate column names by appending _1, _2, etc."""
        
        cols = df.columns.tolist()
        seen = {}
        new_cols = []
        
        for col in cols:
            if col in seen:
                seen[col] += 1
                new_cols.append(f"{col}_{seen[col]}")
            else:
                seen[col] = 0
                new_cols.append(col)
        
        df.columns = new_cols
        return df
    
    def _infer_types(self, df: pd.DataFrame) -> pd.DataFrame:
        """Infer and convert column data types"""
        
        for col in df.columns:
            if col == '_row_number':
                continue
            
            # Try numeric conversion
            try:
                numeric = pd.to_numeric(df[col], errors='coerce')
                # If >80% of non-null values converted successfully, use numeric
                non_null_count = df[col].notna().sum()
                numeric_count = numeric.notna().sum()
                
                if non_null_count > 0 and numeric_count / non_null_count > 0.8:
                    df[col] = numeric
                    continue
            except:
                pass
            
            # Try datetime conversion
            try:
                datetime = pd.to_datetime(df[col], errors='coerce')
                non_null_count = df[col].notna().sum()
                datetime_count = datetime.notna().sum()
                
                if non_null_count > 0 and datetime_count / non_null_count > 0.8:
                    df[col] = datetime
                    continue
            except:
                pass
            
            # Default to string, but strip whitespace
            df[col] = df[col].astype(str).str.strip()
            df[col] = df[col].replace('nan', np.nan)
        
        return df
```

## 4. Formula Extraction

**Implementation**:

```python
@dataclass
class FormulaDefinition:
    """Represents a formula found in the spreadsheet"""
    sheet_name: str
    row: int
    column: int
    column_name: str
    formula_string: str
    calculated_value: Any
    referenced_cells: List[str]  # e.g., ['A1', 'Sheet2!B5']
    referenced_ranges: List[str]  # e.g., ['A1:A10', 'Sheet2!B:B']

class FormulaExtractor:
    """Extract formulas from spreadsheet"""
    
    def extract(
        self,
        sheets: Dict[str, RawSheetData],
        regions: Dict[str, DataRegion]
    ) -> List[FormulaDefinition]:
        """Extract all formulas from detected data regions"""
        
        formulas = []
        
        for sheet_name, sheet_data in sheets.items():
            if sheet_name not in regions:
                continue
            
            region = regions[sheet_name]
            
            for row_idx in range(region.data_start_row, region.data_end_row + 1):
                if row_idx >= len(sheet_data.cells):
                    continue
                
                for col_idx in range(region.start_col, region.end_col + 1):
                    if col_idx >= len(sheet_data.cells[row_idx]):
                        continue
                    
                    cell = sheet_data.cells[row_idx][col_idx]
                    
                    if cell.formula:
                        col_name = region.column_names[col_idx - region.start_col]
                        
                        formula_def = FormulaDefinition(
                            sheet_name=sheet_name,
                            row=row_idx,
                            column=col_idx,
                            column_name=col_name,
                            formula_string=cell.formula,
                            calculated_value=cell.value,
                            referenced_cells=self._extract_cell_references(cell.formula),
                            referenced_ranges=self._extract_range_references(cell.formula)
                        )
                        
                        formulas.append(formula_def)
        
        return formulas
    
    def _extract_cell_references(self, formula: str) -> List[str]:
        """Extract cell references like A1, Sheet2!B5"""
        
        # Pattern: optional sheet name, cell reference
        pattern = r'(?:([A-Za-z0-9_]+)!)?([A-Z]+[0-9]+)'
        matches = re.findall(pattern, formula)
        
        refs = []
        for sheet, cell in matches:
            if sheet:
                refs.append(f"{sheet}!{cell}")
            else:
                refs.append(cell)
        
        return refs
    
    def _extract_range_references(self, formula: str) -> List[str]:
        """Extract range references like A1:A10, Sheet2!B:B"""
        
        # Pattern: cell:cell or column:column
        pattern = r'(?:([A-Za-z0-9_]+)!)?([A-Z]+[0-9]*:[A-Z]+[0-9]*)'
        matches = re.findall(pattern, formula)
        
        refs = []
        for sheet, range_ref in matches:
            if sheet:
                refs.append(f"{sheet}!{range_ref}")
            else:
                refs.append(range_ref)
        
        return refs
```

## Summary

The Parser Layer provides:

1. **Unified file loading** for Excel (xlsx/xls) and CSV formats
2. **Robust structure detection** that handles headers in various locations
3. **Data region boundary detection** that stops at summary rows and empty regions
4. **Normalization** into clean Pandas DataFrames with proper type inference
5. **Formula extraction** with reference tracking for later translation

All components include confidence scoring and warning generation to support the validation layer's assessment of detection quality.

Next steps: Use these parsed and normalized DataFrames as input to the Entity Inference Engine and Formula Translator.

