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
// Novo: armazena índice de textura por célula para alternância
let cellTextureIndexes = [];

// NOVOS OFFSETS PARA CENTRALIZAR A GRADE NO CANVAS
let offsetX = 0;
let offsetY = 0;

// === INICIALIZAÇÃO ===
function createGrid(c, r, rotated = false) {
    cols = c;
    rows = r;
    grid = [];
    cellTextureIndexes = [];
    for (let row = 0; row < rows; row++) {
        let line = [];
        let idxLine = [];
        for (let col = 0; col < cols; col++) {
            line.push({ color: '#4fc3f7', texture: null });
            idxLine.push(0);
        }
        grid.push(line);
        cellTextureIndexes.push(idxLine);
    }
    isRotated = rotated;
    resizeCanvas();
    drawGrid();
}

function resizeCanvas() {
    let gridWidth, gridHeight;
    if (isRotated) {
        gridWidth = hexHeight * cols + hexRadius;
        gridHeight = hexRadius * 1.5 * rows + hexRadius;
    } else {
        gridWidth = hexRadius * 1.5 * cols + hexRadius;
        gridHeight = hexHeight * rows + hexRadius;
    }
    canvas.width = gridWidth + 32;
    canvas.height = gridHeight + 32;
    offsetX = (canvas.width - gridWidth) / 2;
    offsetY = (canvas.height - gridHeight) / 2;
}

function getHexPosition(row, col) {
    let x, y;
    if (isRotated) {
        y = offsetY + hexRadius + row * hexRadius * 1.5;
        x = offsetX + hexHeight / 2 + col * hexHeight + (row % 2) * (hexHeight / 2);
    } else {
        x = offsetX + hexRadius + col * hexRadius * 1.5;
        y = offsetY + hexRadius + row * hexHeight + (col % 2) * (hexHeight / 2);
    }
    return { x, y };
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
        ctx.drawImage(cell.texture, -hexRadius, -hexRadius, hexRadius * 2, hexRadius * 2);
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
            const { x, y } = getHexPosition(row, col);
            drawHex(x, y, grid[row][col]);
        }
    }
}

function pointInHex(px, py, hx, hy) {
    return Math.hypot(px - hx, py - hy) < hexRadius;
}

// Clique: considera scaling do canvas para zoom/scroll/resize
canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    let found = false;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const { x, y } = getHexPosition(row, col);
            if (pointInHex(mx, my, x, y)) {
                // Paleta fixa
                if (selectedFixedTexturePalette !== null) {
                    const pal = fixedTexturePalette[selectedFixedTexturePalette];
                    const tex = pal.textures[selectedFixedTexture];
                    let img = null;
                    if (tex && Array.isArray(tex.images) && tex.images.length > 0) {
                        const validImgs = tex.images.filter(img => img && typeof img.src === 'string' && img.src.length > 0);
                        if (validImgs.length > 0) {
                            img = validImgs[Math.floor(Math.random() * validImgs.length)];
                        }
                    }
                    if (img && typeof img.src === 'string' && img.src.length > 0) {
                        grid[row][col].texture = img;
                        grid[row][col].color = '#fff';
                    } else {
                        grid[row][col].texture = null;
                        grid[row][col].color = '#4fc3f7';
                    }
                }
                // Paleta customizada
                else if (useTexture && selectedTextureFolder !== null && texturePalette[selectedTextureFolder].images.length > 0) {
                    const folder = texturePalette[selectedTextureFolder];
                    let img = null;
                    const imgs = folder.images.filter(img => img && typeof img.src === 'string' && img.src.length > 0);
                    if (imgs.length > 0) {
                        img = imgs[Math.floor(Math.random() * imgs.length)];
                    }
                    if (img && typeof img.src === 'string' && img.src.length > 0) {
                        grid[row][col].texture = img;
                        grid[row][col].color = '#fff';
                    } else {
                        grid[row][col].texture = null;
                        grid[row][col].color = '#4fc3f7';
                    }
                }
                // Cor
                else if (currentColor) {
                    grid[row][col].texture = null;
                    grid[row][col].color = currentColor;
                }
                // Nenhuma cor selecionada
                else {
                    grid[row][col].texture = null;
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
    selectedFixedTexturePalette = null;
    useTexture = false;
    renderFixedTexturePalette();
});

document.addEventListener('DOMContentLoaded', () => {
    createGrid(cols, rows);
    selectedFixedTexturePalette = null;
    useTexture = false;
    renderFixedTexturePalette();
});

// NOVA UI: Menus horizontais, limpos, sem sobreposição
const oldPalette = document.querySelector('.palette-menu');
if (oldPalette) oldPalette.remove();
const oldTexture = document.querySelector('.texture-menu');
if (oldTexture) oldTexture.remove();

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
            if (isRotated) {
                thumb.style.transform = 'rotate(90deg)';
            } else {
                thumb.style.transform = '';
            }
            thumbWrapper.appendChild(thumb);
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

const paletasContainer = document.getElementById('paletas');
paletasContainer.innerHTML = '';
paletasContainer.style.display = 'flex';
paletasContainer.style.flexDirection = 'column';
paletasContainer.style.alignItems = 'flex-end';
paletasContainer.style.gap = '32px';
paletasContainer.style.margin = '0';
paletasContainer.appendChild(paletteMenu);
paletasContainer.appendChild(textureMenu);

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

const menuForm = document.getElementById('menu');
['Create Grid', 'Save Project', 'Load Project'].forEach(text => {
    const btns = Array.from(menuForm.querySelectorAll('button')).filter(b => b.textContent.trim() === text);
    if (btns.length > 1) {
        for (let i = 1; i < btns.length; i++) btns[i].remove();
    }
});

const saveBtnHtml = document.getElementById('saveProjectBtn');
if (saveBtnHtml) saveBtnHtml.remove();
const loadBtnHtml = document.getElementById('loadProjectBtn');
if (loadBtnHtml) loadBtnHtml.remove();
const rotateBtnHtml = document.getElementById('rotateBtn');
if (rotateBtnHtml) rotateBtnHtml.remove();

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
const fixedTextureFolders = [
    { name: 'Brick', path: 'Textures/Roads/Brick', files: [
        'T1-Brick-1.png','T1-Brick-2.png','T1-Brick-3.png','T1-Decorative-Brick-1.png','T2-Brick-1.png','T3-Brick-1.png','T3-Brick-2.png','T3-Decorative-Brick-1.png','T3-Decorative-Brick-2.png'] },
    { name: 'Stone', path: 'Textures/Roads/Stone', files: [
        'T1-Cobblestone-1.png','T1-Cobblestone-2.png','T1-Cobblestone-3.png','T1-Gravel-1.png','T1-Gravel-2.png','T1-Gravel-3.png','T1-Stone-1.png','T1-Stone-2.png','T1-Stone-3.png','T2-Cobblestone-1.png','T2-Cobblestone-2.png','T2-Gravel-1.png','T2-Gravel-2.png','T2-Stone-1.png','T2-Stone-2.png','T2-Stone-3.png','T2-Stone-4.png','T3-Cobblestone-1.png','T3-Cobblestone-2.png','T3-Gravel-1.png','T3-Gravel-2.png','T3-Stone-1.png','T3-Stone-2.png','T4-Cobblestone-1.png','T4-Cobblestone-2.png','T4-Cobblestone-3.png','T4-Cobblestone-4.png','T4-Gravel-1.png','T4-Gravel-2.png','T4-Stone-1.png','T4-Stone-2.png','T4-Stone-3.png'] },
    { name: 'Wood', path: 'Textures/Roads/Wood', files: [
        'T1-Decorative-Wood-1.png','T1-Plank-1.png','T1-Plank-2.png','T1-Wood-1.png','T1-Wood-2.png','T2-Decorative-Wood-1.png','T2-Plank-1.png','T2-Plank-2.png','T2-Wood-1.png','T2-Wood-2.png','T2-Wood-3.png','T3-Wood-1.png','T3-Decorative-Wood-1.png','T3-Wood-2.png','T4-Decorative-Wood-1.png','T4-Wood-1.png','T4-Wood-2.png','T4-Wood-3.png'] }
];

function getValidImages(images) {
    return images.filter(img => img && typeof img.src === 'string' && img.src.length > 0 && !img.invalid);
}

// FUNÇÃO CORRIGIDA PARA AGRUPAMENTO DE TEXTURAS
function groupFixedTextures(files, category) {
    const groups = {};
    files.forEach(file => {
        const cleanFile = file.replace(/\s+/g, '');
        if (!cleanFile.endsWith('.png')) return;
        if (category === 'Wood' && !(/Plank|Wood|Decorative/i.test(cleanFile))) return;
        if (category === 'Stone' && !(/Gravel|Cobble|Stone/i.test(cleanFile))) return;
        // Brick não filtra nada
        const match = cleanFile.match(/^(.*?)-\d+\.png$/i);
        const prefix = match ? match[1] : cleanFile.replace(/\.png$/i, '');
        if (!groups[prefix]) groups[prefix] = [];
        groups[prefix].push(cleanFile);
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
            img.onerror = function() { img.invalid = true; };
            return img;
        });
        // Preview: sempre tenta pegar o -1.png, se não existir pega o primeiro válido
        let previewImg = images.find(img => /-1\.png$/i.test(img.src) && !img.invalid) || getValidImages(images)[0] || images[0];
        return { name: key.replace(/T(\d+)-/, 'T$1 '), images, previewImg };
    });
    fixedTexturePalette.push({ name: folder.name, textures });
});

function renderFixedTexturePalette() {
    let fixedMenu = document.getElementById('fixed-texture-menu');
    if (!fixedMenu) {
        fixedMenu = document.createElement('div');
        fixedMenu.id = 'fixed-texture-menu';
        document.getElementById('paletas').appendChild(fixedMenu);
    }
    fixedMenu.innerHTML = '';

    // Container para cor e borracha
    const topTools = document.createElement('div');
    topTools.style.display = 'flex';
    topTools.style.flexDirection = 'row';
    topTools.style.alignItems = 'center';
    topTools.style.gap = '10px';
    topTools.style.marginBottom = '8px';

    // Botão Cor
    const colorBtn = document.createElement('button');
    colorBtn.textContent = 'Color';
    colorBtn.className = 'fixed-palette-title' + (selectedFixedTexturePalette === null && !window.isEraserSelected ? ' active' : '');
    colorBtn.style.display = 'flex';
    colorBtn.style.alignItems = 'center';
    colorBtn.onclick = () => {
        selectedFixedTexturePalette = null;
        useTexture = false;
        window.isEraserSelected = false;
        renderFixedTexturePalette();
    };
    topTools.appendChild(colorBtn);

    // Botão Borracha
    const eraserBtn = document.createElement('button');
    eraserBtn.className = 'fixed-palette-title' + (window.isEraserSelected ? ' active' : '');
    eraserBtn.title = 'Borracha';
    eraserBtn.style.display = 'flex';
    eraserBtn.style.alignItems = 'center';
    eraserBtn.style.gap = '6px';
    eraserBtn.style.fontWeight = 'bold';
    eraserBtn.style.fontSize = '1em';
    eraserBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" style="vertical-align:middle;"><rect x="4" y="15" width="12" height="5" rx="2" fill="#e57373" stroke="#fff" stroke-width="2"/><polygon points="4,15 12,7 20,15 12,20" fill="#f5f5f5" stroke="#e57373" stroke-width="2"/></svg> <span style="color:#e57373;">Eraser</span>';
    eraserBtn.onclick = () => {
        window.isEraserSelected = true;
        selectedFixedTexturePalette = null;
        useTexture = false;
        currentColor = null;
        renderFixedTexturePalette();
    };
    topTools.appendChild(eraserBtn);

    fixedMenu.appendChild(topTools);

    fixedTexturePalette.forEach((pal, palIdx) => {
        const group = document.createElement('div');
        group.className = 'fixed-palette-group';
        const groupBtn = document.createElement('button');
        groupBtn.textContent = pal.name;
        groupBtn.className = 'fixed-palette-title' + (selectedFixedTexturePalette === palIdx ? ' active' : '');
        groupBtn.onclick = () => {
            selectedFixedTexturePalette = selectedFixedTexturePalette === palIdx ? null : palIdx;
            selectedFixedTexture = 0;
            useTexture = selectedFixedTexturePalette !== null;
            window.isEraserSelected = false;
            renderFixedTexturePalette();
        };
        group.appendChild(groupBtn);
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
                    window.isEraserSelected = false;
                    renderFixedTexturePalette();
                };
                // Mostra só a primeira imagem válida como ícone
                const validImgs = getValidImages(tex.images);
                let thumb;
                if (validImgs.length > 0) {
                    thumb = document.createElement('img');
                    thumb.src = validImgs[0].src;
                    thumb.style.width = '24px';
                    thumb.style.height = '24px';
                    thumb.style.objectFit = 'cover';
                    thumb.style.margin = '0 2px';
                    thumb.style.border = validImgs[0].invalid ? '2px solid #e57373' : '1px solid #222';
                    thumb.title = validImgs[0].invalid ? 'Imagem não carregada' : tex.name;
                } else {
                    // Placeholder visual se não houver imagem válida
                    thumb = document.createElement('canvas');
                    thumb.width = 24;
                    thumb.height = 24;
                    const pctx = thumb.getContext('2d');
                    pctx.fillStyle = '#e57373';
                    pctx.fillRect(0, 0, 24, 24);
                    pctx.strokeStyle = '#fff';
                    pctx.lineWidth = 2;
                    pctx.beginPath();
                    pctx.moveTo(4, 4); pctx.lineTo(20, 20);
                    pctx.moveTo(20, 4); pctx.lineTo(4, 20);
                    pctx.stroke();
                }
                texBtn.appendChild(thumb);
                // Não adiciona texto, só o ícone
                texList.appendChild(texBtn);
            });
        }
        group.appendChild(texList);
        fixedMenu.appendChild(group);
    });
}

// Remove botão borracha do topbar se existir
const topbarEraserBtn = document.getElementById('eraserTopBtn');
if (topbarEraserBtn) topbarEraserBtn.remove();

// Clique corrigido para paleta fixa (scaling e comparação por src)
canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    let found = false;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const { x, y } = getHexPosition(row, col);
            if (pointInHex(mx, my, x, y)) {
                // Borracha
                if (window.isEraserSelected) {
                    grid[row][col].texture = null;
                    grid[row][col].color = '#4fc3f7';
                }
                // Paleta fixa
                if (selectedFixedTexturePalette !== null) {
                    const pal = fixedTexturePalette[selectedFixedTexturePalette];
                    const tex = pal.textures[selectedFixedTexture];
                    const validImgs = getValidImages(tex.images);
                    // Alterna textura a cada clique
                    cellTextureIndexes[row][col] = (cellTextureIndexes[row][col] + 1) % validImgs.length;
                    let img = validImgs[cellTextureIndexes[row][col]];
                    if (img && typeof img.src === 'string' && img.src.length > 0 && !img.invalid) {
                        grid[row][col].texture = img;
                        grid[row][col].color = '#fff';
                    } else {
                        grid[row][col].texture = null;
                        grid[row][col].color = '#e57373'; // cor de erro
                    }
                }
                // Paleta customizada
                else if (useTexture && selectedTextureFolder !== null && texturePalette[selectedTextureFolder].images.length > 0) {
                    const folder = texturePalette[selectedTextureFolder];
                    const validImgs = getValidImages(folder.images);
                    cellTextureIndexes[row][col] = (cellTextureIndexes[row][col] + 1) % validImgs.length;
                    let img = validImgs[cellTextureIndexes[row][col]];
                    if (img && typeof img.src === 'string' && img.src.length > 0 && !img.invalid) {
                        grid[row][col].texture = img;
                        grid[row][col].color = '#fff';
                    } else {
                        grid[row][col].texture = null;
                        grid[row][col].color = '#e57373'; // cor de erro
                    }
                }
                // Cor
                else if (currentColor) {
                    grid[row][col].texture = null;
                    grid[row][col].color = currentColor;
                }
                // Nenhuma cor selecionada
                else {
                    grid[row][col].texture = null;
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

let isMouseDown = false;
let lastCell = null;

canvas.addEventListener('mousedown', function(e) {
    isMouseDown = true;
});
canvas.addEventListener('mouseup', function(e) {
    isMouseDown = false;
    lastCell = null;
});
canvas.addEventListener('mouseleave', function(e) {
    isMouseDown = false;
    lastCell = null;
});
canvas.addEventListener('mousemove', function(e) {
    if (!isMouseDown) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const { x, y } = getHexPosition(row, col);
            if (pointInHex(mx, my, x, y)) {
                // Evita repetir célula
                if (lastCell && lastCell.row === row && lastCell.col === col) return;
                lastCell = { row, col };
                // Borracha
                if (window.isEraserSelected) {
                    grid[row][col].texture = null;
                    grid[row][col].color = '#4fc3f7';
                }
                // Paleta fixa
                else if (selectedFixedTexturePalette !== null) {
                    const pal = fixedTexturePalette[selectedFixedTexturePalette];
                    const tex = pal.textures[selectedFixedTexture];
                    const validImgs = getValidImages(tex.images);
                    // Alterna textura a cada novo hexágono tocado no arraste
                    let idx = cellTextureIndexes[row][col];
                    idx = (idx + 1) % validImgs.length;
                    cellTextureIndexes[row][col] = idx;
                    let img = validImgs[idx];
                    if (img && typeof img.src === 'string' && img.src.length > 0 && !img.invalid) {
                        grid[row][col].texture = img;
                        grid[row][col].color = '#fff';
                    } else {
                        grid[row][col].texture = null;
                        grid[row][col].color = '#e57373';
                    }
                }
                // Paleta customizada
                else if (useTexture && selectedTextureFolder !== null && texturePalette[selectedTextureFolder].images.length > 0) {
                    const folder = texturePalette[selectedTextureFolder];
                    const validImgs = getValidImages(folder.images);
                    // Alterna textura a cada novo hexágono tocado no arraste
                    let idx = cellTextureIndexes[row][col];
                    idx = (idx + 1) % validImgs.length;
                    cellTextureIndexes[row][col] = idx;
                    let img = validImgs[idx];
                    if (img && typeof img.src === 'string' && img.src.length > 0 && !img.invalid) {
                        grid[row][col].texture = img;
                        grid[row][col].color = '#fff';
                    } else {
                        grid[row][col].texture = null;
                        grid[row][col].color = '#e57373';
                    }
                }
                // Cor
                else if (currentColor) {
                    grid[row][col].texture = null;
                    grid[row][col].color = currentColor;
                }
                // Nenhuma cor selecionada
                else {
                    grid[row][col].texture = null;
                    grid[row][col].color = '#4fc3f7';
                }
                drawGrid();
                return;
            }
        }
    }
});
