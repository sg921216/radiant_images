"""Read-only visual/text bounds check for the synthetic pricing download fixture."""
from pathlib import Path
import argparse
import pymupdf
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument('pdf', type=Path)
parser.add_argument('--revision', required=True)
parser.add_argument('--price', default='$250.00')
args = parser.parse_args()
reader = PdfReader(args.pdf)
doc = pymupdf.open(args.pdf)
assert len(reader.pages) == len(doc) == 3, 'Expected one fixture page per shoot type'
for index, (page, kind) in enumerate(zip(doc, ['Maternity', 'Newborn', 'Family'])):
    visible = page.get_text()
    for expected in [f'{kind} pricing', args.price, args.revision]:
        assert expected in visible, f'Missing visible pricing content on page {index + 1}'
        assert expected in reader.pages[index].extract_text()
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            for span in line.get('spans', []):
                assert page.rect.contains(pymupdf.Rect(span['bbox'])), 'Text extends outside a PDF page'
    page.get_pixmap(matrix=pymupdf.Matrix(1.1, 1.1)).save(args.pdf.parent / f'pricing-page-{index + 1}.png')
print('Three visible pricing sections, prices, revision footers and text bounds verified.')
