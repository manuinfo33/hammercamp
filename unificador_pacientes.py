import os
import io
import time
from pathlib import Path
import tempfile
from pypdf import PdfWriter, PdfReader, Transformation
from docx2pdf import convert as convert_docx_to_pdf

# Configuración de tamaño A4
A4_WIDTH = 595.28
A4_HEIGHT = 841.89

def docx_to_pdf_bytes(docx_path):
    """Convierte un archivo DOCX a un buffer de bytes PDF usando MS Word (docx2pdf)
    para preservar logos, imágenes, tablas y formato original al 100%."""
    import pythoncom
    try:
        pythoncom.CoInitialize()
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_dir_path = Path(temp_dir)
            pdf_path = temp_dir_path / "temp.pdf"
            
            # Convertir usando MS Word
            convert_docx_to_pdf(str(docx_path), str(pdf_path))
            
            if pdf_path.exists():
                with open(pdf_path, 'rb') as pdf_file:
                    buffer = io.BytesIO(pdf_file.read())
                    return buffer
            else:
                return None
    except Exception as e:
        print(f"   [!] Error convirtiendo DOCX {docx_path.name}: {e}")
        return None
    finally:
        try:
            pythoncom.CoUninitialize()
        except:
            pass

def add_page_normalized(writer, source_page):
    """Escala y centra la página a tamaño A4."""
    try:
        rotation = int(source_page.get('/Rotate') or 0) % 360
        orig_w = float(source_page.mediabox.width)
        orig_h = float(source_page.mediabox.height)

        if rotation in (90, 270):
            orig_w, orig_h = orig_h, orig_w

        if orig_w <= 0 or orig_h <= 0:
            writer.add_page(source_page)
            return

        scale = min(A4_WIDTH / orig_w, A4_HEIGHT / orig_h)
        scaled_w = orig_w * scale
        scaled_h = orig_h * scale

        tx = (A4_WIDTH - scaled_w) / 2
        ty = (A4_HEIGHT - scaled_h) / 2

        new_page = writer.add_blank_page(width=A4_WIDTH, height=A4_HEIGHT)
        transform = Transformation().scale(scale, scale).translate(tx, ty)
        new_page.merge_transformed_page(source_page, transform)
    except Exception as e:
        print(f"   [!] Error normalizando página: {e}")
        writer.add_page(source_page)

def procesar_carpeta_paciente(carpeta_path):
    """Une todos los PDF y DOCX dentro de una carpeta en un solo PDF."""
    nombre_paciente = carpeta_path.name
    print(f"\n[*] Procesando paciente: {nombre_paciente}")
    
    archivos = [f for f in carpeta_path.iterdir() if f.is_file() and f.suffix.lower() in ['.pdf', '.docx']]
    
    if not archivos:
        print(f"   [-] No se encontraron archivos válidos.")
        return

    # Ordenar por nombre
    archivos.sort(key=lambda x: x.name.lower())
    
    writer = PdfWriter()
    total_procesados = 0

    for f in archivos:
        # Evitar procesar el archivo que nosotros mismos creamos si ya existe
        if f.name == f"{nombre_paciente}.pdf":
            continue
            
        print(f"   -> Agregando: {f.name}")
        try:
            if f.suffix.lower() == '.pdf':
                reader = PdfReader(f)
                for page in reader.pages:
                    add_page_normalized(writer, page)
                total_procesados += 1
            elif f.suffix.lower() == '.docx':
                pdf_buffer = docx_to_pdf_bytes(f)
                if pdf_buffer:
                    reader = PdfReader(pdf_buffer)
                    for page in reader.pages:
                        add_page_normalized(writer, page)
                    total_procesados += 1
        except Exception as e:
            print(f"   [!] Error con {f.name}: {e}")

    if total_procesados > 0:
        output_path = carpeta_path / f"{nombre_paciente}.pdf"
        with open(output_path, "wb") as out:
            writer.write(out)
        print(f"   [OK] Guardado en: {output_path.name}")
    else:
        print(f"   [-] Nada que unificar.")

def main():
    # Usar la carpeta actual como raíz
    root = Path(".").resolve()
    print("==================================================")
    print("   UNIFICADOR AUTOMÁTICO DE PACIENTES (A4)")
    print("==================================================")
    print(f"Carpeta raíz: {root}")
    
    # Listar subcarpetas
    subcarpetas = [d for d in root.iterdir() if d.is_dir()]
    
    if not subcarpetas:
        print("\n[!] No se encontraron subcarpetas en este directorio.")
        print("Pon este script dentro de la carpeta que contiene a los pacientes.")
        return

    print(f"Se encontraron {len(subcarpetas)} carpetas de pacientes.")
    
    confirm = input("\n¿Deseas comenzar la unificación? (s/n): ")
    if confirm.lower() != 's':
        print("Cancelado.")
        return

    for carpeta in subcarpetas:
        procesar_carpeta_paciente(carpeta)

    print("\n==================================================")
    print("   PROCESO FINALIZADO")
    print("==================================================")
    time.sleep(2)

if __name__ == "__main__":
    main()
