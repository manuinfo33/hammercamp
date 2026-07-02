from fpdf import FPDF

class HammercampReport(FPDF):
    def header(self):
        # Logo placeholder or Title
        self.set_font('helvetica', 'B', 20)
        self.set_text_color(139, 115, 85) # Brand brown/beige
        self.cell(0, 10, 'HAMMERCAMP - REPORTE DE SISTEMA', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128)
        self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

def generate_pdf():
    pdf = HammercampReport()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    # Section 1: Intro
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 10, '1. Introducción', 0, 1)
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(0, 0, 0)
    intro_text = (
        "Hammercamp es una plataforma integral de gestión deportiva diseñada para administrar equipos, "
        "delegados y categorías con una interfaz de usuario premium y moderna. El sistema se enfoca en la "
        "eficiencia operativa y la integridad de los datos, proporcionando herramientas avanzadas para la "
        "organización de torneos y eventos deportivos."
    )
    pdf.multi_cell(0, 6, intro_text)
    pdf.ln(5)

    # Section 2: Tech
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 10, '2. Tecnologías y Lenguajes', 0, 1)
    pdf.set_font('helvetica', 'B', 12)
    pdf.cell(0, 8, 'Backend:', 0, 1)
    pdf.set_font('helvetica', '', 11)
    pdf.multi_cell(0, 6, "- Lenguaje: Python 3.x\n- Framework: Django 5.x\n- API: Django REST Framework\n- Base de Datos: SQLite / PostgreSQL")
    pdf.ln(2)
    pdf.set_font('helvetica', 'B', 12)
    pdf.cell(0, 8, 'Frontend:', 0, 1)
    pdf.set_font('helvetica', '', 11)
    pdf.multi_cell(0, 6, "- Lenguaje: JavaScript (ES6+)\n- Framework: React 19\n- Build Tool: Vite\n- Estilizado: Vanilla CSS (Glassmorphism)")
    pdf.ln(5)

    # Section 3: Models
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 10, '3. Arquitectura de Datos', 0, 1)
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 6, "El sistema cuenta con modelos para Categorías, Delegados y Equipos, con relaciones bidireccionales y soporte para archivos multimedia (logos, fotos, DNI).")
    pdf.ln(5)

    # Section 4: Views
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(60, 60, 60)
    pdf.cell(0, 10, '4. Vistas Implementadas', 0, 1)
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 6, "1. Dashboard: Resumen estadístico.\n2. Equipos: Gestión completa de planteles.\n3. Delegados: Administración de responsables con validación de DNI.\n4. Unificador de PDF: Procesamiento inteligente de documentos.\n5. Login: Acceso seguro y protegido.")
    pdf.ln(10)

    # Final note
    pdf.set_font('helvetica', 'I', 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, 'Generado automáticamente por Antigravity AI.', 0, 1, 'R')

    pdf.output('reporte_hammercamp.pdf')
    print("PDF generado con éxito: reporte_hammercamp.pdf")

if __name__ == '__main__':
    generate_pdf()
