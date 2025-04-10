import pandas as pd
import os

def prepare_excel_to_markdown(excel_path, output_path=None, preview_rows=5):
    """
    Convert Excel file to Markdown format with data validation and preview
    
    Parameters:
    -----------
    excel_path : str
        Path to the Excel file
    output_path : str, optional
        Path for the output Markdown file. If None, will use same name as Excel file
    preview_rows : int, optional
        Number of rows to preview
    
    Returns:
    --------
    str
        Path to the generated Markdown file
    """
    # Verify input file exists
    if not os.path.exists(excel_path):
        raise FileNotFoundError(f"Excel file not found: {excel_path}")
        
    # Set default output path if none provided
    if output_path is None:
        output_path = os.path.splitext(excel_path)[0] + "_output.md"
    
    # Read Excel file
    print(f"\nLoading Excel file: {excel_path}")
    df = pd.read_excel(excel_path)
    
    # Display initial information
    print("\nDataset Information:")
    print(f"Number of rows: {len(df)}")
    print(f"Number of columns: {len(df.columns)}")
    print("\nColumns found:")
    for col in df.columns:
        non_null = df[col].count()
        print(f"- {col}: {non_null} non-null values")
    
    # Preview data
    print(f"\nFirst {preview_rows} rows of data:")
    print(df.head(preview_rows))
    
    # Convert to Markdown
    print("\nConverting to Markdown format...")
    markdown_table = df.to_markdown(index=False)
    
    # Save to file
    print(f"Saving to: {output_path}")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown_table)
    
    # Verify the file was created
    if os.path.exists(output_path):
        file_size = os.path.getsize(output_path) / 1024  # Convert to KB
        print(f"\nMarkdown file successfully created:")
        print(f"- Path: {output_path}")
        print(f"- Size: {file_size:.2f} KB")
        
        # Read back a few lines to verify content
        print("\nVerifying Markdown content (first few lines):")
        with open(output_path, 'r', encoding='utf-8') as f:
            print(f.readline().strip())  # Header line
            print(f.readline().strip())  # Separator line
            print(f.readline().strip())  # First data line
    else:
        raise IOError("Failed to create Markdown file")
        
    return output_path

def verify_markdown_columns(markdown_path):
    """
    Verify and display columns in the Markdown file
    
    Parameters:
    -----------
    markdown_path : str
        Path to the Markdown file
    
    Returns:
    --------
    list
        List of column names
    """
    df = pd.read_table(markdown_path, sep='|', skiprows=1)
    df.columns = df.columns.str.strip()
    
    print("\nColumns in Markdown file:")
    for i, col in enumerate(df.columns, 1):
        print(f"{i}. '{col}'")
        
    return df.columns.tolist()

if __name__ == "__main__":
    # Configuration
    excel_file = "fichier_trad.xlsx"
    markdown_file = "fichier_trad_output.md"
    
    try:
        # Convert Excel to Markdown
        output_path = prepare_excel_to_markdown(
            excel_path=excel_file,
            output_path=markdown_file,
            preview_rows=3
        )
        
        # Verify columns in created Markdown file
        columns = verify_markdown_columns(output_path)
        
        print("\nConversion completed successfully!")
        
    except Exception as e:
        print(f"\nError occurred: {str(e)}")