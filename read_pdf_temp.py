import sys

# Try to import pypdf or PyPDF2
try:
    import pypdf
    reader_cls = pypdf.PdfReader
except ImportError:
    try:
        import PyPDF2
        reader_cls = PyPDF2.PdfReader
    except ImportError:
        print("MISSING_LIB")
        sys.exit(0)

file_path = r"C:\Users\mishr\OneDrive\Desktop\CA Automator.pdf"

try:
    reader = reader_cls(file_path)
    text = ""
    print(f"--- START PDF CONTENT ({len(reader.pages)} pages) ---")
    for i, page in enumerate(reader.pages):
        print(f"--- PAGE {i+1} ---")
        print(page.extract_text())
    print("--- END PDF CONTENT ---")
except Exception as e:
    print(f"ERROR: {e}")
