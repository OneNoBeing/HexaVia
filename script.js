const canvas = document.getElementById('hexCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const colsSelect = document.getElementById('cols');
const rowsSelect = document.getElementById('rows');
const colorPicker = document.getElementById('colorPicker');
const textureInput = document.getElementById('textureInput');

let hexRadius = 40;
let hexHeight = Math.sqrt(3) * hexRadius;
let cols = 12;
let rows = 10;
let grid = [];
let currentColor = colorPicker ? colorPicker.value : '#ffeb3b';
let textureImg = null;
let useTexture = false;
let isRotated = false;

if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
        useTexture = false;
    });
}

// Modifica o grid para suportar cor ou textura
function createGrid(c, r, rotated = false) {
    cols = c;
    rows = r;
    grid = [];
    for (let row = 0; row < rows; row++) {
        let line = [];
        for (let col = 0; col < cols; col++) {
            line.push({ color: '#4fc3f7', texture: null });
        }
        grid.push(line);
    }
    isRotated = rotated;
    resizeCanvas();
    drawGrid();
}

function resizeCanvas() {
    if (isRotated) {
        canvas.width = hexHeight * cols + hexRadius;
        canvas.height = hexRadius * 1.5 * rows + hexRadius;
    } else {
        canvas.width = hexRadius * 1.5 * cols + hexRadius;
        canvas.height = hexHeight * rows + hexRadius;
    }
}

function drawHex(x, y, cell) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        let angle = Math.PI / 3 * i;
        if (isRotated) angle += Math.PI / 2;
        const px = x + hexRadius * Math.cos(angle);
        const py = y + hexRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (cell.texture) {
        // desenha textura
        ctx.clip();
        ctx.drawImage(cell.texture, x - hexRadius, y - hexRadius, hexRadius * 2, hexRadius * 2);
    } else {
        ctx.fillStyle = cell.color;
        ctx.fill();
    }
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let x, y;
            if (isRotated) {
                y = hexRadius + row * hexRadius * 1.5;
                x = hexHeight / 2 + col * hexHeight + (row % 2) * (hexHeight / 2);
            } else {
                x = hexRadius + col * hexRadius * 1.5;
                y = hexRadius + row * hexHeight + (col % 2) * (hexHeight / 2);
            }
            drawHex(x, y, grid[row][col]);
        }
    }
}

function pointInHex(px, py, hx, hy) {
    return Math.hypot(px - hx, py - hy) < hexRadius;
}

canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found = false;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let x, y;
            if (isRotated) {
                y = hexRadius + row * hexRadius * 1.5;
                x = hexHeight / 2 + col * hexHeight + (row % 2) * (hexHeight / 2);
            } else {
                x = hexRadius + col * hexRadius * 1.5;
                y = hexRadius + row * hexHeight + (col % 2) * (hexHeight / 2);
            }
            if (pointInHex(mx, my, x, y)) {
                if (useTexture && selectedTextureFolder !== null && texturePalette[selectedTextureFolder].images.length > 0) {
                    // Pasta selecionada: sorteia uma imagem
                    const folder = texturePalette[selectedTextureFolder];
                    const imgs = folder.images;
                    const img = imgs[Math.floor(Math.random() * imgs.length)];
                    if (grid[row][col].texture === img) {
                        grid[row][col].texture = null;
                        grid[row][col].color = '#4fc3f7';
                    } else {
                        grid[row][col].texture = img;
                        grid[row][col].color = '#fff';
                    }
                } else if (grid[row][col].texture) {
                    grid[row][col].texture = null;
                    grid[row][col].color = '#4fc3f7';
                } else if (currentColor) {
                    if (grid[row][col].color === currentColor) {
                        grid[row][col].color = '#4fc3f7';
                    } else {
                        grid[row][col].color = currentColor;
                    }
                } else {
                    grid[row][col].color = '#4fc3f7';
                }
                drawGrid();
                expandIfNearBorder(row, col);
                found = true;
                break;
            }
        }
        if (found) break;
    }
});

// Corrige bug: novos hexes criados no grid devem ser objetos { color, texture }
function expandIfNearBorder(row, col) {
    const margin = 1;
    let expanded = false;
    if (row <= margin) {
        grid.unshift(Array(cols).fill().map(() => ({ color: '#4fc3f7', texture: null })));
        rows++;
        expanded = true;
    }
    if (row >= rows - 1 - margin) {
        grid.push(Array(cols).fill().map(() => ({ color: '#4fc3f7', texture: null })));
        rows++;
        expanded = true;
    }
    if (col <= margin) {
        for (let r = 0; r < rows; r++) grid[r].unshift({ color: '#4fc3f7', texture: null });
        cols++;
        expanded = true;
    }
    if (col >= cols - 1 - margin) {
        for (let r = 0; r < rows; r++) grid[r].push({ color: '#4fc3f7', texture: null });
        cols++;
        expanded = true;
    }
    if (expanded) {
        resizeCanvas();
        drawGrid();
    }
}

menu.addEventListener('submit', function(e) {
    e.preventDefault();
    const c = parseInt(colsSelect.value, 10);
    const r = parseInt(rowsSelect.value, 10);
    createGrid(c, r, isRotated); // Mantém orientação atual
});

document.addEventListener('DOMContentLoaded', () => {
    createGrid(cols, rows);
});

// === NOVA UI: Menus horizontais, limpos, sem sobreposição ===
// Remove menus antigos se existirem
const oldPalette = document.querySelector('.palette-menu');
if (oldPalette) oldPalette.remove();
const oldTexture = document.querySelector('.texture-menu');
if (oldTexture) oldTexture.remove();

// Paleta de cores horizontal com botão de adicionar cor
// Substituído pelas cores da imagem fornecida, de cima para baixo
const paletteColors = [
    '#6b747b', // cinza escuro
    '#d86d2a', // laranja
    '#1fa12a', // verde
    '#1a7cf2', // azul
    '#f6a6e7', // rosa claro
    '#f67b8c', // rosa médio
    '#f6f67b', // amarelo
    '#1fe2d2', // ciano
    '#232728'  // preto/cinza escuro
];
const paletteMenu = document.createElement('div');
paletteMenu.className = 'palette-menu';
paletteMenu.style.display = 'flex';
paletteMenu.style.flexDirection = 'row';
paletteMenu.style.alignItems = 'center';
paletteMenu.style.gap = '8px';
paletteMenu.style.margin = '0 32px 20px 0';
paletteMenu.style.background = 'rgba(30,32,36,0.95)';
paletteMenu.style.borderRadius = '12px';
paletteMenu.style.padding = '10px 18px';
paletteMenu.style.boxShadow = '0 2px 12px 0 rgba(0,0,0,0.10)';

function renderPaletteColors() {
    paletteMenu.innerHTML = '';
    paletteColors.forEach((color, idx) => {
        const btnWrapper = document.createElement('div');
        btnWrapper.style.position = 'relative';
        btnWrapper.style.display = 'inline-block';
        btnWrapper.style.margin = '0';
        const btn = document.createElement('button');
        btn.style.background = color;
        btn.style.width = '32px';
        btn.style.height = '32px';
        btn.style.border = currentColor === color && !useTexture ? '2.5px solid #1976d2' : '1.5px solid #444';
        btn.style.margin = '0';
        btn.style.borderRadius = '50%';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'border 0.2s';
        btn.dataset.color = color;
        btn.title = color;
        btn.onclick = () => {
            if (currentColor === color && !useTexture) {
                currentColor = null;
            } else {
                currentColor = color;
                useTexture = false;
            }
            renderPaletteColors();
        };
        btnWrapper.appendChild(btn);
        // Só permite remover cores adicionadas (não as 9 iniciais)
        if (idx >= 9) {
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '×';
            delBtn.title = 'Remove color';
            delBtn.style.position = 'absolute';
            delBtn.style.top = '-7px';
            delBtn.style.right = '-7px';
            delBtn.style.width = '18px';
            delBtn.style.height = '18px';
            delBtn.style.border = 'none';
            delBtn.style.background = '#23272e';
            delBtn.style.color = '#e57373';
            delBtn.style.fontWeight = 'bold';
            delBtn.style.fontSize = '1em';
            delBtn.style.borderRadius = '50%';
            delBtn.style.cursor = 'pointer';
            delBtn.style.display = 'none';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                paletteColors.splice(idx, 1);
                renderPaletteColors();
            };
            btnWrapper.appendChild(delBtn);
            btnWrapper.onmouseenter = () => { delBtn.style.display = 'block'; };
            btnWrapper.onmouseleave = () => { delBtn.style.display = 'none'; };
        }
        paletteMenu.appendChild(btnWrapper);
    });
    // Add color button
    const addColorBtn = document.createElement('button');
    addColorBtn.innerHTML = '<span style="font-size:1.5em;line-height:1;">+</span>';
    addColorBtn.title = 'Add color';
    addColorBtn.style.width = '32px';
    addColorBtn.style.height = '32px';
    addColorBtn.style.fontWeight = 'bold';
    addColorBtn.style.fontSize = '1.2em';
    addColorBtn.style.border = '1.5px solid #444';
    addColorBtn.style.background = 'linear-gradient(135deg,#23272e,#2c313a)';
    addColorBtn.style.color = '#1976d2';
    addColorBtn.style.cursor = 'pointer';
    addColorBtn.style.display = 'flex';
    addColorBtn.style.alignItems = 'center';
    addColorBtn.style.justifyContent = 'center';
    addColorBtn.style.borderRadius = '50%';
    addColorBtn.style.margin = '0';
    addColorBtn.onclick = () => {
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.style.position = 'absolute';
        colorInput.style.left = '-9999px';
        document.body.appendChild(colorInput);
        colorInput.click();
        colorInput.oninput = () => {
            if (!paletteColors.includes(colorInput.value)) {
                paletteColors.push(colorInput.value);
                renderPaletteColors();
            }
            document.body.removeChild(colorInput);
        };
        colorInput.onblur = () => document.body.removeChild(colorInput);
    };
    paletteMenu.appendChild(addColorBtn);
}
renderPaletteColors();

// Paleta de texturas horizontal com botão de adicionar textura
// Cada slot é uma pasta (array de imagens)
let texturePalette = [];
const textureMenu = document.createElement('div');
textureMenu.className = 'texture-menu';
textureMenu.style.display = 'flex';
textureMenu.style.flexDirection = 'row';
textureMenu.style.alignItems = 'center';
textureMenu.style.gap = '12px';
textureMenu.style.margin = '0 0 20px 0';
textureMenu.style.background = 'rgba(30,32,36,0.95)';
textureMenu.style.borderRadius = '12px';
textureMenu.style.padding = '10px 18px';
textureMenu.style.boxShadow = '0 2px 12px 0 rgba(0,0,0,0.10)';

let selectedTextureFolder = null;

function renderTexturePalette() {
    textureMenu.innerHTML = '';
    texturePalette.forEach((folder, idx) => {
        const folderBtn = document.createElement('div');
        folderBtn.style.display = 'flex';
        folderBtn.style.flexDirection = 'column';
        folderBtn.style.alignItems = 'center';
        folderBtn.style.gap = '2px';
        folderBtn.style.position = 'relative';
        folderBtn.style.minWidth = '44px';

        // Miniaturas
        const thumbsContainer = document.createElement('div');
        thumbsContainer.style.display = 'flex';
        thumbsContainer.style.flexDirection = 'row';
        thumbsContainer.style.gap = '2px';
        thumbsContainer.style.marginBottom = '2px';
        folder.images.forEach((img, imgIdx) => {
            const thumbWrapper = document.createElement('div');
            thumbWrapper.style.position = 'relative';
            thumbWrapper.style.display = 'inline-block';
            const thumb = document.createElement('img');
            thumb.src = img.src;
            thumb.style.width = '18px';
            thumb.style.height = '18px';
            thumb.style.objectFit = 'cover';
            thumb.style.border = '1px solid #222';
            thumb.style.borderRadius = '4px';
            thumbWrapper.appendChild(thumb);
            // Botão de remover imagem
            const delImgBtn = document.createElement('button');
            delImgBtn.innerHTML = '×';
            delImgBtn.title = 'Remove texture';
            delImgBtn.style.position = 'absolute';
            delImgBtn.style.top = '-7px';
            delImgBtn.style.right = '-7px';
            delImgBtn.style.width = '16px';
            delImgBtn.style.height = '16px';
            delImgBtn.style.border = 'none';
            delImgBtn.style.background = '#23272e';
            delImgBtn.style.color = '#e57373';
            delImgBtn.style.fontWeight = 'bold';
            delImgBtn.style.fontSize = '0.9em';
            delImgBtn.style.borderRadius = '50%';
            delImgBtn.style.cursor = 'pointer';
            delImgBtn.style.display = 'none';
            delImgBtn.onclick = (e) => {
                e.stopPropagation();
                folder.images.splice(imgIdx, 1);
                renderTexturePalette();
            };
            thumbWrapper.appendChild(delImgBtn);
            thumbWrapper.onmouseenter = () => { delImgBtn.style.display = 'block'; };
            thumbWrapper.onmouseleave = () => { delImgBtn.style.display = 'none'; };
            thumbsContainer.appendChild(thumbWrapper);
        });
        folderBtn.appendChild(thumbsContainer);

        // Botão principal da pasta
        const btn = document.createElement('button');
        btn.style.width = '40px';
        btn.style.height = '22px';
        btn.style.padding = '0';
        btn.style.border = selectedTextureFolder === idx ? '2.5px solid #1976d2' : '1.5px solid #444';
        btn.style.background = '#23272e';
        btn.style.cursor = 'pointer';
        btn.style.borderRadius = '8px';
        btn.style.transition = 'border 0.2s';
        btn.title = 'Select texture folder';
        btn.innerText = folder.images.length > 0 ? '🎲' : '+';
        btn.onclick = () => {
            if (selectedTextureFolder === idx && useTexture) {
                selectedTextureFolder = null;
                useTexture = false;
            } else {
                selectedTextureFolder = idx;
                useTexture = true;
            }
            textureImg = null;
            renderTexturePalette();
        };
        folderBtn.appendChild(btn);

        // Botão para adicionar textura à pasta
        const addBtn = document.createElement('button');
        addBtn.innerHTML = '<span style="font-size:1.2em;line-height:1;">+</span>';
        addBtn.title = 'Add texture to folder';
        addBtn.style.width = '22px';
        addBtn.style.height = '22px';
        addBtn.style.fontWeight = 'bold';
        addBtn.style.fontSize = '1em';
        addBtn.style.border = '1.5px solid #444';
        addBtn.style.background = 'linear-gradient(135deg,#23272e,#2c313a)';
        addBtn.style.color = '#1976d2';
        addBtn.style.cursor = 'pointer';
        addBtn.style.position = 'absolute';
        addBtn.style.right = '-10px';
        addBtn.style.top = '-10px';
        addBtn.style.borderRadius = '50%';
        addBtn.onclick = (e) => {
            e.stopPropagation();
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
            fileInput.style.position = 'absolute';
            fileInput.style.left = '-9999px';
            document.body.appendChild(fileInput);
            fileInput.click();
            fileInput.onchange = (ev) => {
                const files = Array.from(fileInput.files);
                files.forEach(file => {
                    const img = new window.Image();
                    img.onload = function() {
                        folder.images.push(img);
                        renderTexturePalette();
                    };
                    img.src = URL.createObjectURL(file);
                });
                document.body.removeChild(fileInput);
            };
            fileInput.onblur = () => document.body.removeChild(fileInput);
        };
        folderBtn.appendChild(addBtn);
        // Botão para remover pasta (só se vazia)
        if (folder.images.length === 0) {
            const delFolderBtn = document.createElement('button');
            delFolderBtn.innerHTML = '×';
            delFolderBtn.title = 'Remove folder';
            delFolderBtn.style.position = 'absolute';
            delFolderBtn.style.top = '-7px';
            delFolderBtn.style.left = '-7px';
            delFolderBtn.style.width = '18px';
            delFolderBtn.style.height = '18px';
            delFolderBtn.style.border = 'none';
            delFolderBtn.style.background = '#23272e';
            delFolderBtn.style.color = '#e57373';
            delFolderBtn.style.fontWeight = 'bold';
            delFolderBtn.style.fontSize = '1em';
            delFolderBtn.style.borderRadius = '50%';
            delFolderBtn.style.cursor = 'pointer';
            delFolderBtn.style.display = 'none';
            delFolderBtn.onclick = (e) => {
                e.stopPropagation();
                texturePalette.splice(idx, 1);
                if (selectedTextureFolder === idx) selectedTextureFolder = null;
                renderTexturePalette();
            };
            folderBtn.appendChild(delFolderBtn);
            folderBtn.onmouseenter = () => { delFolderBtn.style.display = 'block'; };
            folderBtn.onmouseleave = () => { delFolderBtn.style.display = 'none'; };
        }
        textureMenu.appendChild(folderBtn);
    });
    // Add new folder button
    const addFolderBtn = document.createElement('button');
    addFolderBtn.innerHTML = '<span style="font-size:2em;line-height:1;">+</span>';
    addFolderBtn.title = 'New texture folder';
    addFolderBtn.style.width = '40px';
    addFolderBtn.style.height = '40px';
    addFolderBtn.style.fontWeight = 'bold';
    addFolderBtn.style.fontSize = '1.5em';
    addFolderBtn.style.border = '1.5px solid #444';
    addFolderBtn.style.background = 'linear-gradient(135deg,#23272e,#2c313a)';
    addFolderBtn.style.color = '#1976d2';
    addFolderBtn.style.cursor = 'pointer';
    addFolderBtn.style.display = 'flex';
    addFolderBtn.style.alignItems = 'center';
    addFolderBtn.style.justifyContent = 'center';
    addFolderBtn.style.margin = '2px 0';
    addFolderBtn.style.borderRadius = '12px';
    addFolderBtn.onclick = () => {
        texturePalette.push({ images: [] });
        renderTexturePalette();
    };
    textureMenu.appendChild(addFolderBtn);
}
renderTexturePalette();

// Adiciona as paletas horizontalmente acima do canvas
const paletasContainer = document.getElementById('paletas');
paletasContainer.innerHTML = '';
paletasContainer.style.display = 'flex';
paletasContainer.style.flexDirection = 'row';
paletasContainer.style.alignItems = 'center';
paletasContainer.style.gap = '32px';
paletasContainer.style.margin = '0 0 24px 0';
paletasContainer.appendChild(paletteMenu);
paletasContainer.appendChild(textureMenu);

// Input de textura oculto, mas funcional
if (textureInput) {
    textureInput.style.display = 'none';
    textureInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const img = new window.Image();
            img.onload = function() {
                texturePalette.push(img);
                textureImg = img;
                useTexture = true;
                renderTexturePalette();
            };
            img.src = URL.createObjectURL(file);
        }
    });
}

// Remove qualquer botão "Novo Grid 90°" deixado no HTML (duplicado)
const oldRotateBtn = document.querySelector('#rotateBtn');
if (oldRotateBtn) oldRotateBtn.remove();

// Add button to create 90-degree rotated grid
const menuForm = document.getElementById('menu');
const rotateBtn = document.createElement('button');
rotateBtn.type = 'button';
rotateBtn.textContent = 'New 90° Grid';
rotateBtn.style.padding = '8px 18px';
rotateBtn.style.borderRadius = '6px';
rotateBtn.style.background = '#222';
rotateBtn.style.color = '#fff';
rotateBtn.style.border = 'none';
rotateBtn.style.fontWeight = 'bold';
rotateBtn.style.cursor = 'pointer';
rotateBtn.style.marginLeft = '8px';
menuForm.appendChild(rotateBtn);

rotateBtn.onclick = () => {
    isRotated = !isRotated;
    createGrid(cols, rows, isRotated);
};

// Remove duplicate "New 90° Grid" button if it appears on the left (if exists)
const menuFormBtns = document.querySelectorAll('form#menu > #rotateBtn');
if (menuFormBtns.length > 1) {
    // Remove all but the last (the functional one created via script)
    for (let i = 0; i < menuFormBtns.length - 1; i++) {
        menuFormBtns[i].remove();
    }
}

// === Save and Load Project Buttons ===
const saveBtn = document.createElement('button');
saveBtn.type = 'button';
saveBtn.id = 'saveProjectBtn';
saveBtn.textContent = 'Save Project';
saveBtn.style.padding = '8px 18px';
saveBtn.style.borderRadius = '6px';
saveBtn.style.background = '#1976d2';
saveBtn.style.color = '#fff';
saveBtn.style.border = 'none';
saveBtn.style.fontWeight = 'bold';
saveBtn.style.cursor = 'pointer';
saveBtn.style.marginLeft = '8px';

const loadBtn = document.createElement('button');
loadBtn.type = 'button';
loadBtn.id = 'loadProjectBtn';
loadBtn.textContent = 'Load Project';
loadBtn.style.padding = '8px 18px';
loadBtn.style.borderRadius = '6px';
loadBtn.style.background = '#43a047';
loadBtn.style.color = '#fff';
loadBtn.style.border = 'none';
loadBtn.style.fontWeight = 'bold';
loadBtn.style.cursor = 'pointer';
loadBtn.style.marginLeft = '8px';

menu.appendChild(saveBtn);
menu.appendChild(loadBtn);

// Função para exportar o projeto (grid, cores, texturas, etc.)
function exportProject() {
    const data = {
        cols, rows, isRotated, paletteColors, texturePalette: texturePalette.map(f => ({ images: f.images.map(img => img.src) })), grid: grid.map(row => row.map(cell => ({ color: cell.color, texture: cell.texture ? cell.texture.src : null })))
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hexavia-project.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

// Função para importar o projeto
function importProject(json) {
    try {
        const data = JSON.parse(json);
        cols = data.cols; rows = data.rows; isRotated = data.isRotated;
        paletteColors.length = 0; data.paletteColors.forEach(c => paletteColors.push(c));
        texturePalette.length = 0;
        data.texturePalette.forEach(folder => {
            const images = folder.images.map(src => { const img = new window.Image(); img.src = src; return img; });
            texturePalette.push({ images });
        });
        grid = data.grid.map(row => row.map(cell => ({ color: cell.color, texture: cell.texture ? (() => { const img = new window.Image(); img.src = cell.texture; return img; })() : null })));
        resizeCanvas();
        drawGrid();
        renderPaletteColors();
        renderTexturePalette();
    } catch (e) { alert('Failed to load project!'); }
}

saveBtn.onclick = exportProject;
loadBtn.onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            importProject(ev.target.result);
        };
        reader.readAsText(file);
        document.body.removeChild(input);
    };
    input.click();
};

// === PALETA FIXA DE TEXTURAS (NÃO EDITÁVEL) ===
// Definição das texturas fixas agrupadas por prefixo
const fixedTextureFolders = [
    { name: 'Brick', path: 'Textures/Roads/Brick', files: [
        'T1-Brick-1.png','T1-Brick-2.png','T1-Brick-3.png','T1-Decorative-Brick-1.png','T2-Brick-1.png','T3-Brick-1.png','T3-Brick-2.png','T3-Decorative-Brick-1.png','T3-Decorative-Brick-2.png'] },
    { name: 'Stone', path: 'Textures/Roads/Stone', files: [
        'T1-Cobblenstone-1.png','T1-Cobblenstone-2.png','T1-Cobblenstone-3.png','T1-Gravel-1.png','T1-Gravel-2.png','T1-Gravel-3.png','T1-Stone-1.png','T1-Stone-2.png','T1-Stone-3.png','T2-Cobblestone-1.png','T2-Cobblestone-2.png','T2-Gravel-1.png','T2-Gravel-2.png','T2-Stone-1.png','T2-Stone-2.png','T2-Stone-3.png','T2-Stone-4.png','T3-Cobblestone-1.png','T3-Cobblestone-2.png','T3-Gravel-1.png','T3-Gravel-2.png','T3-Stone-1.png','T3-Stone-2.png','T4-Cobblestone-1.png','T4-Cobblestone-2.png','T4-Cobblestone-3.png','T4-Cobblestone-4.png','T4-Gravel-1.png','T4-Gravel-2.png','T4-Stone-1.png','T4-Stone-2.png','T4-Stone-3.png'] },
    { name: 'Wood', path: 'Textures/Roads/Wood', files: [
        'T1-Decorative-Wood-1.png','T1-Plank-1.png','T1-Plank-2.png','T1-Wood-1.png','T1-Wood-2.png','T2-Decorative-Wood-1.png','T2-Plank-1.png','T2-Plank-2.png','T2-Wood-1.png','T2-Wood-2.png','T2-Wood-3.png','T3-3Wood-1.png','T3-Decorative-Wood-1.png','T3-Wood-2.png','T4-Decorative-Wood-1.png','T4-Wood-1.png','T4-Wood-2.png','T4-Wood-3.png'] }
];

function groupFixedTextures(files) {
    const groups = {};
    files.forEach(file => {
        const base = file.replace(/\.png$/i, '');
        const prefix = base.replace(/-\d+$/, '');
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push(file);
    });
    return groups;
}

let fixedTexturePalette = [];
fixedTextureFolders.forEach(folder => {
    const groups = groupFixedTextures(folder.files);
    const textures = Object.keys(groups).map(key => {
        const images = groups[key].map(filename => {
            const img = new window.Image();
            img.src = folder.path + '/' + filename;
            return img;
        });
        return { name: key.replace(/T(\d+)-/, 'T$1 '), images };
    });
    fixedTexturePalette.push({ name: folder.name, textures });
});

let selectedFixedTexturePalette = null; // null = cor, 0 = Brick, 1 = Stone, 2 = Wood
let selectedFixedTexture = 0;

function renderFixedTexturePalette() {
    // Cria container se não existir
    let fixedMenu = document.getElementById('fixed-texture-menu');
    if (!fixedMenu) {
        fixedMenu = document.createElement('div');
        fixedMenu.id = 'fixed-texture-menu';
        fixedMenu.style.display = 'flex';
        fixedMenu.style.flexDirection = 'row';
        fixedMenu.style.alignItems = 'center';
        fixedMenu.style.gap = '12px';
        fixedMenu.style.margin = '0 0 20px 0';
        fixedMenu.style.background = 'rgba(30,32,36,0.95)';
        fixedMenu.style.borderRadius = '12px';
        fixedMenu.style.padding = '10px 18px';
        fixedMenu.style.boxShadow = '0 2px 12px 0 rgba(0,0,0,0.10)';
        document.getElementById('paletas').appendChild(fixedMenu);
    }
    fixedMenu.innerHTML = '';
    // Botão para voltar para cor
    const colorBtn = document.createElement('button');
    colorBtn.textContent = 'Cor';
    colorBtn.style.marginRight = '12px';
    colorBtn.style.padding = '6px 16px';
    colorBtn.style.borderRadius = '8px';
    colorBtn.style.background = selectedFixedTexturePalette === null ? '#1976d2' : '#23272e';
    colorBtn.style.color = '#fff';
    colorBtn.style.border = selectedFixedTexturePalette === null ? '2px solid #1976d2' : '1.5px solid #444';
    colorBtn.style.fontWeight = 'bold';
    colorBtn.style.cursor = 'pointer';
    colorBtn.onclick = () => {
        selectedFixedTexturePalette = null;
        useTexture = false;
        renderFixedTexturePalette();
    };
    fixedMenu.appendChild(colorBtn);
    // Paletas (Brick, Stone, Wood)
    fixedTexturePalette.forEach((pal, palIdx) => {
        const palBtn = document.createElement('button');
        palBtn.textContent = pal.name;
        palBtn.style.marginRight = '12px';
        palBtn.style.padding = '6px 16px';
        palBtn.style.borderRadius = '8px';
        palBtn.style.background = selectedFixedTexturePalette === palIdx ? '#1976d2' : '#23272e';
        palBtn.style.color = '#fff';
        palBtn.style.border = selectedFixedTexturePalette === palIdx ? '2px solid #1976d2' : '1.5px solid #444';
        palBtn.style.fontWeight = 'bold';
        palBtn.style.cursor = 'pointer';
        palBtn.onclick = () => {
            selectedFixedTexturePalette = palIdx;
            selectedFixedTexture = 0;
            useTexture = true;
            renderFixedTexturePalette();
        };
        fixedMenu.appendChild(palBtn);
    });
    // Texturas da paleta selecionada
    if (selectedFixedTexturePalette !== null) {
        const pal = fixedTexturePalette[selectedFixedTexturePalette];
        pal.textures.forEach((tex, texIdx) => {
            const texBtn = document.createElement('button');
            texBtn.style.marginRight = '8px';
            texBtn.style.padding = '0';
            texBtn.style.width = '44px';
            texBtn.style.height = '44px';
            texBtn.style.borderRadius = '8px';
            texBtn.style.background = selectedFixedTexture === texIdx ? '#1976d2' : '#23272e';
            texBtn.style.border = selectedFixedTexture === texIdx ? '2.5px solid #1976d2' : '1.5px solid #444';
            texBtn.style.cursor = 'pointer';
            texBtn.title = tex.name;
            texBtn.onclick = () => {
                selectedFixedTexture = texIdx;
                useTexture = true;
                renderFixedTexturePalette();
            };
            tex.images.forEach(img => {
                const thumb = document.createElement('img');
                thumb.src = img.src;
                thumb.style.width = '18px';
                thumb.style.height = '18px';
                thumb.style.objectFit = 'cover';
                thumb.style.margin = '2px';
                texBtn.appendChild(thumb);
            });
            fixedMenu.appendChild(texBtn);
        });
    }
}

// Inicializa a paleta fixa ao carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFixedTexturePalette);
} else {
    renderFixedTexturePalette();
}

// Altera o click do canvas para usar a paleta fixa se selecionada
const originalCanvasClick = canvas.onclick;
canvas.addEventListener('click', function(e) {
    if (selectedFixedTexturePalette !== null) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        let found = false;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let x, y;
                if (isRotated) {
                    y = hexRadius + row * hexRadius * 1.5;
                    x = hexHeight / 2 + col * hexHeight + (row % 2) * (hexHeight / 2);
                } else {
                    x = hexRadius + col * hexRadius * 1.5;
                    y = hexRadius + row * hexHeight + (col % 2) * (hexHeight / 2);
                }
                if (pointInHex(mx, my, x, y)) {
                    const pal = fixedTexturePalette[selectedFixedTexturePalette];
                    const tex = pal.textures[selectedFixedTexture];
                    if (tex && tex.images.length > 0) {
                        const img = tex.images[Math.floor(Math.random() * tex.images.length)];
                        if (grid[row][col].texture === img) {
                            grid[row][col].texture = null;
                            grid[row][col].color = '#4fc3f7';
                        } else {
                            grid[row][col].texture = img;
                            grid[row][col].color = '#fff';
                        }
                    }
                    drawGrid();
                    expandIfNearBorder(row, col);
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        return;
    }
    originalCanvasClick.call(canvas, e);
});