from pathlib import Path
from PIL import Image, ImageDraw

files = sorted(p for p in Path('images').rglob('*') if p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'})
for i, path in enumerate(files, 1):
    with Image.open(path) as image:
        print(f'{i}\t{path}\t{image.width}x{image.height}\t{path.suffix.lower()}')

out = Path('catalog-contact-sheets')
out.mkdir(exist_ok=True)
cellw, cellh = 200, 160
for start in range(0, len(files), 20):
    sheet = Image.new('RGB', (1000, 800), 'white')
    draw = ImageDraw.Draw(sheet)
    for j, path in enumerate(files[start:start + 20]):
        image = Image.open(path).convert('RGB')
        image.thumbnail((cellw - 10, cellh - 30))
        x = (j % 5) * cellw + (cellw - image.width) // 2
        y = (j // 5) * cellh
        sheet.paste(image, (x, y))
        draw.text(((j % 5) * cellw + 4, y + cellh - 24), f'{start+j+1}: {path.name[:24]}', fill='black')
    sheet.save(out / f'sheet-{start // 20 + 1}.jpg', quality=88)
