const canvas = document.getElementById('hexCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const colsSelect = document.getElementById('cols');
const rowsSelect = document.getElementById('rows');
const colorPicker = document.getElementById('colorPicker');
const textureInput = document.getElementById('textureInput');

// === VARIÁVEIS GLOBAIS ===
let hexRadius = 40;
let hexHeight = Math.sqrt(3) * hexRadius;
let cols = 12;
let rows = 10;
let grid = [];
let currentColor = '#ffeb3b';
let useTexture = false;
let isRotated = false;
let selectedTextureFolder = null;

// === INICIALIZAÇÃO ===
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
        ctx.save();
        ctx.clip();
        ctx.translate(x, y);
        if (isRotated) ctx.rotate(Math.PI / 2);
        ctx.drawImage(
            cell.texture,
            -hexRadius, -hexRadius,
            hexRadius * 2, hexRadius * 2
        );
        ctx.restore();
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
                if (selectedFixedTexturePalette !== null) {
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
                } else if (useTexture && selectedTextureFolder !== null && texturePalette[selectedTextureFolder].images.length > 0) {
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
                found = true;
                break;
            }
        }
        if (found) break;
    }
});

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
    createGrid(c, r, isRotated);
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
    '#6b747b', '#d86d2a', '#1fa12a', '#1a7cf2', '#f6a6e7', '#f67b8c', '#f6f67b', '#1fe2d2', '#232728'
];
const paletteMenu = document.createElement('div');
paletteMenu.className = 'palette-menu';
Object.assign(paletteMenu.style, {
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px',
    margin: '0 32px 20px 0', background: 'rgba(30,32,36,0.95)', borderRadius: '12px',
    padding: '10px 18px', boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)'
});

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
                selectedFixedTexturePalette = null;
                renderFixedTexturePalette && renderFixedTexturePalette();
            }
            renderPaletteColors();
        };
        btnWrapper.appendChild(btn);
        if (idx >= 9) {
            const delBtn = document.createElement('button');
            delBtn.innerHTML = '×';
            delBtn.title = 'Remove color';
            Object.assign(delBtn.style, {
                position: 'absolute', top: '-7px', right: '-7px', width: '18px', height: '18px',
                border: 'none', background: '#23272e', color: '#e57373', fontWeight: 'bold',
                fontSize: '1em', borderRadius: '50%', cursor: 'pointer', display: 'none'
            });
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
    Object.assign(addColorBtn.style, {
        width: '32px', height: '32px', fontWeight: 'bold', fontSize: '1.2em',
        border: '1.5px solid #444', background: 'linear-gradient(135deg,#23272e,#2c313a)',
        color: '#1976d2', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', borderRadius: '50%', margin: '0'
    });
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
Object.assign(textureMenu.style, {
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px',
    margin: '0 0 20px 0', background: 'rgba(30,32,36,0.95)', borderRadius: '12px',
    padding: '10px 18px', boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)'
});

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
            // Rotaciona a miniatura se o canvas estiver rotacionado
            if (isRotated) {
                thumb.style.transform = 'rotate(90deg)';
            } else {
                thumb.style.transform = '';
            }
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

// === INTEGRAÇÃO DAS PALETAS NA UI ===
const paletasContainer = document.getElementById('paletas');
paletasContainer.innerHTML = '';
paletasContainer.style.display = 'flex';
paletasContainer.style.flexDirection = 'column';
paletasContainer.style.alignItems = 'flex-end';
paletasContainer.style.gap = '32px';
paletasContainer.style.margin = '0';
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

// Remove qualquer botão duplicado de Create Grid, Save Project e Load Project
const menuForm = document.getElementById('menu');
['Create Grid', 'Save Project', 'Load Project'].forEach(text => {
    const btns = Array.from(menuForm.querySelectorAll('button')).filter(b => b.textContent.trim() === text);
    if (btns.length > 1) {
        for (let i = 1; i < btns.length; i++) btns[i].remove();
    }
});

// Remove Save Project, Load Project e New 90° Grid do HTML (caso estejam no form)
const saveBtnHtml = document.getElementById('saveProjectBtn');
if (saveBtnHtml) saveBtnHtml.remove();
const loadBtnHtml = document.getElementById('loadProjectBtn');
if (loadBtnHtml) loadBtnHtml.remove();
const rotateBtnHtml = document.getElementById('rotateBtn');
if (rotateBtnHtml) rotateBtnHtml.remove();

// Add button to create 90-degree rotated grid
const rotateBtn = document.createElement('button');
rotateBtn.type = 'button';
rotateBtn.textContent = 'New 90° Grid';
Object.assign(rotateBtn.style, {
    padding: '8px 18px', borderRadius: '6px', background: '#222', color: '#fff',
    border: 'none', fontWeight: 'bold', cursor: 'pointer', marginLeft: '8px'
});
menu.appendChild(rotateBtn);
rotateBtn.onclick = () => {
    isRotated = !isRotated;
    createGrid(cols, rows, isRotated);
};

const saveBtn = document.createElement('button');
saveBtn.type = 'button';
saveBtn.id = 'saveProjectBtn';
saveBtn.textContent = 'Save Project';
Object.assign(saveBtn.style, {
    padding: '8px 18px', borderRadius: '6px', background: '#1976d2', color: '#fff',
    border: 'none', fontWeight: 'bold', cursor: 'pointer', marginLeft: '8px'
});
const loadBtn = document.createElement('button');
loadBtn.type = 'button';
loadBtn.id = 'loadProjectBtn';
loadBtn.textContent = 'Load Project';
Object.assign(loadBtn.style, {
    padding: '8px 18px', borderRadius: '6px', background: '#43a047', color: '#fff',
    border: 'none', fontWeight: 'bold', cursor: 'pointer', marginLeft: '8px'
});
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

function groupFixedTextures(files, category) {
    const groups = {};
    files.forEach(file => {
        // Para Wood, ignorar arquivos que não sejam Plank, Wood ou Decorative Wood
        if (category === 'Wood' && !(/Plank|Wood|Decorative/i.test(file))) return;
        // Para Stone, ignorar arquivos que não sejam Gravel, Cobble, Stone
        if (category === 'Stone' && !(/Gravel|Cobble|Stone/i.test(file))) return;
        const base = file.replace(/\.png$/i, '');
        const prefix = base.replace(/-\d+$/, '');
        // Corrige bug do 3Wood: só aceita prefixos válidos
        if (category === 'Wood' && !/^T\d+-(Plank|Wood|Decorative-Wood)$/i.test(prefix)) return;
        if (category === 'Stone' && !/^T\d+-(Gravel|Cobblestone|Stone)$/i.test(prefix)) return;
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push(file);
    });
    return groups;
}

let fixedTexturePalette = [];
fixedTextureFolders.forEach(folder => {
    const groups = groupFixedTextures(folder.files, folder.name);
    const textures = Object.keys(groups).map(key => {
        const images = groups[key].map(filename => {
            const img = new window.Image();
            img.src = folder.path + '/' + filename;
            return img;
        });
        // Preview: pega -1.png se existir, senão a primeira
        let previewImg = images.find(img => /-1\.png$/i.test(img.src)) || images[0];
        return { name: key.replace(/T(\d+)-/, 'T$1 '), images, previewImg };
    });
    fixedTexturePalette.push({ name: folder.name, textures });
});

let selectedFixedTexturePalette = null; // null = cor, 0 = Brick, 1 = Stone, 2 = Wood
let selectedFixedTexture = 0;

function renderFixedTexturePalette() {
    let fixedMenu = document.getElementById('fixed-texture-menu');
    if (!fixedMenu) {
        fixedMenu = document.createElement('div');
        fixedMenu.id = 'fixed-texture-menu';
        document.getElementById('paletas').appendChild(fixedMenu);
    }
    fixedMenu.innerHTML = '';

    // Botão para cor
    const colorBtn = document.createElement('button');
    colorBtn.textContent = 'Cor';
    colorBtn.className = 'fixed-palette-title' + (selectedFixedTexturePalette === null ? ' active' : '');
    colorBtn.onclick = () => {
        selectedFixedTexturePalette = null;
        useTexture = false;
        renderFixedTexturePalette();
    };
    fixedMenu.appendChild(colorBtn);

    // Para cada grupo (Brick, Stone, Wood)
    fixedTexturePalette.forEach((pal, palIdx) => {
        // Grupo
        const group = document.createElement('div');
        group.className = 'fixed-palette-group';
        // Botão do grupo
        const groupBtn = document.createElement('button');
        groupBtn.textContent = pal.name;
        groupBtn.className = 'fixed-palette-title' + (selectedFixedTexturePalette === palIdx ? ' active' : '');
        groupBtn.onclick = () => {
            selectedFixedTexturePalette = selectedFixedTexturePalette === palIdx ? null : palIdx;
            selectedFixedTexture = 0;
            useTexture = selectedFixedTexturePalette !== null;
            renderFixedTexturePalette();
        };
        group.appendChild(groupBtn);
        // Lista de texturas (dropdown)
        const texList = document.createElement('div');
        texList.className = 'fixed-palette-textures' + (selectedFixedTexturePalette === palIdx ? ' active' : '');
        if (selectedFixedTexturePalette === palIdx) {
            pal.textures.forEach((tex, texIdx) => {
                const texBtn = document.createElement('button');
                texBtn.className = 'texture-btn' + (selectedFixedTexture === texIdx ? ' selected' : '');
                texBtn.title = tex.name;
                texBtn.onclick = () => {
                    selectedFixedTexture = texIdx;
                    useTexture = true;
                    renderFixedTexturePalette();
                };
                if (tex.previewImg) {
                    const thumb = document.createElement('img');
                    thumb.src = tex.previewImg.src;
                    texBtn.appendChild(thumb);
                }
                texList.appendChild(texBtn);
            });
        }
        group.appendChild(texList);
        fixedMenu.appendChild(group);
    });
}

// Inicializa a paleta fixa ao carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFixedTexturePalette);
} else {
    renderFixedTexturePalette();
}

// Altera o click do canvas para usar a paleta fixa se selecionada
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
                    found = true;
                    break;
                }
            }
            if (found) break;
        }
        return;
    }
});
